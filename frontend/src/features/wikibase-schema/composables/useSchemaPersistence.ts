import { ref, computed, readonly } from 'vue'

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

export const useSchemaPersistence = () => {
  const schemaStore = useSchemaStore()
  const { updateSchema, createSchema } = useSchemaApi()

  // State
  const isSaving = ref(false)
  const saveStatus = ref<SaveStatus>('idle')
  const saveError = ref<string | Error | null>(null)

  // Computed
  const canSave = computed(() => {
    return schemaStore.canSave && !isSaving.value
  })

  // Actions
  const saveSchema = async () => {
    if (!canSave.value || !schemaStore.projectId) {
      return { success: false, error: 'Cannot save schema - missing project ID' }
    }

    try {
      isSaving.value = true
      saveStatus.value = 'saving'
      saveError.value = null

      let result

      if (schemaStore.schemaId) {
        // Update existing schema
        const schemaData = {
          name: schemaStore.schemaName,
          wikibase: schemaStore.wikibase,
          schema: {
            terms: {
              labels: schemaStore.labels,
              descriptions: schemaStore.descriptions,
              aliases: schemaStore.aliases,
            },
            statements: schemaStore.statements,
          },
        }

        result = await updateSchema(schemaStore.projectId, schemaStore.schemaId, schemaData)
      } else {
        // Create new schema
        result = await createSchema(schemaStore.projectId, {
          name: schemaStore.schemaName,
          wikibase: schemaStore.wikibase,
          schema: {
            terms: {
              labels: schemaStore.labels,
              descriptions: schemaStore.descriptions,
              aliases: schemaStore.aliases,
            },
            statements: schemaStore.statements,
          },
        })
      }

      schemaStore.markAsSaved()
      saveStatus.value = 'success'

      return { success: true, data: result }
    } catch (error) {
      saveStatus.value = 'error'
      saveError.value = error instanceof Error ? error : String(error)
      return { success: false, error: saveError.value }
    } finally {
      isSaving.value = false
    }
  }

  return {
    // State
    isSaving: readonly(isSaving),
    saveStatus: readonly(saveStatus),
    saveError: readonly(saveError),

    // Computed
    canSave,

    // Actions
    saveSchema,
  }
}
