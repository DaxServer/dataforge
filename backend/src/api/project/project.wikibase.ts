import { Elysia, t } from 'elysia'
import { databasePlugin } from '@backend/plugins/database'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { ApiError } from '@backend/types/error-schemas'
import { UUID_REGEX } from '@backend/api/project/_schemas'
import { ApiErrorHandler } from '@backend/types/error-handler'

const WikibaseSchemaCreateRequest = t.Object({
  id: t.Optional(t.String({ pattern: UUID_REGEX })),
  project_id: t.String({ pattern: UUID_REGEX }),
  name: t.String({ minLength: 1, maxLength: 255 }),
  wikibase_instance: t.Optional(t.String({ default: 'wikidata' })),
  items: t.Optional(t.Array(t.Any(), { default: [] })),
})

const WikibaseSchemaUpdateRequest = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  wikibase_instance: t.Optional(t.String()),
  items: t.Optional(t.Array(t.Any())),
})

const ProjectParams = t.Object({
  project_id: t.String({ pattern: UUID_REGEX }),
})

const ProjectAndSchemaParams = t.Object({
  project_id: t.String({ pattern: UUID_REGEX }),
  id: t.String({ pattern: UUID_REGEX }),
})

export const wikibaseRoutes = new Elysia({ prefix: '/api/project/:project_id' })
  .use(errorHandlerPlugin)
  .use(databasePlugin)

  // Get all schemas for a project
  .get(
    '/schemas',
    async ({ db, params: { project_id } }) => {
      const reader = await db().runAndReadAll(
        `SELECT * FROM _meta_wikibase_schema WHERE project_id = ?`,
        [project_id]
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
      params: ProjectParams,
      response: {
        200: t.Object({
          data: t.Array(t.Any()),
        }),
        404: ApiError,
        500: ApiError,
      },
    }
  )

  // Create a new Wikibase schema
  .post(
    '/schemas',
    async ({ db, body, set }) => {
      const { id, project_id, name, wikibase_instance = 'wikidata', items = [] } = body
      // Check if project exists
      const projectCheck = await db().runAndReadAll('SELECT id FROM _meta_projects WHERE id = ?', [
        project_id,
      ])
      if (projectCheck.getRowObjectsJson().length === 0) {
        set.status = 422
        return ApiErrorHandler.validationErrorWithData('Project not found')
      }
      // Compose new schema object, use provided id if present
      const schemaId = id || Bun.randomUUIDv7()
      const newSchema = {
        id: schemaId,
        project_id,
        wikibase: wikibase_instance,
        name,
        items,
      }
      await db().run(
        'INSERT INTO _meta_wikibase_schema (id, project_id, wikibase, name, schema) VALUES (?, ?, ?, ?, ?)',
        [schemaId, project_id, wikibase_instance, name, JSON.stringify(items)]
      )
      set.status = 201
      return { data: newSchema }
    },
    {
      body: WikibaseSchemaCreateRequest,
      response: {
        201: t.Object({ data: t.Any() }),
        400: ApiError,
        404: ApiError,
        500: ApiError,
      },
    }
  )

  // Get a specific schema with full details
  .get(
    '/schemas/:id',
    async ({ db, params: { project_id, id }, set }) => {
      const reader = await db().runAndReadAll(
        'SELECT * FROM _meta_wikibase_schema WHERE id = ? AND project_id = ?',
        [id, project_id]
      )
      const rows = reader.getRowObjectsJson()
      if (rows.length === 0 || !rows[0]) {
        set.status = 404
        return ApiErrorHandler.notFoundErrorWithData('Schema', id)
      }
      let schema = rows[0].schema
      if (typeof schema === 'string') {
        try {
          schema = JSON.parse(schema)
        } catch {
          schema = {}
        }
      }
      if (!schema || typeof schema !== 'object') schema = {}
      return { data: { ...(rows[0] ?? {}), schema } }
    },
    {
      params: ProjectAndSchemaParams,
      response: {
        200: t.Object({ data: t.Any() }),
        404: ApiError,
        500: ApiError,
      },
    }
  )

  // Update a schema
  .put(
    '/schemas/:id',
    async ({ db, params: { project_id, id }, body, set }) => {
      const reader = await db().runAndReadAll(
        'SELECT * FROM _meta_wikibase_schema WHERE id = ? AND project_id = ?',
        [id, project_id]
      )
      const rows = reader.getRowObjectsJson()
      if (rows.length === 0 || !rows[0]) {
        set.status = 404
        return ApiErrorHandler.notFoundErrorWithData('Schema', id)
      }
      let schema = rows[0].schema
      if (typeof schema === 'string') {
        try {
          schema = JSON.parse(schema)
        } catch {
          schema = {}
        }
      }
      if (!schema || typeof schema !== 'object') schema = {}
      // Merge updates into schema
      schema = { ...schema, ...(body ?? {}) }
      const updated_at = new Date().toISOString()
      await db().run('UPDATE _meta_wikibase_schema SET schema = ?, updated_at = ? WHERE id = ?', [
        JSON.stringify(schema),
        updated_at,
        id,
      ])
      return { data: { ...(rows[0] ?? {}), schema, updated_at } }
    },
    {
      params: ProjectAndSchemaParams,
      body: WikibaseSchemaUpdateRequest,
      response: {
        200: t.Object({ data: t.Any() }),
        404: ApiError,
        500: ApiError,
      },
    }
  )

  // Delete a schema
  .delete(
    '/schemas/:id',
    async ({ db, params: { project_id, id }, status }) => {
      const reader = await db().runAndReadAll(
        'SELECT * FROM _meta_wikibase_schema WHERE id = ? AND project_id = ?',
        [id, project_id]
      )
      const rows = reader.getRowObjectsJson()
      if (rows.length === 0) {
        return status(404, ApiErrorHandler.notFoundErrorWithData('Schema', id))
      }
      await db().run('DELETE FROM _meta_wikibase_schema WHERE id = ?', [id])
      return status(204, new Response(null))
    },
    {
      params: ProjectAndSchemaParams,
      response: {
        204: t.Null(),
        404: ApiError,
        500: ApiError,
      },
    }
  )
