import type {
  PropertyReference,
  StatementRank,
  ValueMapping,
  WikibaseDataType,
} from '@backend/api/project/project.wikibase'
import { useSchemaStore } from '@frontend/features/wikibase-schema/stores/schema.store'
import { computed, ref, watch } from 'vue'

const createDefaultStatement = () => ({
  property: null as PropertyReference | null,
  value: {
    type: 'column' as const,
    source: { columnName: '', dataType: 'VARCHAR' },
    dataType: 'string' as WikibaseDataType,
  } as ValueMapping,
  rank: 'normal' as StatementRank,
})

export const useStatementConfig = () => {
  const schemaStore = useSchemaStore()

  // Current statement being edited
  const currentStatement = ref(createDefaultStatement())

  // Available options
  const valueTypes = [
    { label: 'Column', value: 'column' },
    { label: 'Constant', value: 'constant' },
    { label: 'Expression', value: 'expression' },
  ]

  const dataTypes = [
    { label: 'String', value: 'string' },
    { label: 'Number', value: 'number' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Date', value: 'date' },
    { label: 'URL', value: 'url' },
    { label: 'Item', value: 'wikibase-item' },
    { label: 'Property', value: 'wikibase-property' },
  ]

  const rankOptions = [
    { label: 'Preferred', value: 'preferred' },
    { label: 'Normal', value: 'normal' },
    { label: 'Deprecated', value: 'deprecated' },
  ]

  // Computed properties for UI labels
  const sourceLabel = computed(() => {
    switch (currentStatement.value.value.type) {
      case 'column':
        return 'Column Name'
      case 'constant':
        return 'Constant Value'
      case 'expression':
        return 'Expression'
      default:
        return 'Source'
    }
  })

  const sourcePlaceholder = computed(() => {
    switch (currentStatement.value.value.type) {
      case 'column':
        return 'column_name'
      case 'constant':
        return 'constant value'
      case 'expression':
        return 'expression'
      default:
        return 'Enter value'
    }
  })

  const sourceValue = computed({
    get: () => {
      return typeof currentStatement.value.value.source === 'string'
        ? currentStatement.value.value.source
        : ''
    },
    set: (value: string) => {
      currentStatement.value.value.source = value
    },
  })

  // Auto-save to store when statement is complete
  const canSaveStatement = computed(() => {
    const hasSource =
      typeof currentStatement.value.value.source === 'string'
        ? currentStatement.value.value.source.trim() !== ''
        : false

    return !!(
      currentStatement.value.property &&
      currentStatement.value.property.id &&
      hasSource &&
      currentStatement.value.property.id.startsWith('P')
    )
  })

  // Watch for changes and auto-save when statement is complete
  watch(
    () => [
      currentStatement.value.property,
      currentStatement.value.value,
      currentStatement.value.rank,
    ],
    () => {
      if (canSaveStatement.value) {
        saveCurrentStatement()
      }
    },
    { deep: true },
  )

  const saveCurrentStatement = () => {
    if (!canSaveStatement.value || !currentStatement.value.property) return

    const type = currentStatement.value.value.type
    const source = currentStatement.value.value.source
    const dataType = currentStatement.value.value.dataType

    let valueMapping: ValueMapping
    if (type === 'column') {
      valueMapping = {
        type,
        source: typeof source === 'string' ? { columnName: source, dataType: 'VARCHAR' } : source,
        dataType,
      }
    } else {
      valueMapping = {
        type,
        source,
        dataType,
      } as ValueMapping
    }

    schemaStore.addStatement(
      currentStatement.value.property,
      valueMapping,
      currentStatement.value.rank,
    )
  }

  const resetStatement = () => {
    currentStatement.value = createDefaultStatement()
  }

  return {
    // State
    currentStatement,

    // Options
    valueTypes,
    dataTypes,
    rankOptions,

    // Computed
    canSaveStatement,
    sourceLabel,
    sourcePlaceholder,
    sourceValue,

    // Methods
    resetStatement,
    saveCurrentStatement,
  }
}
