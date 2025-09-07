import type { ItemSchema } from '@backend/api/project/project.wikibase'
import { ApiError } from '@backend/types/error-schemas'
import { computed, readonly, ref } from 'vue'

export type SchemaRequest = {
  name: string
  wikibase: string
  schema?: ItemSchema
}

export const useSchemaApi = () => {
  const api = useApi()
  const schemaStore = useSchemaStore()
  const { showError } = useErrorHandling()

  // Persistence state
  const isSaving = ref(false)
  const saveStatus = ref<'idle' | 'saving' | 'success' | 'error'>('idle')
  const saveError = ref<string | Error | null>(null)

  // Computed
  const canSave = computed(() => {
    return schemaStore.canSave && !isSaving.value
  })

  const withLoadingState = async <T>(operation: () => Promise<T>): Promise<T> => {
    schemaStore.setLoading(true)
    try {
      return await operation()
    } finally {
      schemaStore.setLoading(false)
    }
  }

  // Actions
  const loadSchema = async (projectId: UUID, schemaId: UUID) => {
    return withLoadingState(async () => {
      const { data, error: apiError } = await api.project({ projectId }).schemas({ schemaId }).get()

      if (apiError) {
        showError(apiError.value as ApiError)
        schemaStore.$reset()
        return
      }

      if (!data?.data) {
        showError({
          errors: [{ code: 'NOT_FOUND', message: 'Schema not found' }],
        } as ApiError)
        schemaStore.$reset()
        return
      }

      schemaStore.loadSchema(data.data)
    })
  }

  const createSchema = async (projectId: UUID, schemaData: SchemaRequest) => {
    return withLoadingState(async () => {
      const { data, error: apiError } = await api.project({ projectId }).schemas.post({
        projectId,
        name: schemaData.name,
        wikibase: schemaData.wikibase,
        schema: schemaData.schema,
      })

      if (apiError) {
        showError(apiError.value as ApiError)
        return
      }

      // @ts-expect-error Elysia Eden thinks non-200 2xx responses are errors
      if (!data?.data) {
        showError({
          errors: [{ code: 'NOT_FOUND', message: 'Schema not found' }],
        } as ApiError)
        return
      }

      // @ts-expect-error Elysia Eden thinks non-200 2xx responses are errors
      schemaStore.loadSchema(data.data, false)

      // @ts-expect-error Elysia Eden thinks non-200 2xx responses are errors
      return data.data
    })
  }

  const updateSchema = async (projectId: UUID, schemaId: UUID, schemaData: SchemaRequest) => {
    return withLoadingState(async () => {
      const { data, error: apiError } = await api
        .project({ projectId })
        .schemas({ schemaId })
        .put(schemaData)

      if (apiError) {
        showError(apiError.value as ApiError)
        return
      }

      if (!data?.data) {
        showError({
          errors: [{ code: 'NOT_FOUND', message: 'Schema not found' }],
        } as ApiError)
        return
      }

      schemaStore.loadSchema(data.data, false)
      schemaStore.markAsSaved()

      return data.data
    })
  }

  const deleteSchema = async (projectId: UUID, schemaId: UUID) => {
    return withLoadingState(async () => {
      const { error: apiError } = await api.project({ projectId }).schemas({ schemaId }).delete()

      if (apiError) {
        showError(apiError.value as ApiError)
      } else {
        // Clear current schema if it matches the deleted one
        if (schemaStore.schemaId === schemaId) {
          schemaStore.$reset()
        }
      }
    })
  }

  const loadAllSchemas = async (projectId: UUID) => {
    return withLoadingState(async () => {
      const { data, error: apiError } = await api.project({ projectId }).schemas.get()

      if (apiError) {
        showError(apiError.value as ApiError)
        return []
      }

      if (!data?.data) {
        showError({
          errors: [{ code: 'NOT_FOUND', message: 'Schemas not found' }],
        } as ApiError)
        return []
      }

      return data.data.map((schema) => ({
        id: schema.id as UUID,
        projectId: schema.project_id as UUID,
        name: schema.name,
        wikibase: schema.wikibase,
        schema: schema.schema,
        createdAt: schema.created_at,
        updatedAt: schema.updated_at,
      }))
    })
  }

  const saveSchema = async () => {
    if (!canSave.value || !schemaStore.projectId) {
      return { success: false, error: 'Cannot save schema - missing project ID' }
    }

    try {
      isSaving.value = true
      saveStatus.value = 'saving'
      saveError.value = null

      // Transform statements1 object to array format expected by API
      const statements = Object.values(schemaStore.statements1)
        .filter((stmt) => stmt.property && stmt.value)
        .map((stmt) => ({
          id: stmt.id,
          property: stmt.property!,
          value: stmt.value!,
          rank: stmt.rank || 'normal',
          qualifiers: stmt.qualifiers || [],
          references: stmt.references || [],
        }))

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
            statements,
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
            statements,
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
    loadSchema,
    loadAllSchemas,
    createSchema,
    updateSchema,
    deleteSchema,
    saveSchema,
  }
}
