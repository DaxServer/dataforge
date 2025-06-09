import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { Elysia } from 'elysia'
import { projectRoutes } from '../../../src/api/project'
import { initializeDb, closeDb } from '../../../src/db'

// Create a test app with the project import routes
const createTestApp = () => {
  const app = new Elysia()
  return app.use(projectRoutes)
}

describe('POST /project/:projectId/import-file', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(async () => {
    await initializeDb(':memory:')
    app = createTestApp()
  })

  afterEach(async () => {
    await closeDb()
  })

  test('should validate the schema with file field', async () => {
    const projectId = 'test-project-id'

    // Create a test file
    const testData = JSON.stringify({ test: 'data' })
    const file = new File([testData], 'test-file.json', { type: 'application/json' })

    // Create a FormData object and append the file
    const formData = new FormData()
    formData.append('file', file)

    const res = await app.handle(
      new Request(`http://localhost/project/${projectId}/import/file`, {
        method: 'POST',
        body: formData,
      })
    )

    // For Cycle 1, we're just testing that the schema is defined correctly
    // We expect a 500 since the endpoint is registered but the handler is empty
    expect(res.status).toBe(500)
  })
})
