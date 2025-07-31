import { Elysia, t } from 'elysia'
import cors from '@elysiajs/cors'
import { databasePlugin } from '@backend/plugins/database'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { ApiError } from '@backend/types/error-schemas'
import { UUIDValidator } from '@backend/api/project/_schemas'
import { ApiErrorHandler } from '@backend/types/error-handler'

const WikibaseSchemaCreateRequest = t.Object({
  schemaId: t.Optional(UUIDValidator),
  projectId: UUIDValidator,
  name: t.String({ minLength: 1, maxLength: 255 }),
  wikibase: t.Optional(t.String({ default: 'wikidata' })),
  schema: t.Optional(t.Any()),
})

const WikibaseSchemaUpdateRequest = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  wikibase: t.Optional(t.String()),
  schema: t.Optional(t.Any()),
})

const ProjectParams = t.Object({
  projectId: UUIDValidator,
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
        let schema = row.schema
        if (typeof schema === 'string') {
          try {
            schema = JSON.parse(schema)
          } catch {
            schema = {}
          }
        }
        return { ...row, schema }
      })
      return { data: schemas }
    },
    {
      response: {
        200: t.Object({
          data: t.Array(t.Any()),
        }),
        404: ApiError,
        500: ApiError,
      },
    },
  )

  // Create a new Wikibase schema
  .post(
    '/',
    async ({ db, body, status }) => {
      const { schemaId, projectId, name, wikibase = 'wikidata', schema = {} } = body
      // Compose new schema object, use provided id if present
      const _schemaId = schemaId || Bun.randomUUIDv7()

      await db().run(
        'INSERT INTO _meta_wikibase_schema (id, project_id, wikibase, name, schema) VALUES (?, ?, ?, ?, ?)',
        [_schemaId, projectId, wikibase, name, JSON.stringify(schema)],
      )

      const reader = await db().runAndReadAll('SELECT * FROM _meta_wikibase_schema WHERE id = ?', [
        _schemaId,
      ])
      const row = reader.getRowObjectsJson()[0]
      let parsedSchema = row?.schema
      if (typeof parsedSchema === 'string') {
        try {
          parsedSchema = JSON.parse(parsedSchema)
        } catch {
          parsedSchema = {}
        }
      }
      return status(201, { data: { ...row, schema: parsedSchema } })
    },
    {
      body: WikibaseSchemaCreateRequest,
      response: {
        201: t.Object({ data: t.Any() }),
        404: ApiError,
        500: ApiError,
      },
    },
  )

  .guard({
    schema: 'standalone',
    params: t.Object({
      projectId: UUIDValidator,
      schemaId: UUIDValidator,
    }),
  })

  .resolve(async ({ db, params: { projectId, schemaId } }) => {
    const reader = await db().runAndReadAll(
      'SELECT * FROM _meta_wikibase_schema WHERE id = ? AND project_id = ?',
      [schemaId, projectId],
    )

    return {
      schema: reader.getRowObjectsJson(),
    }
  })

  .onBeforeHandle(async ({ params: { schemaId }, schema, status }) => {
    if (schema.length === 0 || !schema[0]) {
      return status(404, ApiErrorHandler.notFoundErrorWithData('Schema', schemaId))
    }
  })

  // Get a specific schema with full details
  .get(
    '/:schemaId',
    async ({ schema }) => {
      let _schema = schema[0]!.schema
      try {
        _schema = JSON.parse(_schema as string)
      } catch {
        _schema = {}
      }

      return { data: { ...schema[0]!, schema: _schema } }
    },
    {
      response: {
        200: t.Object({ data: t.Any() }),
        404: ApiError,
        500: ApiError,
      },
    },
  )

  // Update a schema
  .put(
    '/:schemaId',
    async ({ db, params: { schemaId }, body: { name, wikibase, schema: ns }, schema, status }) => {
      let _name = schema[0]!.name as string
      let _wikibase = schema[0]!.wikibase as string

      let _schema = schema[0]!.schema
      try {
        _schema = JSON.parse(_schema as string)
      } catch {
        _schema = {}
      }

      if (name) {
        _name = name
      }
      if (wikibase) {
        _wikibase = wikibase
      }
      if (ns) {
        _schema = ns as any
      }

      const updated_at = new Date().toISOString()
      try {
        await db().run(
          'UPDATE _meta_wikibase_schema SET name = ?, wikibase = ?, schema = ?, updated_at = ? WHERE id = ?',
          [_name, _wikibase, JSON.stringify(_schema), updated_at, schemaId],
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
      let parsedSchema = row?.schema
      try {
        parsedSchema = JSON.parse(parsedSchema as string)
      } catch {
        parsedSchema = {}
      }

      return { data: { ...row, schema: parsedSchema } }
    },
    {
      body: WikibaseSchemaUpdateRequest,
      response: {
        200: t.Object({ data: t.Any() }),
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
