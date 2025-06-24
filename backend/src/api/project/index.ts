import { Elysia } from 'elysia'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { databasePlugin } from '@backend/plugins/database'
import {
  importProject,
  importProjectFile,
  ProjectImportFileAltSchema,
  ProjectImportSchema,
} from '@backend/api/project/import'
import { createProject, ProjectCreateSchema } from '@backend/api/project/project.create'
import { deleteProject, ProjectDeleteSchema } from '@backend/api/project/project.delete'
import { getProjectById, GetProjectByIdSchema } from '@backend/api/project/project.get'
import { getAllProjects, ProjectsGetAllSchema } from '@backend/api/project/project.get-all'
import { importWithFile, ProjectImportFileSchema } from '@backend/api/project/project.import-file'

export const projectRoutes = new Elysia({ prefix: '/api/project' })
  .onError(({ code, error, status }) => {
    // Handle validation errors
    if (code === 'VALIDATION') {
      return status(422, {
        data: [],
        errors: [
          {
            code,
            message: error.validator.Errors(error.value).First().schema.error,
            details: Array.from(error.validator.Errors(error.value)).map(e => ({
              path: (e as { path: string }).path,
              message: (e as { message: string }).message,
              schema: (e as { schema: object }).schema,
            })),
          },
        ],
      })
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return status(500, ApiErrorHandler.internalServerErrorWithData(errorMessage))
  })
  .use(databasePlugin)
  .get('/', ({ db }) => getAllProjects(db), ProjectsGetAllSchema)
  .get(
    '/:id',
    ({ db, params, status }) => getProjectById(db, params.id, status),
    GetProjectByIdSchema
  )
  .post('/', ({ db, body, status }) => createProject(db, body, status), ProjectCreateSchema)
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
