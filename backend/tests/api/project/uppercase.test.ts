import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { tmpdir } from 'node:os'
import { projectRoutes } from '@backend/api/project'
import { closeDb, initializeDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'
import { Elysia } from 'elysia'

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

describe('Project API - Uppercase Conversion', () => {
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
      name: 'Test Project for uppercase',
    })
    expect(error).toBeNull()
    expect(status).toBe(201)
    projectId = (data as any)!.data!.id as string

    await importTestData()
  })

  afterEach(async () => {
    await closeDb()
  })

  test('should perform basic uppercase conversion', async () => {
    const { data, status, error } = await api.project({ projectId }).uppercase.post({
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
        expect.objectContaining({ name: 'JOHN DOE' }),
        expect.objectContaining({ name: 'JANE SMITH' }),
        expect.objectContaining({ name: 'BOB JOHNSON' }),
        expect.objectContaining({ name: 'ALICE BROWN' }),
        expect.objectContaining({ name: 'CHARLIE DAVIS' }),
      ]),
    )
  })

  test('should return 400 for non-existent column', async () => {
    const { data, status, error } = await api.project({ projectId }).uppercase.post({
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
    const { data, status, error } = await api.project({ projectId }).uppercase.post({
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
})
