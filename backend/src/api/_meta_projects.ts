import { databasePlugin } from '@backend/plugins/database'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { ApiErrors } from '@backend/types/error-schemas'
import type { DuckDBColumnNameAndType } from '@backend/utils/duckdb-types'
import { Elysia, t } from 'elysia'

const MetaProject = t.Object({
  id: t.String(),
  name: t.String(),
  schema_for: t.Union([t.String(), t.Null()]),
  schema: t.Any(),
  created_at: t.String(),
  updated_at: t.String(),
  wikibase_schema: t.Array(
    t.Object({
      id: t.String(),
      wikibase: t.String(),
      name: t.String(),
      created_at: t.String(),
      updated_at: t.String(),
    }),
  ),
})
type MetaProject = typeof MetaProject.static

export const metaProjectsRoutes = new Elysia({ prefix: '/api' })
  .use(errorHandlerPlugin)
  .use(databasePlugin)
  .get(
    '/_meta_projects',
    async ({ db }) => {
      const reader = await db().runAndReadAll(`
        SELECT
          p.id,
          p.name,
          p.schema_for,
          p.schema,
          p.created_at,
          p.updated_at,
          COALESCE(
            array_agg(
              CASE
                WHEN w.id IS NOT NULL THEN
                  struct_pack(
                    id := w.id,
                    wikibase := w.wikibase,
                    name := w.name,
                    created_at := w.created_at,
                    updated_at := w.updated_at
                  )
                ELSE NULL
              END
            ) FILTER (WHERE w.id IS NOT NULL),
            []
          ) AS wikibase_schema
        FROM _meta_projects p
        LEFT JOIN _meta_wikibase_schema w ON w.project_id = p.id
        GROUP BY p.id, p.name, p.schema_for, p.schema, p.created_at, p.updated_at
      `)

      const columns = reader.columnNameAndTypeObjectsJson() as DuckDBColumnNameAndType[]
      const jsonColumns = columns
        .filter((c) => c.columnType.alias === 'JSON')
        .map((c) => c.columnName)

      const data = reader.getRowObjectsJson().map((row) => {
        const newRow: Record<string, unknown> = { ...row }
        jsonColumns.forEach((column) => {
          if (newRow[column] && typeof newRow[column] === 'string') {
            newRow[column] = JSON.parse(newRow[column] as string)
          }
        })
        return newRow as MetaProject
      })

      return { data }
    },
    {
      response: {
        200: t.Object({
          data: t.Array(MetaProject),
        }),
        500: ApiErrors,
      },
    },
  )
