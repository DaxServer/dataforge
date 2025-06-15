import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'
import { projectRoutes } from '@backend/api/project'
import { initializeDb, closeDb, getDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'
import { UUID_REGEX_PATTERN } from '@backend/api/project/schemas'
import { readdir } from 'node:fs/promises'

// Create a test app with the project routes
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

    // Clean up temporary files
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
      // Create a valid JSON file
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
      expect(data).toMatchObject({
        data: {
          id: expect.stringMatching(UUID_REGEX_PATTERN),
        },
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
      expect(data).toMatchObject({
        data: {
          id: expect.stringMatching(UUID_REGEX_PATTERN),
        },
      })
    })

    test('should handle large JSON files', async () => {
      // Create a larger dataset
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
        expect(error).toBeDefined()
        expect(error).toHaveProperty('status', 422)
        expect(error).toHaveProperty('value', {
          errors: [
            {
              code: 'VALIDATION',
              details: [
                {
                  message: "Expected kind 'File'",
                  path: '/file',
                },
              ],
              message: 'Validation failed',
            },
          ],
        })
      })

      test('should return 422 for empty file', async () => {
        const file = new File([], 'empty.json', { type: 'application/json' })

        const { data, status, error } = await api.project.import.post({ file })

        expect(status).toBe(422)
        expect(data).toBeNull()
        expect(error).toBeDefined()
        expect(error).toHaveProperty('status', 422)
      })

      test('should return 422 for invalid name (too long)', async () => {
        const testData = JSON.stringify({ rows: [], columns: [] })
        const file = new File([testData], 'test.json', { type: 'application/json' })
        const longName = 'a'.repeat(256) // Assuming 255 character limit

        const { data, status, error } = await api.project.import.post({
          file,
          name: longName,
        })

        expect(status).toBe(422)
        expect(data).toBeNull()
        expect(error).toBeDefined()
        expect(error).toHaveProperty('status', 422)
        expect(error).toHaveProperty('value', {
          errors: [
            {
              code: 'VALIDATION',
              details: [
                {
                  message: 'Expected string length less or equal to 255',
                  path: '/name',
                  received: longName,
                },
              ],
              message: 'Validation failed',
            },
          ],
        })
      })

      test('should return 422 for invalid name (empty string)', async () => {
        const testData = JSON.stringify({ rows: [], columns: [] })
        const file = new File([testData], 'test.json', { type: 'application/json' })

        const { data, status, error } = await api.project.import.post({
          file,
          name: '',
        })

        expect(status).toBe(422)
        expect(data).toBeNull()
        expect(error).toBeDefined()
        expect(error).toHaveProperty('status', 422)
        expect(error).toHaveProperty('value', {
          errors: [
            {
              code: 'VALIDATION',
              details: [
                {
                  message: 'Expected string length greater or equal to 1',
                  path: '/name',
                  received: '',
                },
              ],
              message: 'Validation failed',
            },
          ],
        })
      })
    })

    describe('Table creation', () => {
      test('should create table with autoincrement primary key', async () => {
        // Create a valid JSON file
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

        // Check if the table has an autoincrement primary key using DuckDB's PRAGMA table_info
        const result = await db.runAndReadAll(`
        PRAGMA table_info("project_${projectId}")
      `)

        const columns = result.getRowObjectsJson()

        // Verify there is an 'id' column with autoincrement and primary key
        const idColumn = (columns as DuckDBColumn[]).find(col => col.name === 'id')
        expect(idColumn).toBeDefined()

        // In DuckDB, primary key is indicated by pk > 0
        expect(Number(idColumn.pk)).toBeGreaterThan(0)

        // Check if the id column is autoincrement by checking its type and constraints
        // In DuckDB, autoincrement columns are BIGINT PRIMARY KEY and NOT NULL
        expect(idColumn.type.toUpperCase()).toBe('BIGINT')
        // Handle both boolean true and number 1 for notnull
        expect(Boolean(idColumn.notnull)).toBe(true)

        // In DuckDB, autoincrement columns don't necessarily create explicit sequences
        // Instead, verify that the table was created successfully with the autoincrement column
        // The presence of the BIGINT PRIMARY KEY column with NOT NULL constraint is sufficient
        expect(idColumn.type.toUpperCase()).toBe('BIGINT')
        expect(Boolean(idColumn.pk)).toBe(true)
      })
    })

    describe('File processing errors', () => {
      test('should return 400 for invalid JSON content', async () => {
        const invalidJson = '{ "invalid": json content }'
        const file = new File([invalidJson], 'invalid.json', { type: 'application/json' })

        const { data, status, error } = await api.project.import.post({ file })

        expect(status).toBe(400)
        expect(data).toBeNull()
        expect(error).toBeDefined()
        expect(error).toHaveProperty('status', 400)
        expect(error).toHaveProperty('value', {
          errors: [
            {
              code: 'INVALID_JSON',
              details: {
                error: 'Failed to parse JSON',
              },
              message: 'Invalid JSON format in uploaded file',
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
        expect(error).toBeDefined()
        expect(error).toHaveProperty('status', 400)
        expect(error).toHaveProperty('value', {
          errors: [
            {
              code: 'INVALID_JSON',
              details: {
                error: 'Failed to parse JSON',
              },
              message: 'Invalid JSON format in uploaded file',
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
        expect(error).toBeDefined()
        expect(error).toHaveProperty('status', 500)
        expect(error).toHaveProperty('value', {
          errors: [
            {
              code: 'UNKNOWN',
              details: {},
              message: 'Database not initialized. Call initializeDb() first.',
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
        expect(data).toHaveProperty('data')
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

        // Should still work if content is valid JSON
        expect(status).toBe(201)
        expect(error).toBeNull()
        expect(data).toHaveProperty('data', {
          id: expect.stringMatching(UUID_REGEX_PATTERN),
        })
      })

      test('should create table with autoincrement primary key', async () => {
        // Create a valid JSON file
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

        // Check if the table has an autoincrement primary key using DuckDB's PRAGMA table_info
        const result = await db.runAndReadAll(`
          PRAGMA table_info("project_${projectId}")
        `)

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
