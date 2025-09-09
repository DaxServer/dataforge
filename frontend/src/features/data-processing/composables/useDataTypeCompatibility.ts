import type { WikibaseDataType } from '@backend/types/wikibase-schema'
import { useColumnDataTypeIndicators } from '@frontend/features/data-processing/composables/useColumnDataTypeIndicators'
import type { ColumnInfo } from '@frontend/shared/types/wikibase-schema'
import { readonly, ref } from 'vue'

/**
 * Composable for handling data type compatibility between database columns and Wikibase data types
 */
export const useDataTypeCompatibility = () => {
  const { getCompatibleWikibaseTypes } = useColumnDataTypeIndicators()

  // Define text-compatible data types as a reactive constant
  const textCompatibleTypes = ref(['VARCHAR', 'TEXT', 'STRING', 'CHAR'])

  /**
   * Helper function to check if a column type is compatible with any of the accepted types
   * @param columnType - The database column data type
   * @param acceptedTypes - Array of accepted Wikibase data types
   * @returns True if the column type is compatible with any of the accepted types
   */
  const isDataTypeCompatible = (columnType: string, acceptedTypes: WikibaseDataType[]): boolean => {
    const compatibleTypes = getCompatibleWikibaseTypes(columnType)
    return acceptedTypes.some((type) => compatibleTypes.includes(type))
  }

  /**
   * Check if a column is valid for text-based fields (string-like data types)
   * @param dataColumn - The column information
   * @returns True if the column can be used for text fields (labels, descriptions, aliases)
   */
  const isValidTextColumn = (dataColumn: ColumnInfo | null): boolean => {
    if (!dataColumn) return false

    // Direct check without unnecessary computed property
    const upperDataType = dataColumn.dataType.toUpperCase()
    return textCompatibleTypes.value.includes(upperDataType)
  }

  return {
    getCompatibleWikibaseTypes,
    isDataTypeCompatible,
    isValidTextColumn,
    textCompatibleTypes: readonly(textCompatibleTypes),
  }
}
