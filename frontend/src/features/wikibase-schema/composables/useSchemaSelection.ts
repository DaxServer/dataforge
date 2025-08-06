import { ref, computed, readonly } from 'vue'
import type { WikibaseSchemaMapping } from '@frontend/shared/types/wikibase-schema'
import type { UUID } from 'crypto'
import { createFrontendError } from '@frontend/shared/types/client-errors'

/**
 * Composable for managing schema selection workflow
 * Handles the transition between schema selector and main editor
 */
export const useSchemaSelection = () => {
  // Dependencies
  const { loadSchema } = useSchemaApi()
  const { showError } = useErrorHandling()
  const schemaStore = useSchemaStore()
  const projectId = useRouteParams('id') as Ref<UUID>

  // State
  const selectedSchema = ref<WikibaseSchemaMapping | null>(null)
  const isLoadingSchema = ref(false)
  const currentView = ref<'selector' | 'editor'>('selector')

  // Computed properties
  const showSchemaSelector = computed(() => currentView.value === 'selector')
  const showMainEditor = computed(() => currentView.value === 'editor')

  // Actions
  const selectSchema = async (schema: WikibaseSchemaMapping) => {
    isLoadingSchema.value = true

    try {
      // Load the selected schema into the store
      await loadSchema(projectId.value, schema.id)

      // Set the selected schema reference
      selectedSchema.value = schema

      // Transition to main editor
      currentView.value = 'editor'
    } catch {
      // Handle loading errors
      showError(createFrontendError('SCHEMA_SELECTION_FAILED', 'Failed to load selected schema'))

      // Stay on selector view if loading fails
      selectedSchema.value = null
    } finally {
      isLoadingSchema.value = false
    }
  }

  const createNewSchema = () => {
    // Initialize empty schema in store
    schemaStore.projectId = projectId.value
    schemaStore.schemaName = 'Untitled Schema'
    schemaStore.wikibase = 'https://www.wikidata.org'
    schemaStore.schemaId = null
    schemaStore.itemId = null

    // Clear selected schema reference
    selectedSchema.value = null

    // Transition to main editor
    currentView.value = 'editor'

    // Don't mark as dirty - only when user makes actual changes
  }

  const backToSelector = () => {
    // Reset store state
    schemaStore.$reset()

    // Clear selected schema
    selectedSchema.value = null

    // Transition back to selector
    currentView.value = 'selector'
  }

  return {
    // State
    selectedSchema: readonly(selectedSchema),
    isLoadingSchema: readonly(isLoadingSchema),

    // Computed
    showSchemaSelector,
    showMainEditor,

    // Actions
    selectSchema,
    createNewSchema,
    backToSelector,
  }
}
