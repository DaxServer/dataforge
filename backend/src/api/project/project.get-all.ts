import { t } from 'elysia'
import type { DuckDBConnection } from '@duckdb/node-api'
import { ErrorResponseWithDataSchema } from '@backend/types/error-schemas'
import { ProjectResponseSchema, type Project } from '@backend/api/project/_schemas'

export const ProjectsGetAllSchema = {
  response: {
    200: t.Object({
      data: t.Array(ProjectResponseSchema),
    }),
    500: ErrorResponseWithDataSchema,
  },
}

export const getAllProjects = async (db: () => DuckDBConnection) => {
  const reader = await db().runAndReadAll('SELECT * FROM _meta_projects ORDER BY created_at DESC')

  const projects = reader.getRowObjectsJson()

  return {
    data: projects as Project[],
  }
}
