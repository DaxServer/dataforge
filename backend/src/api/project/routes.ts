import { Elysia } from 'elysia'
import { GetProjectByIdSchema } from './schemas'
import {
  createProject,
  deleteProject,
  getAllProjects,
  getProjectById,
  importWithFile,
} from './handlers'
import {
  CreateProjectSchema,
  DeleteProjectSchema,
  GetAllProjectsSchema,
  ImportProjectSchema,
  ImportFileProjectSchema,
  ImportWithFileSchema,
} from './schemas'
import { importProject, importProjectFile } from './import'
import { ApiErrorHandler } from '@backend/types/error-handler'

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
  .get('/', getAllProjects, GetAllProjectsSchema)
  .get('/:id', getProjectById, GetProjectByIdSchema)
  .post('/', createProject, CreateProjectSchema)
  .delete('/:id', deleteProject, DeleteProjectSchema)
  .post('/:id/import', importProject, ImportProjectSchema)
  .post('/:id/import/file', importProjectFile, ImportFileProjectSchema)
  .post('/import', importWithFile, ImportWithFileSchema)
