import { ProjectParams, UUIDPattern } from '@backend/api/project/schemas'
import { databasePlugin } from '@backend/plugins/database'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { ApiErrors } from '@backend/types/error-schemas'
import { ItemId, PropertyId, StatementRank, WikibaseDataType } from '@backend/types/wikibase-schema'
import cors from '@elysiajs/cors'
import { Elysia } from 'elysia'
import z from 'zod'
import { InstanceId } from '../wikibase/schemas'

const tags = ['Wikibase', 'Schema']

// Transformation rule for column mapping
const TransformationRule = z.object({
  type: z.union([z.literal('constant'), z.literal('expression'), z.literal('lookup')]),
  value: z.string(),
  parameters: z.optional(z.record(z.string(), z.any())),
})
export type TransformationRule = z.infer<typeof TransformationRule>

// Column mapping for data transformation
const ColumnMapping = z.object({
  columnName: z.string(),
  dataType: z.string(),
  transformation: TransformationRule.optional(),
})
export type ColumnMapping = z.infer<typeof ColumnMapping>

// Property reference for schema mapping
const PropertyReference = z.object({
  id: PropertyId,
  label: z.string().optional(),
  dataType: z.string(),
})
export type PropertyReference = z.infer<typeof PropertyReference>

// Value mapping types
const ValueMapping = z.union([
  z.object({
    type: z.literal('column'),
    source: ColumnMapping,
    dataType: WikibaseDataType,
  }),
  z.object({
    type: z.literal('constant'),
    source: z.string(),
    dataType: WikibaseDataType,
  }),
  z.object({
    type: z.literal('expression'),
    source: z.string(),
    dataType: WikibaseDataType,
  }),
])
export type ValueMapping = z.infer<typeof ValueMapping>

// Property-value mapping for qualifiers and references
const PropertyValueMap = z.object({
  id: UUIDPattern,
  property: PropertyReference,
  value: ValueMapping,
})
export type PropertyValueMap = z.infer<typeof PropertyValueMap>

// Reference schema mapping
const ReferenceSchemaMapping = z.object({
  id: UUIDPattern,
  snaks: z.array(PropertyValueMap),
})
export type ReferenceSchemaMapping = z.infer<typeof ReferenceSchemaMapping>

const Qualifier = PropertyValueMap
export type Qualifier = z.infer<typeof Qualifier>

const Reference = ReferenceSchemaMapping
export type Reference = z.infer<typeof Reference>

// Statement schema mapping
const StatementSchemaMapping = z.object({
  id: UUIDPattern,
  property: PropertyReference,
  value: ValueMapping,
  rank: StatementRank,
  qualifiers: z.array(Qualifier),
  references: z.array(Reference),
})
export type StatementSchemaMapping = z.infer<typeof StatementSchemaMapping>

// Label schema mapping
const Label = z.record(z.string(), ColumnMapping)
export type Label = z.infer<typeof Label>

// Alias schema mapping
const Alias = z.record(z.string(), z.array(ColumnMapping))
export type Alias = z.infer<typeof Alias>

// Terms schema mapping
const TermsSchemaMapping = z.object({
  labels: Label, // language code -> column mapping
  descriptions: Label,
  aliases: Alias,
})

export type TermsSchemaMapping = z.infer<typeof TermsSchemaMapping>

// Item schema
export const ItemSchema = z.object({
  id: ItemId.optional(),
  terms: TermsSchemaMapping,
  statements: z.array(StatementSchemaMapping),
})
export type ItemSchema = z.infer<typeof ItemSchema>

const blankSchema = {
  terms: {
    labels: {},
    descriptions: {},
    aliases: {},
  },
  statements: [],
} as ItemSchema

const SchemaName = z.string().min(1).max(255)

const WikibaseSchemaResponse = z.object({
  id: UUIDPattern,
  project_id: UUIDPattern,
  name: SchemaName,
  wikibase: z.string(),
  schema: ItemSchema,
  created_at: z.string(),
  updated_at: z.string(),
})
export type WikibaseSchemaResponse = z.infer<typeof WikibaseSchemaResponse>

const WikibaseSchemaUpdateRequest = z.object({
  name: SchemaName.optional(),
  wikibase: z.string().optional(),
  schema: ItemSchema.optional(),
})

const WikibaseSchemaCreateSchema = {
  body: z.object({
    ...WikibaseSchemaUpdateRequest.shape,
    schemaId: UUIDPattern.optional(),
    projectId: UUIDPattern,
    name: SchemaName,
    wikibase: InstanceId,
  }),
  response: {
    201: z.object({ data: WikibaseSchemaResponse }),
    404: ApiErrors,
    500: ApiErrors,
  },
  detail: {
    summary: 'Create a new Wikibase schema',
    description: 'Create a new Wikibase schema',
    tags,
  },
}

const WikibaseSchemaGetAllSchema = {
  response: {
    200: z.object({
      data: z.array(WikibaseSchemaResponse),
    }),
    404: ApiErrors,
    500: ApiErrors,
  },
  detail: {
    summary: 'Get all Wikibase schemas for a project',
    description: 'Get all Wikibase schemas for a project',
    tags,
  },
}

const WikibaseSchemaGetSchema = {
  response: {
    200: z.object({ data: WikibaseSchemaResponse }),
    404: ApiErrors,
    500: ApiErrors,
  },
  detail: {
    summary: 'Get a Wikibase schema',
    description: 'Get a Wikibase schema',
    tags,
  },
}

const WikibaseSchemaUpdateSchema = {
  body: WikibaseSchemaUpdateRequest,
  response: {
    200: z.object({ data: WikibaseSchemaResponse }),
    404: ApiErrors,
    500: ApiErrors,
  },
  detail: {
    summary: 'Update a Wikibase schema',
    description: 'Update a Wikibase schema',
    tags,
  },
}

const WikibaseSchemaDeleteSchema = {
  response: {
    204: z.void(),
    404: ApiErrors,
    500: ApiErrors,
  },
  detail: {
    summary: 'Delete a Wikibase schema',
    description: 'Delete a Wikibase schema',
    tags,
  },
}

const parseSchemaField = (schema: unknown) => {
  try {
    return JSON.parse(schema as string) as ItemSchema
  } catch {
    return blankSchema
  }
}

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
      const schemas = rows.map((row) => {
        return { ...row, schema: parseSchemaField(row.schema) } as WikibaseSchemaResponse
      })

      return { data: schemas }
    },
    WikibaseSchemaGetAllSchema,
  )

  // Create a new Wikibase schema
  .post(
    '/',
    async ({
      db,
      body: { schemaId = Bun.randomUUIDv7(), projectId, name, wikibase, schema = blankSchema },
      status,
    }) => {
      await db().run(
        'INSERT INTO _meta_wikibase_schema (id, project_id, wikibase, name, schema) VALUES (?, ?, ?, ?, ?)',
        [schemaId, projectId, wikibase, name, JSON.stringify(schema)],
      )

      const reader = await db().runAndReadAll('SELECT * FROM _meta_wikibase_schema WHERE id = ?', [
        schemaId,
      ])
      const row = reader.getRowObjectsJson()[0]!

      return status(201, {
        data: { ...row, schema: parseSchemaField(row?.schema) } as WikibaseSchemaResponse,
      })
    },
    WikibaseSchemaCreateSchema,
  )

  .guard({
    schema: 'standalone',
    params: z.object({
      ...ProjectParams.shape,
      schemaId: UUIDPattern,
    }),
  })

  .resolve(async ({ db, params: { projectId, schemaId } }) => {
    const reader = await db().runAndReadAll(
      'SELECT * FROM _meta_wikibase_schema WHERE id = ? AND project_id = ?',
      [schemaId, projectId],
    )

    const schemas = reader.getRowObjectsJson().map((item) => {
      return { ...item, schema: parseSchemaField(item.schema) } as WikibaseSchemaResponse
    })

    return { schemas }
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
      return { data: schemas[0]! }
    },
    WikibaseSchemaGetSchema,
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
      const row = reader.getRowObjectsJson()[0]!

      return { data: { ...row, schema: parseSchemaField(row?.schema) } as WikibaseSchemaResponse }
    },
    WikibaseSchemaUpdateSchema,
  )

  // Delete a schema
  .delete(
    '/:schemaId',
    async ({ db, params: { schemaId }, status }) => {
      await db().run('DELETE FROM _meta_wikibase_schema WHERE id = ?', [schemaId])

      return status(204, undefined)
    },
    WikibaseSchemaDeleteSchema,
  )
