import { ApiError } from '@backend/types/error-schemas'
import type { WikibaseSchemaMapping } from '@frontend/shared/types/wikibase-schema'

export interface CreateSchemaRequest {
  name: string
  wikibase: string
}

export const useSchemaApi = () => {
  const api = useApi()
  const schemaStore = useSchemaStore()
  const { showError } = useErrorHandling()

  // Helper functions
  const transformBackendSchema = (
    rawSchema: Record<string, unknown>,
    projectId: UUID,
  ): WikibaseSchemaMapping => {
    return {
      id: rawSchema.id as UUID,
      projectId: (rawSchema.project_id as UUID) || projectId,
      name: rawSchema.name as string,
      wikibase: rawSchema.wikibase as string,
      createdAt: rawSchema.created_at as string,
      updatedAt: rawSchema.updated_at as string,
      item: (rawSchema.schema || {
        terms: { labels: {}, descriptions: {}, aliases: {} },
        statements: [],
      }) as ItemSchemaMapping,
    }
  }

  const loadSchemaIntoStore = (schema: WikibaseSchemaMapping) => {
    schemaStore.schemaId = schema.id
    schemaStore.projectId = schema.projectId
    schemaStore.schemaName = schema.name
    schemaStore.wikibase = schema.wikibase
    schemaStore.labels = schema.item?.terms?.labels || {}
    schemaStore.descriptions = schema.item?.terms?.descriptions || {}
    schemaStore.aliases = schema.item?.terms?.aliases || {}
    schemaStore.statements = schema.item?.statements || []
    schemaStore.createdAt = schema.createdAt
    schemaStore.updatedAt = schema.updatedAt
    schemaStore.isDirty = false
    schemaStore.lastSaved = new Date(schema.updatedAt)
  }

  const updateStoreFromSchema = (schema: WikibaseSchemaMapping) => {
    schemaStore.schemaId = schema.id
    schemaStore.projectId = schema.projectId
    schemaStore.schemaName = schema.name
    schemaStore.wikibase = schema.wikibase
    schemaStore.createdAt = schema.createdAt
    schemaStore.updatedAt = schema.updatedAt
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
      } else if (data?.data) {
        const schema = transformBackendSchema(data.data, projectId)
        loadSchemaIntoStore(schema)
      } else {
        showError({
          errors: [{ code: 'NOT_FOUND', message: 'Schema not found' }],
        } as ApiError)
        schemaStore.$reset()
      }
    })
  }

  const createSchema = async (projectId: UUID, schemaData: CreateSchemaRequest) => {
    return withLoadingState(async () => {
      const { data, error: apiError } = await api.project({ projectId }).schemas.post({
        projectId,
        name: schemaData.name,
        wikibase: schemaData.wikibase,
      })

      if (apiError) {
        showError(apiError.value as ApiError)
      } else if (data && typeof data === 'object' && 'data' in data) {
        const rawSchema = (data as { data: Record<string, unknown> }).data
        const createdSchema = transformBackendSchema(rawSchema, projectId)
        updateStoreFromSchema(createdSchema)
        return createdSchema
      }
    })
  }

  const updateSchema = async (
    projectId: UUID,
    schemaId: UUID,
    schemaData: WikibaseSchemaMapping,
  ) => {
    return withLoadingState(async () => {
      const { data, error: apiError } = await api.project({ projectId }).schemas({ schemaId }).put({
        name: schemaData.name,
        wikibase: schemaData.wikibase,
        schema: schemaData.item,
      })

      if (apiError) {
        showError(apiError.value as ApiError)
      } else if (data?.data) {
        const rawSchema = (data as { data: Record<string, unknown> }).data
        const updatedSchema = transformBackendSchema(rawSchema, projectId)
        updateStoreFromSchema(updatedSchema)
        schemaStore.markAsSaved()
        return updatedSchema
      }
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

      const schemas = (data?.data || []).map((backendSchema) =>
        transformBackendSchema(backendSchema, projectId),
      )

      return schemas
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
