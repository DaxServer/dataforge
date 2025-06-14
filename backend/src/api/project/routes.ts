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

export const projectRoutes = new Elysia({ prefix: '/api/project' })
  .onError(({ code, error, set }) => {
    // Handle validation errors
    if (code === 'VALIDATION') {
      set.status = 422
      return {
        errors: [
          {
            code,
            message: 'Validation failed',
            details:
              error.all?.map(
                (e: { path?: string; message?: string; expected?: unknown; value: unknown }) => ({
                  path: e.path?.replace(/^\/body\//, '') || 'unknown',
                  message: e.message || 'Invalid value',
                  expected: e.expected,
                  received: e.value,
                })
              ) || [],
          },
        ],
      }
    }

    // Handle other errors
    set.status = 500
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return {
      errors: [
        {
          code,
          message: errorMessage,
          details: {},
        },
      ],
    }
  })
  .get('/', getAllProjects, GetAllProjectsSchema)
  .get('/:id', getProjectById, GetProjectByIdSchema)
  .post('/', createProject, CreateProjectSchema)
  .delete('/:id', deleteProject, DeleteProjectSchema)
  .post('/:id/import', importProject, ImportProjectSchema)
  .post('/:id/import/file', importProjectFile, ImportFileProjectSchema)
  .post('/import', importWithFile, ImportWithFileSchema)
