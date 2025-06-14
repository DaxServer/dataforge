/// <reference types="bun-types" />

// 1. Imports
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { projectRoutes } from '@backend/api/project'
import { initializeDb, closeDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'

// 2. Test Data
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

// 3. Test Suite
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
    projectId = data.data.id

    // Import test data into the project
    await importTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
    await closeDb()
  })

  // Test Helpers
  const cleanupTestData = async () => {
    if (projectId && api) {
      const { error } = await api.project({ id: projectId }).delete()
      expect(error).toBeNull()
    }
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

  // 4. Test Cases
  it('should return project by id', async () => {
    const { data, status, error } = await api.project({ id: projectId }).get()

    expect(status).toBe(200)
    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('data.0.name', 'John')
    expect(data).toHaveProperty('data.0.age', '30')
    expect(data).toHaveProperty('data.0.city', 'New York')
  })

  it('should return 404 for non-existent project', async () => {
    const { data, status, error } = await api.project({ id: NON_EXISTENT_UUID }).get()

    expect(status).toBe(404)
    expect(error).toBeDefined()
    expect(data).toBeNull()
  })

  it('should return 422 for invalid project id format', async () => {
    const { data, status, error } = await api.project({ id: INVALID_UUID }).get()

    expect(status).toBe(422)
    expect(error).toBeDefined()
    expect(data).toBeNull()
  })

  it('should return project with empty data', async () => {
    // Create a project with no data
    const { data: createData, error: createError } = await api.project.post({
      name: 'Empty Project',
    })
    expect(createError).toBeNull()
    const emptyProjectId = createData.data.id

    const { data, status, error } = await api.project({ id: emptyProjectId }).get()

    expect(status).toBe(200)
    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('data.length', 0)

    // Cleanup
    await api.project({ id: emptyProjectId }).delete()
  })

  it('should return project with correct structure', async () => {
    const { data, status, error } = await api.project({ id: projectId }).get()

    expect(status).toBe(200)
    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('data.length', 3) // Should have 3 test records
    expect(data).toHaveProperty('meta.total', 3)
    expect(data).toHaveProperty('meta.limit', 25)
    expect(data).toHaveProperty('meta.offset', 0)
  })
})
