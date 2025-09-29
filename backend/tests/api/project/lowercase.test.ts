import { projectRoutes } from '@backend/api/project'
import { closeDb, initializeDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'
import { tmpdir } from 'node:os'

interface TestData {
  name: string
  email: string
  city: string
}

const TEST_DATA: TestData[] = [
  { name: 'John Doe', email: 'john@example.com', city: 'New York' },
  { name: 'Jane Smith', email: 'jane@example.com', city: 'Los Angeles' },
  { name: 'Bob Johnson', email: 'bob@example.com', city: 'New York' },
  { name: 'Alice Brown', email: 'alice@test.com', city: 'Chicago' },
  { name: 'Charlie Davis', email: 'charlie@example.com', city: 'New York' },
]

const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}

const tempFilePath = tmpdir() + '/test-data.json'

describe('Project API - Lowercase Conversion', () => {
  let api: ReturnType<typeof createTestApi>
  let projectId: string

  const importTestData = async () => {
    await Bun.write(tempFilePath, JSON.stringify(TEST_DATA))

    const { status, error } = await api.project({ projectId }).import.post({
      filePath: tempFilePath,
    })

    expect(error).toBeNull()
    expect(status).toBe(201)
  }

  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()

    const { data, status, error } = await api.project.post({
      name: 'Test Project for lowercase',
    })
    expect(error).toBeNull()
    expect(status).toBe(201)
    projectId = (data as any)!.data!.id as string

    await importTestData()
  })

  afterEach(async () => {
    await closeDb()
  })

  test('should perform basic lowercase conversion', async () => {
    const { data, status, error } = await api.project({ projectId }).lowercase.post({
      column: 'name',
    })

    expect(status).toBe(200)
    expect(error).toBeNull()
    expect(data).toEqual({
      affectedRows: 5,
    })

    // Verify the data was actually changed
    const { data: projectData } = await api.project({ projectId }).get({
      query: { offset: 0, limit: 25 },
    })

    expect(projectData).toHaveProperty(
      'data',
      expect.arrayContaining([
        expect.objectContaining({ name: 'john doe' }),
        expect.objectContaining({ name: 'jane smith' }),
        expect.objectContaining({ name: 'bob johnson' }),
        expect.objectContaining({ name: 'alice brown' }),
        expect.objectContaining({ name: 'charlie davis' }),
      ]),
    )
  })

  test('should return 400 for non-existent column', async () => {
    const { data, status, error } = await api.project({ projectId }).lowercase.post({
      column: 'nonexistent_column',
    })

    expect(status).toBe(400)
    expect(data).toBeNull()
    expect(error).toHaveProperty('status', 400)
    expect(error).toHaveProperty('value', [
      {
        code: 'VALIDATION',
        message: 'Column not found',
        details: [`Column 'nonexistent_column' does not exist in table 'project_${projectId}'`],
      },
    ])
  })

  test('should return 422 for missing required fields', async () => {
    const { data, status, error } = await api.project({ projectId }).lowercase.post({
      column: '',
    })

    expect(status).toBe(422)
    expect(data).toBeNull()
    expect(error).toHaveProperty('status', 422)
    expect(error).toHaveProperty(
      'value',
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Expected string length greater or equal to 1',
          path: '/column',
        }),
      ]),
    )
  })

  test('should handle mixed case data with some already lowercase', async () => {
    // Create a new project for this test to avoid import conflicts
    const {
      data: newProjectData,
      status: newProjectStatus,
      error: newProjectError,
    } = await api.project.post({
      name: 'Test Project for lowercase - mixed case data',
    })
    expect(newProjectError).toBeNull()
    expect(newProjectStatus).toBe(201)
    const newProjectId = (newProjectData as any)!.data!.id as string

    // Create test data with mixed case
    const mixedData = [
      { name: 'JOHN DOE', email: 'john@example.com', city: 'NEW YORK' },
      { name: 'jane smith', email: 'jane@example.com', city: 'los angeles' },
      { name: 'Bob Johnson', email: 'bob@example.com', city: 'New York' },
      { name: 'alice brown', email: 'alice@test.com', city: 'chicago' },
      { name: 'CHARLIE DAVIS', email: 'charlie@example.com', city: 'CHICAGO' },
    ]

    await Bun.write(tempFilePath, JSON.stringify(mixedData))

    // Import the mixed data
    const { status, error } = await api.project({ projectId: newProjectId }).import.post({
      filePath: tempFilePath,
    })

    expect(error).toBeNull()
    expect(status).toBe(201)

    // Perform lowercase conversion
    const {
      data,
      status: lowercaseStatus,
      error: lowercaseError,
    } = await api.project({ projectId: newProjectId }).lowercase.post({
      column: 'name',
    })

    expect(lowercaseStatus).toBe(200)
    expect(lowercaseError).toBeNull()
    expect(data).toEqual({
      affectedRows: 3, // JOHN DOE, Bob Johnson, CHARLIE DAVIS should be affected
    })

    // Verify the data was converted correctly
    const { data: projectData } = await api.project({ projectId: newProjectId }).get({
      query: { offset: 0, limit: 25 },
    })

    expect(projectData).toHaveProperty(
      'data',
      expect.arrayContaining([
        expect.objectContaining({ name: 'john doe' }), // 'JOHN DOE' -> 'john doe'
        expect.objectContaining({ name: 'jane smith' }), // 'jane smith' -> unchanged (already lowercase)
        expect.objectContaining({ name: 'bob johnson' }), // 'Bob Johnson' -> 'bob johnson'
        expect.objectContaining({ name: 'alice brown' }), // 'alice brown' -> unchanged (already lowercase)
        expect.objectContaining({ name: 'charlie davis' }), // 'CHARLIE DAVIS' -> 'charlie davis'
      ]),
    )
  })

  test('should return 0 when no rows need conversion', async () => {
    // Create a new project for this test to avoid import conflicts
    const {
      data: newProjectData,
      status: newProjectStatus,
      error: newProjectError,
    } = await api.project.post({
      name: 'Test Project for lowercase - already lowercase data',
    })
    expect(newProjectError).toBeNull()
    expect(newProjectStatus).toBe(201)
    const newProjectId = (newProjectData as any)!.data!.id as string

    // Create test data that's already lowercase
    const lowercaseData = [
      { name: 'john doe', email: 'john@example.com', city: 'new york' },
      { name: 'jane smith', email: 'jane@example.com', city: 'los angeles' },
      { name: 'bob johnson', email: 'bob@example.com', city: 'new york' },
    ]

    await Bun.write(tempFilePath, JSON.stringify(lowercaseData))

    // Import the lowercase data
    const { status, error } = await api.project({ projectId: newProjectId }).import.post({
      filePath: tempFilePath,
    })

    expect(error).toBeNull()
    expect(status).toBe(201)

    // Perform lowercase conversion
    const {
      data,
      status: lowercaseStatus,
      error: lowercaseError,
    } = await api.project({ projectId: newProjectId }).lowercase.post({
      column: 'name',
    })

    expect(lowercaseStatus).toBe(200)
    expect(lowercaseError).toBeNull()
    expect(data).toEqual({
      affectedRows: 0, // No rows should be affected as all text is already lowercase
    })
  })
})
