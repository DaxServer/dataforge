/// <reference types="bun-types" />
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'
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

    // Insert a test project
    const insertReader = await db.runAndReadAll(
      `INSERT INTO _meta_projects (name)
       VALUES (?)
       RETURNING id`,
      ['Test Project']
    )

    const result = insertReader.getRowObjectsJson() as Array<{ id: string }>
    expect(result[0]).toBeDefined()
    expect(result[0]).toHaveProperty('id')
    const testProjectId = result[0].id

    const { data, status, error } = await api.project({ id: testProjectId }).delete()

    // Verify the response status and body
    expect(status).toBe(204)
    expect(data).toBeEmpty()
    expect(error).toBeNull()

    // Verify the project is actually deleted
    const selectReader = await db.runAndReadAll('SELECT * FROM _meta_projects WHERE id = ?', [
      testProjectId,
    ])
    const projects = selectReader.getRowObjectsJson()

    expect(projects).toEqual([])
  })

  test('should return 404 when trying to delete non-existent project', async () => {
    // Use a valid UUID that doesn't exist in the database
    const nonExistentId = Bun.randomUUIDv7()

    // Attempt to delete the non-existent project
    const { data, status, error } = await api.project({ id: nonExistentId }).delete()

    // Verify the response status and body
    expect(status).toBe(404)
    expect(data).toBeNull()
    expect(error).toEqual(
      expect.objectContaining({
        status: 404,
        value: expect.objectContaining({
          data: expect.arrayContaining([]),
          errors: expect.arrayContaining([
            expect.objectContaining({
              code: 'NOT_FOUND',
              message: 'Project not found',
              details: expect.arrayContaining([]),
            }),
          ]),
        }),
      })
    )
  })

  test('should return 422 when trying to delete with invalid UUID format', async () => {
    const { data, status, error } = await api.project({ id: 'invalid-uuid-format' }).delete()

    expect(status).toBe(422)
    expect(data).toBeNull()
    expect(error).toEqual(
      expect.objectContaining({
        status: 422,
        value: expect.objectContaining({
          data: expect.any(Array),
          errors: expect.arrayContaining([
            expect.objectContaining({
              code: 'VALIDATION',
              message: 'ID must be a valid UUID',
              details: expect.arrayContaining([
                expect.objectContaining({
                  path: '/id',
                  message: `Expected string to match '${UUID_REGEX}'`,
                  schema: expect.objectContaining({
                    error: 'ID must be a valid UUID',
                    pattern: UUID_REGEX,
                    type: 'string',
                  }),
                }),
              ]),
            }),
          ]),
        }),
      })
    )
  })
})
