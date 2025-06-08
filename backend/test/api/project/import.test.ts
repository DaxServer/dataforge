import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { Elysia } from 'elysia'
import { projectRoutes } from '../../../src/api/project'
import { initializeDb, getDb, closeDb } from '../../../src/db'

// Create a test app with the project import routes
const createTestApp = () => {
  const app = new Elysia()
  return app.use(projectRoutes)
}

describe('POST /project/:projectId/import', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(async () => {
    await initializeDb(':memory:')
    app = createTestApp()
  })

  afterEach(async () => {
    await closeDb()
  })

  test('should return 201 for a valid import', async () => {
    const projectId = 'test-project-id'
    const tempFilePath = './temp-test-file.json'
    await Bun.write(tempFilePath, JSON.stringify({ test: 'data' }))

    const res = await app.handle(
      new Request(`http://localhost/project/${projectId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath: tempFilePath }),
      })
    )

    expect(res.status).toBe(201)
    const text = await res.text()
    expect(text).toBe('')

    await Bun.file(tempFilePath).delete()
  })

  test('should return 400 for a missing JSON file', async () => {
    const projectId = 'test-project-id'
    const nonExistentFilePath = '/path/to/non-existent-file.json'
    const res = await app.handle(
      new Request(`http://localhost/project/${projectId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath: nonExistentFilePath }),
      })
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({
      errors: [
        {
          code: 'FILE_NOT_FOUND',
          message: 'File not found',
          details: {
            filePath: nonExistentFilePath,
          },
        },
      ],
    })
  })

  test('should return 400 for invalid JSON content in file', async () => {
    const projectId = 'test-project-id'
    const tempFilePath = './temp-invalid-json-file.json'
    await Bun.write(tempFilePath, 'this is not valid json')

    const res = await app.handle(
      new Request(`http://localhost/project/${projectId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath: tempFilePath }),
      })
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({
      errors: [
        {
          code: 'VALIDATION',
          message: 'Invalid file content',
        },
      ],
    })

    await Bun.file(tempFilePath).delete()
  })

  test('should create a DuckDB table after successful import', async () => {
    const projectId = 'test-project-id'
    const tempFilePath = './temp-test-file.json'
    const testData = [{ id: 1, name: 'test' }]
    await Bun.write(tempFilePath, JSON.stringify(testData))

    const res = await app.handle(
      new Request(`http://localhost/project/${projectId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath: tempFilePath }),
      })
    )

    expect(res.status).toBe(201)

    // Verify table creation in DuckDB
    const db = getDb()
    const reader = await db.runAndReadAll(`PRAGMA table_info("project_${projectId}")`)
    const result = reader.getRowObjectsJson()

    expect(result.length).toBeGreaterThan(0)

    await Bun.file(tempFilePath).delete()
  })

  test('should return 409 when importing to an existing table', async () => {
    const projectId = 'duplicate-project-id'
    const tempFilePath = './temp-test-file.json'
    const testData = [{ id: 1, name: 'test' }]
    await Bun.write(tempFilePath, JSON.stringify(testData))

    // First import - should succeed
    const firstRes = await app.handle(
      new Request(`http://localhost/project/${projectId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath: tempFilePath }),
      })
    )
    expect(firstRes.status).toBe(201)

    // Second import with same project ID - should fail with 409
    const secondRes = await app.handle(
      new Request(`http://localhost/project/${projectId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath: tempFilePath }),
      })
    )

    expect(secondRes.status).toBe(409)
    const body = await secondRes.json()
    expect(body).toEqual({
      errors: [
        {
          code: 'TABLE_ALREADY_EXISTS',
          message: `Table with name 'project_${projectId}' already exists`,
        },
      ],
    })

    await Bun.file(tempFilePath).delete()
  })
})
