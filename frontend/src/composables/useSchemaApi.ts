import { ApiError } from '@backend/types/error-schemas'
import type { WikibaseSchemaMapping } from '@frontend/types/wikibase-schema'

export interface CreateSchemaRequest {
  name: string
  wikibase: string
}

export const useSchemaApi = () => {
  const api = useApi()
  const schemaStore = useSchemaStore()
  const { showError } = useErrorHandling()

  // Helper function
  const loadSchemaIntoStore = (schema: WikibaseSchemaMapping) => {
    schemaStore.schemaId = schema.id
    schemaStore.projectId = schema.projectId
    schemaStore.schemaName = schema.name
    schemaStore.wikibase = schema.wikibase
    schemaStore.labels = schema.item.terms.labels
    schemaStore.descriptions = schema.item.terms.descriptions
    schemaStore.aliases = schema.item.terms.aliases
    schemaStore.statements = schema.item.statements
    schemaStore.createdAt = schema.createdAt
    schemaStore.updatedAt = schema.updatedAt
    schemaStore.isDirty = false
    schemaStore.lastSaved = new Date(schema.updatedAt)
  }

  // Actions
  const loadSchema = async (projectId: string, schemaId: string) => {
    schemaStore.setLoading(true)

    const { data, error: apiError } = await api.project({ projectId }).schemas({ schemaId }).get()

    if (apiError) {
      showError(apiError.value as ApiError)
      schemaStore.$reset()
    } else if (data && data.data) {
      loadSchemaIntoStore(data.data as WikibaseSchemaMapping)
    } else {
      showError({
        errors: [{ code: 'NOT_FOUND', message: 'Schema not found' }],
      } as ApiError)
      schemaStore.$reset()
    }

    schemaStore.setLoading(false)
  }

  const createSchema = async (projectId: string, schemaData: CreateSchemaRequest) => {
    schemaStore.setLoading(true)

    const { data, error: apiError } = await api.project({ projectId }).schemas.post({
      projectId,
      name: schemaData.name,
      wikibase: schemaData.wikibase,
    })

    schemaStore.setLoading(false)

    if (apiError) {
      showError(apiError.value as ApiError)
    } else {
      loadSchemaIntoStore((data as any).data as WikibaseSchemaMapping)
      return (data as any).data
    }
  }

  const updateSchema = async (
    projectId: string,
    schemaId: string,
    schemaData: WikibaseSchemaMapping,
  ) => {
    schemaStore.setLoading(true)

    const { data, error: apiError } = await api.project({ projectId }).schemas({ schemaId }).put({
      name: schemaData.name,
      wikibase: schemaData.wikibase,
      schema: schemaData.item,
    })

    schemaStore.setLoading(false)

    if (apiError) {
      showError(apiError.value as ApiError)
    } else {
      loadSchemaIntoStore(data.data as WikibaseSchemaMapping)
      schemaStore.markAsSaved()
      return data.data
    }
  }

  const deleteSchema = async (projectId: string, schemaId: string) => {
    schemaStore.setLoading(true)

    const { error: apiError } = await api.project({ projectId }).schemas({ schemaId }).delete()

    if (apiError) {
      showError(apiError.value as ApiError)
    } else {
      // Clear current schema if it matches the deleted one
      if (schemaStore.schemaId === schemaId) {
        schemaStore.$reset()
      }
    }

    schemaStore.setLoading(false)
  }

  const loadAllSchemas = async (projectId: string) => {
    schemaStore.setLoading(true)

    const { data, error: apiError } = await api.project({ projectId }).schemas.get()

    schemaStore.setLoading(false)

    if (apiError) {
      showError(apiError.value as ApiError)
      return []
    }

    return data?.data || []
  }

  return {
    // Actions
    loadSchema,
    loadAllSchemas,
    createSchema,
    updateSchema,
    deleteSchema,
  }
}
