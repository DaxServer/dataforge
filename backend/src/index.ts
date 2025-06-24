import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import swagger from '@elysiajs/swagger'
import { logger } from '@bogeychan/elysia-logger'
import { databasePlugin } from '@backend/plugins/database'
import { healthRoutes } from '@backend/api/health'
import { projectRoutes } from '@backend/api/project'

export const elysiaApp = new Elysia({
  serve: {
    maxRequestBodySize: 1024 * 1024 * 1024, // 1GB
  },
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
