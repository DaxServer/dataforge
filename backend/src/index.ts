import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import swagger from '@elysiajs/swagger'
import { logger } from '@bogeychan/elysia-logger'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { databasePlugin } from '@backend/plugins/database'
import { healthRoutes } from '@backend/api/health'
import { projectRoutes } from '@backend/api/project'

export const elysiaApp = new Elysia({
  serve: {
    maxRequestBodySize: 1024 * 1024 * 1024, // 1GB
  },
})
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
  .use(cors())
  .use(databasePlugin)
  .use(
    swagger({
      path: '/docs',
    })
  )
  .use(logger())
  .use(healthRoutes)
  .use(projectRoutes)
  .listen(3000, () => {
    console.log('🦊 Elysia is running at http://localhost:3000')
  })

export type App = typeof elysiaApp
