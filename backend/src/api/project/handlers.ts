import type { Context } from 'elysia'
import type {
  CreateProjectInput,
  Project,
  ImportWithFileInput,
  GetProjectByIdInput,
} from '@backend/api/project/schemas'
import { getDb } from '@backend/plugins/database'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { enhanceSchemaWithTypes } from '@backend/utils/duckdb-types'

export const getProjectById = async ({ params, set }: Context<{ params: GetProjectByIdInput }>) => {
  const db = getDb()

  // First, check if the project exists in _meta_projects
  const projectReader = await db.runAndReadAll('SELECT * FROM _meta_projects WHERE id = ?', [
    params.id,
  ])
  const projects = projectReader.getRowObjectsJson()

  if (projects.length === 0) {
    set.status = 404
    return ApiErrorHandler.notFoundErrorWithData('Project')
  }

  try {
    // Get the project's data from the project table (first 25 rows)
    const tableName = `project_${params.id}`
    const rowsReader = await db.runAndReadAll(`SELECT * FROM "${tableName}" LIMIT 25`)
    const rows = rowsReader.getRowObjectsJson()
    const schema = rowsReader.columnNameAndTypeObjectsJson()

    return {
      data: rows,
      meta: {
        name: projects?.[0]?.name ?? 'Unknown Project',
        schema: enhanceSchemaWithTypes(schema),
        total: rows.length, // For simplicity, we're not doing a separate count query
        limit: 25,
        offset: 0,
      },
    }
  } catch (error) {
    // If the table doesn't exist, return empty data
    if (error instanceof Error && error.message.includes('does not exist')) {
      return {
        data: [],
        meta: {
          name: projects?.[0]?.name ?? 'Unknown Project',
          schema: enhanceSchemaWithTypes([]),
          total: 0,
          limit: 25,
          offset: 0,
        },
      }
    }

    // Re-throw other errors
    throw error
  }
}

export const getAllProjects = async () => {
  const db = getDb()
  const reader = await db.runAndReadAll('SELECT * FROM _meta_projects ORDER BY created_at DESC')

  const projects = reader.getRowObjectsJson()

  return {
    data: projects as Project[],
  }
}

export const createProject = async ({
  body,
  set,
}: Context<{
  body: CreateProjectInput
}>) => {
  const db = getDb()

  // Insert the new project and get the inserted row in one operation
  const reader = await db.runAndReadAll(
    `INSERT INTO _meta_projects (name)
     VALUES (?)
     RETURNING *`,
    [body.name]
  )

  const projects = reader.getRowObjectsJson()

  if (projects.length === 0) {
    set.status = 500
    return ApiErrorHandler.databaseErrorWithData(
      'Failed to create project: No project returned from database'
    )
  }

  set.status = 201
  return {
    data: projects[0] as Project,
  }
}

export const deleteProject = async ({ params, set }: Context<{ params: { id: string } }>) => {
  const db = getDb()

  // Delete the project and return the deleted row if it exists
  const reader = await db.runAndReadAll('DELETE FROM _meta_projects WHERE id = ? RETURNING id', [
    params.id,
  ])

  const deleted = reader.getRowObjectsJson()

  if (deleted.length === 0) {
    set.status = 404
    return ApiErrorHandler.notFoundErrorWithData('Project')
  }

  set.status = 204
}

const cleanupProject = async (projectId: string, tempFilePath?: string) => {
  const db = getDb()

  await db.run('DELETE FROM _meta_projects WHERE id = ?', [projectId])

  if (tempFilePath) {
    await Bun.file(tempFilePath).delete()
  }
}

export const importWithFile = async ({
  body,
  set,
}: Context<{
  body: ImportWithFileInput
}>) => {
  const { file, name } = body

  const db = getDb()

  // Generate project name if not provided
  const projectName =
    name ||
    (() => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`
      const baseName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
      return `${baseName}-${timestamp}`
    })()

  // Create the project
  const reader = await db.runAndReadAll(
    `INSERT INTO _meta_projects (name)
     VALUES (?)
     RETURNING *`,
    [projectName]
  )

  const projects = reader.getRowObjectsJson()
  if (projects.length === 0) {
    set.status = 500
    return ApiErrorHandler.projectCreationErrorWithData(
      'Failed to create project: No project returned from database'
    )
  }

  const project = projects[0] as Project

  // Save file to temporary location
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const tempFileName = `temp_${timestamp}_${randomSuffix}.json`
  const tempFilePath = `./temp/${tempFileName}`

  const fileBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(fileBuffer)

  await Bun.write(tempFilePath, uint8Array)

  // Parse JSON and handle syntax errors
  try {
    await Bun.file(tempFilePath).json()
  } catch (parseError) {
    await cleanupProject(project.id, tempFilePath)

    set.status = 400
    const errorMessage = parseError instanceof Error ? parseError.message : 'Failed to parse JSON'
    // Extract the specific error part from the message (e.g., "Unexpected identifier 'json'")
    const match = errorMessage.match(/Unexpected identifier "([^"]+)"/)
    const errorDetail = match
      ? `JSON Parse error: Unexpected identifier "${match[1]}"`
      : 'Failed to parse JSON'

    return ApiErrorHandler.invalidJsonErrorWithData('Invalid JSON format in uploaded file', [
      errorDetail,
    ])
  }

  // Check if table already exists
  const tableExistsReader = await db.runAndReadAll(
    `SELECT 1 FROM duckdb_tables() WHERE table_name = 'project_${project.id}'`
  )

  if (tableExistsReader.getRows().length > 0) {
    // await cleanupProject(db, project.id, tempFilePath)

    set.status = 500
    return ApiErrorHandler.dataImportErrorWithData(
      `Table with name 'project_${project.id}' already exists`
    )
  }

  // Create table with autoincrement primary key and import data using DuckDB's JSON functions
  await db.run(`
    -- Create the table with an autoincrement primary key
    CREATE TABLE "project_${project.id}" AS
    SELECT
      row_number() OVER () AS id,
      *
    FROM (
      SELECT * FROM read_json_auto('${tempFilePath}')
    ) t
  `)

  // Add primary key constraint
  await db.run(`
    ALTER TABLE "project_${project.id}"
    ALTER COLUMN id SET NOT NULL;

    ALTER TABLE "project_${project.id}"
    ADD PRIMARY KEY (id);
  `)

  // Clean up temporary file
  await Bun.file(tempFilePath).delete()

  set.status = 201
  return {
    data: { id: project.id },
  }
}
