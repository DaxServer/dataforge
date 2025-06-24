import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { readdir } from 'node:fs/promises'
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'
import { initializeDb, closeDb, getDb } from '@backend/plugins/database'
import { projectRoutes } from '@backend/api/project'
import { UUID_REGEX_PATTERN } from '@backend/api/project/_schemas'

const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}

describe('POST /api/project/import', () => {
  let api: ReturnType<typeof createTestApi>

  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()
  })

  afterEach(async () => {
    await closeDb()

    const tempDir = new URL('../../temp', import.meta.url).pathname
    const files = await readdir(tempDir).catch(() => [])
    await Promise.all(
      files.map(async file => {
        const filePath = `${tempDir}/${file}`
        await Bun.file(filePath)
          .delete()
          .catch(() => {})
      })
    )
  })

  describe('Successful imports', () => {
    test('should create project and import JSON file with auto-generated name', async () => {
      const testData = JSON.stringify({
        rows: [
          { name: 'John', age: 30, city: 'New York' },
          { name: 'Jane', age: 25, city: 'Boston' },
        ],
        columns: ['name', 'age', 'city'],
      })
      const file = new File([testData], 'test-data.json', { type: 'application/json' })

      const { data, status, error } = await api.project.import.post({ file })

      expect(status).toBe(201)
      expect(error).toBeNull()
      expect(data).toHaveProperty('data', {
        id: expect.stringMatching(UUID_REGEX_PATTERN),
      })
    })

    test('should create project and import JSON file with custom name', async () => {
      const testData = JSON.stringify({
        rows: [{ id: 1, value: 'test' }],
        columns: ['id', 'value'],
      })
      const file = new File([testData], 'data.json', { type: 'application/json' })
      const customName = 'My Custom Project'

      const { data, status, error } = await api.project.import.post({
        file,
        name: customName,
      })

      expect(status).toBe(201)
      expect(error).toBeNull()
      expect(data).toHaveProperty('data', {
        id: expect.stringMatching(UUID_REGEX_PATTERN),
      })
    })

    test('should handle large JSON files', async () => {
      const rows = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        active: i % 2 === 0,
      }))
      const testData = JSON.stringify({ rows, columns: ['id', 'name', 'email', 'active'] })
      const file = new File([testData], 'large-dataset.json', { type: 'application/json' })

      const { data, status, error } = await api.project.import.post({ file })

      expect(status).toBe(201)
      expect(error).toBeNull()
      expect(data).toHaveProperty('data', {
        id: expect.stringMatching(UUID_REGEX_PATTERN),
      })
    })

    describe('Validation errors', () => {
      test('should return 422 for missing file', async () => {
        // @ts-expect-error - Testing invalid input where file is missing
        const { data, status, error } = await api.project.import.post({})

        expect(status).toBe(422)
        expect(data).toBeNull()
        expect(error).toHaveProperty('status', 422)
        expect(error).toHaveProperty('value', {
          data: [],
          errors: [
            {
              code: 'VALIDATION',
              details: [
                {
                  message: "Expected kind 'File'",
                  path: '/file',
                  schema: {
                    default: 'File',
                    format: 'binary',
                    minSize: 1,
                    type: 'string',
                  },
                },
              ],
            },
          ],
        })
      })

      test('should return 422 for empty file', async () => {
        const file = new File([], 'empty.json', { type: 'application/json' })

        const { data, status, error } = await api.project.import.post({ file })

        expect(status).toBe(422)
        expect(data).toBeNull()
        expect(error).toHaveProperty('status', 422)
        expect(error).toHaveProperty('value', {
          data: [],
          errors: [
            {
              code: 'VALIDATION',
              details: [
                {
                  path: '/file',
                  message: "Expected kind 'File'",
                  schema: {
                    default: 'File',
                    format: 'binary',
                    minSize: 1,
                    type: 'string',
                  },
                },
              ],
            },
          ],
        })
      })

      test('should return 422 for invalid name - too long', async () => {
        const testData = JSON.stringify({ rows: [], columns: [] })
        const file = new File([testData], 'test.json', { type: 'application/json' })
        const longName = 'a'.repeat(256) // Assuming 255 character limit

        const { data, status, error } = await api.project.import.post({
          file,
          name: longName,
        })

        expect(status).toBe(422)
        expect(data).toBeNull()
        expect(error).toHaveProperty('status', 422)
        expect(error).toHaveProperty('value', {
          data: [],
          errors: [
            {
              code: 'VALIDATION',
              message: 'Project name must be between 1 and 255 characters long if provided',
              details: [
                {
                  path: '/name',
                  message: 'Expected string length less or equal to 255',
                  schema: {
                    error: 'Project name must be between 1 and 255 characters long if provided',
                    maxLength: 255,
                    minLength: 1,
                    type: 'string',
                  },
                },
              ],
            },
          ],
        })
      })

      test('should return 422 for invalid name - empty string', async () => {
        const testData = JSON.stringify({ rows: [], columns: [] })
        const file = new File([testData], 'test.json', { type: 'application/json' })

        const { data, status, error } = await api.project.import.post({
          file,
          name: '',
        })

        expect(status).toBe(422)
        expect(data).toBeNull()
        expect(error).toHaveProperty('status', 422)
        expect(error).toHaveProperty('value', {
          data: [],
          errors: [
            {
              code: 'VALIDATION',
              message: 'Project name must be between 1 and 255 characters long if provided',
              details: [
                {
                  path: '/name',
                  message: 'Expected string length greater or equal to 1',
                  schema: {
                    error: 'Project name must be between 1 and 255 characters long if provided',
                    maxLength: 255,
                    minLength: 1,
                    type: 'string',
                  },
                },
              ],
            },
          ],
        })
      })
    })

    describe('File processing errors', () => {
      test('should return 400 for invalid JSON content', async () => {
        const invalidJson = '{ "invalid": json content }'
        const file = new File([invalidJson], 'invalid.json', { type: 'application/json' })

        const { data, status, error } = await api.project.import.post({ file })

        expect(status).toBe(400)
        expect(data).toBeNull()
        expect(error).toHaveProperty('status', 400)
        expect(error).toHaveProperty('value', {
          data: [],
          errors: [
            {
              code: 'INVALID_JSON',
              message: 'Invalid JSON format in uploaded file',
              details: ['Failed to parse JSON'],
            },
          ],
        })
      })

      test('should return 400 for non-JSON file content', async () => {
        const textContent = 'This is plain text, not JSON'
        const file = new File([textContent], 'text.json', { type: 'application/json' })

        const { data, status, error } = await api.project.import.post({ file })

        expect(status).toBe(400)
        expect(data).toBeNull()
        expect(error).toHaveProperty('status', 400)
        expect(error).toHaveProperty('value', {
          data: [],
          errors: [
            {
              code: 'INVALID_JSON',
              message: 'Invalid JSON format in uploaded file',
              details: ['Failed to parse JSON'],
            },
          ],
        })
      })
    })

    describe('Server errors', () => {
      test('should handle database errors gracefully', async () => {
        // Close the database to simulate a database error
        await closeDb()

        const testData = JSON.stringify({ rows: [], columns: [] })
        const file = new File([testData], 'test.json', { type: 'application/json' })

        const { data, status, error } = await api.project.import.post({ file })

        expect(status).toBe(500)
        expect(data).toBeNull()
        expect(error).toHaveProperty('status', 500)
        expect(error).toHaveProperty('value', {
          data: [],
          errors: [
            {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Database not initialized. Call initializeDb() first.',
              details: [],
            },
          ],
        })

        // Reinitialize for cleanup
        await initializeDb(':memory:')
      })
    })

    describe('Edge cases', () => {
      test('should handle very small JSON files', async () => {
        const minimalData = JSON.stringify({ rows: [], columns: [] })
        const file = new File([minimalData], 'minimal.json', { type: 'application/json' })

        const { data, status, error } = await api.project.import.post({ file })

        expect(status).toBe(201)
        expect(error).toBeNull()
        expect(data).toHaveProperty('data', {
          id: expect.stringMatching(UUID_REGEX_PATTERN),
        })
      })

      test('should handle special characters in project name', async () => {
        const testData = JSON.stringify({ rows: [], columns: [] })
        const file = new File([testData], 'test.json', { type: 'application/json' })
        const specialName = 'Project with émojis 🚀 and symbols @#$%'

        const { data, status, error } = await api.project.import.post({
          file,
          name: specialName,
        })

        expect(status).toBe(201)
        expect(error).toBeNull()
        expect(data).toHaveProperty('data', {
          id: expect.stringMatching(UUID_REGEX_PATTERN),
        })
      })

      test('should handle Unicode content in JSON', async () => {
        const unicodeData = JSON.stringify({
          rows: [
            { name: '张三', city: '北京' },
            { name: 'José', city: 'São Paulo' },
            { name: 'محمد', city: 'الرياض' },
          ],
          columns: ['name', 'city'],
        })
        const file = new File([unicodeData], 'unicode.json', { type: 'application/json' })

        const { data, status, error } = await api.project.import.post({ file })

        expect(status).toBe(201)
        expect(error).toBeNull()
        expect(data).toHaveProperty('data', {
          id: expect.stringMatching(UUID_REGEX_PATTERN),
        })
      })

      test('should handle files with different extensions but JSON content', async () => {
        const testData = JSON.stringify({ rows: [], columns: [] })
        const file = new File([testData], 'data.txt', { type: 'text/plain' })

        const { data, status, error } = await api.project.import.post({ file })

        expect(status).toBe(201)
        expect(error).toBeNull()
        expect(data).toHaveProperty('data', {
          id: expect.stringMatching(UUID_REGEX_PATTERN),
        })
      })

      test('should create table with autoincrement primary key', async () => {
        const testData = JSON.stringify({
          rows: [
            { name: 'John', age: 30, city: 'New York' },
            { name: 'Jane', age: 25, city: 'Boston' },
          ],
          columns: ['name', 'age', 'city'],
        })
        const file = new File([testData], 'test-data.json', { type: 'application/json' })

        const { data, status } = await api.project.import.post({ file })
        expect(status).toBe(201)

        const db = getDb()
        const projectId = data?.data?.id

        const result = await db.runAndReadAll(`PRAGMA table_info("project_${projectId}")`)

        const columns = result.getRowObjectsJson()

        // Verify there is an 'id' column with autoincrement and primary key
        const idColumn = (columns as DuckDBColumn[]).find(col => col.name === 'id')
        expect(idColumn).toBeDefined()

        // In DuckDB, primary key is indicated by pk > 0
        expect(Number(idColumn.pk)).toBeGreaterThan(0)

        // Check if the id column is autoincrement by checking its type and constraints
        // In DuckDB, autoincrement columns are BIGINT PRIMARY KEY and NOT NULL
        expect(idColumn.type.toUpperCase()).toBe('BIGINT')
        expect(Boolean(idColumn.notnull)).toBe(true)
      })
    })
  })
})
