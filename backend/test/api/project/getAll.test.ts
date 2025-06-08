/// <reference types="bun-types" />
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  beforeAll,
  afterAll,
  setSystemTime,
} from 'bun:test'
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
      created_at: '2023-01-01 00:00:00',
      updated_at: '2023-01-01 00:00:00',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Test Project 2',
      created_at: '2023-01-02 00:00:00',
      updated_at: '2023-01-02 00:00:00',
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

  // Mock system time for consistent testing
  beforeAll(() => {
    // Set a fixed date for all tests
    setSystemTime(new Date('2023-01-03T00:00:00.000Z'))
  })

  // Clean up after each test
  afterEach(async () => {
    // Close the database connection
    await closeDb()
  })

  // Restore real timers after all tests
  afterAll(() => {
    setSystemTime() // Reset to real time
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

  test('should return all projects with consistent timestamps', async () => {
    const response = await app.handle(
      new Request('http://localhost/project', {
        method: 'GET',
      })
    )

    expect(response.status).toBe(200)
    const body = await response.json()

    // Sort projects by created_at in descending order
    const expectedProjects = [...sampleProjects]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((project) => ({
        ...project,
        // DuckDB returns timestamps in format: 'YYYY-MM-DD HH:MM:SS' (naive timestamp without timezone)
        created_at: project.created_at,
        updated_at: project.updated_at,
      }))

    // Verify the structure and exact values
    expect(body).toEqual({
      data: expectedProjects,
    })
  })
})
