/// <reference types="bun-types" />
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Elysia, InvertedStatusMap } from 'elysia'
import { treaty } from '@elysiajs/eden'
import { closeDb, initializeDb, getDb } from '@backend/plugins/database'
import { projectRoutes } from '@backend/api/project'
import { UUID_REGEX } from '@backend/api/project/_schemas'

const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}

describe('deleteProject', () => {
  let api: ReturnType<typeof createTestApi>

  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()
  })

  afterEach(async () => {
    await closeDb()
  })

  test('should delete an existing project and return 204', async () => {
    const db = getDb()

    const insertReader = await db.runAndReadAll(
      `INSERT INTO _meta_projects (name)
       VALUES (?)
       RETURNING id`,
      ['Test Project']
    )

    const result = insertReader.getRowObjectsJson() as Array<{ id: string }>
    expect(result[0]).toBeDefined()
    expect(result[0]).toHaveProperty('id')
    const testProjectId = result[0]?.id as string

    const { data, status, error } = await api.project({ id: testProjectId }).delete()

    expect(status).toBe(204)
    expect(data).toBeEmpty()
    expect(error).toBeNull()

    const selectReader = await db.runAndReadAll('SELECT * FROM _meta_projects WHERE id = ?', [
      testProjectId,
    ])
    const projects = selectReader.getRowObjectsJson()

    expect(projects).toEqual([])
  })

  test('should return 404 when trying to delete non-existent project', async () => {
    const nonExistentId = Bun.randomUUIDv7()

    const { data, status, error } = await api.project({ id: nonExistentId }).delete()

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

  test('should return 422 when trying to delete with invalid UUID format', async () => {
    const { data, status, error } = await api.project({ id: 'invalid-uuid-format' }).delete()

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
              path: '/id',
              message: `Expected string to match '${UUID_REGEX}'`,
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
})
