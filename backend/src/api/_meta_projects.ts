import { Elysia } from 'elysia'
import { databasePlugin } from '@backend/plugins/database'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'

export const metaProjectsRoutes = new Elysia({ prefix: '/api' })
  .use(errorHandlerPlugin)
  .use(databasePlugin)
  .get('/_meta_projects', async ({ db }) => {
    const reader = await db().runAndReadAll('SELECT * FROM _meta_projects')
    const columnsRaw = reader.columnNameAndTypeObjectsJson()
    const columns = Array.isArray(columnsRaw) ? columnsRaw : []
    const jsonColumns = new Set(
      columns
        .filter((col: any) => typeof col === 'object' && col?.columnType?.alias === 'JSON')
        .map((col: any) => col.columnName as string)
    )

    const rows = reader.getRowObjectsJson()
    const projects = rows.map((row: Record<string, unknown>) => {
      const newRow: Record<string, unknown> = { ...row }
      for (const key of jsonColumns) {
        if (typeof newRow[key] === 'string') {
          const str = (newRow[key] as string).trim()
          newRow[key] = str ? JSON.parse(str) : {}
        } else if (newRow[key] == null) {
          newRow[key] = {}
        }
      }
      return newRow
    })

    return { data: projects }
  })
