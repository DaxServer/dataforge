import { Elysia } from 'elysia'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { getDb } from '@backend/plugins/database'
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
  .onError(({ code, error, set }) => {
    // Handle validation errors
    if (code === 'VALIDATION') {
      set.status = 422
      return {
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
      }
    }

    // Handle other errors
    set.status = 500
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return ApiErrorHandler.internalServerErrorWithData(errorMessage)
  })
  .decorate('db', getDb)
  .get('/', getAllProjects, ProjectsGetAllSchema)
  .get('/:id', getProjectById, GetProjectByIdSchema)
  .post('/', createProject, ProjectCreateSchema)
  .delete('/:id', deleteProject, ProjectDeleteSchema)
  .post('/:id/import', importProject, ProjectImportSchema)
  .post('/:id/import/file', importProjectFile, ProjectImportFileAltSchema)
  .post('/import', importWithFile, ProjectImportFileSchema)
