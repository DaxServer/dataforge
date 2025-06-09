import { Elysia } from 'elysia'
import { healthRoutes } from './api/health'
import { projectRoutes } from './api/project'
import swagger from '@elysiajs/swagger'
import { logger } from '@bogeychan/elysia-logger'
import { initializeDb } from './db'

// Initialize database with default path
await initializeDb()

// Create Elysia app
const app = new Elysia()
  .use(
    swagger({
      path: '/docs',
    })
  )
  .use(logger())
  .use(healthRoutes)
  .use(projectRoutes)
  .get('/', () => 'OpenRefine NG')
  .listen(process.env.PORT || 8000)

console.log(`🦊 Elysia server is running at http://${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
