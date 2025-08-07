import { ref, computed } from 'vue'
import type { ColumnMapping } from '@backend/api/project/project.wikibase'
import { useSchemaStore } from '@frontend/features/wikibase-schema/stores/schema.store'

/**
 * Composable for handling language drop zone functionality
 */
export const useLanguageDropZone = () => {
  const schemaStore = useSchemaStore()

  // Configuration state
  const termType = ref<'label' | 'description' | 'alias'>('label')

  // Reactive state
  const selectedLanguage = ref('en')

  // Check if there are any existing mappings using computed
  const hasExistingMappings = computed(() => {
    const storeProperty =
      termType.value === 'label'
        ? schemaStore.labels
        : termType.value === 'description'
          ? schemaStore.descriptions
          : schemaStore.aliases

    // Check if any property exists in the object
    for (const key in storeProperty) {
      if (storeProperty[key]) {
        return true
      }
    }
    return false
  })

  // Transform mappings into display format using computed
  const mappingDisplayData = computed(() => {
    const storeProperty =
      termType.value === 'label'
        ? schemaStore.labels
        : termType.value === 'description'
          ? schemaStore.descriptions
          : schemaStore.aliases

    const items: Array<{
      languageCode: string
      mappings: ColumnMapping[]
      isArray: boolean
    }> = []

    // Iterate through all properties in the mappings object
    for (const languageCode in storeProperty) {
      const mapping = storeProperty[languageCode]
      if (mapping) {
        if (termType.value === 'alias') {
          items.push({
            languageCode,
            mappings: mapping as ColumnMapping[],
            isArray: true,
          })
        } else {
          items.push({
            languageCode,
            mappings: [mapping as ColumnMapping],
            isArray: false,
          })
        }
      }
    }

    return items
  })

  // Remove mapping actions - direct store calls
  const removeMapping = (languageCode: string, mapping?: ColumnMapping) => {
    if (termType.value === 'label') {
      schemaStore.removeLabelMapping(languageCode)
    } else if (termType.value === 'description') {
      schemaStore.removeDescriptionMapping(languageCode)
    } else if (termType.value === 'alias' && mapping) {
      schemaStore.removeAliasMapping(languageCode, mapping)
    }
  }

  // Configuration methods
  const setTermType = (newTermType: 'label' | 'description' | 'alias') => {
    termType.value = newTermType
  }

  return {
    // Configuration state
    termType,

    // Reactive state
    selectedLanguage,
    hasExistingMappings,
    mappingDisplayData,

    // Actions
    removeMapping,

    // Configuration methods
    setTermType,
  }
}
