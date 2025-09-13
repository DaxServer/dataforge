import { projectRoutes } from '@backend/api/project'
import { UUID_REGEX_PATTERN } from '@backend/api/project/schemas'
import { closeDb, initializeDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'

const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}

describe('createProject', () => {
  let api: ReturnType<typeof createTestApi>

  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()
  })

  afterEach(async () => {
    await closeDb()
  })

  describe('Validation', () => {
    test('should create a new project with required fields', async () => {
      const projectData = {
        name: 'Test Project',
      }

      const { data, status, error } = await api.project.post(projectData)

      expect(status).toBe(201)
      expect(data).toHaveProperty('data', {
        name: projectData.name,
        id: expect.stringMatching(UUID_REGEX_PATTERN),
        created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,3})?$/),
        updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,3})?$/),
      })
      expect(error).toBeNull()
    })

    test('should return 422 when name is missing', async () => {
      // @ts-expect-error - Testing invalid input where name is missing
      const { data, status, error } = await api.project.post({})

      expect(status).toBe(422)
      expect(data).toBeNull()
      expect(error).toHaveProperty('status', 422)
      expect(error).toHaveProperty('value', [
        {
          errors: [],
          message: 'Expected string',
          path: '/name',
          schema: {
            error: 'Project name is required and must be between 1 and 255 characters long',
            maxLength: 255,
            minLength: 1,
            type: 'string',
          },
          type: 54,
        },
      ])
    })

    test('should return 422 when name is empty', async () => {
      const { data, status, error } = await api.project.post({
        name: '',
      })

      expect(status).toBe(422)
      expect(data).toBeNull()
      expect(error).toHaveProperty('status', 422)
      expect(error).toHaveProperty('value', [
        {
          errors: [],
          message: 'Expected string length greater or equal to 1',
          path: '/name',
          schema: {
            error: 'Project name is required and must be between 1 and 255 characters long',
            maxLength: 255,
            minLength: 1,
            type: 'string',
          },
          type: 52,
          value: '',
        },
      ])
    })
  })
})
