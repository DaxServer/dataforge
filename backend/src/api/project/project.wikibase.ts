import { Elysia, t } from 'elysia'
import cors from '@elysiajs/cors'
import { databasePlugin } from '@backend/plugins/database'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { ApiError } from '@backend/types/error-schemas'
import { UUIDPattern } from '@backend/api/project/_schemas'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { ItemId, PropertyId } from '@backend/types/wikibase-schema'

// Column mapping for data transformation
const ColumnMapping = t.Object({
  columnName: t.String(),
  dataType: t.String(),
  transformation: t.Optional(
    t.Object({
      type: t.Union([t.Literal('constant'), t.Literal('expression'), t.Literal('lookup')]),
      value: t.String(),
      parameters: t.Optional(t.Record(t.String(), t.Any())),
    }),
  ),
})

// Property reference for statements
const PropertyReference = t.Object({
  id: t.String(PropertyId),
  label: t.Optional(t.String()),
  dataType: t.String(),
})

const DataType = t.Union([
  t.Literal('string'),
  t.Literal('wikibase-item'),
  t.Literal('wikibase-property'),
  t.Literal('quantity'),
  t.Literal('time'),
  t.Literal('globe-coordinate'),
  t.Literal('url'),
  t.Literal('external-id'),
  t.Literal('monolingualtext'),
  t.Literal('commonsMedia'),
])

// Value mapping types
const ValueMapping = t.Union([
  t.Object({
    type: t.Literal('column'),
    source: ColumnMapping,
    dataType: DataType,
  }),
  t.Object({
    type: t.Literal('constant'),
    source: t.String(),
    dataType: DataType,
  }),
  t.Object({
    type: t.Literal('expression'),
    source: t.String(),
    dataType: DataType,
  }),
])

// Property-value mapping for qualifiers and references
const PropertyValueMap = t.Object({
  property: PropertyReference,
  value: ValueMapping,
})

// Reference schema mapping
const ReferenceSchemaMapping = t.Object({
  id: UUIDPattern,
  snaks: t.Array(PropertyValueMap),
})

// Statement schema mapping
const StatementSchemaMapping = t.Object({
  id: UUIDPattern,
  property: PropertyReference,
  value: ValueMapping,
  rank: t.Union([t.Literal('preferred'), t.Literal('normal'), t.Literal('deprecated')]),
  qualifiers: t.Array(PropertyValueMap),
  references: t.Array(ReferenceSchemaMapping),
})

// Terms schema mapping
const TermsSchemaMapping = t.Object({
  labels: t.Record(t.String(), ColumnMapping), // language code -> column mapping
  descriptions: t.Record(t.String(), ColumnMapping),
  aliases: t.Record(t.String(), t.Array(ColumnMapping)),
})

// Item schema mapping
const ItemSchemaMapping = t.Object({
  id: t.Optional(t.String(ItemId)),
  terms: TermsSchemaMapping,
  statements: t.Array(StatementSchemaMapping),
})

type ItemSchema = typeof ItemSchemaMapping.static

const blankSchema = {
  terms: {
    labels: {},
    descriptions: {},
    aliases: {},
  },
  statements: [],
} as ItemSchema

const SchemaName = t.String({ minLength: 1, maxLength: 255 })

const WikibaseSchemaUpdateRequest = t.Object({
  name: t.Optional(SchemaName),
  wikibase: t.Optional(t.String()),
  schema: t.Optional(ItemSchemaMapping),
})

const WikibaseSchemaCreateRequest = t.Composite([
  WikibaseSchemaUpdateRequest,
  t.Object({
    schemaId: t.Optional(UUIDPattern),
    projectId: UUIDPattern,
    name: SchemaName,
    wikibase: t.Optional(t.String({ default: 'wikidata' })),
  }),
])

const WikibaseSchemaResponse = t.Object({
  id: UUIDPattern,
  project_id: UUIDPattern,
  name: SchemaName,
  wikibase: t.String(),
  schema: ItemSchemaMapping,
  created_at: t.String(),
  updated_at: t.String(),
})

type WikibaseSchemaResponse = typeof WikibaseSchemaResponse.static

const ProjectParams = t.Object({
  projectId: UUIDPattern,
})

export const wikibaseRoutes = new Elysia({ prefix: '/api/project/:projectId/schemas' })
  .use(cors())
  .use(errorHandlerPlugin)
  .use(databasePlugin)

  .guard({
    schema: 'standalone',
    params: ProjectParams,
  })

  .onBeforeHandle(async ({ db, params: { projectId }, status }) => {
    const reader = await db().runAndReadAll('SELECT id FROM _meta_projects WHERE id = ?', [
      projectId,
    ])

    if (reader.getRowObjectsJson().length === 0) {
      return status(404, ApiErrorHandler.notFoundErrorWithData('Project', projectId))
    }
  })

  // Get all schemas for a project
  .get(
    '/',
    async ({ db, params: { projectId } }) => {
      const reader = await db().runAndReadAll(
        `SELECT * FROM _meta_wikibase_schema WHERE project_id = ?`,
        [projectId],
      )
      const rows = reader.getRowObjectsJson()
      // Parse schema JSON if needed
      const schemas = rows.map(row => {
        let schema: ItemSchema
        if (typeof row.schema === 'string') {
          try {
            schema = JSON.parse(row.schema)
          } catch {
            schema = blankSchema
          }
        } else {
          schema = row.schema as ItemSchema
        }
        return { ...row, schema } as WikibaseSchemaResponse
      })
      return { data: schemas }
    },
    {
      response: {
        200: t.Object({
          data: t.Array(WikibaseSchemaResponse),
        }),
        404: ApiError,
        500: ApiError,
      },
    },
  )

  // Create a new Wikibase schema
  .post(
    '/',
    async ({
      db,
      body: {
        schemaId = Bun.randomUUIDv7(),
        projectId,
        name,
        wikibase = 'wikidata',
        schema = blankSchema,
      },
      status,
    }) => {
      await db().run(
        'INSERT INTO _meta_wikibase_schema (id, project_id, wikibase, name, schema) VALUES (?, ?, ?, ?, ?)',
        [schemaId, projectId, wikibase, name, JSON.stringify(schema)],
      )

      const reader = await db().runAndReadAll('SELECT * FROM _meta_wikibase_schema WHERE id = ?', [
        schemaId,
      ])
      const row = reader.getRowObjectsJson()[0]
      let parsedSchema = row?.schema
      if (typeof parsedSchema === 'string') {
        try {
          parsedSchema = JSON.parse(parsedSchema)
        } catch {
          parsedSchema = blankSchema
        }
      }
      return status(201, { data: { ...row, schema: parsedSchema } as WikibaseSchemaResponse })
    },
    {
      body: WikibaseSchemaCreateRequest,
      response: {
        201: t.Object({ data: WikibaseSchemaResponse }),
        404: ApiError,
        500: ApiError,
      },
    },
  )

  .guard({
    schema: 'standalone',
    params: t.Object({
      projectId: UUIDPattern,
      schemaId: UUIDPattern,
    }),
  })

  .resolve(async ({ db, params: { projectId, schemaId } }) => {
    const reader = await db().runAndReadAll(
      'SELECT * FROM _meta_wikibase_schema WHERE id = ? AND project_id = ?',
      [schemaId, projectId],
    )

    const schemas = reader.getRowObjectsJson().map(item => {
      let schema: ItemSchema
      try {
        schema = JSON.parse(item.schema as string)
      } catch {
        schema = blankSchema
      }
      return { ...item, schema } as WikibaseSchemaResponse
    })

    return {
      schemas,
    }
  })

  .onBeforeHandle(async ({ params: { schemaId }, schemas, status }) => {
    if (schemas.length === 0) {
      return status(404, ApiErrorHandler.notFoundErrorWithData('Schema', schemaId))
    }
  })

  // Get a specific schema with full details
  .get(
    '/:schemaId',
    async ({ schemas }) => {
      return { data: schemas[0] as WikibaseSchemaResponse }
    },
    {
      response: {
        200: t.Object({ data: WikibaseSchemaResponse }),
        404: ApiError,
        500: ApiError,
      },
    },
  )

  // Update a schema
  .put(
    '/:schemaId',
    async ({
      db,
      schemas,
      params: { schemaId },
      body: {
        name = schemas[0]!.name,
        wikibase = schemas[0]!.wikibase,
        schema: newSchema = schemas[0]!.schema,
      },
      status,
    }) => {
      const updatedAt = new Date().toISOString()
      try {
        await db().run(
          'UPDATE _meta_wikibase_schema SET name = ?, wikibase = ?, schema = ?, updated_at = ? WHERE id = ?',
          [name, wikibase, JSON.stringify(newSchema), updatedAt, schemaId],
        )
      } catch (error) {
        return status(
          500,
          ApiErrorHandler.internalServerErrorWithData('Error updating schema', [error as string]),
        )
      }

      const reader = await db().runAndReadAll('SELECT * FROM _meta_wikibase_schema WHERE id = ?', [
        schemaId,
      ])
      const row = reader.getRowObjectsJson()[0]
      let parsedSchema: ItemSchema
      try {
        parsedSchema = JSON.parse(row?.schema as string)
      } catch {
        parsedSchema = blankSchema
      }

      return { data: { ...row, schema: parsedSchema } as WikibaseSchemaResponse }
    },
    {
      body: WikibaseSchemaUpdateRequest,
      response: {
        200: t.Object({ data: WikibaseSchemaResponse }),
        404: ApiError,
        500: ApiError,
      },
    },
  )

  // Delete a schema
  .delete(
    '/:schemaId',
    async ({ db, params: { schemaId }, status }) => {
      await db().run('DELETE FROM _meta_wikibase_schema WHERE id = ?', [schemaId])

      return status(204, undefined)
    },
    {
      response: {
        204: t.Void(),
        404: ApiError,
        500: ApiError,
      },
    },
  )
