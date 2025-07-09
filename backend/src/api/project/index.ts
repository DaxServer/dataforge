import { Elysia } from 'elysia'
import cors from '@elysiajs/cors'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { databasePlugin } from '@backend/plugins/database'
import { ProjectResponseSchema } from '@backend/api/project/_schemas'
import { enhanceSchemaWithTypes, type DuckDBTablePragma } from '@backend/utils/duckdb-types'
import {
  importProject,
  importProjectFile,
  ProjectImportFileAltSchema,
  ProjectImportSchema,
} from '@backend/api/project/import'
import { ProjectCreateSchema } from '@backend/api/project/project.create'
import { ProjectDeleteSchema } from '@backend/api/project/project.delete'
import { GetProjectByIdSchema } from '@backend/api/project/project.get'
import { ProjectsGetAllSchema } from '@backend/api/project/project.get-all'
import { importWithFile, ProjectImportFileSchema } from '@backend/api/project/project.import-file'

export const projectRoutes = new Elysia({ prefix: '/api/project' })
  .use(errorHandlerPlugin)
  .use(databasePlugin)
  .use(cors())
  .get(
    '/',
    async ({ db }) => {
      const reader = await db().runAndReadAll(
        'SELECT * FROM _meta_projects ORDER BY created_at DESC'
      )
      const projects = reader.getRowObjectsJson()
      return {
        data: projects as (typeof ProjectResponseSchema.static)[],
      }
    },
    ProjectsGetAllSchema
  )
  .get(
    '/:id',
    async ({ db, params: { id }, query: { limit = 0, offset = 0 }, status }) => {
      // First, check if the project exists in _meta_projects
      const projectReader = await db().runAndReadAll('SELECT * FROM _meta_projects WHERE id = ?', [
        id,
      ])
      const projects = projectReader.getRowObjects()

      if (projects.length === 0) {
        return status(404, ApiErrorHandler.notFoundErrorWithData('Project'))
      }

      try {
        // Get the project's data from the project table with pagination
        const tableName = `project_${id}`
        const rowsReader = await db().runAndReadAll(
          `SELECT * FROM "${tableName}" LIMIT ? OFFSET ?`,
          [limit, offset]
        )
        const rows = rowsReader.getRowObjectsJson()
        const projectName = projects?.[0]?.name?.toString() ?? 'Unknown Project'

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
          return status(404, ApiErrorHandler.notFoundErrorWithData('Project'))
        }
        throw error
      }
    },
    GetProjectByIdSchema
  )
  .post(
    '/',
    async ({ db, body: { name }, status }) => {
      // Insert the new project and get the inserted row in one operation
      const reader = await db().runAndReadAll(
        `INSERT INTO _meta_projects (name)
         VALUES (?)
         RETURNING *`,
        [name]
      )

      const projects = reader.getRowObjectsJson()

      if (projects.length === 0) {
        return status(
          500,
          ApiErrorHandler.databaseErrorWithData(
            'Failed to create project: No project returned from database'
          )
        )
      }

      return status(201, {
        data: projects[0] as typeof ProjectResponseSchema.static,
      })
    },
    ProjectCreateSchema
  )
  .delete(
    '/:id',
    async ({ db, params: { id }, status }) => {
      // Delete the project and return the deleted row if it exists
      const reader = await db().runAndReadAll(
        'DELETE FROM _meta_projects WHERE id = ? RETURNING id',
        [id]
      )

      const deleted = reader.getRowObjectsJson()

      if (deleted.length === 0) {
        return status(404, ApiErrorHandler.notFoundErrorWithData('Project'))
      }

      // @ts-expect-error
      return status(204, new Response(null))
    },
    ProjectDeleteSchema
  )
  .post(
    '/:id/import',
    ({ db, params, body, status }) => importProject(db, params.id, body, status),
    ProjectImportSchema
  )
  .post(
    '/:id/import/file',
    ({ body, status }) => importProjectFile(body, status),
    ProjectImportFileAltSchema
  )
  .post(
    '/import',
    ({ db, body, status }) => importWithFile(db, body, status),
    ProjectImportFileSchema
  )
