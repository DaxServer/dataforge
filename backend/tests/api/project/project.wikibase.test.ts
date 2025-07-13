import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'
import { closeDb, getDb, initializeDb } from '@backend/plugins/database'
import { wikibaseRoutes } from '@backend/api/project/project.wikibase'
import type {
  Labels,
  Qualifiers,
  References,
  Aliases,
  Sitelinks,
  Claims,
  Descriptions,
  Snak,
  PropertyId,
  Site,
  Guid,
  ItemId,
  Item,
  Sitelink,
} from 'wikibase-sdk'

let _strCounter = 0
const deterministicString = (prefix: string) => `${prefix}_${_strCounter++}`

let _itemIdCounter = 1000
const deterministicItemId = (): ItemId => `Q${_itemIdCounter++}` as ItemId

let _propertyIdCounter = 200
const deterministicPropertyId = (): PropertyId => `P${_propertyIdCounter++}` as PropertyId

const deterministicLangs = ['en', 'fr', 'de', 'es', 'it']
const deterministicLang = (index: number) =>
  deterministicLangs[
    index >= 0 && index < deterministicLangs.length
      ? index
      : _strCounter % deterministicLangs.length
  ]!

const deterministicLabels = (count = 2): Labels => {
  let labels: Labels = {}

  for (let i = 0; i < count; i++) {
    const lang = deterministicLang(i)
    labels = Object.assign({}, labels, {
      [lang]: deterministicString('Label'),
    })
  }

  return labels
}

const deterministicDescriptions = (count = 2): Descriptions => {
  let descriptions: Descriptions = {}

  for (let i = 0; i < count; i++) {
    const lang = deterministicLang(i)
    descriptions = Object.assign({}, descriptions, {
      [lang]: deterministicString('Description'),
    })
  }

  return descriptions
}

const deterministicAliases = (count = 2): Aliases => {
  let aliases: Aliases = {}

  for (let i = 0; i < count; i++) {
    const lang = deterministicLang(i)
    aliases = Object.assign({}, aliases, {
      [lang]: [deterministicString('Alias1'), deterministicString('Alias2')],
    })
  }

  return aliases
}

const deterministicClaims = (): Claims => {
  const property = deterministicPropertyId()
  const qualifierProp = deterministicPropertyId()
  const referenceProp = deterministicPropertyId()

  const qualifiers: Qualifiers = {
    [qualifierProp]: [
      {
        datatype: 'wikibase-item',
        datavalue: {
          type: 'wikibase-entityid',
          value: {
            id: deterministicItemId(),
            'entity-type': 'item',
          },
        },
        hash: deterministicString('qhash'),
        property: qualifierProp,
        snaktype: 'value',
      } as Snak,
    ],
  }

  const references: References = [
    {
      hash: deterministicString('rhash'),
      snaks: {
        [referenceProp]: [
          {
            datatype: 'wikibase-item',
            datavalue: {
              type: 'wikibase-entityid',
              value: {
                id: deterministicItemId(),
                'entity-type': 'item',
              },
            },
            hash: deterministicString('rshash'),
            property: referenceProp,
            snaktype: 'value',
          } as Snak,
        ],
      },
      'snaks-order': [referenceProp],
    },
  ]

  const claims: Claims = {
    [property]: [
      {
        id: `${property}$${deterministicString('claim')}` as Guid,
        mainsnak: {
          datatype: 'wikibase-item',
          datavalue: {
            type: 'wikibase-entityid',
            value: {
              id: deterministicItemId(),
              'entity-type': 'item',
            },
          },
          hash: deterministicString('hash'),
          property: property,
          snaktype: 'value',
        },
        rank: 'normal',
        type: 'statement',
        qualifiers: qualifiers,
        references,
      },
    ],
  }

  return claims
}

const deterministicSitelinks = (count = 1): Sitelinks => {
  const sites: Site[] = ['enwiki', 'frwiki', 'dewiki']
  const sitelinks: Sitelinks = {}

  for (let i = 0; i < count; i++) {
    const site = sites[i % sites.length] || 'enwiki'
    sitelinks[site] = {
      site: site,
      title: deterministicString('Title'),
    } as Sitelink
  }

  return sitelinks
}

const TEST_PROJECT_ID = Bun.randomUUIDv7()

const createTestApi = () => {
  return treaty(new Elysia().use(wikibaseRoutes)).api
}

const insertTestProject = async () => {
  const db = getDb()
  await db.run(`INSERT INTO _meta_projects (id, name, schema_for, schema) VALUES (?, ?, ?, ?)`, [
    TEST_PROJECT_ID,
    'Test Project',
    null,
    '{}',
  ])
}

const generateRandomWikibaseSchema = (overrides = {}) => {
  return {
    id: Bun.randomUUIDv7(),
    project_id: TEST_PROJECT_ID,
    name: deterministicString('Test Wikibase Schema'),
    wikibase: 'wikidata',
    schema: {
      id: deterministicItemId(),
      type: 'item',
      labels: deterministicLabels(),
      descriptions: deterministicDescriptions(),
      aliases: deterministicAliases(),
      claims: deterministicClaims(),
      sitelinks: deterministicSitelinks(),
    } as Item,
    ...overrides,
  }
}

const expectNotFoundError = (status: number, data: any, error: any, message: string) => {
  expect(status).toBe(404)
  expect(data).toBeNull()
  expect(error).not.toBeNull()
  expect(error.status).toBe(404)
  expect(error.value).toEqual(
    expect.objectContaining({
      data: [],
      errors: [
        expect.objectContaining({
          code: 'NOT_FOUND',
          details: [],
          message: message,
        }),
      ],
    }),
  )
}

const expectSuccess = (status: number, data: any, error: any, schema: any) => {
  expect(status).toBe(status)
  expect(data).toEqual({
    data: expect.objectContaining({
      id: schema.id,
      project_id: schema.project_id,
      name: schema.name,
      wikibase: schema.wikibase,
      schema: schema.schema,
      created_at: expect.any(String),
      updated_at: expect.any(String),
    }),
  })
  expect(error).toBeNull()
}

describe('Wikibase API', () => {
  let api: ReturnType<typeof createTestApi>

  beforeEach(async () => {
    await initializeDb(':memory:')
    await insertTestProject()
    api = createTestApi()
  })

  afterEach(async () => {
    await closeDb()
  })

  describe('GET /api/wikibase/project/:project_id/schemas', () => {
    test('should return empty array when no schemas exist', async () => {
      const { data, status, error } = await api
        .project({ project_id: TEST_PROJECT_ID })
        .schemas.get()

      expect(status).toBe(200)
      expect(data).toEqual({ data: [] })
      expect(error).toBeNull()
    })

    test('should return schemas for a project', async () => {
      const schema = generateRandomWikibaseSchema()
      await api.project({ project_id: TEST_PROJECT_ID }).schemas.post(schema)

      const { data, status, error } = await api
        .project({ project_id: TEST_PROJECT_ID })
        .schemas.get()

      expect(status).toBe(200)
      expect(data).toEqual({
        data: [
          Object.assign({}, schema, {
            created_at: expect.any(String),
            updated_at: expect.any(String),
          }),
        ],
      })
      expect(error).toBeNull()
    })

    test('should return 404 for non-existent project', async () => {
      const randomId = Bun.randomUUIDv7()
      const { data, status, error } = await api.project({ project_id: randomId }).schemas.get()

      expectNotFoundError(status, data, error, `Project with identifier '${randomId}' not found`)
    })
  })

  describe('POST /api/wikibase/schemas', () => {
    test('should create a new Wikibase schema', async () => {
      const schema = generateRandomWikibaseSchema()
      const { data, status, error } = await api
        .project({ project_id: TEST_PROJECT_ID })
        .schemas.post(schema)

      expectSuccess(status, data, error, schema)
    })

    test('should return 404 when project does not exist', async () => {
      const randomProjectId = Bun.randomUUIDv7()
      const schema = {
        ...generateRandomWikibaseSchema(),
        project_id: randomProjectId, // Non-existent project
      }

      const { data, status, error } = await api
        .project({ project_id: randomProjectId })
        .schemas.post(schema)

      expectNotFoundError(
        status,
        data,
        error,
        `Project with identifier '${randomProjectId}' not found`,
      )
    })
  })

  describe('GET /api/wikibase/schemas/:id', () => {
    test('should return schema with full details', async () => {
      const schema = generateRandomWikibaseSchema()
      await api.project({ project_id: TEST_PROJECT_ID }).schemas.post(schema)
      const { data, status, error } = await api
        .project({ project_id: TEST_PROJECT_ID })
        .schemas({ id: schema.id })
        .get()

      expectSuccess(status, data, error, schema)
    })

    test('should return 404 for non-existent project', async () => {
      const randomId = Bun.randomUUIDv7()
      const { data, status, error } = await api
        .project({ project_id: randomId })
        .schemas({ id: Bun.randomUUIDv7() })
        .get()

      expectNotFoundError(status, data, error, `Project with identifier '${randomId}' not found`)
    })

    test('should return 404 for non-existent schema', async () => {
      const randomId = Bun.randomUUIDv7()
      const { data, status, error } = await api
        .project({ project_id: TEST_PROJECT_ID })
        .schemas({ id: randomId })
        .get()

      expectNotFoundError(status, data, error, `Schema with identifier '${randomId}' not found`)
    })
  })

  describe('PUT /api/wikibase/schemas/:id', () => {
    test('should update schema name', async () => {
      const schema = generateRandomWikibaseSchema()
      await api.project({ project_id: TEST_PROJECT_ID }).schemas.post(schema)

      const updateData = {
        name: 'Updated Schema Name',
      }
      const { data, status, error } = await api
        .project({ project_id: TEST_PROJECT_ID })
        .schemas({ id: schema.id })
        .put(updateData)

      expectSuccess(status, data, error, { ...schema, name: updateData.name })
    })

    test('should update wikibase', async () => {
      const schema = generateRandomWikibaseSchema()
      await api.project({ project_id: TEST_PROJECT_ID }).schemas.post(schema)
      const updateData = {
        wikibase: 'commons',
      }

      const { data, status, error } = await api
        .project({ project_id: TEST_PROJECT_ID })
        .schemas({ id: schema.id })
        .put(updateData)

      expectSuccess(status, data, error, { ...schema, wikibase: updateData.wikibase })
    })

    test('should return 404 for non-existent project', async () => {
      const randomId = Bun.randomUUIDv7()
      const { data, status, error } = await api
        .project({ project_id: randomId })
        .schemas({ id: Bun.randomUUIDv7() })
        .put({ name: 'New Name' })

      expectNotFoundError(status, data, error, `Project with identifier '${randomId}' not found`)
    })

    test('should return 404 for non-existent schema', async () => {
      const updateData = { name: 'New Name' }
      const randomId = Bun.randomUUIDv7()

      const { data, status, error } = await api
        .project({ project_id: TEST_PROJECT_ID })
        .schemas({ id: randomId })
        .put(updateData)

      expectNotFoundError(status, data, error, `Schema with identifier '${randomId}' not found`)
    })
  })

  describe('DELETE /api/wikibase/schemas/:id', () => {
    test('should delete schema successfully', async () => {
      const schema = generateRandomWikibaseSchema()
      await api.project({ project_id: TEST_PROJECT_ID }).schemas.post(schema)

      const { data, status, error } = await api
        .project({ project_id: TEST_PROJECT_ID })
        .schemas({ id: schema.id })
        .delete()

      expect(status).toBe(204)
      expect(data).toBeEmpty()
      expect(error).toBeNull()

      // Verify it's actually deleted
      const {
        data: getResponse,
        status: getStatus,
        error: getError,
      } = await api.project({ project_id: TEST_PROJECT_ID }).schemas({ id: schema.id }).get()

      expectNotFoundError(
        getStatus,
        getResponse,
        getError,
        `Schema with identifier '${schema.id}' not found`,
      )
    })

    test('should return 404 for non-existent project', async () => {
      const randomId = Bun.randomUUIDv7()
      const { data, status, error } = await api
        .project({ project_id: randomId })
        .schemas({ id: Bun.randomUUIDv7() })
        .delete()

      expectNotFoundError(status, data, error, `Project with identifier '${randomId}' not found`)
    })

    test('should return 404 for non-existent schema', async () => {
      const randomId = Bun.randomUUIDv7()
      const { data, status, error } = await api
        .project({ project_id: TEST_PROJECT_ID })
        .schemas({ id: randomId })
        .delete()

      expectNotFoundError(status, data, error, `Schema with identifier '${randomId}' not found`)
    })
  })
})
