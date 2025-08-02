import { ref, computed } from 'vue'
import type {
  ValueMapping,
  ColumnInfo,
  WikibaseDataType,
  PropertyReference,
} from '@frontend/types/wikibase-schema'
import { useDataTypeCompatibility } from '@frontend/composables/useDataTypeCompatibility'

/**
 * Composable for handling value mapping configuration and validation
 */
export const useValueMapping = () => {
  const { isDataTypeCompatible, getCompatibleWikibaseTypes } = useDataTypeCompatibility()

  // Current value mapping state
  const currentMapping = ref<ValueMapping>({
    type: 'column',
    source: {
      columnName: '',
      dataType: 'VARCHAR',
    },
    dataType: 'string',
  })

  // Available value types
  const valueTypes = [
    { label: 'Column', value: 'column', icon: 'pi pi-database' },
    { label: 'Constant', value: 'constant', icon: 'pi pi-lock' },
    { label: 'Expression', value: 'expression', icon: 'pi pi-code' },
  ]

  // Available Wikibase data types
  const wikibaseDataTypes: { label: string; value: WikibaseDataType }[] = [
    { label: 'String', value: 'string' },
    { label: 'Wikibase Item', value: 'wikibase-item' },
    { label: 'Wikibase Property', value: 'wikibase-property' },
    { label: 'Quantity', value: 'quantity' },
    { label: 'Time', value: 'time' },
    { label: 'Globe Coordinate', value: 'globe-coordinate' },
    { label: 'URL', value: 'url' },
    { label: 'External ID', value: 'external-id' },
    { label: 'Monolingual Text', value: 'monolingualtext' },
    { label: 'Commons Media', value: 'commonsMedia' },
  ]

  // Computed properties
  const isColumnType = computed(() => currentMapping.value.type === 'column')
  const isConstantType = computed(() => currentMapping.value.type === 'constant')
  const isExpressionType = computed(() => currentMapping.value.type === 'expression')

  const sourceValue = computed({
    get: () => {
      if (currentMapping.value.type === 'column') {
        return currentMapping.value.source?.columnName || ''
      }
      return currentMapping.value.source || ''
    },
    set: (value: string) => {
      if (currentMapping.value.type === 'column') {
        // This will be handled by the component when a column is selected
        return
      } else {
        currentMapping.value.source = value
      }
    },
  })

  const isValidMapping = computed(() => {
    if (currentMapping.value.type === 'column') {
      const source = currentMapping.value.source
      return !!(source?.columnName && source?.dataType)
    }

    if (currentMapping.value.type === 'constant' || currentMapping.value.type === 'expression') {
      return !!currentMapping.value.source?.trim()
    }

    return false
  })

  // Methods
  const createValueMappingFromColumn = (
    columnInfo: ColumnInfo,
    targetDataType?: WikibaseDataType,
  ): ValueMapping => {
    const compatibleTypes = getCompatibleWikibaseTypes(columnInfo.dataType)

    let dataType: WikibaseDataType
    if (targetDataType) {
      // If target data type is specified and compatible, use it
      if (compatibleTypes.includes(targetDataType)) {
        dataType = targetDataType
      } else {
        // If not compatible, use first compatible type
        dataType = compatibleTypes[0] || 'string'
      }
    } else {
      // If no target specified, use first compatible type
      dataType = compatibleTypes[0] || 'string'
    }

    return {
      type: 'column',
      source: {
        columnName: columnInfo.name,
        dataType: columnInfo.dataType,
      },
      dataType,
    }
  }

  const createConstantMapping = (value: string, dataType: WikibaseDataType): ValueMapping => {
    return {
      type: 'constant',
      source: value,
      dataType,
    }
  }

  const createExpressionMapping = (
    expression: string,
    dataType: WikibaseDataType,
  ): ValueMapping => {
    return {
      type: 'expression',
      source: expression,
      dataType,
    }
  }

  const updateValueType = (newType: 'column' | 'constant' | 'expression') => {
    const dataType = currentMapping.value.dataType

    if (newType === 'column') {
      currentMapping.value = {
        type: 'column',
        source: { columnName: '', dataType: 'VARCHAR' },
        dataType,
      }
    } else {
      currentMapping.value = {
        type: newType,
        source: '',
        dataType,
      } as ValueMapping
    }
  }

  const updateColumnSource = (columnInfo: ColumnInfo) => {
    if (currentMapping.value.type !== 'column') return

    currentMapping.value.source = {
      columnName: columnInfo.name,
      dataType: columnInfo.dataType,
    }

    // Auto-suggest compatible data type
    const compatibleTypes = getCompatibleWikibaseTypes(columnInfo.dataType)
    if (compatibleTypes.length > 0 && compatibleTypes[0]) {
      currentMapping.value.dataType = compatibleTypes[0]
    }
  }

  const updateDataType = (dataType: WikibaseDataType) => {
    currentMapping.value.dataType = dataType
  }

  const validateMapping = (mapping: ValueMapping): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    // Check source
    if (mapping.type === 'column') {
      const source = mapping.source
      if (!source?.columnName) {
        errors.push('Column name is required')
      }
    } else if (mapping.type === 'constant' || mapping.type === 'expression') {
      if (!mapping.source || mapping.source.trim() === '') {
        errors.push('Value source is required')
      }
    }

    // Check data type compatibility for column mappings
    if (mapping.type === 'column') {
      const source = mapping.source
      if (source?.dataType) {
        const isCompatible = isDataTypeCompatible(source.dataType, [mapping.dataType])
        if (!isCompatible) {
          errors.push(`Column type ${source.dataType} is not compatible with ${mapping.dataType}`)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  const getCompatibleDataTypes = (
    columnType?: string,
  ): { label: string; value: WikibaseDataType }[] => {
    if (!columnType) return wikibaseDataTypes

    const compatible = getCompatibleWikibaseTypes(columnType)
    return wikibaseDataTypes.filter((type) => compatible.includes(type.value))
  }

  const autoSuggestDataType = (
    property: PropertyReference,
    columnInfo?: ColumnInfo,
  ): WikibaseDataType => {
    if (!columnInfo) return property.dataType as WikibaseDataType

    const compatibleTypes = getCompatibleWikibaseTypes(columnInfo.dataType)

    // If property data type is compatible with column, use it
    if (compatibleTypes.includes(property.dataType as WikibaseDataType)) {
      return property.dataType as WikibaseDataType
    }

    // Otherwise, use the first compatible type
    return compatibleTypes[0] || 'string'
  }

  const resetMapping = () => {
    currentMapping.value = {
      type: 'column',
      source: {
        columnName: '',
        dataType: 'VARCHAR',
      },
      dataType: 'string',
    }
  }

  return {
    // State
    currentMapping,

    // Options
    valueTypes,
    wikibaseDataTypes,

    // Computed
    isColumnType,
    isConstantType,
    isExpressionType,
    sourceValue,
    isValidMapping,

    // Methods
    createValueMappingFromColumn,
    createConstantMapping,
    createExpressionMapping,
    updateValueType,
    updateColumnSource,
    updateDataType,
    validateMapping,
    getCompatibleDataTypes,
    autoSuggestDataType,
    resetMapping,
  }
}
