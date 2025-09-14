import { ProjectImportFileAltSchema, ProjectImportSchema } from '@backend/api/project/import'
import { cleanupProject, generateProjectName } from '@backend/api/project/project.import-file'
import {
  GetProjectByIdSchema,
  ProjectCreateSchema,
  ProjectDeleteSchema,
  ProjectImportFileSchema,
  ProjectParams,
  ProjectsGetAllSchema,
  type Project,
} from '@backend/api/project/schemas'
import { databasePlugin } from '@backend/plugins/database'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { enhanceSchemaWithTypes, type DuckDBTablePragma } from '@backend/utils/duckdb-types'
import cors from '@elysiajs/cors'
import { Elysia } from 'elysia'

export const projectRoutes = new Elysia({ prefix: '/api/project' })
  .use(errorHandlerPlugin)
  .use(databasePlugin)
  .use(cors())

  .get(
    '/',
    async ({ db }) => {
      const reader = await db().runAndReadAll(
        'SELECT * FROM _meta_projects ORDER BY created_at DESC',
      )
      const projects = reader.getRowObjectsJson()
      return {
        data: projects as Project[],
      }
    },
    ProjectsGetAllSchema,
  )

  .post(
    '/',
    async ({ db, body: { name }, status }) => {
      // Insert the new project and get the inserted row in one operation
      const reader = await db().runAndReadAll(
        `INSERT INTO _meta_projects (name)
         VALUES (?)
         RETURNING *`,
        [name],
      )

      const projects = reader.getRowObjectsJson()

      if (projects.length === 0) {
        return status(
          500,
          ApiErrorHandler.databaseErrorWithData(
            'Failed to create project: No project returned from database',
          ),
        )
      }

      return status(201, {
        data: projects[0] as Project,
      })
    },
    ProjectCreateSchema,
  )

  .post(
    '/import',
    async ({ db, body: { name, file }, status }) => {
      // Generate project name if not provided
      const projectName = name || generateProjectName(file.name)

      // Create the project
      const reader = await db().runAndReadAll(
        `
        INSERT INTO _meta_projects (name)
        VALUES (?)
        RETURNING *`,
        [projectName],
      )

      const projects = reader.getRowObjectsJson()
      if (projects.length === 0) {
        return status(
          500,
          ApiErrorHandler.projectCreationErrorWithData(
            'Failed to create project: No project returned from database',
          ),
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

        const errorMessage =
          parseError instanceof Error ? parseError.message : 'Failed to parse JSON'
        // Extract the specific error part from the message (e.g., "Unexpected identifier 'json'")
        const match = errorMessage.match(/Unexpected identifier "([^"]+)"/)
        const errorDetail = match
          ? `JSON Parse error: Unexpected identifier "${match[1]}"`
          : 'Failed to parse JSON'

        return status(
          400,
          ApiErrorHandler.invalidJsonErrorWithData('Invalid JSON format in uploaded file', [
            errorDetail,
          ]),
        )
      }

      // Check if table already exists
      const tableExistsReader = await db().runAndReadAll(
        `SELECT 1 FROM duckdb_tables() WHERE table_name = 'project_${project.id}'`,
      )

      if (tableExistsReader.getRows().length > 0) {
        // await cleanupProject(db, project.id, tempFilePath)

        return status(
          500,
          ApiErrorHandler.dataImportErrorWithData(
            `Table with name 'project_${project.id}' already exists`,
          ),
        )
      }

      // First, import the JSON data into the table
      await db().run(
        `
        CREATE TABLE "project_${project.id}" AS
        SELECT * FROM read_json_auto(?)
        `,
        [tempFilePath],
      )

      // Check if 'id' column already exists and generate unique primary key column name
      const tableInfo = await db().runAndReadAll(`PRAGMA table_info("project_${project.id}")`)
      const columns = tableInfo.getRowObjectsJson() as Array<{ name: string }>
      const existingColumnNames = columns.map((col) => col.name)

      let primaryKeyColumnName = 'id'
      let counter = 1
      while (existingColumnNames.includes(primaryKeyColumnName)) {
        primaryKeyColumnName = `_pk_id_${counter}`
        counter++
      }

      // Then add the auto-increment primary key column with unique name
      await db().run(`
        -- Start the transaction
        BEGIN;

        -- Create the sequence
        CREATE SEQUENCE "project_${project.id}_${primaryKeyColumnName}_seq" START 1;

        -- Add the column with the sequence as the default value
        ALTER TABLE "project_${project.id}"
        ADD COLUMN "${primaryKeyColumnName}" BIGINT DEFAULT nextval('project_${project.id}_${primaryKeyColumnName}_seq');

        -- Add the primary key constraint
        ALTER TABLE "project_${project.id}"
        ADD CONSTRAINT "project_${project.id}_pkey" PRIMARY KEY ("${primaryKeyColumnName}");

        -- Commit the transaction
        COMMIT;

        -- Force a checkpoint to flush WAL
        CHECKPOINT;
      `)

      // Clean up temporary file
      await Bun.file(tempFilePath).delete()

      return status(201, {
        data: { id: project.id },
      })
    },
    ProjectImportFileSchema,
  )

  .guard({
    schema: 'standalone',
    params: ProjectParams,
  })

  .resolve(async ({ db, params: { projectId } }) => {
    const reader = await db().runAndReadAll('SELECT * FROM _meta_projects WHERE id = ?', [
      projectId,
    ])
    const projects = reader.getRowObjectsJson()

    return {
      projects,
    }
  })

  .onBeforeHandle(async ({ params: { projectId }, projects, status }) => {
    if (projects.length === 0) {
      return status(404, ApiErrorHandler.notFoundErrorWithData('Project', projectId))
    }
  })

  .get(
    '/:projectId',
    async ({ db, params: { projectId }, query: { limit = 25, offset = 0 }, projects, status }) => {
      try {
        // Get the project's data from the project table with pagination
        const tableName = `project_${projectId}`
        const rowsReader = await db().runAndReadAll(
          `SELECT * FROM "${tableName}" LIMIT ? OFFSET ?`,
          [limit, offset],
        )
        const rows = rowsReader.getRowObjectsJson()
        const projectName = projects[0]?.name?.toString() ?? 'Unknown Project'

        const schemaReader = await db().runAndReadAll(`PRAGMA table_info("${tableName}")`)
        const schemaResult = schemaReader.getRowObjectsJson()

        const countReader = await db().runAndReadAll(`SELECT COUNT(*) as total FROM "${tableName}"`)
        const countResult = countReader.getRowObjectsJson()
        const total = Number(countResult[0]?.total ?? 0)

        return {
          data: rows,
          meta: {
            name: projectName,
            schema: enhanceSchemaWithTypes(schemaResult as DuckDBTablePragma[]),
            total,
            limit,
            offset,
          },
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('does not exist')) {
          return status(404, ApiErrorHandler.notFoundErrorWithData('Project', projectId))
        }
        throw error
      }
    },
    GetProjectByIdSchema,
  )

  .delete(
    '/:projectId',
    async ({ db, params: { projectId }, status }) => {
      // Delete the project and return the deleted row if it exists
      const reader = await db().runAndReadAll(
        'DELETE FROM _meta_projects WHERE id = ? RETURNING id',
        [projectId],
      )

      const deleted = reader.getRowObjectsJson()

      if (deleted.length === 0) {
        return status(404, ApiErrorHandler.notFoundErrorWithData('Project', projectId))
      }

      return status(204, undefined)
    },
    ProjectDeleteSchema,
  )

  .post(
    '/:projectId/import',
    async ({ db, params: { projectId }, body: { filePath }, status }) => {
      const fileExists = await Bun.file(filePath).exists()

      if (!fileExists) {
        return status(400, ApiErrorHandler.fileNotFoundError(filePath))
      }

      // We'll check if the file exists but won't parse it
      // DuckDB's read_json_auto will handle the parsing

      // Check if a table with the same project ID already exists
      let tableExistsReader
      try {
        tableExistsReader = await db().runAndReadAll(
          `SELECT 1 FROM duckdb_tables() WHERE table_name = 'project_${projectId}'`,
        )
      } catch (error) {
        return status(
          500,
          ApiErrorHandler.internalServerErrorWithData(
            'An error occurred while importing the project',
            [(error as Error).message],
          ),
        )
      }

      if (tableExistsReader.getRows().length > 0) {
        return status(409, ApiErrorHandler.tableExistsErrorWithData(`project_${projectId}`))
      }

      // Try to create the table directly
      try {
        await db().run(`CREATE TABLE "project_${projectId}" AS SELECT * FROM read_json_auto(?)`, [
          filePath,
        ])

        // @ts-expect-error ToDo: Fix
        return status(201, new Response(null))
      } catch (error) {
        // Check if the error is related to JSON parsing
        const errorMessage = String(error)
        if (errorMessage.toLowerCase().includes('parse')) {
          return status(
            400,
            ApiErrorHandler.invalidJsonErrorWithData('Invalid JSON format in uploaded file', [
              (error as Error).message,
            ]),
          )
        }

        // Handle any other errors
        return status(
          500,
          ApiErrorHandler.internalServerErrorWithData(
            'An error occurred while importing the project',
            [(error as Error).message],
          ),
        )
      }
    },
    ProjectImportSchema,
  )

  .post(
    '/:projectId/import/file',
    async ({ body: { file }, status }) => {
      try {
        // Generate a unique temporary file name
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const tempFileName = `temp_${timestamp}_${randomSuffix}.json`
        const tempFilePath = `./temp/${tempFileName}`

        // Convert file to buffer and save to temporary location
        const fileBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(fileBuffer)

        // Write the file to temporary location using Bun.write
        await Bun.write(tempFilePath, uint8Array)

        return status(201, {
          tempFilePath,
        })
      } catch (error) {
        return status(
          500,
          ApiErrorHandler.internalServerErrorWithData('Failed to save uploaded file', [
            (error as Error).message,
          ]),
        )
      }
    },
    ProjectImportFileAltSchema,
  )
