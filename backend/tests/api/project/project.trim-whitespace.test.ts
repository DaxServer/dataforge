import { projectRoutes } from '@backend/api/project'
import { initializeDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'
import { tmpdir } from 'node:os'

interface TestData {
  text_col: string
  int_col: number
  double_col: number
  bool_col: boolean
  date_col: string
}

const TEST_DATA: TestData[] = [
  {
    text_col: '  hello world  ',
    int_col: 1,
    double_col: 1.5,
    bool_col: true,
    date_col: '2023-01-01',
  },
  { text_col: '\ttab start', int_col: 2, double_col: 2.5, bool_col: false, date_col: '2023-01-02' },
  {
    text_col: 'newline end\n',
    int_col: 3,
    double_col: 3.5,
    bool_col: true,
    date_col: '2023-01-03',
  },
  {
    text_col: '  \t multiple   spaces  \n  ',
    int_col: 4,
    double_col: 4.5,
    bool_col: false,
    date_col: '2023-01-04',
  },
  {
    text_col: 'no whitespace',
    int_col: 5,
    double_col: 5.5,
    bool_col: true,
    date_col: '2023-01-05',
  },
  { text_col: '', int_col: 6, double_col: 6.5, bool_col: false, date_col: '2023-01-06' },
  { text_col: '   ', int_col: 7, double_col: 7.5, bool_col: true, date_col: '2023-01-07' },
]

const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}
const tempFilePath = tmpdir() + '/test-trim-whitespace-data.json'

describe('Project API - trim whitespace', () => {
  let api: ReturnType<typeof createTestApi>
  let projectId: string

  const importTestData = async () => {
    await Bun.write(tempFilePath, JSON.stringify(TEST_DATA))

    const { status, error } = await api.project({ projectId }).import.post({
      filePath: tempFilePath,
    })

    expect(error).toBeNull()
    expect(status).toBe(201)
  }

  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()

    const { data, status, error } = await api.project.post({
      name: 'Test Project for trim whitespace',
    })
    expect(error).toBeNull()
    expect(status).toBe(201)
    projectId = (data as any)!.data!.id as string

    await importTestData()
  })

  test('should trim whitespace from VARCHAR column', async () => {
    const { data, status, error } = await api.project({ projectId }).trim_whitespace.post({
      column: 'text_col',
    })

    expect(status).toBe(200)
    expect(error).toBeNull()
    expect(data).toEqual({
      affectedRows: 5,
    })

    // Verify the data was actually changed
    const { data: projectData } = await api.project({ projectId }).get({
      query: { offset: 0, limit: 25 },
    })

    const textValues = projectData!.data?.map((row: TestData) => row.text_col)
    expect(textValues).toContain('hello world') // '  hello world  ' -> 'hello world'
    expect(textValues).toContain('tab start') // '\ttab start' -> 'tab start'
    expect(textValues).toContain('newline end') // 'newline end\n' -> 'newline end'
    expect(textValues).toContain('multiple   spaces') // '  \t multiple   spaces  \n  ' -> 'multiple   spaces'
    expect(textValues).toContain('no whitespace') // unchanged
    expect(textValues).toContain('') // '   ' -> ''
  })

  test('should handle non-existent column', async () => {
    const { data, status, error } = await api.project({ projectId }).trim_whitespace.post({
      column: 'nonexistent_column',
    })

    expect(status).toBe(400)
    expect(data).toBeNull()
    expect(error).toHaveProperty('status', 400)
    expect(error).toHaveProperty('value', [
      {
        code: 'VALIDATION',
        message: 'Column not found',
        details: [`Column 'nonexistent_column' does not exist in table 'project_${projectId}'`],
      },
    ])
  })

  test('should handle invalid project ID', async () => {
    const invalidProjectId = 'invalid-uuid'

    const { data, status, error } = await api
      .project({ projectId: invalidProjectId })
      .trim_whitespace.post({
        column: 'text_col',
      })

    expect(status).toBe(422)
    expect(data).toBeNull()
    expect(error).toHaveProperty('status', 422)
  })

  test('should handle missing column parameter', async () => {
    // @ts-expect-error testing invalid payload
    const { data, status, error } = await api.project({ projectId }).trim_whitespace.post({})

    expect(status).toBe(422)
    expect(data).toBeNull()
    expect(error).toHaveProperty('status', 422)
  })

  test('should convert INTEGER column to VARCHAR and trim (0 affected rows)', async () => {
    const { data, status, error } = await api.project({ projectId }).trim_whitespace.post({
      column: 'int_col',
    })

    expect(status).toBe(200)
    expect(error).toBeNull()
    expect(data).toEqual({
      affectedRows: 0,
    })
  })
})
