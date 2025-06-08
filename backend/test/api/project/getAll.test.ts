/// <reference types="bun-types" />
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'
import { projectRoutes } from '../../../src/api/project'
import { closeDb, initializeDb } from '../../../src/db'

// Create a test app with the project routes
const createTestApp = () => {
  return new Elysia().use(projectRoutes)
}

describe('getAllProjects', () => {
  // Create a test app instance for each test
  let app: ReturnType<typeof createTestApp>

  // Sample project data for testing
  const sampleProjects = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Project 1',
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Test Project 2',
      created_at: '2023-01-02T00:00:00.000Z',
      updated_at: '2023-01-02T00:00:00.000Z',
    },
  ]

  // Set up and clean up database for each test
  beforeEach(async () => {
    // Initialize a fresh in-memory database
    await initializeDb(':memory:')

    // Create a fresh app instance for each test
    app = createTestApp()

    // Insert sample projects
    const db = (await import('../../../src/db')).getDb()
    for (const project of sampleProjects) {
      await db.run(
        'INSERT INTO _meta_projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [project.id, project.name, project.created_at, project.updated_at]
      )
    }
  })

  // Clean up after each test
  afterEach(async () => {
    // Close the database connection
    await closeDb()
  })

  test('should return an empty array when no projects exist', async () => {
    // Clear the test data for this specific test
    const db = (await import('../../../src/db')).getDb()
    await db.run('DELETE FROM _meta_projects')

    const response = await app.handle(
      new Request('http://localhost/project', {
        method: 'GET',
      })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({
      data: [],
    })
  })

  test('should return all projects', async () => {
    const response = await app.handle(
      new Request('http://localhost/project', {
        method: 'GET',
      })
    )

    expect(response.status).toBe(200)
    const body = await response.json()

    const expectedProjects = [...sampleProjects]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((project) => ({
        ...project,
        created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\+\d{2}$/),
        updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\+\d{2}$/),
      }))

    expect(body).toEqual({
      data: expectedProjects,
    })
  })
})
