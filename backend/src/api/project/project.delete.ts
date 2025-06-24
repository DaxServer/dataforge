import { t } from 'elysia'
import type { DuckDBConnection } from '@duckdb/node-api'
import { ApiErrorHandler } from '@backend/types/error-handler'
import { ErrorResponseWithDataSchema } from '@backend/types/error-schemas'
import { ProjectUUIDParams } from '@backend/api/project/_schemas'

export const ProjectDeleteSchema = {
  params: ProjectUUIDParams,
  response: {
    204: t.Null(),
    404: ErrorResponseWithDataSchema,
    422: ErrorResponseWithDataSchema,
    500: ErrorResponseWithDataSchema,
  },
}

export const deleteProject = async (db: () => DuckDBConnection, id: string, status) => {
  // Delete the project and return the deleted row if it exists
  const reader = await db().runAndReadAll('DELETE FROM _meta_projects WHERE id = ? RETURNING id', [
    id,
  ])

  const deleted = reader.getRowObjectsJson()

  if (deleted.length === 0) {
    return status(404, ApiErrorHandler.notFoundErrorWithData('Project'))
  }

  return status(204, new Response(null))
}
