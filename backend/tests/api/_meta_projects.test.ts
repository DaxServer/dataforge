import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'
import { metaProjectsRoutes } from '@backend/api/_meta_projects'
import { databasePlugin, initializeDb, closeDb, getDb } from '@backend/plugins/database'

const TEST_DB_PATH = ':memory:'

const createTestApi = () => {
  return treaty(new Elysia().use(databasePlugin).use(metaProjectsRoutes)).api
}

const insertMetaProject = async (row: Record<string, unknown>) => {
  const db = getDb()
  await db.run(
    `INSERT INTO _meta_projects (id, name, schema_for, schema)
     VALUES (?, ?, ?, ?)`,
    [row.id, row.name, row.schema_for, JSON.stringify(row.schema)] as any[]
  )
}

describe('GET /api/_meta_projects', () => {
  let api: ReturnType<typeof createTestApi>
  let uuid: string

  beforeEach(async () => {
    await initializeDb(TEST_DB_PATH)
    api = createTestApi()
    uuid = Bun.randomUUIDv7()
  })
  afterEach(async () => {
    await closeDb()
  })

  test('returns 200 and an array - empty table', async () => {
    const { data, status, error } = await api._meta_projects.get()
    expect(status).toBe(200)
    expect(error).toBeNull()
    expect(data).toHaveProperty('data', [])
  })

  test('parses JSON columns as objects', async () => {
    const row = {
      id: uuid,
      name: 'test',
      schema_for: null,
      schema: { foo: 42, bar: [1, 2, 3] },
    }
    await insertMetaProject(row)
    const { data, status, error } = await api._meta_projects.get()
    expect(status).toBe(200)
    expect(error).toBeNull()
    expect(data).toHaveProperty('data')
    expect(data).not.toBeNull()
    expect(data!.data).toContainEqual({
      ...row,
      created_at: expect.any(String),
      updated_at: expect.any(String),
    })
  })

  test('does not change non-JSON columns', async () => {
    const row = {
      id: uuid,
      name: 'test',
      schema_for: 'something',
      schema: {},
    }
    await insertMetaProject(row)
    const { data, status, error } = await api._meta_projects.get()
    expect(status).toBe(200)
    expect(error).toBeNull()
    expect(data).toHaveProperty('data')
    expect(data!.data).toContainEqual({
      ...row,
      created_at: expect.any(String),
      updated_at: expect.any(String),
    })
  })
})
