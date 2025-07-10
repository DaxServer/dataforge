import { Elysia, t } from 'elysia'
import { databasePlugin } from '@backend/plugins/database'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { ApiError } from '@backend/types/error-schemas'
import type { DuckDBColumnNameAndType } from '@backend/utils/duckdb-types'

const MetaProject = t.Object({
  id: t.String(),
  name: t.String(),
  schema_for: t.Union([t.String(), t.Null()]),
  schema: t.Any(),
  created_at: t.String(),
  updated_at: t.String(),
})

type MetaProject = typeof MetaProject.static

export const metaProjectsRoutes = new Elysia({ prefix: '/api' })
  .use(errorHandlerPlugin)
  .use(databasePlugin)
  .get(
    '/_meta_projects',
    async ({ db }) => {
      const reader = await db().runAndReadAll('SELECT * FROM _meta_projects')
      const columns = reader.columnNameAndTypeObjectsJson() as DuckDBColumnNameAndType[]

      const jsonColumns = columns.filter(c => c.columnType.alias === 'JSON').map(c => c.columnName)

      const rows = reader.getRowObjectsJson().map(row => {
        const newRow: Record<string, unknown> = { ...row }
        jsonColumns.forEach(column => {
          if (newRow[column] && typeof newRow[column] === 'string') {
            newRow[column] = JSON.parse(newRow[column] as string)
          }
        })
        return newRow
      })

      return { data: rows as MetaProject[] }
    },
    {
      response: {
        200: t.Object({
          data: t.Array(MetaProject),
        }),
        500: ApiError,
      },
    }
  )
