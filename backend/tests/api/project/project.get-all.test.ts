/// <reference types="bun-types" />
import { projectRoutes } from '@backend/api/project'
import { closeDb, getDb, initializeDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  setSystemTime,
  test,
} from 'bun:test'
import { Elysia } from 'elysia'

const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}

describe('getAllProjects', () => {
  let api: ReturnType<typeof createTestApi>

  const sampleProjects = [
    {
      id: Bun.randomUUIDv7(),
      name: 'Test Project 1',
      created_at: '2023-01-01 00:00:00',
      updated_at: '2023-01-01 00:00:00',
    },
    {
      id: Bun.randomUUIDv7(),
      name: 'Test Project 2',
      created_at: '2023-01-02 00:00:00',
      updated_at: '2023-01-02 00:00:00',
    },
  ]

  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()

    const db = getDb()
    for (const project of sampleProjects) {
      await db.run(
        'INSERT INTO _meta_projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [project.id, project.name, project.created_at, project.updated_at],
      )
    }
  })

  beforeAll(() => {
    setSystemTime(new Date('2023-01-03T00:00:00.000Z'))
  })

  afterEach(async () => {
    await closeDb()
  })

  afterAll(() => {
    setSystemTime()
  })

  test('should return an empty array when no projects exist', async () => {
    const db = getDb()
    await db.run('DELETE FROM _meta_projects')

    const { data, status, error } = await api.project.get()

    expect(status).toBe(200)
    expect(error).toBeNull()
    expect(data).toStrictEqual({
      data: [],
    })
  })

  test('should return all projects with consistent timestamps', async () => {
    const { data, status, error } = await api.project.get()

    // Sort projects by created_at in descending order
    const expectedProjects = [...sampleProjects]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((project) => ({
        ...project,
        // DuckDB returns timestamps in format: 'YYYY-MM-DD HH:MM:SS' (naive timestamp without timezone)
        created_at: project.created_at,
        updated_at: project.updated_at,
      }))

    expect(status).toBe(200)
    expect(data).toEqual({
      data: expectedProjects,
    })
    expect(error).toBeNull()
  })
})
