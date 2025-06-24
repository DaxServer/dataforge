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
]

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
    const { data, status, error } = await api.project({ id: projectId }).get()

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
    expect(data).toHaveProperty('meta', {
      total: TEST_DATA.length,
      limit: 25,
      offset: 0,
      name: 'Test Project for getById',
      schema: [
        { name: 'name', type: 'string' },
        { name: 'age', type: 'integer' },
        { name: 'city', type: 'string' },
      ],
    })
  })

  it('should return 404 for non-existent project', async () => {
    const { data, status, error } = await api.project({ id: NON_EXISTENT_UUID }).get()

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
    const { data, status, error } = await api.project({ id: INVALID_UUID }).get()

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

  it('should return project with empty data', async () => {
    const { data: createData, error: createError } = await api.project.post({
      name: 'Empty Project',
    })
    expect(createError).toBeNull()
    const emptyProjectId = createData?.data?.id as string

    const { data, status, error } = await api.project({ id: emptyProjectId }).get()

    expect(status).toBe(200)
    expect(error).toBeNull()
    expect(data).toHaveProperty('data', [])
    expect(data).toHaveProperty('meta', {
      name: 'Unknown Project',
      schema: [],
      total: 0,
      limit: 25,
      offset: 0,
    })

    await api.project({ id: emptyProjectId }).delete()
  })
})
