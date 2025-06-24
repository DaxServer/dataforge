import { t, type Context } from 'elysia'
import type { Project } from '@backend/api/project/_schemas'
import { getDb } from '@backend/plugins/database'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { ErrorResponseWithDataSchema } from '@backend/types/error-schemas'

const cleanupProject = async (projectId: string, tempFilePath?: string) => {
  const db = getDb()

  await db.run('DELETE FROM _meta_projects WHERE id = ?', [projectId])

  if (tempFilePath) {
    await Bun.file(tempFilePath).delete()
  }
}

export const ProjectImportFileSchema = {
  body: t.Object({
    file: t.File({
      // Note: File type validation has known issues in Elysia 1.3.x
      // See: https://github.com/elysiajs/elysia/issues/1073
      // type: ['application/json'], // Temporarily disabled due to validation issues
      minSize: 1, // Reject empty files
    }),
    name: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 255,
        error: 'Project name must be between 1 and 255 characters long if provided',
      })
    ),
  }),
  response: {
    201: t.Object({
      data: t.Object({
        id: t.String(),
      }),
    }),
    400: ErrorResponseWithDataSchema,
    422: ErrorResponseWithDataSchema,
    500: ErrorResponseWithDataSchema,
  },
}

type ProjectImportBody = typeof ProjectImportFileSchema.body.static

export const importWithFile = async ({
  body,
  set,
}: Context<{
  body: ProjectImportBody
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
