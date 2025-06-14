/// <reference types="bun-types" />
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'
import { projectRoutes } from '../../../src/api/project'
import { closeDb, initializeDb, getDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'

// Create a test app with the project routes
const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}

describe('deleteProject', () => {
  // Create a test app instance for each test
  let api: ReturnType<typeof createTestApi>

  // Set up and clean up database for each test
  beforeEach(async () => {
    // Initialize a fresh in-memory database
    await initializeDb(':memory:')

    // Create a fresh app instance for each test
    api = createTestApi()
  })

  // Clean up after each test
  afterEach(async () => {
    // Close the database connection
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
    if (!result[0]?.id) {
      throw new Error('Failed to create test project')
    }
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

    expect(projects.length).toBe(0)
  })

  test('should return 404 when trying to delete non-existent project', async () => {
    // Use a valid UUID that doesn't exist in the database
    const nonExistentId = Bun.randomUUIDv7()

    // Attempt to delete the non-existent project
    const { data, status, error } = await api.project({ id: nonExistentId }).delete()

    // Verify the response status and body
    expect(status).toBe(404)
    expect(data).toBeNull()
    expect(error).toBeDefined()
    expect(error).toHaveProperty('status', 404)
    expect(error).toHaveProperty('value', '')
  })

  test('should return 422 when trying to delete with invalid UUID format', async () => {
    const { data, status, error } = await api.project({ id: 'invalid-uuid-format' }).delete()

    expect(status).toBe(422)
    expect(data).toBeNull()
    expect(error).toHaveProperty('value', {
      errors: [
        {
          code: 'VALIDATION',
          message: 'Validation failed',
          details: [
            {
              path: '/id',
              message:
                "Expected string to match '^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$'",
              received: 'invalid-uuid-format',
            },
          ],
        },
      ],
    })
  })
})
