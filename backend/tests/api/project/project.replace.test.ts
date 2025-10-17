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

describe('Project API - find and replace', () => {
  let api: ReturnType<typeof createTestApi>
  let projectId: string

  const cleanupTestData = async () => {
    expect(projectId).toBeDefined()
    expect(api).toBeDefined()

    const { error } = await api.project({ projectId }).delete()
    expect(error).toBeNull()

    const tempFile = Bun.file(tempFilePath)
    await tempFile.delete()
  }

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
      name: 'Test Project for replace',
    })
    expect(error).toBeNull()
    expect(status).toBe(201)
    projectId = (data as any)!.data!.id as string

    await importTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
    await closeDb()
  })

  test('should perform basic find and replace operation', async () => {
    const { data, status, error } = await api.project({ projectId }).replace.post({
      column: 'city',
      find: 'New York',
      replace: 'San Francisco',
      caseSensitive: false,
      wholeWord: false,
    })

    expect(status).toBe(200)
    expect(error).toBeNull()
    expect(data).toEqual({
      affectedRows: 3,
    })

    // Verify the data was actually changed
    const { data: projectData } = await api.project({ projectId }).get({
      query: { offset: 0, limit: 25 },
    })

    expect(projectData).toHaveProperty(
      'data',
      expect.arrayContaining([
        expect.objectContaining({ city: 'San Francisco' }),
        expect.objectContaining({ city: 'Los Angeles' }),
        expect.objectContaining({ city: 'Chicago' }),
      ]),
    )
    const cities = projectData!.data?.map((row: TestData) => row.city)
    expect(cities.filter((city: string) => city === 'San Francisco')).toHaveLength(3)
    expect(cities.filter((city: string) => city === 'New York')).toHaveLength(0)
  })

  describe('case sensitivity tests', () => {
    test.each([
      {
        description: 'case-sensitive replace operation',
        column: 'email',
        find: 'example.com',
        replace: 'company.com',
        caseSensitive: true,
        wholeWord: false,
        expectedAffectedRows: 4,
      },
      {
        description: 'case-insensitive replace operation',
        column: 'email',
        find: 'EXAMPLE.COM',
        replace: 'company.com',
        caseSensitive: false,
        wholeWord: false,
        expectedAffectedRows: 4,
      },
    ])(
      '$description',
      async ({ column, find, replace, caseSensitive, wholeWord, expectedAffectedRows }) => {
        const { data, status, error } = await api.project({ projectId }).replace.post({
          column,
          find,
          replace,
          caseSensitive,
          wholeWord,
        })

        expect(status).toBe(200)
        expect(error).toBeNull()
        expect(data).toEqual({
          affectedRows: expectedAffectedRows,
        })
      },
    )
  })

  describe('whole word tests', () => {
    test.each([
      {
        description: 'whole word replace operation',
        column: 'name',
        find: 'John',
        replace: 'Jonathan',
        caseSensitive: false,
        wholeWord: true,
        expectedAffectedRows: 1,
      },
      {
        description: 'whole word with case sensitivity',
        column: 'name',
        find: 'john',
        replace: 'jonathan',
        caseSensitive: true,
        wholeWord: true,
        expectedAffectedRows: 0,
      },
    ])(
      '$description',
      async ({ column, find, replace, caseSensitive, wholeWord, expectedAffectedRows }) => {
        const { data, status, error } = await api.project({ projectId }).replace.post({
          column,
          find,
          replace,
          caseSensitive,
          wholeWord,
        })

        expect(status).toBe(200)
        expect(error).toBeNull()
        expect(data).toEqual({
          affectedRows: expectedAffectedRows,
        })
      },
    )
  })

  describe('replace with empty string', () => {
    test.each([
      {
        description: 'basic empty string replace',
        column: 'city',
        find: 'New York',
        replace: '',
        expectedAffectedRows: 3,
      },
      {
        description: 'empty string replace with whole word',
        column: 'name',
        find: 'John',
        replace: '',
        expectedAffectedRows: 2,
      },
    ])('$description', async ({ column, find, replace, expectedAffectedRows }) => {
      const { data, status, error } = await api.project({ projectId }).replace.post({
        column,
        find,
        replace,
        caseSensitive: false,
        wholeWord: false,
      })

      expect(status).toBe(200)
      expect(error).toBeNull()
      expect(data).toEqual({
        affectedRows: expectedAffectedRows,
      })
    })
  })

  test('should return 400 for non-existent column', async () => {
    const { data, status, error } = await api.project({ projectId }).replace.post({
      column: 'nonexistent_column',
      find: 'value',
      replace: 'new_value',
      caseSensitive: false,
      wholeWord: false,
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
    // @ts-expect-error testing invalid payload
    const { data, status, error } = await api.project({ projectId }).replace.post({
      column: '',
      find: '',
      replace: 'new_value',
    })

    expect(status).toBe(422)
    expect(data).toBeNull()
    expect(error).toHaveProperty('status', 422)
  })

  describe('special characters tests', () => {
    test.each([
      {
        description: 'handle @ symbol',
        column: 'email',
        find: '@',
        replace: '[AT]',
        expectedAffectedRows: 5,
      },
      {
        description: 'handle single quotes',
        column: 'name',
        find: "John's",
        replace: "Jonathan's",
        expectedAffectedRows: 0, // No data with John's in test data
      },
    ])('$description', async ({ column, find, replace, expectedAffectedRows }) => {
      const { data, status, error } = await api.project({ projectId }).replace.post({
        column,
        find,
        replace,
        caseSensitive: false,
        wholeWord: false,
      })

      expect(status).toBe(200)
      expect(error).toBeNull()
      expect(data).toEqual({
        affectedRows: expectedAffectedRows,
      })
    })
  })
})
