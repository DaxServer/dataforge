import { t } from 'elysia'
import type { DuckDBConnection } from '@duckdb/node-api'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { enhanceSchemaWithTypes } from '@backend/utils/duckdb-types'
import { ErrorResponseWithDataSchema } from '@backend/types/error-schemas'
import {
  DuckDBColumnSchema,
  ProjectUUIDParams,
  PaginationQuery,
} from '@backend/api/project/_schemas'

const ResponseSchema = t.Object({
  data: t.Array(t.Any()),
  meta: t.Object({
    name: t.String(),
    schema: DuckDBColumnSchema,
    total: t.Number(),
    limit: t.Numeric(),
    offset: t.Numeric(),
  }),
})

export const GetProjectByIdSchema = {
  params: ProjectUUIDParams,
  query: PaginationQuery,
  response: {
    200: ResponseSchema,
    400: ErrorResponseWithDataSchema,
    404: ErrorResponseWithDataSchema,
    422: ErrorResponseWithDataSchema,
    500: ErrorResponseWithDataSchema,
  },
}

export type GetProjectByIdResponse = typeof ResponseSchema.static

export const getProjectById = async (
  db: () => DuckDBConnection,
  id: string,
  offset: number,
  limit: number,
  status
) => {
  // First, check if the project exists in _meta_projects
  const projectReader = await db().runAndReadAll('SELECT * FROM _meta_projects WHERE id = ?', [id])
  const projects = projectReader.getRowObjects()

  if (projects.length === 0) {
    return status(404, ApiErrorHandler.notFoundErrorWithData('Project'))
  }

  try {
    // Get the project's data from the project table with pagination
    const tableName = `project_${id}`
    const rowsReader = await db().runAndReadAll(`SELECT * FROM "${tableName}" LIMIT ? OFFSET ?`, [
      limit,
      offset,
    ])
    const rows = rowsReader.getRowObjectsJson()
    const schema = rowsReader.columnNameAndTypeObjectsJson()
    const projectName = projects?.[0]?.name?.toString() ?? 'Unknown Project'

    // Get the total count with a separate query
    const countReader = await db().runAndReadAll(`SELECT COUNT(*) as total FROM "${tableName}"`)
    const countResult = countReader.getRowObjectsJson()
    const total = Number(countResult[0]?.total ?? 0)

    return {
      data: rows,
      meta: {
        name: projectName,
        schema: enhanceSchemaWithTypes(schema),
        total,
        limit,
        offset,
      },
    }
  } catch (error) {
    // If the table doesn't exist, return API error
    if (error instanceof Error && error.message.includes('does not exist')) {
      return status(404, ApiErrorHandler.notFoundErrorWithData('Project'))
    }

    // Re-throw other errors
    throw error
  }
}
