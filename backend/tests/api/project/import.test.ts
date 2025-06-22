import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { Elysia } from 'elysia'
import { projectRoutes } from '@backend/api/project'
import { initializeDb, closeDb, getDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'

// Create a test app with the project import routes
const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}

describe('POST /project/:projectId/import', () => {
  let api: ReturnType<typeof createTestApi>

  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()
  })

  afterEach(async () => {
    await closeDb()

    // Clean up temporary files created during tests
    const tempFiles = ['./temp-test-file.json', './temp-invalid-json-file.json']

    await Promise.all(
      tempFiles.map(async filePath => {
        await Bun.file(filePath)
          .delete()
          .catch(() => {})
      })
    )
  })

  test('should return 201 for a valid import', async () => {
    const projectId = 'test-project-id'
    const tempFilePath = './temp-test-file.json'
    await Bun.write(tempFilePath, JSON.stringify({ test: 'data' }))

    const { data, status, error } = await api.project({ id: projectId }).import.post({
      filePath: tempFilePath,
    })

    expect(status).toBe(201)
    expect(data).toBeEmpty()
    expect(error).toBeNull()
  })

  test('should return 400 for a missing JSON file', async () => {
    const projectId = 'test-project-id'
    const nonExistentFilePath = './non-existent-file.json'

    const { data, status, error } = await api.project({ id: projectId }).import.post({
      filePath: nonExistentFilePath,
    })

    expect(status).toBe(400)
    expect(data).toBeNull()
    expect(error).toBeDefined()
    expect(error).toHaveProperty('status', 400)
    expect(error).toHaveProperty('value.data', [])
    expect(error).toHaveProperty('value.errors')
    expect(error.value.errors).toHaveLength(1)
    expect(error.value.errors[0]).toHaveProperty('code', 'FILE_NOT_FOUND')
    expect(error.value.errors[0]).toHaveProperty('message', expect.any(String))
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
    expect(error).toHaveProperty('value.data', [])
    expect(error).toHaveProperty('value.errors')
    expect(error.value.errors).toHaveLength(1)
    expect(error.value.errors[0]).toHaveProperty('code', 'INTERNAL_SERVER_ERROR')
    expect(error.value.errors[0]).toHaveProperty(
      'message',
      'An error occurred while importing the project'
    )
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
    expect(data).toBeEmpty()
    expect(error).toBeNull()

    // Verify table creation in DuckDB
    const db = getDb()
    const reader = await db.runAndReadAll(`PRAGMA table_info("project_${projectId}")`)
    const result = reader.getRowObjectsJson()

    expect(result.length).toBeGreaterThan(0)
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
    expect(firstData).toBeEmpty()
    expect(firstError).toBeNull()

    // Second import with same project ID - should fail with 409
    const { data, status, error } = await api.project({ id: projectId }).import.post({
      filePath: tempFilePath,
    })

    expect(status).toBe(409)
    expect(data).toBeNull()
    expect(error).toBeDefined()
    expect(error).toHaveProperty('status', 409)
    expect(error).toHaveProperty('value')
    expect(error.value).toHaveProperty('data', [])
    expect(error.value).toHaveProperty('errors')
    expect(error.value.errors).toHaveLength(1)
    expect(error.value.errors[0]).toHaveProperty('code', 'TABLE_ALREADY_EXISTS')
    expect(error.value.errors[0]).toHaveProperty(
      'message',
      expect.stringContaining('already exists')
    )
  })
})
