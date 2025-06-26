import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import swagger from '@elysiajs/swagger'
import { logger } from '@bogeychan/elysia-logger'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { healthRoutes } from '@backend/api/health'
import { projectRoutes } from '@backend/api/project'

export const elysiaApp = new Elysia({
  serve: {
    maxRequestBodySize: 1024 * 1024 * 1024 * 10, // 10GB
  },
})
  .use(errorHandlerPlugin)
  .use(cors())
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
