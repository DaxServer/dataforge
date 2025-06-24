import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'
import { initializeDb, closeDb, getDb } from '@backend/plugins/database'
import { projectRoutes } from '@backend/api/project'

// Create a test app with the project import routes
const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}

describe('POST /project/:projectId/import-file', () => {
  let api: ReturnType<typeof createTestApi>

  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()
  })

  afterEach(async () => {
    await closeDb()
  })

  test('should accept non-JSON file type (type validation disabled)', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440005'

    // Create a test file with non-JSON mime type
    // Note: File type validation is currently disabled due to Elysia 1.3.x issues
    const testData = 'This is not JSON data'
    const file = new File([testData], 'test-file.txt', { type: 'text/plain' })

    const { data, status, error } = await api.project({ id: projectId }).import.file.post({
      file,
    })

    expect(status).toBe(201)
    expect(data).toEqual(
      expect.objectContaining({
        tempFilePath: expect.stringMatching(/\.json$/),
      })
    )
    expect(error).toBeNull()

    // Clean up the temporary file
    const tempFile = Bun.file(data.tempFilePath)
    await tempFile.delete()
  })

  test('should return 422 for empty file', async () => {
    const projectId = 'test-project-id'

    // Create an empty file
    const file = new File([], 'empty-file.json', { type: 'application/json' })

    const { data, status, error } = await api.project({ id: projectId }).import.file.post({
      file,
    })

    expect(status).toBe(422)
    expect(data).toBeNull()
    expect(error).toEqual(
      expect.objectContaining({
        value: expect.objectContaining({
          data: expect.arrayContaining([]),
          errors: expect.arrayContaining([
            expect.objectContaining({
              code: 'VALIDATION',
              details: expect.arrayContaining([
                expect.objectContaining({
                  message: "Expected kind 'File'",
                  path: '/file',
                  schema: expect.objectContaining({
                    default: 'File',
                    format: 'binary',
                    minSize: 1,
                    type: 'string',
                  }),
                }),
              ]),
            }),
          ]),
        }),
      })
    )
  })

  test('should save uploaded file to temporary location', async () => {
    const projectId = 'test-project-id'

    // Create a test file with JSON data
    const testData = JSON.stringify({ name: 'John', age: 30, city: 'New York' })
    const file = new File([testData], 'test-data.json', { type: 'application/json' })

    const { data, status, error } = await api.project({ id: projectId }).import.file.post({
      file,
    })

    // Should return 201 when file is successfully saved
    expect(status).toBe(201)
    expect(data).toEqual(
      expect.objectContaining({
        tempFilePath: expect.stringMatching(/\.json$/),
      })
    )
    expect(error).toBeNull()

    const tempFile = Bun.file(data.tempFilePath)
    // Verify the file exists at the temporary location
    expect(await tempFile.exists()).toBe(true)

    // Verify the file content matches what was uploaded
    const savedContent = await tempFile.text()
    expect(savedContent).toBe(testData)

    // Clean up the temporary file
    await tempFile.delete()
  })

  test('should successfully import uploaded file into DuckDB', async () => {
    let projectId = '550e8400-e29b-41d4-a716-446655440008'

    // Create a test file with JSON data
    const TEST_DATA = [
      { id: 1, name: 'John', age: 30 },
      { id: 2, name: 'Jane', age: 25 },
    ]
    const file = new File([JSON.stringify(TEST_DATA)], 'test-data.json', {
      type: 'application/json',
    })

    // First, upload the file
    const {
      data: uploadData,
      status: uploadStatus,
      error: uploadError,
    } = await api.project({ id: projectId }).import.file.post({
      file,
    })

    expect(uploadStatus).toBe(201)
    expect(uploadData).toEqual(
      expect.objectContaining({
        tempFilePath: expect.stringMatching(/\.json$/),
      })
    )
    expect(uploadError).toBeNull()

    // Then, import the uploaded file into DuckDB using the existing import endpoint
    const {
      data: importData,
      status: importStatus,
      error: importError,
    } = await api.project({ id: projectId }).import.post({
      filePath: uploadData.tempFilePath,
    })

    expect(importStatus).toBe(201)
    expect(importData).toBeEmpty()
    expect(importError).toBeNull()

    // Verify table creation in DuckDB
    const db = getDb()
    const reader = await db.runAndReadAll(`PRAGMA table_info("project_${projectId}")`)
    const tableInfo = reader.getRowObjectsJson()

    expect(tableInfo.length).toBeGreaterThan(0)

    // Verify data was imported correctly
    const dataReader = await db.runAndReadAll(`SELECT * FROM "project_${projectId}"`)
    const importedData = dataReader.getRowObjectsJson()

    expect(importedData).toEqual(
      expect.arrayContaining(
        TEST_DATA.map(({ id, name, age }) =>
          expect.objectContaining({
            id: expect.stringMatching(id.toString()),
            name: expect.stringMatching(name),
            age: expect.stringMatching(age.toString()),
          })
        )
      )
    )

    // Clean up the temporary file
    const tempFile = Bun.file(uploadData.tempFilePath)
    await tempFile.delete()
  })
})
