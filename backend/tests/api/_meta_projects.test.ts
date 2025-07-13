import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'
import { metaProjectsRoutes } from '@backend/api/_meta_projects'
import { databasePlugin, initializeDb, closeDb, getDb } from '@backend/plugins/database'

const TEST_PROJECT_ID = Bun.randomUUIDv7()

const createTestApi = () => {
  return treaty(new Elysia().use(databasePlugin).use(metaProjectsRoutes)).api
}

const insertMetaProject = async (project: Record<string, unknown>) => {
  const db = getDb()
  await db.run(
    `INSERT INTO _meta_projects (id, name, schema_for, schema)
     VALUES (?, ?, ?, ?)`,
    [project.id, project.name, project.schema_for, JSON.stringify(project.schema)] as any[]
  )
}

type WikibaseRow = { id: string; wikibase: string; name: string }

const createAndInsertWikibaseRows = async (wikibaseRows: WikibaseRow[]) => {
  const db = getDb()
  for (const w of wikibaseRows) {
    await db.run(`INSERT INTO _meta_wikibase_schema (id, project_id, wikibase, name) VALUES (?, ?, ?, ?)`, [
      w.id,
      TEST_PROJECT_ID,
      w.wikibase,
      w.name,
    ])
  }
}

describe('GET /api/_meta_projects', () => {
  let api: ReturnType<typeof createTestApi>

  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()
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

  test('does not change non-JSON columns and includes empty wikibase schema', async () => {
    const project = {
      id: TEST_PROJECT_ID,
      name: 'test',
      schema_for: 'something',
      schema: {},
    }
    await insertMetaProject(project)
    const { data, status, error } = await api._meta_projects.get()
    expect(status).toBe(200)
    expect(error).toBeNull()
    expect(data).toHaveProperty('data')
    expect(data!.data).toContainEqual({
      ...project,
      created_at: expect.any(String),
      updated_at: expect.any(String),
      wikibase_schema: [],
    })
  })

  describe('parses JSON columns as objects', () => {
    const project = {
      id: TEST_PROJECT_ID,
      name: 'test',
      schema_for: null,
      schema: { foo: 42, bar: [1, 2, 3] },
    }

    let data: any, status: number, error: any, wikibaseRows: WikibaseRow[]

    beforeEach(async () => {
      await insertMetaProject(project)
      data = null
      status = 0
      error = null
      wikibaseRows = []
    })

    afterEach(async () => {
      expect(status).toBe(200)
      expect(error).toBeNull()
      expect(data).toHaveProperty('data')
      expect(data).not.toBeNull()
      expect(data!.data).toContainEqual({
        ...project,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        wikibase_schema: wikibaseRows.map(w => ({
          ...w,
          name: w.name || `Schema for ${w.wikibase}`,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        })),
      })
    })

    test('parses JSON columns as objects and includes no wikibase schema', async () => {
      ;({ data, status, error } = await api._meta_projects.get())
      wikibaseRows = []
    })

    test('parses JSON columns as objects with one linked wikibase schema', async () => {
      wikibaseRows = [{ id: Bun.randomUUIDv7(), wikibase: 'wikibase1', name: 'Schema for wikibase1' }]
      await createAndInsertWikibaseRows(wikibaseRows)
      ;({ data, status, error } = await api._meta_projects.get())
    })

    test('parses JSON columns as objects with multiple linked wikibase schemas', async () => {
      wikibaseRows = [
        { id: Bun.randomUUIDv7(), wikibase: 'wikibase1', name: 'Schema for wikibase1' },
        { id: Bun.randomUUIDv7(), wikibase: 'wikibase2', name: 'Schema for wikibase2' },
      ]
      await createAndInsertWikibaseRows(wikibaseRows)
      ;({ data, status, error } = await api._meta_projects.get())
    })

    test('parses JSON columns as objects with and without linked wikibase schemas', async () => {
      wikibaseRows = [
        { id: Bun.randomUUIDv7(), wikibase: 'wikibase1', name: 'Schema for wikibase1' },
        { id: Bun.randomUUIDv7(), wikibase: 'wikibase2', name: 'Schema for wikibase2' },
      ]
      await createAndInsertWikibaseRows(wikibaseRows)
      ;({ data, status, error } = await api._meta_projects.get())
    })
  })
})
