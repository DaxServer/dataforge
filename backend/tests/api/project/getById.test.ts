/// <reference types="bun-types" />
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'
import { initializeDb, closeDb } from '@backend/plugins/database'
import { projectRoutes } from '@backend/api/project'

const TEST_DATA = [
  { name: 'John', age: 30, city: 'New York' },
  { name: 'Jane', age: 25, city: 'Los Angeles' },
  { name: 'Bob', age: 35, city: 'Chicago' },
]

const INVALID_UUID = 'invalid-uuid'
const NON_EXISTENT_UUID = '12345678-1234-1234-1234-123456789abc'

// Create a test app with the project routes
const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}

describe('Project API - GET /:id', () => {
  let api: ReturnType<typeof createTestApi>
  let projectId: string

  // Setup and Teardown
  beforeEach(async () => {
    // Initialize a fresh in-memory database
    await initializeDb(':memory:')

    // Create a fresh app instance for each test
    api = createTestApi()

    // Create a test project
    const { data, status, error } = await api.project.post({
      name: 'Test Project for getById',
    })
    expect(error).toBeNull()
    expect(status).toBe(201)
    projectId = data?.data?.id as string

    // Import test data into the project
    await importTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
    await closeDb()
  })

  // Test Helpers
  const cleanupTestData = async () => {
    expect(projectId).toBeDefined()
    expect(api).toBeDefined()
    const { error } = await api.project({ id: projectId }).delete()
    expect(error).toBeNull()

    // Clean up temporary files
    const tempFilePath = './temp/test-data.json'
    const tempFile = Bun.file(tempFilePath)
    await tempFile.delete()
  }

  const importTestData = async () => {
    // Write test data to a temporary file
    const tempFilePath = './temp/test-data.json'
    await Bun.write(tempFilePath, JSON.stringify(TEST_DATA))

    // Import the data using the file path
    const { status, error } = await api.project({ id: projectId }).import.post({
      filePath: tempFilePath,
    })
    expect(error).toBeNull()
    expect(status).toBe(201)
  }

  it('should return project by id', async () => {
    const { data, status, error } = await api.project({ id: projectId }).get()

    expect(status).toBe(200)
    expect(error).toBeNull()
    expect(data).toEqual(
      expect.objectContaining({
        data: expect.arrayContaining(
          TEST_DATA.map(({ name, age, city }) =>
            expect.objectContaining({
              name,
              age: expect.stringMatching(age.toString()),
              city,
            })
          )
        ),
        meta: expect.objectContaining({
          total: TEST_DATA.length,
          limit: 25,
          offset: 0,
          name: 'Test Project for getById',
        }),
      })
    )
  })

  it('should return 404 for non-existent project', async () => {
    const { data, status, error } = await api.project({ id: NON_EXISTENT_UUID }).get()

    expect(status).toBe(404)
    expect(data).toBeNull()
    expect(error).toEqual(
      expect.objectContaining({
        status: 404,
        value: expect.objectContaining({
          data: expect.arrayContaining([]),
          errors: expect.arrayContaining([
            expect.objectContaining({
              code: 'NOT_FOUND',
              message: 'Project not found',
              details: [],
            }),
          ]),
        }),
      })
    )
  })

  it('should return 422 for invalid project id format', async () => {
    const { data, status, error } = await api.project({ id: INVALID_UUID }).get()

    expect(status).toBe(422)
    expect(data).toBeNull()
    expect(error).toEqual(
      expect.objectContaining({
        status: 422,
        value: expect.objectContaining({
          data: expect.arrayContaining([]),
          errors: expect.arrayContaining([
            expect.objectContaining({
              code: 'VALIDATION',
              message: expect.any(String),
              details: expect.any(Array),
            }),
          ]),
        }),
      })
    )
  })

  it('should return project with empty data', async () => {
    // Create a project with no data
    const { data: createData, error: createError } = await api.project.post({
      name: 'Empty Project',
    })
    expect(createError).toBeNull()
    const emptyProjectId = createData?.data?.id as string

    const { data, status, error } = await api.project({ id: emptyProjectId }).get()

    expect(status).toBe(200)
    expect(error).toBeNull()
    expect(data).toMatchObject(
      expect.objectContaining({
        data: expect.arrayContaining([]),
        meta: expect.objectContaining({
          name: 'Empty Project',
          schema: expect.arrayContaining([]),
          total: 0,
          limit: 25,
          offset: 0,
        }),
      })
    )

    // Cleanup
    await api.project({ id: emptyProjectId }).delete()
  })
})
