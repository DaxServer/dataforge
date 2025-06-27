/// <reference types="bun-types" />
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'
import { initializeDb, closeDb } from '@backend/plugins/database'
import { projectRoutes } from '@backend/api/project'
import { UUID_REGEX } from '@backend/api/project/_schemas'

const TEST_DATA = [
  { name: 'John', age: 30, city: 'New York' },
  { name: 'Jane', age: 25, city: 'Los Angeles' },
  { name: 'Bob', age: 35, city: 'Chicago' },
  { name: 'Alice', age: 28, city: 'Boston' },
  { name: 'Charlie', age: 32, city: 'Seattle' },
  { name: 'Diana', age: 27, city: 'Miami' },
  { name: 'Eve', age: 31, city: 'Denver' },
  { name: 'Frank', age: 29, city: 'Austin' },
]

// Helper function to convert TEST_DATA to expected API response format (with string ages)
const getExpectedData = (offset = 0, limit = TEST_DATA.length) => {
  return TEST_DATA.slice(offset, offset + limit).map(item => ({
    ...item,
    age: item.age.toString(), // API returns age as string
  }))
}

// Helper function to generate schema from data
const generateSchema = (data: any[]) => {
  if (data.length === 0) return []

  const sampleItem = data[0]
  return Object.keys(sampleItem).map(key => ({
    name: key,
    pk: false,
    type: typeof sampleItem[key] === 'number' ? 'BIGINT' : 'VARCHAR',
  }))
}

// Helper function to generate expected meta object
const getExpectedMeta = (offset = 0, limit = 25) => ({
  name: 'Test Project for getById',
  schema: generateSchema(TEST_DATA),
  total: TEST_DATA.length,
  limit,
  offset,
})

const INVALID_UUID = 'invalid-uuid'
const NON_EXISTENT_UUID = Bun.randomUUIDv7()

const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}

describe('Project API - GET /:id', () => {
  let api: ReturnType<typeof createTestApi>
  let projectId: string

  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()

    const { data, status, error } = await api.project.post({
      name: 'Test Project for getById',
    })
    expect(error).toBeNull()
    expect(status).toBe(201)
    projectId = data?.data?.id as string

    await importTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
    await closeDb()
  })

  const cleanupTestData = async () => {
    expect(projectId).toBeDefined()
    expect(api).toBeDefined()

    const { error } = await api.project({ id: projectId }).delete()
    expect(error).toBeNull()

    const tempFilePath = './temp/test-data.json'
    const tempFile = Bun.file(tempFilePath)
    await tempFile.delete()
  }

  const importTestData = async () => {
    const tempFilePath = './temp/test-data.json'
    await Bun.write(tempFilePath, JSON.stringify(TEST_DATA))

    const { status, error } = await api.project({ id: projectId }).import.post({
      filePath: tempFilePath,
    })

    expect(error).toBeNull()
    expect(status).toBe(201)
  }

  it('should return project by id', async () => {
    const { data, status, error } = await api.project({ id: projectId }).get({
      query: {
        offset: 0,
        limit: 25,
      },
    })

    expect(status).toBe(200)
    expect(error).toBeNull()
    expect(data).toHaveProperty('data', [
      ...TEST_DATA.map(({ name, age, city }) =>
        expect.objectContaining({
          name,
          age: expect.stringMatching(age.toString()),
          city,
        })
      ),
    ])
    expect(data).toHaveProperty('meta', getExpectedMeta())
  })

  it('should return 404 for non-existent project', async () => {
    const { data, status, error } = await api.project({ id: NON_EXISTENT_UUID }).get({
      query: {
        offset: 0,
        limit: 25,
      },
    })

    expect(status).toBe(404)
    expect(data).toBeNull()
    expect(error).toHaveProperty('status', 404)
    expect(error).toHaveProperty('value', {
      data: [],
      errors: [
        {
          code: 'NOT_FOUND',
          message: 'Project not found',
          details: [],
        },
      ],
    })
  })

  it('should return 422 for invalid project id format', async () => {
    const { data, status, error } = await api.project({ id: INVALID_UUID }).get({
      query: {
        offset: 0,
        limit: 25,
      },
    })

    expect(status).toBe(422)
    expect(data).toBeNull()
    expect(error).toHaveProperty('status', 422)
    expect(error).toHaveProperty('value', {
      data: [],
      errors: [
        {
          code: 'VALIDATION',
          message: 'ID must be a valid UUID',
          details: [
            {
              message: `Expected string to match '${UUID_REGEX}'`,
              path: '/id',
              schema: {
                error: 'ID must be a valid UUID',
                pattern: UUID_REGEX,
                type: 'string',
              },
            },
          ],
        },
      ],
    })
  })

  it('should return 404 for project with no data table', async () => {
    const { data: createData, error: createError } = await api.project.post({
      name: 'Empty Project',
    })
    expect(createError).toBeNull()
    const emptyProjectId = createData?.data?.id as string

    const { data, status, error } = await api.project({ id: emptyProjectId }).get({
      query: {
        offset: 0,
        limit: 25,
      },
    })

    expect(status).toBe(404)
    expect(data).toBeNull()
    expect(error).toHaveProperty('status', 404)
    expect(error).toHaveProperty('value', {
      data: [],
      errors: [
        {
          code: 'NOT_FOUND',
          message: 'Project not found',
          details: [],
        },
      ],
    })

    await api.project({ id: emptyProjectId }).delete()
  })

  describe('Pagination', () => {
    it('should return first page with default limit', async () => {
      const { data, status, error } = await api.project({ id: projectId }).get({
        query: {
          offset: 0,
          limit: 25,
        },
      })

      expect(status).toBe(200)
      expect(error).toBeNull()
      expect(data).toHaveProperty('data', getExpectedData())
      expect(data).toHaveProperty('meta', getExpectedMeta())
    })

    it('should return first page with custom limit', async () => {
      const { data, status, error } = await api.project({ id: projectId }).get({
        query: { limit: 3 },
      })

      expect(status).toBe(200)
      expect(error).toBeNull()
      expect(data).toHaveProperty('data', getExpectedData(0, 3))
      expect(data).toHaveProperty('meta', getExpectedMeta(0, 3))
    })

    it('should return second page with offset', async () => {
      const { data, status, error } = await api.project({ id: projectId }).get({
        query: { limit: 3, offset: 3 },
      })

      expect(status).toBe(200)
      expect(error).toBeNull()
      expect(data).toHaveProperty('data', getExpectedData(3, 3))
      expect(data).toHaveProperty('meta', getExpectedMeta(3, 3))
    })

    it('should return partial page when offset near end', async () => {
      const { data, status, error } = await api.project({ id: projectId }).get({
        query: { limit: 5, offset: 6 },
      })

      expect(status).toBe(200)
      expect(error).toBeNull()
      expect(data).toHaveProperty('data', getExpectedData(6, 5))
      expect(data).toHaveProperty('meta', getExpectedMeta(6, 5))
    })

    it('should return empty data when offset exceeds total', async () => {
      const { data, status, error } = await api.project({ id: projectId }).get({
        query: { limit: 5, offset: 20 },
      })

      expect(status).toBe(200)
      expect(error).toBeNull()
      expect(data).toHaveProperty('data', [])
      expect(data).toHaveProperty('meta', getExpectedMeta(20, 5))
    })

    it('should handle limit of 1', async () => {
      const { data, status, error } = await api.project({ id: projectId }).get({
        query: { limit: 1, offset: 0 },
      })

      expect(status).toBe(200)
      expect(error).toBeNull()
      expect(data).toHaveProperty('data', getExpectedData(0, 1))
      expect(data).toHaveProperty('meta', getExpectedMeta(0, 1))
    })

    it('should handle maximum limit', async () => {
      const { data, status, error } = await api.project({ id: projectId }).get({
        query: { limit: 1000 },
      })

      expect(status).toBe(200)
      expect(error).toBeNull()
      expect(data).toHaveProperty('data', getExpectedData())
      expect(data).toHaveProperty('meta', getExpectedMeta(0, 1000))
    })

    // TODO: Uncomment these tests when https://github.com/elysiajs/elysia/issues/1268 is fixed
    // These tests fail due to incorrect validation error messages for numeric query parameters outside min/max bounds

    // it('should return 422 for invalid limit (too high)', async () => {
    //   const { data, status, error } = await api.project({ id: projectId }).get({
    //     query: { limit: 1001 }
    //   })

    //   expect(status).toBe(422)
    //   expect(data).toBeNull()
    //   expect(error).toHaveProperty('value.errors.0.code', 'VALIDATION')
    // })

    // it('should return 422 for invalid limit (zero)', async () => {
    //   const { data, status, error } = await api.project({ id: projectId }).get({
    //     query: { limit: 0 }
    //   })

    //   expect(status).toBe(422)
    //   expect(data).toBeNull()
    //   expect(error).toHaveProperty('value.errors.0.code', 'VALIDATION')
    // })

    // it('should return 422 for negative offset', async () => {
    //   const { data, status, error } = await api.project({ id: projectId }).get({
    //     query: { offset: -1 }
    //   })

    //   expect(status).toBe(422)
    //   expect(data).toBeNull()
    //   expect(error).toHaveProperty('value.errors.0.code', 'VALIDATION')
    // })
  })
})
