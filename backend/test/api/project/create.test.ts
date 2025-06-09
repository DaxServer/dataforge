/// <reference types="bun-types" />
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'
import { projectRoutes } from '../../../src/api/project'
import { closeDb, initializeDb } from '../../../src/db'
import { treaty } from '@elysiajs/eden'

// Create a test app with the project routes
const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes))
}

describe('createProject', () => {
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

  describe('Validation', () => {
    test('should create a new project with required fields', async () => {
      const projectData = {
        name: 'Test Project',
      }

      const { data, status, error } = await api.project.post(projectData)

      // Verify the response status and structure
      expect(status).toBe(201)
      expect(data).toMatchObject({
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
      expect(error).toBeNull()
    })

    test('should return 422 when name is missing', async () => {
      // @ts-ignore
      const { data, status, error } = await api.project.post({})

      expect(status).toBe(422)
      expect(data).toBeNull()

      // Check that the error object has the expected structure
      expect(error).toBeDefined()
      expect(error).toHaveProperty('status', 422)
      expect(error).toHaveProperty('value', {
        errors: [
          {
            code: 'VALIDATION',
            message: 'Validation failed',
            details: [
              {
                path: '/name',
                message: 'Expected string',
              },
            ],
          },
        ],
      })
    })

    test('should return 422 when name is empty', async () => {
      const { data, status, error } = await api.project.post({
        name: '',
      })

      expect(status).toBe(422)
      expect(data).toBeNull()

      // Check that the error object has the expected structure
      expect(error).toBeDefined()
      expect(error).toHaveProperty('status', 422)
      expect(error).toHaveProperty('value', {
        errors: [
          {
            code: 'VALIDATION',
            message: 'Validation failed',
            details: [
              {
                path: '/name',
                message: 'Expected string length greater or equal to 1',
                received: '',
              },
            ],
          },
        ],
      })
    })
  })
})
