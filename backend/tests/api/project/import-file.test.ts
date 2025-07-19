import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { readdir } from 'node:fs/promises'
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'
import { initializeDb, closeDb, getDb } from '@backend/plugins/database'
import { projectRoutes } from '@backend/api/project'

const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}

describe('POST /project/:projectId/import-file', () => {
  let api: ReturnType<typeof createTestApi>
  let projectId: string

  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()

    const { data } = await api.project.post({ name: 'Test Project' })
    projectId = (data as any)?.data?.id as string
  })

  afterEach(async () => {
    await closeDb()

    // Clean up temp files
    const tempDir = './temp'
    const files = await readdir(tempDir).catch(() => [])
    await Promise.all(
      files
        .filter(file => file.startsWith('temp_') && file.endsWith('.json'))
        .map(async file => {
          const filePath = `${tempDir}/${file}`
          await Bun.file(filePath)
            .delete()
            .catch(() => {})
        }),
    )
  })

  test('should accept non-JSON file type - type validation disabled', async () => {
    // Create a test file with non-JSON mime type
    // Note: File type validation is currently disabled due to Elysia 1.3.x issues
    const testData = 'This is not JSON data'
    const file = new File([testData], 'test-file.txt', { type: 'text/plain' })

    const { data, status, error } = await api.project({ projectId }).import.file.post({
      file,
    })

    expect(status).toBe(201)
    expect(data).toHaveProperty('tempFilePath', expect.stringMatching(/\.json$/))
    expect(error).toBeNull()
  })

  test('should return 422 for empty file', async () => {
    const file = new File([], 'empty-file.json', { type: 'application/json' })

    const { data, status, error } = await api.project({ projectId }).import.file.post({
      file,
    })

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

  test('should save uploaded file to temporary location', async () => {
    const testData = JSON.stringify({ name: 'John', age: 30, city: 'New York' })
    const file = new File([testData], 'test-data.json', { type: 'application/json' })

    const { data, status, error } = await api.project({ projectId }).import.file.post({
      file,
    })

    expect(status).toBe(201)
    expect(data).toHaveProperty('tempFilePath', expect.stringMatching(/\.json$/))
    expect(error).toBeNull()

    const tempFile = Bun.file((data as any).tempFilePath)
    expect(await tempFile.exists()).toBe(true)

    const savedContent = await tempFile.text()
    expect(savedContent).toBe(testData)
  })

  test('should successfully import uploaded file into DuckDB', async () => {
    const TEST_DATA = [
      { id: 1, name: 'John', age: 30 },
      { id: 2, name: 'Jane', age: 25 },
    ]
    const file = new File([JSON.stringify(TEST_DATA)], 'test-data.json', {
      type: 'application/json',
    })

    const {
      data: uploadData,
      status: uploadStatus,
      error: uploadError,
    } = await api.project({ projectId }).import.file.post({
      file,
    })

    expect(uploadStatus).toBe(201)
    expect(uploadData).toHaveProperty('tempFilePath', expect.stringMatching(/\.json$/))
    expect(uploadError).toBeNull()

    const {
      data: importData,
      status: importStatus,
      error: importError,
    } = await api.project({ projectId }).import.post({
      filePath: (uploadData as any).tempFilePath,
    })

    expect(importStatus).toBe(201)
    expect(importData).toBeEmpty()
    expect(importError).toBeNull()

    const db = getDb()
    const reader = await db.runAndReadAll(`PRAGMA table_info("project_${projectId}")`)
    const tableInfo = reader.getRowObjectsJson()

    expect(tableInfo.length).toBeGreaterThan(0)

    const dataReader = await db.runAndReadAll(`SELECT * FROM "project_${projectId}"`)
    const importedData = dataReader.getRowObjectsJson()

    expect(importedData).toEqual(
      expect.arrayContaining(
        TEST_DATA.map(({ id, name, age }) => ({
          id: expect.stringMatching(id.toString()),
          name,
          age: expect.stringMatching(age.toString()),
        })),
      ),
    )
  })
})
