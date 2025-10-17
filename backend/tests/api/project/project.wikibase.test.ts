import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  type Alias,
  type Label,
  type WikibaseCreateSchema,
  wikibaseRoutes,
} from '@backend/api/project/project.wikibase'
import type { InstanceId } from '@backend/api/wikibase/schemas'
import { closeDb, databasePlugin, getDb, initializeDb } from '@backend/plugins/database'
import type { ItemId } from '@backend/types/wikibase-schema'
import { treaty } from '@elysiajs/eden'
import { Elysia } from 'elysia'

let _strCounter = 0
const deterministicString = (prefix: string) => `${prefix}_${_strCounter++}`

let _itemIdCounter = 1000
const deterministicItemId = (): ItemId => `Q${_itemIdCounter++}` as ItemId

// let _propertyIdCounter = 200
// const deterministicPropertyId = (): PropertyId => `P${_propertyIdCounter++}` as PropertyId

// let _mediaInfoIdCounter = 5000
// const deterministicMediaInfoId = (): MediaInfoId => `M${_mediaInfoIdCounter++}` as MediaInfoId

const deterministicLangs = ['en', 'fr', 'de', 'es', 'it']
const deterministicLang = (index: number) =>
  deterministicLangs[
    index >= 0 && index < deterministicLangs.length
      ? index
      : _strCounter % deterministicLangs.length
  ]!

const deterministicLabels = (count = 2): Label => {
  let labels: Label = {}

  for (let i = 0; i < count; i++) {
    const lang = deterministicLang(i)
    labels = Object.assign({}, labels, {
      [lang]: {
        columnName: deterministicString('Label'),
        dataType: 'monolingualtext',
      },
    } as Label)
  }

  return labels
}

const deterministicDescriptions = (count = 2): Label => {
  let descriptions: Label = {}

  for (let i = 0; i < count; i++) {
    const lang = deterministicLang(i)
    descriptions = Object.assign({}, descriptions, {
      [lang]: {
        columnName: deterministicString('Description'),
        dataType: 'monolingualtext',
      },
    })
  }

  return descriptions
}

const deterministicAliases = (count = 2): Alias => {
  let aliases: Alias = {}

  for (let i = 0; i < count; i++) {
    const lang = deterministicLang(i)
    aliases = Object.assign({}, aliases, {
      [lang]: [
        {
          columnName: deterministicString('Alias'),
          dataType: 'monolingualtext',
        },
      ],
    })
  }

  return aliases
}

// const deterministicClaims = (): Claims => {
//   const property = deterministicPropertyId()
//   const qualifierProp = deterministicPropertyId()
//   const referenceProp = deterministicPropertyId()

//   const qualifiers: Qualifiers = {
//     [qualifierProp]: [
//       {
//         datatype: 'wikibase-item',
//         datavalue: {
//           type: 'wikibase-entityid',
//           value: {
//             id: deterministicItemId(),
//             'entity-type': 'item',
//           },
//         },
//         hash: deterministicString('qhash'),
//         property: qualifierProp,
//         snaktype: 'value',
//       } as Snak,
//     ],
//   }

//   const references: References = [
//     {
//       hash: deterministicString('rhash'),
//       snaks: {
//         [referenceProp]: [
//           {
//             datatype: 'wikibase-item',
//             datavalue: {
//               type: 'wikibase-entityid',
//               value: {
//                 id: deterministicItemId(),
//                 'entity-type': 'item',
//               },
//             },
//             hash: deterministicString('rshash'),
//             property: referenceProp,
//             snaktype: 'value',
//           } as Snak,
//         ],
//       },
//       'snaks-order': [referenceProp],
//     },
//   ]

//   const claims: Claims = {
//     [property]: [
//       {
//         id: `${property}$${deterministicString('claim')}` as Guid,
//         mainsnak: {
//           datatype: 'wikibase-item',
//           datavalue: {
//             type: 'wikibase-entityid',
//             value: {
//               id: deterministicItemId(),
//               'entity-type': 'item',
//             },
//           },
//           hash: deterministicString('hash'),
//           property: property,
//           snaktype: 'value',
//         },
//         rank: 'normal',
//         type: 'statement',
//         qualifiers: qualifiers,
//         references,
//       },
//     ],
//   }

//   return claims
// }

const TEST_PROJECT_ID = Bun.randomUUIDv7()

const createTestApi = () => {
  return treaty(new Elysia().use(databasePlugin).use(wikibaseRoutes)).api
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

const generateWikibaseSchema = (): Required<WikibaseCreateSchema> => {
  return {
    schemaId: Bun.randomUUIDv7(),
    name: deterministicString('Test Wikibase Schema'),
    wikibase: 'wikidata',
    schema: {
      id: deterministicItemId(),
      terms: {
        labels: deterministicLabels(),
        descriptions: deterministicDescriptions(),
        aliases: deterministicAliases(),
      },
      statements: [],
    },
  }
}

// const generateRandomMediaInfoSchema = (overrides = {}) => {
//   return {
//     schemaId: Bun.randomUUIDv7(),
//     projectId: TEST_PROJECT_ID,
//     name: deterministicString('Test MediaInfo Schema'),
//     wikibase: 'wikidata',
//     schema: generateFrontendSchema(),
//     ...overrides,
//   }
// }

const expectNotFoundError = (status: number, data: unknown, error: unknown, message: string) => {
  expect(status).toBe(404)
  expect(data).toBeNull()
  expect(error).not.toBeNull()
  expect(error).toHaveProperty('status', 404)
  expect(error).toHaveProperty('value', [
    {
      code: 'NOT_FOUND',
      details: [],
      message,
    },
  ])
}

const expectSuccess = (
  expectedStatus: number,
  status: number,
  data: unknown,
  error: unknown,
  schema: WikibaseCreateSchema,
) => {
  expect(status).toBe(expectedStatus)
  expect(data).toEqual({
    data: expect.objectContaining({
      id: schema.schemaId,
      project_id: TEST_PROJECT_ID,
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

  describe('GET schemas', () => {
    test('should return empty array when no schemas exist', async () => {
      const { data, status, error } = await api
        .project({ projectId: TEST_PROJECT_ID })
        .schemas.get()

      expect(status).toBe(200)
      expect(data).toEqual({ data: [] })
      expect(error).toBeNull()
    })

    test('should return schemas for a project', async () => {
      const schema = generateWikibaseSchema()
      await api.project({ projectId: TEST_PROJECT_ID }).schemas.post(schema)

      const { data, status, error } = await api
        .project({ projectId: TEST_PROJECT_ID })
        .schemas.get()

      expect(status).toBe(200)
      expect(data).toEqual({
        data: [
          {
            id: schema.schemaId,
            project_id: TEST_PROJECT_ID,
            name: schema.name,
            wikibase: schema.wikibase,
            schema: schema.schema,
            created_at: expect.any(String),
            updated_at: expect.any(String),
          },
        ],
      })
      expect(error).toBeNull()
    })

    test('should return 404 for non-existent project', async () => {
      const randomId = Bun.randomUUIDv7()
      const { data, status, error } = await api.project({ projectId: randomId }).schemas.get()

      expectNotFoundError(status, data, error, `Project with identifier '${randomId}' not found`)
    })
  })

  describe('POST schemas', () => {
    test('should create a new Wikibase schema', async () => {
      const schema = generateWikibaseSchema()

      const { data, status, error } = await api
        .project({ projectId: TEST_PROJECT_ID })
        .schemas.post(schema)

      expectSuccess(201, status, data, error, schema)
    })

    test('should return 404 when project does not exist', async () => {
      const randomProjectId = Bun.randomUUIDv7()
      const schema = generateWikibaseSchema()

      const { data, status, error } = await api
        .project({ projectId: randomProjectId })
        .schemas.post(schema)

      expectNotFoundError(
        status,
        data,
        error,
        `Project with identifier '${randomProjectId}' not found`,
      )
    })
  })

  describe('GET schema by id', () => {
    test('should return schema with full details', async () => {
      const schema = generateWikibaseSchema()
      await api.project({ projectId: TEST_PROJECT_ID }).schemas.post(schema)
      const { data, status, error } = await api
        .project({ projectId: TEST_PROJECT_ID })
        .schemas({ schemaId: schema.schemaId })
        .get()

      expectSuccess(200, status, data, error, schema)
    })

    test('should return 404 for non-existent project', async () => {
      const randomId = Bun.randomUUIDv7()
      const { data, status, error } = await api
        .project({ projectId: randomId })
        .schemas({ schemaId: Bun.randomUUIDv7() })
        .get()

      expectNotFoundError(status, data, error, `Project with identifier '${randomId}' not found`)
    })

    test('should return 404 for non-existent schema', async () => {
      const randomId = Bun.randomUUIDv7()
      const { data, status, error } = await api
        .project({ projectId: TEST_PROJECT_ID })
        .schemas({ schemaId: randomId })
        .get()

      expectNotFoundError(status, data, error, `Schema with identifier '${randomId}' not found`)
    })
  })

  describe('PUT update schema by id', () => {
    test('should update schema name', async () => {
      const schema = generateWikibaseSchema()
      await api.project({ projectId: TEST_PROJECT_ID }).schemas.post(schema)

      const updateData = {
        name: 'Updated Schema Name',
        schema: schema.schema,
      }
      const { data, status, error } = await api
        .project({ projectId: TEST_PROJECT_ID })
        .schemas({ schemaId: schema.schemaId })
        .put(updateData)

      expectSuccess(200, status, data, error, { ...schema, name: updateData.name })
    })

    test('should update wikibase', async () => {
      const { name, wikibase, schema } = generateWikibaseSchema()
      const {
        data: {
          // @ts-expect-error Elysia Eden thinks 201 is error
          data: { id },
        },
      } = await api.project({ projectId: TEST_PROJECT_ID }).schemas.post({
        // schemaId,
        name,
        wikibase,
        schema,
      })

      const updateData = {
        wikibase: 'commons' as InstanceId,
        schema: schema,
      }

      const { data, status, error } = await api
        .project({ projectId: TEST_PROJECT_ID })
        .schemas({ schemaId: id })
        .put(updateData)

      expectSuccess(200, status, data, error, {
        schemaId: id,
        name,
        schema,
        wikibase: updateData.wikibase,
      })
    })

    test('should return 404 for non-existent project', async () => {
      const randomId = Bun.randomUUIDv7()
      const schema = generateWikibaseSchema()
      await api.project({ projectId: TEST_PROJECT_ID }).schemas.post(schema)

      const { data, status, error } = await api
        .project({ projectId: randomId })
        .schemas({ schemaId: Bun.randomUUIDv7() })
        .put({ name: 'New Name', schema: schema.schema })

      expectNotFoundError(status, data, error, `Project with identifier '${randomId}' not found`)
    })

    test('should return 404 for non-existent schema', async () => {
      const schema = generateWikibaseSchema()
      await api.project({ projectId: TEST_PROJECT_ID }).schemas.post(schema)

      const updateData = { name: 'New Name', schema: schema.schema }
      const randomId = Bun.randomUUIDv7()

      const { data, status, error } = await api
        .project({ projectId: TEST_PROJECT_ID })
        .schemas({ schemaId: randomId })
        .put(updateData)

      expectNotFoundError(status, data, error, `Schema with identifier '${randomId}' not found`)
    })
  })

  describe('DELETE delete schema by id', () => {
    test('should delete schema successfully', async () => {
      const { name, wikibase, schema } = generateWikibaseSchema()
      const {
        data: {
          // @ts-expect-error Elysia Eden thinks 201 is error
          data: { id },
        },
      } = await api.project({ projectId: TEST_PROJECT_ID }).schemas.post({
        name,
        wikibase,
        schema,
      })

      const { data, status, error } = await api
        .project({ projectId: TEST_PROJECT_ID })
        .schemas({ schemaId: id })
        .delete()

      expect(status).toBe(204)
      expect(data).toBeEmpty()
      expect(error).toBeNull()

      // Verify it's actually deleted
      const {
        data: getResponse,
        status: getStatus,
        error: getError,
      } = await api.project({ projectId: TEST_PROJECT_ID }).schemas({ schemaId: id }).get()

      expectNotFoundError(
        getStatus,
        getResponse,
        getError,
        `Schema with identifier '${id}' not found`,
      )
    })

    test('should return 404 for non-existent project', async () => {
      const randomId = Bun.randomUUIDv7()
      const { data, status, error } = await api
        .project({ projectId: randomId })
        .schemas({ schemaId: Bun.randomUUIDv7() })
        .delete()

      expectNotFoundError(status, data, error, `Project with identifier '${randomId}' not found`)
    })

    test('should return 404 for non-existent schema', async () => {
      const randomId = Bun.randomUUIDv7()
      const { data, status, error } = await api
        .project({ projectId: TEST_PROJECT_ID })
        .schemas({ schemaId: randomId })
        .delete()

      expectNotFoundError(status, data, error, `Schema with identifier '${randomId}' not found`)
    })
  })

  // describe('MediaInfo', () => {
  //   test('should create a new MediaInfo schema', async () => {
  //     const mediaInfoSchema = generateRandomMediaInfoSchema()
  //     const { data, status, error } = await api
  //       .project({ projectId: TEST_PROJECT_ID })
  //       .schemas.post(mediaInfoSchema)

  //     expectSuccess(201, status, data, error, mediaInfoSchema)
  //   })

  //   test('should return a MediaInfo schema', async () => {
  //     const mediaInfoSchema = generateRandomMediaInfoSchema()
  //     await api.project({ projectId: TEST_PROJECT_ID }).schemas.post(mediaInfoSchema)

  //     const { data, status, error } = await api
  //       .project({ projectId: TEST_PROJECT_ID })
  //       .schemas({ schemaId: mediaInfoSchema.schemaId })
  //       .get()

  //     expectSuccess(200, status, data, error, mediaInfoSchema)
  //   })

  //   test('should update a MediaInfo schema name', async () => {
  //     const mediaInfoSchema = generateRandomMediaInfoSchema()
  //     await api.project({ projectId: TEST_PROJECT_ID }).schemas.post(mediaInfoSchema)

  //     const updateData = { name: 'Updated Schema Name', schema: mediaInfoSchema.schema }

  //     const { data, status, error } = await api
  //       .project({ projectId: TEST_PROJECT_ID })
  //       .schemas({ schemaId: mediaInfoSchema.schemaId })
  //       .put(updateData)

  //     expectSuccess(200, status, data, error, { ...mediaInfoSchema, name: updateData.name })
  //   })

  //   test('should update a MediaInfo schema schema', async () => {
  //     const mediaInfoSchema = generateRandomMediaInfoSchema()
  //     await api.project({ projectId: TEST_PROJECT_ID }).schemas.post(mediaInfoSchema)

  //     const updateData = {
  //       schema: { ...mediaInfoSchema.schema, id: deterministicMediaInfoId() },
  //     }

  //     const { data, status, error } = await api
  //       .project({ projectId: TEST_PROJECT_ID })
  //       .schemas({ schemaId: mediaInfoSchema.schemaId })
  //       .put(updateData)

  //     expectSuccess(200, status, data, error, { ...mediaInfoSchema, schema: updateData.schema })
  //   })

  //   test('should delete a MediaInfo schema', async () => {
  //     const mediaInfoSchema = generateRandomMediaInfoSchema()
  //     await api.project({ projectId: TEST_PROJECT_ID }).schemas.post(mediaInfoSchema)

  //     const { data, status, error } = await api
  //       .project({ projectId: TEST_PROJECT_ID })
  //       .schemas({ schemaId: mediaInfoSchema.schemaId })
  //       .delete()

  //     expect(status).toBe(204)
  //     expect(data).toBeEmpty()
  //     expect(error).toBeNull()
  //   })
  // })
})
