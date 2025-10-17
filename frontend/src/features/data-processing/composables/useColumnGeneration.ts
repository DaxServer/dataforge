import type { DuckDBColumnSchema } from '@backend/api/project/schemas'

export interface ProjectColumn {
  field: string
  header: string
  type: string
  pk: boolean
  isInteger: boolean
  isDate: boolean
}

export const useColumnGeneration = () => {
  const generateColumns = (schema: DuckDBColumnSchema): ProjectColumn[] => {
    const columns = schema.map((col) => ({
      field: col.name,
      header: col.name,
      type: col.type,
      pk: col.pk,
      isInteger: col.type === 'BIGINT' || col.type === 'INTEGER',
      isDate:
        col.type === 'date' ||
        col.type === 'DATETIME' ||
        col.type === 'DATE' ||
        col.type === 'TIMESTAMP',
    }))

    // Sort columns to show primary key columns first
    return columns.sort((a, b) => {
      if (a.pk && !b.pk) return -1
      if (!a.pk && b.pk) return 1
      return 0
    })
  }

  return {
    generateColumns,
  }
}
