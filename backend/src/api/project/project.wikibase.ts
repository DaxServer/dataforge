import { Elysia, t } from 'elysia'
import { databasePlugin } from '@backend/plugins/database'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { ApiError } from '@backend/types/error-schemas'
import { UUID_REGEX, UUIDParam } from '@backend/api/project/_schemas'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { Item } from '@backend/types/wikibase-schema'

const WikibaseSchemaCreateRequest = t.Object({
  id: t.Optional(t.String({ pattern: UUID_REGEX })),
  project_id: t.String({ pattern: UUID_REGEX }),
  name: t.String({ minLength: 1, maxLength: 255 }),
  wikibase: t.Optional(t.String({ default: 'wikidata' })),
  schema: t.Optional(Item),
})

const WikibaseSchemaUpdateRequest = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  wikibase: t.Optional(t.String()),
  schema: t.Optional(Item),
})

const ProjectParams = t.Object({
  project_id: t.String({ pattern: UUID_REGEX }),
})

export const wikibaseRoutes = new Elysia({ prefix: '/api/project/:project_id' })
  .use(errorHandlerPlugin)
  .use(databasePlugin)

  .guard({
    schema: 'standalone',
    params: ProjectParams,
  })

  .onBeforeHandle(async ({ db, params: { project_id }, status }) => {
    const reader = await db().runAndReadAll('SELECT id FROM _meta_projects WHERE id = ?', [
      project_id,
    ])

    if (reader.getRowObjectsJson().length === 0) {
      return status(404, ApiErrorHandler.notFoundErrorWithData('Project', project_id))
    }
  })

  // Get all schemas for a project
  .get(
    '/schemas',
    async ({ db, params: { project_id } }) => {
      const reader = await db().runAndReadAll(
        `SELECT * FROM _meta_wikibase_schema WHERE project_id = ?`,
        [project_id],
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
    '/schemas',
    async ({ db, body, status }) => {
      const { id, project_id, name, wikibase = 'wikidata', schema = {} } = body
      // Compose new schema object, use provided id if present
      const schemaId = id || Bun.randomUUIDv7()

      await db().run(
        'INSERT INTO _meta_wikibase_schema (id, project_id, wikibase, name, schema) VALUES (?, ?, ?, ?, ?)',
        [schemaId, project_id, wikibase, name, JSON.stringify(schema)],
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
    params: UUIDParam,
  })

  .resolve(async ({ db, params: { project_id, id } }) => {
    const reader = await db().runAndReadAll(
      'SELECT * FROM _meta_wikibase_schema WHERE id = ? AND project_id = ?',
      [id, project_id],
    )

    return {
      schema: reader.getRowObjectsJson(),
    }
  })

  .onBeforeHandle(async ({ params: { id }, schema, status }) => {
    if (schema.length === 0 || !schema[0]) {
      return status(404, ApiErrorHandler.notFoundErrorWithData('Schema', id))
    }
  })

  // Get a specific schema with full details
  .get(
    '/schemas/:id',
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
    '/schemas/:id',
    async ({ db, params: { id }, body: { name, wikibase, schema: ns }, schema, status }) => {
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
        _schema = ns
      }

      const updated_at = new Date().toISOString()
      try {
        await db().run(
          'UPDATE _meta_wikibase_schema SET name = ?, wikibase = ?, schema = ?, updated_at = ? WHERE id = ?',
          [_name, _wikibase, JSON.stringify(_schema), updated_at, id],
        )
      } catch (error) {
        return status(
          500,
          ApiErrorHandler.internalServerErrorWithData('Error updating schema', [error as string]),
        )
      }

      const reader = await db().runAndReadAll('SELECT * FROM _meta_wikibase_schema WHERE id = ?', [
        id,
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
    '/schemas/:id',
    async ({ db, params: { id }, status }) => {
      await db().run('DELETE FROM _meta_wikibase_schema WHERE id = ?', [id])

      // @ts-expect-error
      return status(204, new Response(null))
    },
    {
      response: {
        204: t.Null(),
        404: ApiError,
        500: ApiError,
      },
    },
  )
