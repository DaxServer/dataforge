/// <reference types="bun-types" />
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'
import { projectRoutes } from '@backend/api/project'
import { closeDb, initializeDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'
import { UUID_REGEX_PATTERN } from '@backend/api/project/schemas.ts'

// Create a test app with the project routes
const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
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
      expect(data).toHaveProperty('data')
      expect(data).toHaveProperty('data.name', projectData.name)
      expect(data).toHaveProperty('data.id')
      expect(data).toHaveProperty('data.id', expect.stringMatching(UUID_REGEX_PATTERN))
      // Expecting naive timestamp format: YYYY-MM-DD HH:MM:SS[.SSS] (with optional milliseconds)
      expect(data).toHaveProperty(
        'data.created_at',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,3})?$/)
      )
      expect(data).toHaveProperty(
        'data.updated_at',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,3})?$/)
      )
      expect(error).toBeNull()
    })

    test('should return 422 when name is missing', async () => {
      // @ts-expect-error - Testing invalid input where name is missing
      const { data, status, error } = await api.project.post({})

      expect(status).toBe(422)
      expect(data).toBeNull()

      expect(error).toBeDefined()
      expect(error).toHaveProperty('status', 422)
      expect(error).toHaveProperty('value.data', [])
      expect(error).toHaveProperty('value.errors', [
        {
          code: 'VALIDATION',
          message: 'Project name is required and must be at least 1 character long',
          details: [
            {
              path: '/name',
              message: 'Expected string',
              schema: {
                error: 'Project name is required and must be at least 1 character long',
                minLength: 1,
                type: 'string',
              },
            },
          ],
        },
      ])
    })

    test('should return 422 when name is empty', async () => {
      const { data, status, error } = await api.project.post({
        name: '',
      })

      expect(status).toBe(422)
      expect(data).toBeNull()

      expect(error).toBeDefined()
      expect(error).toHaveProperty('status', 422)
      expect(error).toHaveProperty('value.data', [])
      expect(error).toHaveProperty('value.errors', [
        {
          code: 'VALIDATION',
          message: 'Project name is required and must be at least 1 character long',
          details: [
            {
              path: '/name',
              message: 'Expected string length greater or equal to 1',
              schema: {
                error: 'Project name is required and must be at least 1 character long',
                minLength: 1,
                type: 'string',
              },
            },
          ],
        },
      ])
    })
  })
})
