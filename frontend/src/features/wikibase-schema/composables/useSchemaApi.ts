import type { ItemSchema, WikibaseSchemaResponse } from '@backend/api/project/project.wikibase'
import { ApiError } from '@backend/types/error-schemas'

export type SchemaRequest = {
  name: string
  wikibase: string
  schema?: ItemSchema
}

export const useSchemaApi = () => {
  const api = useApi()
  const schemaStore = useSchemaStore()
  const { showError } = useErrorHandling()

  const loadSchemaIntoStore = (response: WikibaseSchemaResponse, metadata: boolean = true) => {
    schemaStore.schemaId = response.id as UUID
    schemaStore.projectId = response.project_id as UUID
    schemaStore.schemaName = response.name
    schemaStore.wikibase = response.wikibase
    schemaStore.createdAt = response.created_at
    schemaStore.updatedAt = response.updated_at

    if (metadata) {
      schemaStore.labels = response.schema.terms?.labels || {}
      schemaStore.descriptions = response.schema.terms?.descriptions || {}
      schemaStore.aliases = response.schema.terms?.aliases || {}
      schemaStore.statements = response.schema.statements || []
      schemaStore.isDirty = false
      schemaStore.lastSaved = new Date(response.updated_at)
    }
  }

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

      loadSchemaIntoStore(data.data)
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
      loadSchemaIntoStore(data.data, false)

      // @ts-expect-error Elysia Eden thinks non-200 2xx responses are errors
      return data.data
    })
  }

  const updateSchema = async (projectId: UUID, schemaId: UUID, schemaData: SchemaRequest) => {
    return withLoadingState(async () => {
      const { data, error: apiError } = await api.project({ projectId }).schemas({ schemaId }).put({
        name: schemaData.name,
        wikibase: schemaData.wikibase,
        schema: schemaData.schema,
      })

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

      loadSchemaIntoStore(data.data, false)
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

      return data.data
    })
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
