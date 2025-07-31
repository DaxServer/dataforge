import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { useSchemaApi } from '@frontend/composables/useSchemaApi'
import { useSchemaStore } from '@frontend/stores/schema.store'
import type { WikibaseSchemaMapping } from '@frontend/types/wikibase-schema'

// Create mock functions
const mockSchemaPost = mock()
const mockSchemaIdGet = mock()
const mockSchemaIdPut = mock()
const mockSchemaIdDelete = mock()
const mockShowError = mock()

// Mock functions
const mockMarkAsSaved = mock()
const mock$reset = mock()

// Mock the API client structure to match Eden client for Wikibase schemas
const mockSchemasGet = mock()
const mockSchemasFunction = mock(() => ({
  get: mockSchemaIdGet,
  put: mockSchemaIdPut,
  delete: mockSchemaIdDelete,
}))

// Add the HTTP methods directly to the function
Object.assign(mockSchemasFunction, {
  get: mockSchemasGet,
  post: mockSchemaPost,
})

const mockApi = {
  project: mock((params: { projectId: string }) => ({
    schemas: mockSchemasFunction,
  })),
}

// Mock global functions
;(globalThis as any).useApi = () => mockApi
;(globalThis as any).useErrorHandling = () => ({ showError: mockShowError })

// Mock useSchemaStore
;(globalThis as any).useSchemaStore = useSchemaStore

// Store original functions for cleanup
const originalUseApi = (globalThis as any).useApi
const originalUseErrorHandling = (globalThis as any).useErrorHandling
const originalUseSchemaStore = (globalThis as any).useSchemaStore

const mockSchema: WikibaseSchemaMapping = {
  id: 'schema-123',
  projectId: 'project-456',
  name: 'Test Schema',
  wikibase: '',
  item: {
    terms: {
      labels: {
        en: {
          columnName: 'title',
          dataType: 'VARCHAR',
        },
      },
      descriptions: {},
      aliases: {},
    },
    statements: [],
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockCreatedSchema: WikibaseSchemaMapping = {
  ...mockSchema,
  id: 'schema-789',
  name: 'New Schema',
}

const mockUpdatedSchema: WikibaseSchemaMapping = {
  ...mockSchema,
  name: 'Updated Schema',
  updatedAt: '2024-01-02T00:00:00Z',
}

describe('useSchemaApi', () => {
  beforeEach(() => {
    // Create testing pinia with mocked store actions
    setActivePinia(
      createTestingPinia({
        createSpy: mock,
        stubActions: true, // Stub actions since we're testing the composable, not the store
      }),
    )

    // Reset all mocks before each test
    mockSchemaPost.mockClear()
    mockSchemaIdGet.mockClear()
    mockSchemaIdPut.mockClear()
    mockSchemaIdDelete.mockClear()
    mockSchemasGet.mockClear()
    mockApi.project.mockClear()
    mockShowError.mockClear()
    mockMarkAsSaved.mockClear()
    mock$reset.mockClear()
  })

  afterEach(() => {
    // Restore original functions or delete if they didn't exist
    if (originalUseApi) {
      ;(globalThis as any).useApi = originalUseApi
    } else {
      delete (globalThis as any).useApi
    }

    if (originalUseErrorHandling) {
      ;(globalThis as any).useErrorHandling = originalUseErrorHandling
    } else {
      delete (globalThis as any).useErrorHandling
    }

    if (originalUseSchemaStore) {
      ;(globalThis as any).useSchemaStore = originalUseSchemaStore
    } else {
      delete (globalThis as any).useSchemaStore
    }
  })

  describe('loadSchema', () => {
    it('should load a specific schema by ID and update store', async () => {
      mockSchemaIdGet.mockResolvedValueOnce({
        data: { data: mockSchema },
        error: null,
      })

      const { loadSchema } = useSchemaApi()
      const store = useSchemaStore()

      await loadSchema('project-456', 'schema-123')

      expect(mockApi.project).toHaveBeenCalledWith({ projectId: 'project-456' })
      expect(mockSchemaIdGet).toHaveBeenCalledTimes(1)
      expect(store.setLoading).toHaveBeenCalledWith(true)
      expect(store.setLoading).toHaveBeenLastCalledWith(false)
      // Verify store state was updated through the mocked actions
      expect(store.schemaId).toBe(mockSchema.id)
      expect(store.projectId).toBe(mockSchema.projectId)
      expect(store.schemaName).toBe(mockSchema.name)
      expect(store.wikibase).toBe(mockSchema.wikibase)
    })

    it('should handle API errors when loading a schema', async () => {
      mockSchemaIdGet.mockResolvedValueOnce({
        data: null,
        error: { value: 'Schema not found' },
      })

      const { loadSchema } = useSchemaApi()
      const store = useSchemaStore()

      await loadSchema('project-456', 'schema-123')

      expect(mockShowError).toHaveBeenCalledWith('Schema not found')
      expect(store.$reset).toHaveBeenCalled()
      expect(store.setLoading).toHaveBeenCalledWith(true)
      expect(store.setLoading).toHaveBeenLastCalledWith(false)
    })

    it('should handle missing data when loading a schema', async () => {
      mockSchemaIdGet.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const { loadSchema } = useSchemaApi()
      const store = useSchemaStore()

      await loadSchema('project-456', 'schema-123')

      expect(mockShowError).toHaveBeenCalledWith({
        errors: [{ code: 'NOT_FOUND', message: 'Schema not found' }],
      })
      expect(store.$reset).toHaveBeenCalled()
      expect(store.setLoading).toHaveBeenCalledWith(true)
      expect(store.setLoading).toHaveBeenLastCalledWith(false)
    })
  })

  describe('createSchema', () => {
    it('should create a new schema and update state', async () => {
      mockSchemaPost.mockResolvedValueOnce({
        data: { data: mockCreatedSchema },
        error: null,
      })

      const { createSchema } = useSchemaApi()
      const store = useSchemaStore()

      await createSchema('project-456', {
        name: 'New Schema',
        wikibase: 'https://www.wikidata.org',
      })

      expect(mockApi.project).toHaveBeenCalledWith({ projectId: 'project-456' })
      expect(mockSchemaPost).toHaveBeenCalledWith({
        projectId: 'project-456',
        name: 'New Schema',
        wikibase: 'https://www.wikidata.org',
      })
      expect(store.schemaId).toBe(mockCreatedSchema.id)
      expect(store.projectId).toBe(mockCreatedSchema.projectId)
      expect(store.schemaName).toBe(mockCreatedSchema.name)
      expect(store.wikibase).toBe(mockCreatedSchema.wikibase)
      expect(store.setLoading).toHaveBeenCalledWith(true)
      expect(store.setLoading).toHaveBeenLastCalledWith(false)
    })

    it('should handle validation errors when creating a schema', async () => {
      mockSchemaPost.mockResolvedValueOnce({
        data: null,
        error: { value: 'Validation failed' },
      })

      const { createSchema } = useSchemaApi()
      const store = useSchemaStore()

      await createSchema('project-456', {
        name: '',
        wikibase: 'invalid-url',
      })

      expect(mockShowError).toHaveBeenCalledWith('Validation failed')
      expect(store.setLoading).toHaveBeenCalledWith(true)
      expect(store.setLoading).toHaveBeenLastCalledWith(false)
    })
  })

  describe('updateSchema', () => {
    it('should update an existing schema and sync with store', async () => {
      mockSchemaIdPut.mockResolvedValueOnce({
        data: { data: mockUpdatedSchema },
        error: null,
      })

      const { updateSchema } = useSchemaApi()
      const store = useSchemaStore()

      const updatedData = {
        ...mockSchema,
        name: 'Updated Schema',
      }

      await updateSchema('project-456', 'schema-123', updatedData)

      expect(mockApi.project).toHaveBeenCalledWith({ projectId: 'project-456' })
      expect(mockSchemaIdPut).toHaveBeenCalledWith({
        name: updatedData.name,
        wikibase: updatedData.wikibase,
        schema: updatedData.item,
      })
      expect(store.schemaId).toBe(mockUpdatedSchema.id)
      expect(store.projectId).toBe(mockUpdatedSchema.projectId)
      expect(store.schemaName).toBe(mockUpdatedSchema.name)
      expect(store.wikibase).toBe(mockUpdatedSchema.wikibase)
      expect(store.markAsSaved).toHaveBeenCalled()
      expect(store.setLoading).toHaveBeenCalledWith(true)
      expect(store.setLoading).toHaveBeenLastCalledWith(false)
    })

    it('should update schema and call store methods', async () => {
      mockSchemaIdPut.mockResolvedValueOnce({
        data: { data: mockUpdatedSchema },
        error: null,
      })

      const { updateSchema } = useSchemaApi()
      const store = useSchemaStore()

      // Update the schema
      await updateSchema('project-456', 'schema-123', mockSchema)

      expect(store.schemaId).toBe(mockUpdatedSchema.id)
      expect(store.projectId).toBe(mockUpdatedSchema.projectId)
      expect(store.schemaName).toBe(mockUpdatedSchema.name)
      expect(store.wikibase).toBe(mockUpdatedSchema.wikibase)
      expect(store.markAsSaved).toHaveBeenCalled()
      expect(store.setLoading).toHaveBeenCalledWith(true)
      expect(store.setLoading).toHaveBeenLastCalledWith(false)
    })

    it('should handle API errors when updating a schema', async () => {
      mockSchemaIdPut.mockResolvedValueOnce({
        data: null,
        error: { value: 'Update failed' },
      })

      const { updateSchema } = useSchemaApi()
      const store = useSchemaStore()

      await updateSchema('project-456', 'schema-123', mockSchema)

      expect(mockShowError).toHaveBeenCalledWith('Update failed')
      expect(store.setLoading).toHaveBeenCalledWith(true)
      expect(store.setLoading).toHaveBeenLastCalledWith(false)
    })
  })

  describe('loadAllSchemas', () => {
    it('should load all schemas for a project', async () => {
      const mockSchemas = [mockSchema, mockCreatedSchema]
      mockSchemasGet.mockResolvedValueOnce({
        data: { data: mockSchemas },
        error: null,
      })

      const { loadAllSchemas } = useSchemaApi()

      const result = await loadAllSchemas('project-456')

      expect(mockApi.project).toHaveBeenCalledWith({ projectId: 'project-456' })
      expect(mockSchemasGet).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockSchemas)
    })

    it('should handle API errors when loading all schemas', async () => {
      mockSchemasGet.mockResolvedValueOnce({
        data: null,
        error: { value: 'Failed to load schemas' },
      })

      const { loadAllSchemas } = useSchemaApi()

      const result = await loadAllSchemas('project-456')

      expect(mockShowError).toHaveBeenCalledWith('Failed to load schemas')
      expect(result).toEqual([])
    })

    it('should return empty array when no data is returned', async () => {
      mockSchemasGet.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const { loadAllSchemas } = useSchemaApi()

      const result = await loadAllSchemas('project-456')

      expect(result).toEqual([])
    })
  })

  describe('deleteSchema', () => {
    it('should delete a schema and update state', async () => {
      mockSchemaIdDelete.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const { deleteSchema } = useSchemaApi()
      const store = useSchemaStore()

      // Set up the store to have a matching schema ID
      store.schemaId = 'schema-123'

      await deleteSchema('project-456', 'schema-123')

      expect(mockApi.project).toHaveBeenCalledWith({ projectId: 'project-456' })
      expect(mockSchemaIdDelete).toHaveBeenCalledTimes(1)
      expect(store.$reset).toHaveBeenCalled()
      expect(store.setLoading).toHaveBeenCalledWith(true)
      expect(store.setLoading).toHaveBeenLastCalledWith(false)
    })

    it('should handle API errors when deleting a schema', async () => {
      mockSchemaIdDelete.mockResolvedValueOnce({
        data: null,
        error: { value: 'Delete failed' },
      })

      const { deleteSchema } = useSchemaApi()
      const store = useSchemaStore()

      await deleteSchema('project-456', 'schema-123')

      expect(mockShowError).toHaveBeenCalledWith('Delete failed')
      expect(store.setLoading).toHaveBeenCalledWith(true)
      expect(store.setLoading).toHaveBeenLastCalledWith(false)
    })
  })

  describe('Advanced Pinia Testing with createTestingPinia', () => {
    it('should properly mock store actions and verify calls', async () => {
      mockSchemaIdGet.mockResolvedValueOnce({
        data: { data: mockSchema },
        error: null,
      })

      const { loadSchema } = useSchemaApi()
      const store = useSchemaStore()

      await loadSchema('project-456', 'schema-123')

      // Verify that store actions were called with correct parameters
      expect(store.setLoading).toHaveBeenNthCalledWith(1, true)
      expect(store.setLoading).toHaveBeenNthCalledWith(2, false)
      expect(store.setLoading).toHaveBeenCalledTimes(2)
    })

    it('should test composable with mocked store state', async () => {
      const store = useSchemaStore()

      // Set initial store state
      store.schemaId = 'existing-schema'
      store.projectId = 'project-456'

      mockSchemaIdDelete.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const { deleteSchema } = useSchemaApi()

      await deleteSchema('project-456', 'existing-schema')

      // Verify store methods were called
      expect(store.$reset).toHaveBeenCalled()
    })

    it('should demonstrate proper error handling with mocked store', async () => {
      mockSchemaPost.mockResolvedValueOnce({
        data: null,
        error: { value: { errors: [{ code: 'VALIDATION_ERROR', message: 'Invalid data' }] } },
      })

      const { createSchema } = useSchemaApi()
      const store = useSchemaStore()

      await createSchema('project-456', {
        name: '',
        wikibase: 'invalid',
      })

      // Verify error handling and loading state management
      expect(mockShowError).toHaveBeenCalled()
      expect(store.setLoading).toHaveBeenCalledWith(true)
      expect(store.setLoading).toHaveBeenLastCalledWith(false)
    })
  })
})
