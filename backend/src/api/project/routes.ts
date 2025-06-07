import { Elysia, t } from 'elysia'
import { createProject, getAllProjects } from './handlers'
import { CreateProjectSchema } from './schemas'

export const projectRoutes = new Elysia({ prefix: '/project' })
  // Add global error handler
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
              error.all?.map((e: any) => ({
                path: e.path?.replace(/^\/body\//, '') || 'unknown',
                message: e.message || 'Invalid value',
                expected: e.expected,
                received: e.value,
                keyword: e.keyword,
              })) || [],
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
  .get('/', getAllProjects)
  .post('/', createProject, CreateProjectSchema)
