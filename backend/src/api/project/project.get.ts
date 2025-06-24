import { t, type Context } from 'elysia'
import { getDb } from '@backend/plugins/database'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { enhanceSchemaWithTypes } from '@backend/utils/duckdb-types'
import { ErrorResponseWithDataSchema } from '@backend/types/error-schemas'
import { ProjectUUIDParams } from '@backend/api/project/_schemas'

export const GetProjectByIdSchema = {
  params: ProjectUUIDParams,
  response: {
    200: t.Object({
      data: t.Array(t.Any()),
      meta: t.Object({
        name: t.String(),
        schema: t.Array(
          t.Object({
            name: t.String(),
            type: t.String(),
          })
        ),
        total: t.Number(),
        limit: t.Number(),
        offset: t.Number(),
      }),
    }),
    400: ErrorResponseWithDataSchema,
    404: ErrorResponseWithDataSchema,
    422: ErrorResponseWithDataSchema,
    500: ErrorResponseWithDataSchema,
  },
}

type Params = typeof GetProjectByIdSchema.params.static

export const getProjectById = async ({ params, set }: Context<{ params: Params }>) => {
  const db = getDb()

  // First, check if the project exists in _meta_projects
  const projectReader = await db.runAndReadAll('SELECT * FROM _meta_projects WHERE id = ?', [
    params.id,
  ])
  const projects = projectReader.getRowObjectsJson()

  if (projects.length === 0) {
    set.status = 404
    return ApiErrorHandler.notFoundErrorWithData('Project')
  }

  try {
    // Get the project's data from the project table (first 25 rows)
    const tableName = `project_${params.id}`
    const rowsReader = await db.runAndReadAll(`SELECT * FROM "${tableName}" LIMIT 25`)
    const rows = rowsReader.getRowObjectsJson()
    const schema = rowsReader.columnNameAndTypeObjectsJson()

    return {
      data: rows,
      meta: {
        name: projects?.[0]?.name ?? 'Unknown Project',
        schema: enhanceSchemaWithTypes(schema),
        total: rows.length, // For simplicity, we're not doing a separate count query
        limit: 25,
        offset: 0,
      },
    }
  } catch (error) {
    // If the table doesn't exist, return empty data
    if (error instanceof Error && error.message.includes('does not exist')) {
      return {
        data: [],
        meta: {
          name: projects?.[0]?.name ?? 'Unknown Project',
          schema: enhanceSchemaWithTypes([]),
          total: 0,
          limit: 25,
          offset: 0,
        },
      }
    }

    // Re-throw other errors
    throw error
  }
}
