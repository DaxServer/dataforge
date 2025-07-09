import { Elysia } from 'elysia'
import cors from '@elysiajs/cors'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { databasePlugin } from '@backend/plugins/database'
import { ProjectResponseSchema } from '@backend/api/project/_schemas'
import {
  importProject,
  importProjectFile,
  ProjectImportFileAltSchema,
  ProjectImportSchema,
} from '@backend/api/project/import'
import { ProjectCreateSchema } from '@backend/api/project/project.create'
import { deleteProject, ProjectDeleteSchema } from '@backend/api/project/project.delete'
import { getProjectById, GetProjectByIdSchema } from '@backend/api/project/project.get'
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
    ({ db, params, query, status }) =>
      getProjectById(db, params.id, query?.offset ?? 0, query?.limit ?? 0, status),
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
    ({ db, params, status }) => deleteProject(db, params.id, status),
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
