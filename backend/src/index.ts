import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import swagger from '@elysiajs/swagger'
import { logger } from '@bogeychan/elysia-logger'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { healthRoutes } from '@backend/api/health'
import { projectRoutes } from '@backend/api/project'
import { metaProjectsRoutes } from '@backend/api/_meta_projects'
import { closeDb } from '@backend/plugins/database'
import { wikibaseRoutes } from '@backend/api/project/project.wikibase'

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
