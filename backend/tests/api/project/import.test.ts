import { projectRoutes } from '@backend/api/project'
import { closeDb, getDb, initializeDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'

const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}

describe('POST /project/:projectId/import', () => {
  let api: ReturnType<typeof createTestApi>
  let projectId: string

  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()

    const { data } = await api.project.post({ name: 'Test Project' })
    projectId = (data as any)?.data?.id as string
  })

  afterEach(async () => {
    await closeDb()

    const tempFiles = ['./temp-test-file.json', './temp-invalid-json-file.json']

    await Promise.all(
      tempFiles.map(async (filePath) => {
        await Bun.file(filePath)
          .delete()
          .catch(() => {})
      }),
    )
  })

  test('should return 201 for a valid import', async () => {
    const tempFilePath = './temp-test-file.json'
    await Bun.write(tempFilePath, JSON.stringify({ test: 'data' }))

    const { data, status, error } = await api.project({ projectId }).import.post({
      filePath: tempFilePath,
    })

    expect(status).toBe(201)
    expect(data).toBeEmpty()
    expect(error).toBeNull()
  })

  test('should return 400 for a missing JSON file', async () => {
    const nonExistentFilePath = './non-existent-file.json'

    const { data, status, error } = await api.project({ projectId }).import.post({
      filePath: nonExistentFilePath,
    })

    expect(status).toBe(400)
    expect(data).toBeNull()
    expect(error).toHaveProperty('status', 400)
    expect(error).toHaveProperty('value', {
      data: [],
      errors: [
        {
          code: 'FILE_NOT_FOUND',
          message: 'File not found',
          details: ['./non-existent-file.json'],
        },
      ],
    })
  })

  test('should return 500 for invalid JSON content in file', async () => {
    const tempFilePath = './temp-invalid-json-file.json'
    await Bun.write(tempFilePath, 'this is not valid json')

    const { data, status, error } = await api.project({ projectId }).import.post({
      filePath: tempFilePath,
    })

    expect(status).toBe(500)
    expect(data).toBeNull()
    expect(error).toHaveProperty('status', 500)
    expect(error).toHaveProperty('value', {
      data: [],
      errors: [
        {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while importing the project',
          details: [
            'Invalid Input Error: Malformed JSON in file "./temp-invalid-json-file.json", at byte 1 in record/value 2: invalid literal. ',
          ],
        },
      ],
    })
  })

  test('should create a DuckDB table after successful import', async () => {
    const tempFilePath = './temp-test-file.json'
    const testData = [{ id: 1, name: 'test' }]
    await Bun.write(tempFilePath, JSON.stringify(testData))

    const { data, status, error } = await api.project({ projectId }).import.post({
      filePath: tempFilePath,
    })

    expect(status).toBe(201)
    expect(data).toBeEmpty()
    expect(error).toBeNull()

    const db = getDb()
    const reader = await db.runAndReadAll(`PRAGMA table_info("project_${projectId}")`)
    const result = reader.getRowObjectsJson()

    expect(result.length).toBeGreaterThan(0)
  })

  test('should return 409 when importing to an existing table', async () => {
    const tempFilePath = './temp-test-file.json'
    const testData = [{ id: 1, name: 'test' }]
    await Bun.write(tempFilePath, JSON.stringify(testData))

    // First import - should succeed
    const {
      data: firstData,
      status: firstStatus,
      error: firstError,
    } = await api.project({ projectId }).import.post({
      filePath: tempFilePath,
    })
    expect(firstStatus).toBe(201)
    expect(firstData).toBeEmpty()
    expect(firstError).toBeNull()

    // Second import with same project ID - should fail with 409
    const { data, status, error } = await api.project({ projectId }).import.post({
      filePath: tempFilePath,
    })

    expect(status).toBe(409)
    expect(data).toBeNull()
    expect(error).toHaveProperty('status', 409)
    expect(error).toHaveProperty('value', {
      data: [],
      errors: [
        {
          code: 'TABLE_ALREADY_EXISTS',
          message: `Table with name 'project_${projectId}' already exists`,
          details: [],
        },
      ],
    })
  })
})
