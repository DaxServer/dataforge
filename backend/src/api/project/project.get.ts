import { t } from 'elysia'
import type { DuckDBConnection } from '@duckdb/node-api'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { enhanceSchemaWithTypes } from '@backend/utils/duckdb-types'
import { ErrorResponseWithDataSchema } from '@backend/types/error-schemas'
import { DuckDBColumnSchema, ProjectUUIDParams } from '@backend/api/project/_schemas'

export const GetProjectByIdSchema = {
  params: ProjectUUIDParams,
  response: {
    200: t.Object({
      data: t.Array(t.Any()),
      meta: t.Object({
        name: t.String(),
        schema: DuckDBColumnSchema,
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

export const getProjectById = async (db: () => DuckDBConnection, id: string, status) => {
  // First, check if the project exists in _meta_projects
  const projectReader = await db().runAndReadAll('SELECT * FROM _meta_projects WHERE id = ?', [id])
  const projects = projectReader.getRowObjects()

  if (projects.length === 0) {
    return status(404, ApiErrorHandler.notFoundErrorWithData('Project'))
  }

  try {
    // Get the project's data from the project table (first 25 rows)
    const tableName = `project_${id}`
    const rowsReader = await db().runAndReadAll(`SELECT * FROM "${tableName}" LIMIT 25`)
    const rows = rowsReader.getRowObjectsJson()
    const schema = rowsReader.columnNameAndTypeObjectsJson()
    const projectName = projects?.[0]?.name?.toString() ?? 'Unknown Project'

    return {
      data: rows,
      meta: {
        name: projectName,
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
          name: 'Unknown Project',
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
