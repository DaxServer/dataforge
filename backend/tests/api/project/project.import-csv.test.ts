import { projectRoutes } from '@backend/api/project'
import { UUID_REGEX_PATTERN } from '@backend/api/project/schemas'
import { closeDb, initializeDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'

const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}

describe('project import with CSV', () => {
  let api: ReturnType<typeof createTestApi>

  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()
  })

  afterEach(async () => {
    await closeDb()
  })

  const values = [
    ['John', '30', 'New York'],
    ['Jane', '25', 'Boston'],
  ]

  const testcases = [
    {
      name: 'with header without quotes',
      csvContent: 'name,age,city\nJohn,30,New York\nJane,25,Boston',
      setHasHeaders: false,
    },
    {
      name: 'with header with quotes',
      csvContent: '"name","age","city"\n"John","30","New York"\n"Jane","25","Boston"',
      setHasHeaders: false,
    },
    {
      name: 'without header without quotes',
      csvContent: 'John,30,New York\nJane,25,Boston',
      setHasHeaders: true,
      hasHeaders: false,
    },
    {
      name: 'without header with quotes',
      csvContent: '"John","30","New York"\n"Jane","25","Boston"',
      setHasHeaders: true,
      hasHeaders: false,
    },
  ]

  test.each(testcases)('$name', async ({ csvContent, setHasHeaders, hasHeaders }) => {
    const file = new File([csvContent], 'test-data.csv', { type: 'text/csv' })

    const b = {
      file,
      ...(setHasHeaders ? { hasHeaders: hasHeaders } : {}),
    }

    const { data, status, error } = await api.project.import.post(b)

    expect(status).toBe(201)
    expect(error).toBeNull()
    expect(data).toHaveProperty('data.id', expect.stringMatching(UUID_REGEX_PATTERN))

    // @ts-expect-error Elysia Eden thinks 201 is an error
    const { data: project } = await api.project({ projectId: data!.data!.id }).get()
    expect(project).toHaveProperty('data')
    expect(project!.data).toBeArrayOfSize(2)

    expect(project!.data[0]).toContainAnyValues(values[0]!)
    expect(project!.data[1]).toContainAnyValues(values[1]!)
  })
})
