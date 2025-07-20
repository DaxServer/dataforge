import type { WikibaseDataType } from '@frontend/types/wikibase-schema'
import { useColumnDataTypeIndicators } from './useColumnDataTypeIndicators'

/**
 * Composable for handling data type compatibility between database columns and Wikibase data types
 */
export const useDataTypeCompatibility = () => {
  const { getCompatibleWikibaseTypes } = useColumnDataTypeIndicators()

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

  return {
    getCompatibleWikibaseTypes,
    isDataTypeCompatible,
  }
}
