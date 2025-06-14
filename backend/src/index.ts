import { Elysia } from 'elysia'
import { healthRoutes } from './api/health'
import { projectRoutes } from './api/project'
import swagger from '@elysiajs/swagger'
import { logger } from '@bogeychan/elysia-logger'
import { databasePlugin } from './plugins/database'
import { cors } from '@elysiajs/cors'

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
