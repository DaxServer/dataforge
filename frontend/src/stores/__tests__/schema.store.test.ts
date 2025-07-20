import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { useSchemaStore } from '@frontend/stores/schema.store'
import type {
  ColumnMapping,
  PropertyReference,
  ValueMapping,
} from '@frontend/types/wikibase-schema'

// Mock the useSchemaBuilder composable
const mockBuildStatement = mock(
  (property: PropertyReference, valueMapping: ValueMapping, rank = 'normal') => ({
    id: 'mock-statement-id',
    property,
    value: valueMapping,
    rank,
  }),
)

const mockParseSchema = mock()

// Mock the module at the module level
mock.module('@frontend/composables/useSchemaBuilder', () => ({
  useSchemaBuilder: () => ({
    buildStatement: mockBuildStatement,
    parseSchema: mockParseSchema,
    buildSchema: mock(),
    buildItemSchema: mock(),
    buildTermsSchema: mock(),
    createEmptySchema: mock(),
  }),
}))

describe('useSchemaStore', () => {
  let store: ReturnType<typeof useSchemaStore>

  beforeEach(() => {
    // Clear all mocks before each test
    mockBuildStatement.mockClear()
    mockParseSchema.mockClear()

    // Create testing pinia with proper configuration
    setActivePinia(
      createTestingPinia({
        createSpy: mock,
        stubActions: false, // We want to test actual store actions
      }),
    )
    store = useSchemaStore()
  })

  describe('store initialization', () => {
    it('should initialize with default empty state', () => {
      expect(store.schemaId).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.isDirty).toBe(false)
      expect(store.lastSaved).toBeNull()
    })

    it('should have individual properties with correct initial values', () => {
      expect(store.schemaId).toBeNull()
      expect(store.projectId).toBe('')
      expect(store.schemaName).toBe('')
      expect(store.wikibase).toBe('')
      expect(store.itemId).toBeNull()
      expect(store.labels).toEqual({})
      expect(store.descriptions).toEqual({})
      expect(store.aliases).toEqual({})
      expect(store.statements).toEqual([])
    })
  })

  describe('schema behavior', () => {
    it('should update schema name even when no schemaId exists', () => {
      // Initially no schema
      expect(store.schemaId).toBeNull()

      // Calling updateSchemaName should work even without schemaId
      store.updateSchemaName('Test Auto Schema')

      // Should still have no schemaId but name should be updated
      expect(store.schemaId).toBeNull()
      expect(store.schemaName).toBe('Test Auto Schema') // Should be updated
      expect(store.isDirty).toBe(true)
    })

    it('should allow all operations without schemaId', () => {
      // Initially no schema
      expect(store.schemaId).toBeNull()

      // All operations should work without schemaId
      const columnMapping: ColumnMapping = {
        columnName: 'test_column',
        dataType: 'VARCHAR',
      }

      store.addLabelMapping('en', columnMapping)
      expect(store.labels.en).toEqual(columnMapping)
      expect(store.isDirty).toBe(true)

      store.addDescriptionMapping('fr', columnMapping)
      expect(store.descriptions.fr).toEqual(columnMapping)

      store.addAliasMapping('de', columnMapping)
      expect(store.aliases.de).toHaveLength(1)
      expect(store.aliases.de?.[0]).toEqual(columnMapping)

      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }

      const statementId = store.addStatement(property, {
        type: 'column',
        source: columnMapping,
        dataType: 'wikibase-item',
      })

      expect(statementId).toBeDefined()
      expect(statementId).not.toBe('')
      expect(store.statements).toHaveLength(1)

      // Verify schemaId is still null
      expect(store.schemaId).toBeNull()
    })
  })

  describe('schema state updates and reactivity', () => {
    it('should update schema name and mark as dirty', () => {
      const newName = 'Updated Schema Name'

      store.updateSchemaName(newName)

      expect(store.schemaName).toBe(newName)
      expect(store.isDirty).toBe(true)
    })

    it('should add label mapping', () => {
      const columnMapping: ColumnMapping = {
        columnName: 'title_column',
        dataType: 'VARCHAR',
      }

      store.addLabelMapping('en', columnMapping)

      expect(store.labels.en).toEqual(columnMapping)
      expect(store.isDirty).toBe(true)
    })

    it('should add description mapping', () => {
      const columnMapping: ColumnMapping = {
        columnName: 'description_column',
        dataType: 'TEXT',
      }

      store.addDescriptionMapping('fr', columnMapping)

      expect(store.descriptions.fr).toEqual(columnMapping)
      expect(store.isDirty).toBe(true)
    })

    it('should add alias mapping (multiple aliases per language)', () => {
      const alias1: ColumnMapping = {
        columnName: 'alias1_column',
        dataType: 'VARCHAR',
      }
      const alias2: ColumnMapping = {
        columnName: 'alias2_column',
        dataType: 'VARCHAR',
      }

      store.addAliasMapping('de', alias1)
      store.addAliasMapping('de', alias2)

      expect(store.aliases.de).toHaveLength(2)
      expect(store.aliases.de?.[0]).toEqual(alias1)
      expect(store.aliases.de?.[1]).toEqual(alias2)
      expect(store.isDirty).toBe(true)
    })

    it('should remove label mapping', () => {
      const columnMapping: ColumnMapping = {
        columnName: 'title_column',
        dataType: 'VARCHAR',
      }

      store.addLabelMapping('en', columnMapping)
      expect(store.labels.en).toBeDefined()

      store.removeLabelMapping('en')

      expect(store.labels.en).toBeUndefined()
      expect(store.isDirty).toBe(true)
    })

    it('should remove description mapping', () => {
      const columnMapping: ColumnMapping = {
        columnName: 'desc_column',
        dataType: 'TEXT',
      }

      store.addDescriptionMapping('es', columnMapping)
      expect(store.descriptions.es).toBeDefined()

      store.removeDescriptionMapping('es')

      expect(store.descriptions.es).toBeUndefined()
      expect(store.isDirty).toBe(true)
    })

    it('should remove specific alias mapping', () => {
      const alias1: ColumnMapping = {
        columnName: 'alias1_column',
        dataType: 'VARCHAR',
      }
      const alias2: ColumnMapping = {
        columnName: 'alias2_column',
        dataType: 'VARCHAR',
      }

      store.addAliasMapping('it', alias1)
      store.addAliasMapping('it', alias2)
      expect(store.aliases.it).toHaveLength(2)

      store.removeAliasMapping('it', alias1)

      expect(store.aliases.it).toHaveLength(1)
      expect(store.aliases.it?.[0]).toEqual(alias2)
      expect(store.isDirty).toBe(true)
    })

    it('should add statement', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const columnMapping: ColumnMapping = {
        columnName: 'type_column',
        dataType: 'VARCHAR',
      }

      const statementId = store.addStatement(property, {
        type: 'column',
        source: columnMapping,
        dataType: 'wikibase-item',
      })

      expect(store.statements).toHaveLength(1)
      expect(store.statements[0]?.id).toBe(statementId)
      expect(store.statements[0]?.property).toEqual(property)
      expect(store.isDirty).toBe(true)
    })

    it('should remove statement', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const columnMapping: ColumnMapping = {
        columnName: 'type_column',
        dataType: 'VARCHAR',
      }

      const statementId = store.addStatement(property, {
        type: 'column',
        source: columnMapping,
        dataType: 'wikibase-item',
      })

      expect(store.statements).toHaveLength(1)

      store.removeStatement(statementId)

      expect(store.statements).toHaveLength(0)
      expect(store.isDirty).toBe(true)
    })

    it('should update statement rank', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const columnMapping: ColumnMapping = {
        columnName: 'type_column',
        dataType: 'VARCHAR',
      }

      const statementId = store.addStatement(property, {
        type: 'column',
        source: columnMapping,
        dataType: 'wikibase-item',
      })

      store.updateStatementRank(statementId, 'preferred')

      const statement = store.statements.find((s) => s.id === statementId)
      expect(statement?.rank).toBe('preferred')
      expect(store.isDirty).toBe(true)
    })
  })

  describe('schema persistence state', () => {
    it('should mark schema as saved and update lastSaved timestamp', () => {
      // First make the store dirty
      store.updateSchemaName('Test Schema')
      expect(store.isDirty).toBe(true)
      expect(store.lastSaved).toBeNull()

      store.markAsSaved()

      expect(store.isDirty).toBe(false)
      expect(store.lastSaved).not.toBeNull()
      expect(store.lastSaved).toBeInstanceOf(Date)
    })

    it('should clear schema and reset state', () => {
      store.addLabelMapping('en', { columnName: 'test', dataType: 'VARCHAR' })
      expect(store.schemaId).toBeNull() // schemaId starts as null
      expect(store.isDirty).toBe(true)

      store.$reset()

      expect(store.schemaId).toBeNull()
      expect(store.isDirty).toBe(false)
      expect(store.lastSaved).toBeNull()
    })

    it('should track loading state', () => {
      expect(store.isLoading).toBe(false)

      store.setLoading(true)
      expect(store.isLoading).toBe(true)

      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('mocked dependencies', () => {
    it('should properly mock buildStatement', () => {
      const property: PropertyReference = {
        id: 'P1',
        label: 'Test Property',
        dataType: 'wikibase-item',
      }
      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'test_column', dataType: 'wikibase-item' },
        dataType: 'wikibase-item',
      }

      const statementId = store.addStatement(property, valueMapping)

      expect(mockBuildStatement).toHaveBeenCalledWith(property, valueMapping, 'normal')
      expect(statementId).toBe('mock-statement-id')
      expect(store.statements).toHaveLength(1)
      expect(store.isDirty).toBe(true)
    })
  })
})
