import { ApiError } from '@backend/types/error-schemas'
import type { WikibaseSchemaMapping } from '@frontend/types/wikibase-schema'
import { useSchemaBuilder } from '@frontend/composables/useSchemaBuilder'

export interface CreateSchemaRequest {
  name: string
  wikibase: string
}

export const useSchemaApi = () => {
  const api = useApi()
  const schemaStore = useSchemaStore()
  const { showError } = useErrorHandling()
  const { parseSchema } = useSchemaBuilder()

  // Helper function
  const loadSchemaIntoStore = (schema: WikibaseSchemaMapping) => {
    const parsedSchema = parseSchema(schema)

    schemaStore.schemaId = parsedSchema.id
    schemaStore.projectId = parsedSchema.projectId
    schemaStore.schemaName = parsedSchema.name
    schemaStore.wikibase = parsedSchema.wikibase
    schemaStore.labels = parsedSchema.labels
    schemaStore.descriptions = parsedSchema.descriptions
    schemaStore.aliases = parsedSchema.aliases
    schemaStore.statements = parsedSchema.statements
    schemaStore.createdAt = parsedSchema.createdAt
    schemaStore.updatedAt = parsedSchema.updatedAt
    schemaStore.isDirty = false
    schemaStore.lastSaved = new Date(parsedSchema.updatedAt)
  }

  // Actions
  const loadSchema = async (projectId: string, schemaId: string) => {
    schemaStore.setLoading(true)

    const { data, error: apiError } = await api.project({ projectId }).schemas({ schemaId }).get()

    if (apiError) {
      showError(apiError.value as ApiError)
      schemaStore.$reset()
    } else if (data && (data as any).data) {
      loadSchemaIntoStore((data as any).data)
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
      loadSchemaIntoStore((data as any).data)
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
      loadSchemaIntoStore((data as any).data)
      schemaStore.markAsSaved()
      return (data as any).data
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

    if (!data || !data.data) {
      return []
    }

    return (data as any).data
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
