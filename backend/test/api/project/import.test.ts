import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { Elysia } from 'elysia'
import { projectRoutes } from '../../../src/api/project'
import { initializeDb, getDb, closeDb } from '../../../src/db'
import { treaty } from '@elysiajs/eden'

// Create a test app with the project import routes
const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes))
}

describe('POST /project/:projectId/import', () => {
  let api: ReturnType<typeof createTestApi>

  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()
  })

  afterEach(async () => {
    await closeDb()
  })

  test('should return 201 for a valid import', async () => {
    const projectId = 'test-project-id'
    const tempFilePath = './temp-test-file.json'
    await Bun.write(tempFilePath, JSON.stringify({ test: 'data' }))

    const { data, status, error } = await api.project({ id: projectId }).import.post({
      filePath: tempFilePath,
    })

    expect(status).toBe(201)
    expect(data).toBe('')
    expect(error).toBeNull()

    await Bun.file(tempFilePath).delete()
  })

  test('should return 400 for a missing JSON file', async () => {
    const projectId = 'test-project-id'
    const nonExistentFilePath = '/path/to/non-existent-file.json'
    const { data, status, error } = await api.project({ id: projectId }).import.post({
      filePath: nonExistentFilePath,
    })

    expect(status).toBe(400)
    expect(data).toBeNull()
    expect(error).toBeDefined()
    expect(error).toHaveProperty('status', 400)
    expect(error).toHaveProperty('value', {
      errors: [
        {
          code: 'FILE_NOT_FOUND',
          message: expect.any(String),
          details: {
            filePath: nonExistentFilePath,
          },
        },
      ],
    })
  })

  test('should return 500 for invalid JSON content in file', async () => {
    const projectId = 'test-project-id'
    const tempFilePath = './temp-invalid-json-file.json'
    await Bun.write(tempFilePath, 'this is not valid json')

    const { data, status, error } = await api.project({ id: projectId }).import.post({
      filePath: tempFilePath,
    })

    expect(status).toBe(500)
    expect(data).toBeNull()
    expect(error).toBeDefined()
    expect(error).toHaveProperty('status', 500)
    expect(error).toHaveProperty('value', {
      errors: [
        {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while importing the project',
          details: {
            error: expect.any(String),
          },
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

    const { data, status, error } = await api.project({ id: projectId }).import.post({
      filePath: tempFilePath,
    })

    expect(status).toBe(201)
    expect(data).toBe('')
    expect(error).toBeNull()

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
    const {
      data: firstData,
      status: firstStatus,
      error: firstError,
    } = await api.project({ id: projectId }).import.post({
      filePath: tempFilePath,
    })
    expect(firstStatus).toBe(201)
    expect(firstData).toBe('')
    expect(firstError).toBeNull()

    // Second import with same project ID - should fail with 409
    const { data, status, error } = await api.project({ id: projectId }).import.post({
      filePath: tempFilePath,
    })

    expect(status).toBe(409)
    expect(data).toBeNull()
    expect(error).toBeDefined()
    expect(error).toHaveProperty('status', 409)
    expect(error).toHaveProperty('value', {
      errors: [
        {
          code: 'TABLE_ALREADY_EXISTS',
          message: expect.any(String),
        },
      ],
    })

    await Bun.file(tempFilePath).delete()
  })
})
