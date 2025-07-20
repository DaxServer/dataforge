import type { ProjectColumn } from '@frontend/composables/useColumnGeneration'
import type { ColumnInfo } from '@frontend/types/wikibase-schema'

/**
 * Composable for converting project columns to column info format
 */
export const useColumnConversion = () => {
  /**
   * Converts ProjectColumn array to ColumnInfo array for use with ColumnPalette
   */
  const convertProjectColumnsToColumnInfo = (
    projectColumns: ProjectColumn[],
    sampleData: Record<string, unknown>[] = [],
  ): ColumnInfo[] => {
    return projectColumns.map((col) => {
      // Get all values for this column
      const columnValues = sampleData.map((row) => row[col.field])

      // Filter non-null values and get unique set
      const nonNullValues = columnValues.filter((value) => value !== null && value !== undefined)
      const uniqueValues = new Set(nonNullValues)

      // Get sample values (first 5 unique string values)
      const sampleValues = [...uniqueValues].slice(0, 5).map((value) => String(value))

      return {
        name: col.field,
        dataType: col.type,
        sampleValues,
        nullable: columnValues.length > nonNullValues.length,
        uniqueCount: uniqueValues.size || undefined,
      }
    })
  }

  return {
    convertProjectColumnsToColumnInfo,
  }
}
