/// <reference types="bun-types" />
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'
import { projectRoutes } from '../../../src/api/project'
import { closeDb, initializeDb } from '../../../src/db'

// Create a test app with the project routes
const createTestApp = () => {
  return new Elysia().use(projectRoutes)
}

describe('createProject', () => {
  // Create a test app instance for each test
  let app: ReturnType<typeof createTestApp>

  // Set up and clean up database for each test
  beforeEach(async () => {
    // Initialize a fresh in-memory database
    await initializeDb(':memory:')

    // Create a fresh app instance for each test
    app = createTestApp()
  })

  // Clean up after each test
  afterEach(async () => {
    // Close the database connection
    await closeDb()
  })

  describe('Validation', () => {
    test('should create a new project with required fields', async () => {
      const projectData = {
        name: 'Test Project',
      }

      const response = await app.handle(
        new Request('http://localhost/project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData),
        })
      )

      // Verify the response status and structure
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body).toMatchObject({
        data: {
          name: projectData.name,
          id: expect.stringMatching(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          ),
          // Expecting naive timestamp format: YYYY-MM-DD HH:MM:SS[.SSS] (with optional milliseconds)
          created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,3})?$/),
          updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,3})?$/),
        },
      })
    })

    test('should return 422 when name is missing', async () => {
      const response = await app.handle(
        new Request('http://localhost/project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
      )

      expect(response.status).toBe(422)
      const body = await response.json()
      expect(body).toMatchObject({
        errors: [
          {
            code: 'VALIDATION',
            message: 'Validation failed',
            details: [
              expect.objectContaining({
                message: 'Expected string',
                path: '/name',
              }),
            ],
          },
        ],
      })
    })

    test('should return 422 when name is empty', async () => {
      const response = await app.handle(
        new Request('http://localhost/project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '',
          }),
        })
      )

      expect(response.status).toBe(422)
      const body = await response.json()
      expect(body).toMatchObject({
        errors: [
          {
            code: 'VALIDATION',
            message: 'Validation failed',
            details: [
              expect.objectContaining({
                message: 'Expected string length greater or equal to 1',
                path: '/name',
                received: '',
              }),
            ],
          },
        ],
      })
    })
  })
})
