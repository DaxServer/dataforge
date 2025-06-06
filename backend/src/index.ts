import { Elysia } from 'elysia'
import { healthRoutes } from './api/health'
import swagger from '@elysiajs/swagger'
import { logger } from '@bogeychan/elysia-logger'

// Create Elysia app
const app = new Elysia()
  .use(
    swagger({
      path: '/docs',
    })
  )
  .use(logger())
  .use(healthRoutes)
  .get('/', () => 'OpenRefine NG')
  .listen(process.env.PORT || 8000)

console.log(`🦊 Elysia server is running at http://${app.server?.hostname}:${app.server?.port}`)
