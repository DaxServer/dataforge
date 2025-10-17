import type { WikibaseDataType } from '@backend/types/wikibase-schema'
import type { ColumnInfo } from '@frontend/shared/types/wikibase-schema'

/**
 * Data type configuration mapping
 */
interface DataTypeConfig {
  displayName: string
  icon: string
  compatibleWikibaseTypes: WikibaseDataType[]
}

/**
 * Composable for handling column data type indicators, tooltips, and sample value display
 */
export const useColumnDataTypeIndicators = () => {
  /**
   * Mapping for all data type configurations
   */
  const DATA_TYPE_CONFIG: Record<string, DataTypeConfig> = {
    VARCHAR: {
      displayName: 'Text',
      icon: 'pi-align-left',
      compatibleWikibaseTypes: ['string', 'url', 'external-id', 'monolingualtext'],
    },
    TEXT: {
      displayName: 'Text',
      icon: 'pi-align-left',
      compatibleWikibaseTypes: ['string', 'monolingualtext'],
    },
    STRING: {
      displayName: 'Text',
      icon: 'pi-align-left',
      compatibleWikibaseTypes: ['string', 'url', 'external-id', 'monolingualtext'],
    },
    INTEGER: {
      displayName: 'Number',
      icon: 'pi-hashtag',
      compatibleWikibaseTypes: ['quantity'],
    },
    DECIMAL: {
      displayName: 'Decimal',
      icon: 'pi-hashtag',
      compatibleWikibaseTypes: ['quantity'],
    },
    NUMERIC: {
      displayName: 'Number',
      icon: 'pi-hashtag',
      compatibleWikibaseTypes: ['quantity'],
    },
    FLOAT: {
      displayName: 'Decimal',
      icon: 'pi-hashtag',
      compatibleWikibaseTypes: ['quantity'],
    },
    DOUBLE: {
      displayName: 'Decimal',
      icon: 'pi-hashtag',
      compatibleWikibaseTypes: ['quantity'],
    },
    DATE: {
      displayName: 'Date',
      icon: 'pi-calendar',
      compatibleWikibaseTypes: ['time'],
    },
    DATETIME: {
      displayName: 'Date/Time',
      icon: 'pi-calendar',
      compatibleWikibaseTypes: ['time'],
    },
    TIMESTAMP: {
      displayName: 'Date/Time',
      icon: 'pi-calendar',
      compatibleWikibaseTypes: ['time'],
    },
    BOOLEAN: {
      displayName: 'Boolean',
      icon: 'pi-check-circle',
      compatibleWikibaseTypes: [],
    },
    JSON: {
      displayName: 'JSON',
      icon: 'pi-code',
      compatibleWikibaseTypes: ['string'],
    },
    ARRAY: {
      displayName: 'Array',
      icon: 'pi-list',
      compatibleWikibaseTypes: ['string'],
    },
  }

  /**
   * Get compatible Wikibase data types for a given database column type
   */
  const getCompatibleWikibaseTypes = (columnType: string): WikibaseDataType[] => {
    const config = DATA_TYPE_CONFIG[columnType.toUpperCase()]
    return config?.compatibleWikibaseTypes || []
  }

  /**
   * Format data type display names for better user experience
   */
  const formatDataTypeDisplayName = (dataType: string): string => {
    const config = DATA_TYPE_CONFIG[dataType.toUpperCase()]
    return config?.displayName || dataType
  }

  /**
   * Generate tooltip content for column data type information
   */
  const generateDataTypeTooltip = (columnInfo: ColumnInfo): string => {
    const compatibleTypes = getCompatibleWikibaseTypes(columnInfo.dataType)
    const displayName = formatDataTypeDisplayName(columnInfo.dataType)

    let tooltip = `Data Type: ${displayName} (${columnInfo.dataType})`

    if (columnInfo.nullable) {
      tooltip += '\nNullable: Yes'
    }

    if (columnInfo.uniqueCount !== undefined) {
      tooltip += `\nUnique Values: ${columnInfo.uniqueCount.toLocaleString()}`
    }

    if (compatibleTypes.length > 0) {
      tooltip += `\nWikibase Compatible: ${compatibleTypes.join(', ')}`
    } else {
      tooltip += '\nWikibase Compatible: None (requires transformation)'
    }

    return tooltip
  }

  /**
   * Format sample values for display in tooltips with proper truncation
   */
  const formatSampleValuesForTooltip = (sampleValues: string[], maxDisplay: number = 5): string => {
    if (!sampleValues || sampleValues.length === 0) return 'No sample data available'

    // Truncate individual values if they're too long
    const truncateValue = (value: string, maxLength: number = 30): string => {
      return value.length > maxLength ? `${value.substring(0, maxLength)}...` : value
    }

    const displayValues = sampleValues.slice(0, maxDisplay).map((val) => truncateValue(val))

    const hasMore = sampleValues.length > maxDisplay

    let result = displayValues.join(', ')
    if (hasMore) {
      result += `, ... (+${sampleValues.length - maxDisplay} more)`
    }

    return result
  }

  /**
   * Generate comprehensive tooltip content for a column
   */
  const generateColumnTooltip = (columnInfo: ColumnInfo): string => {
    const dataTypeInfo = generateDataTypeTooltip(columnInfo)
    const sampleInfo = formatSampleValuesForTooltip(columnInfo.sampleValues)

    return `${dataTypeInfo}\n\nSample Values:\n${sampleInfo}`
  }

  /**
   * Generate sample value statistics
   */
  const generateSampleStats = (sampleValues: string[]) => {
    if (!sampleValues || sampleValues.length === 0) {
      return { isEmpty: true, count: 0, hasNulls: false, nullCount: 0 }
    }

    const nullValues = sampleValues.filter(
      (val) => val === null || val === 'null' || val === '' || val === undefined,
    )

    return {
      isEmpty: false,
      count: sampleValues.length,
      hasNulls: nullValues.length > 0,
      nullCount: nullValues.length,
    }
  }

  /**
   * Get appropriate icon for data type
   */
  const getDataTypeIcon = (dataType: string): string => {
    const config = DATA_TYPE_CONFIG[dataType.toUpperCase()]
    return config?.icon || 'pi-question-circle'
  }

  /**
   * Get severity level for data type chip based on Wikibase compatibility
   */
  const getDataTypeSeverity = (dataType: string): 'success' | 'info' | 'warning' | 'danger' => {
    const compatibleTypes = getCompatibleWikibaseTypes(dataType)

    if (compatibleTypes.length === 0) {
      return 'warning' // No direct compatibility, needs transformation
    } else if (compatibleTypes.length >= 3) {
      return 'success' // High compatibility
    } else {
      return 'info' // Some compatibility
    }
  }

  return {
    DATA_TYPE_CONFIG,
    getCompatibleWikibaseTypes,
    formatDataTypeDisplayName,
    generateDataTypeTooltip,
    formatSampleValuesForTooltip,
    generateColumnTooltip,
    generateSampleStats,
    getDataTypeIcon,
    getDataTypeSeverity,
  }
}
