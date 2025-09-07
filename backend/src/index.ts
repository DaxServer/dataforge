import { metaProjectsRoutes } from '@backend/api/_meta_projects'
import { healthRoutes } from '@backend/api/health'
import { projectRoutes } from '@backend/api/project'
import { wikibaseRoutes } from '@backend/api/project/project.wikibase'
import { wikibaseConstraintsApi } from '@backend/api/wikibase/constraints'
import { wikibaseEntitiesApi } from '@backend/api/wikibase/entities'
import { wikibaseInstanceApi } from '@backend/api/wikibase/instance-routes'
import { wikibaseInstancesApi } from '@backend/api/wikibase/instances'
import { closeDb } from '@backend/plugins/database'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { logger } from '@bogeychan/elysia-logger'
import { cors } from '@elysiajs/cors'
import swagger from '@elysiajs/swagger'
import { Elysia } from 'elysia'

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
      scalarConfig: {
        servers: [
          {
            url: 'http://localhost:3000',
          },
        ],
      },
    }),
  )
  .use(logger())
  .use(healthRoutes)
  .use(metaProjectsRoutes)
  .use(projectRoutes)
  .use(wikibaseRoutes)
  .use(wikibaseInstancesApi)
  .use(wikibaseEntitiesApi)
  .use(wikibaseInstanceApi)
  .use(wikibaseConstraintsApi)
  .listen(3000, () => {
    console.log('🦊 Elysia is running at http://localhost:3000')
  })

// Setup termination listeners for graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`)
  try {
    await closeDb()
    console.log('Database connection closed successfully')
  } catch (error) {
    console.error('Error closing database:', error)
  }
  process.exit(0)
}

// Listen for termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

// Listen for process exit event
process.on('exit', code => {
  console.log(`Process exiting with code ${code}`)
})

export type App = typeof elysiaApp
