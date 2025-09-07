import type {
  PropertyReference,
  StatementRank,
  ValueMapping,
  WikibaseDataType,
} from '@backend/api/project/project.wikibase'
import { useDataTypeCompatibility } from '@frontend/features/data-processing/composables/useDataTypeCompatibility'
import type { ColumnInfo } from '@frontend/shared/types/wikibase-schema'
import { computed, ref } from 'vue'

/**
 * Composable for managing statement editor state and logic
 */
export const useStatementEditor = () => {
  const { isDataTypeCompatible, getCompatibleWikibaseTypes } = useDataTypeCompatibility()

  // Default statement structure
  const createDefaultStatement = (): {
    property: PropertyReference | null
    value: ValueMapping
    rank: StatementRank
  } => ({
    property: null,
    value: {
      type: 'column',
      source: {
        columnName: '',
        dataType: 'VARCHAR',
      },
      dataType: 'string',
    } as ValueMapping,
    rank: 'normal',
  })

  // Local statement state
  const localStatement = ref(createDefaultStatement())

  // Available columns (should be set externally)
  const availableColumns = ref<ColumnInfo[]>([])

  // Configuration options
  const valueTypeOptions = [
    { label: 'Column', value: 'column', icon: 'pi pi-database' },
    { label: 'Constant', value: 'constant', icon: 'pi pi-lock' },
    { label: 'Expression', value: 'expression', icon: 'pi pi-code' },
  ]

  const rankOptions = [
    { label: 'Preferred', value: 'preferred', severity: 'success', icon: 'pi pi-star-fill' },
    { label: 'Normal', value: 'normal', severity: 'secondary', icon: 'pi pi-circle' },
    {
      label: 'Deprecated',
      value: 'deprecated',
      severity: 'warn',
      icon: 'pi pi-exclamation-triangle',
    },
  ]

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

  // Computed properties for value type detection
  const isColumnType = computed(() => localStatement.value.value.type === 'column')
  const isConstantType = computed(() => localStatement.value.value.type === 'constant')
  const isExpressionType = computed(() => localStatement.value.value.type === 'expression')

  // UI labels and placeholders
  const sourceLabel = computed(() => {
    switch (localStatement.value.value.type) {
      case 'column':
        return 'Column'
      case 'constant':
        return 'Constant Value'
      case 'expression':
        return 'Expression'
      default:
        return 'Source'
    }
  })

  const sourcePlaceholder = computed(() => {
    switch (localStatement.value.value.type) {
      case 'column':
        return 'Select a column...'
      case 'constant':
        return 'Enter constant value...'
      case 'expression':
        return 'Enter expression...'
      default:
        return 'Enter value...'
    }
  })

  // Source value management (for non-column types only)
  const sourceValue = computed({
    get: () => {
      if (localStatement.value.value.type === 'column') {
        return localStatement.value.value.source.columnName || ''
      }
      return localStatement.value.value.source || ''
    },
    set: (value: string) => {
      if (localStatement.value.value.type !== 'column') {
        // Create a new value mapping with the correct type
        localStatement.value.value = {
          type: localStatement.value.value.type,
          source: value,
          dataType: localStatement.value.value.dataType,
        }
      }
    },
  })

  // Validation
  const isValidStatement = computed(() => {
    const hasProperty = !!localStatement.value.property?.id
    let hasSource = false

    if (localStatement.value.value.type === 'column') {
      hasSource = !!localStatement.value.value.source.columnName
    } else {
      hasSource = !!localStatement.value.value.source.trim()
    }

    return hasProperty && hasSource
  })

  // Data type compatibility
  const compatibleDataTypes = computed(() => {
    if (localStatement.value.value.type !== 'column') return wikibaseDataTypes

    const source = localStatement.value.value.source
    if (!source.dataType) return wikibaseDataTypes

    const compatible = getCompatibleWikibaseTypes(source.dataType)
    return wikibaseDataTypes.filter((type) => compatible.includes(type.value))
  })

  const dataTypeValidationMessage = computed(() => {
    if (localStatement.value.value.type !== 'column') return null

    const source = localStatement.value.value.source
    if (!source.dataType) return null

    const isCompatible = isDataTypeCompatible(source.dataType, [
      localStatement.value.value.dataType,
    ])
    if (!isCompatible) {
      return `Column type ${source.dataType} is not compatible with ${localStatement.value.value.dataType}`
    }

    return null
  })

  // Event handlers
  const handlePropertyUpdate = (property: PropertyReference | null) => {
    localStatement.value.property = property

    // Auto-suggest data type based on property
    if (property?.dataType) {
      localStatement.value.value.dataType = property.dataType as WikibaseDataType
    }
  }

  const handleValueTypeChange = (newType: 'column' | 'constant' | 'expression') => {
    const currentDataType = localStatement.value.value.dataType

    if (newType === 'column') {
      localStatement.value.value = {
        type: 'column',
        source: { columnName: '', dataType: 'VARCHAR' },
        dataType: currentDataType,
      }
    } else {
      localStatement.value.value = {
        type: newType,
        source: '',
        dataType: currentDataType,
      }
    }
  }

  const handleRankChange = (newRank: StatementRank) => {
    localStatement.value.rank = newRank
  }

  const handleColumnDrop = (columnInfo: ColumnInfo) => {
    // Auto-suggest compatible data type
    const compatibleTypes = getCompatibleWikibaseTypes(columnInfo.dataType)
    const suggestedDataType: WikibaseDataType =
      compatibleTypes[0] ?? (localStatement.value.value.dataType || 'string')

    // Set to column type and map the column
    localStatement.value.value = {
      type: 'column',
      source: {
        columnName: columnInfo.name,
        dataType: columnInfo.dataType,
      },
      dataType: suggestedDataType,
    }
  }

  // Update statement from external changes
  const updateStatement = (newStatement: {
    property: PropertyReference | null
    value: ValueMapping
    rank: StatementRank
  }) => {
    localStatement.value = {
      property: newStatement.property,
      value: { ...newStatement.value },
      rank: newStatement.rank,
    }
  }

  // Reset to default state
  const resetStatement = () => {
    localStatement.value = createDefaultStatement()
  }

  // Get current statement value
  const getStatement = () => {
    return { ...localStatement.value }
  }

  // Set available columns (called from parent component)
  const setAvailableColumns = (columns: ColumnInfo[]) => {
    availableColumns.value = columns
  }

  // Initialize statement with external data (called from parent component)
  const initializeStatement = (statement: {
    property: PropertyReference | null
    value: ValueMapping
    rank: StatementRank
  }) => {
    localStatement.value = {
      property: statement.property,
      value: { ...statement.value },
      rank: statement.rank,
    }
  }

  return {
    // State
    localStatement,

    // Configuration options
    valueTypeOptions,
    rankOptions,
    wikibaseDataTypes,

    // Computed properties
    isColumnType,
    isConstantType,
    isExpressionType,
    sourceLabel,
    sourcePlaceholder,
    sourceValue,
    isValidStatement,
    compatibleDataTypes,
    dataTypeValidationMessage,

    // Methods
    handlePropertyUpdate,
    handleValueTypeChange,
    handleRankChange,
    handleColumnDrop,
    updateStatement,
    resetStatement,
    getStatement,
    setAvailableColumns,
    initializeStatement,
  }
}
