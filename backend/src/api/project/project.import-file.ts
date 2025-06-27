import { t } from 'elysia'
import type { DuckDBConnection } from '@duckdb/node-api'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { ApiError } from '@backend/types/error-schemas'
import type { Project } from '@backend/api/project/_schemas'

const generateProjectName = (fileName: string) => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`
      const baseName = fileName.replace(/\.[^/.]+$/, '') // Remove extension
      return `${baseName}-${timestamp}`
    }

const cleanupProject = async (
  db: () => DuckDBConnection,
  projectId: string,
  tempFilePath?: string
) => {
  await db().run('DELETE FROM _meta_projects WHERE id = ?', [projectId])

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
    400: ApiError,
    422: ApiError,
    500: ApiError,
  },
}

type ProjectImportBody = typeof ProjectImportFileSchema.body.static

export const importWithFile = async (
  db: () => DuckDBConnection,
  body: ProjectImportBody,
  status
) => {
  const { file, name } = body

  // Generate project name if not provided
  const projectName = name || generateProjectName(file.name)

  // Create the project
  const reader = await db().runAndReadAll(
    `INSERT INTO _meta_projects (name)
     VALUES (?)
     RETURNING *`,
    [projectName]
  )

  const projects = reader.getRowObjectsJson()
  if (projects.length === 0) {
    return status(
      500,
      ApiErrorHandler.projectCreationErrorWithData(
        'Failed to create project: No project returned from database'
      )
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

  // Check if JSON is parsable
  try {
    await Bun.file(tempFilePath).json()
  } catch (parseError) {
    await cleanupProject(db, project.id, tempFilePath)

    const errorMessage = parseError instanceof Error ? parseError.message : 'Failed to parse JSON'
    // Extract the specific error part from the message (e.g., "Unexpected identifier 'json'")
    const match = errorMessage.match(/Unexpected identifier "([^"]+)"/)
    const errorDetail = match
      ? `JSON Parse error: Unexpected identifier "${match[1]}"`
      : 'Failed to parse JSON'

    return status(
      400,
      ApiErrorHandler.invalidJsonErrorWithData('Invalid JSON format in uploaded file', [
        errorDetail,
      ])
    )
  }

  // Check if table already exists
  const tableExistsReader = await db().runAndReadAll(
    `SELECT 1 FROM duckdb_tables() WHERE table_name = 'project_${project.id}'`
  )

  if (tableExistsReader.getRows().length > 0) {
    // await cleanupProject(db, project.id, tempFilePath)

    return status(
      500,
      ApiErrorHandler.dataImportErrorWithData(
        `Table with name 'project_${project.id}' already exists`
      )
    )
  }

  // First, import the JSON data into the table
  await db().run(`
    CREATE TABLE "project_${project.id}" AS
    SELECT * FROM read_json_auto('${tempFilePath}')
  `)

  // Check if 'id' column already exists and generate unique primary key column name
  const tableInfo = await db().runAndReadAll(`PRAGMA table_info("project_${project.id}")`)
  const columns = tableInfo.getRowObjectsJson() as Array<{ name: string }>
  const existingColumnNames = columns.map(col => col.name)
  
  let primaryKeyColumnName = 'id'
  let counter = 1
  while (existingColumnNames.includes(primaryKeyColumnName)) {
    primaryKeyColumnName = `_pk_id_${counter}`
    counter++
  }

  // Then add the auto-increment primary key column with unique name
  await db().run(`
    -- Create the sequence
    CREATE SEQUENCE "project_${project.id}_${primaryKeyColumnName}_seq" START 1;

    -- Add the column with the sequence as the default value
    ALTER TABLE "project_${project.id}"
    ADD COLUMN "${primaryKeyColumnName}" BIGINT DEFAULT nextval('project_${project.id}_${primaryKeyColumnName}_seq');

    -- Add the primary key constraint
    ALTER TABLE "project_${project.id}"
    ADD CONSTRAINT "project_${project.id}_pkey" PRIMARY KEY ("${primaryKeyColumnName}");
  `)

  // Clean up temporary file
  await Bun.file(tempFilePath).delete()

  return status(201, {
    data: { id: project.id },
  })
}
