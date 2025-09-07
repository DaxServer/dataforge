import { useSchemaSelection } from '@frontend/features/wikibase-schema/composables/useSchemaSelection'
import { useSchemaStore } from '@frontend/features/wikibase-schema/stores/schema.store'
import { createTestingPinia } from '@pinia/testing'
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { UUID } from 'crypto'
import { setActivePinia } from 'pinia'
import { ref } from 'vue'

// Test UUIDs for consistent testing
const TEST_PROJECT_ID = Bun.randomUUIDv7() as UUID

// Mock external dependencies only
const mockLoadSchema = mock()
const mockShowError = mock()

// Set up minimal global mocks
;(globalThis as any).useSchemaApi = () => ({
  loadSchema: mockLoadSchema,
})
;(globalThis as any).useErrorHandling = () => ({
  showError: mockShowError,
})
;(globalThis as any).useRouteParams = () => ref(TEST_PROJECT_ID)

// Make useSchemaStore available globally for the composable
;(globalThis as any).useSchemaStore = useSchemaStore

describe('useSchemaSelection', () => {
  beforeEach(() => {
    setActivePinia(
      createTestingPinia({
        createSpy: mock,
        stubActions: false,
      }),
    )

    mockLoadSchema.mockClear()
    mockShowError.mockClear()
  })

  it('should be importable and callable', async () => {
    expect(() => {
      const result = useSchemaSelection()
      expect(result).toBeDefined()
      expect(result.showSchemaSelector).toBeDefined()
      expect(result.showMainEditor).toBeDefined()
      expect(result.selectedSchema).toBeDefined()
      expect(result.isLoadingSchema).toBeDefined()
      expect(result.selectSchema).toBeDefined()
      expect(result.createNewSchema).toBeDefined()
      expect(result.backToSelector).toBeDefined()
    }).not.toThrow()
  })

  it('should have correct initial state', async () => {
    const { showSchemaSelector, showMainEditor, selectedSchema, isLoadingSchema } =
      useSchemaSelection()

    expect(showSchemaSelector.value).toBe(true)
    expect(showMainEditor.value).toBe(false)
    expect(selectedSchema.value).toBeNull()
    expect(isLoadingSchema.value).toBe(false)
  })

  it('should transition views when creating new schema', async () => {
    const { createNewSchema, showSchemaSelector, showMainEditor } = useSchemaSelection()

    createNewSchema()

    expect(showSchemaSelector.value).toBe(false)
    expect(showMainEditor.value).toBe(true)
  })

  it('should transition back to selector', async () => {
    const { createNewSchema, backToSelector, showSchemaSelector, showMainEditor } =
      useSchemaSelection()

    // First go to main editor
    createNewSchema()
    expect(showMainEditor.value).toBe(true)

    // Then go back to selector
    backToSelector()
    expect(showSchemaSelector.value).toBe(true)
    expect(showMainEditor.value).toBe(false)
  })
})
