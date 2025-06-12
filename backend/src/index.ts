import { Elysia } from 'elysia'
import { healthRoutes } from './api/health'
import { projectRoutes } from './api/project'
import swagger from '@elysiajs/swagger'
import { logger } from '@bogeychan/elysia-logger'
import { databasePlugin } from './plugins/database'

const app = new Elysia()
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

export type App = typeof app
