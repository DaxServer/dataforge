import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { useSchemaStore } from '@frontend/stores/schema.store'
import type {
  ColumnMapping,
  PropertyReference,
  ValueMapping,
} from '@frontend/types/wikibase-schema'
import type { UUID } from 'crypto'

// Test UUID for consistent testing
const TEST_STATEMENT_ID: UUID = Bun.randomUUIDv7() as UUID

// Mock the useSchemaBuilder composable
const mockBuildStatement = mock(
  (property: PropertyReference, valueMapping: ValueMapping, rank = 'normal') => ({
    id: TEST_STATEMENT_ID,
    property,
    value: valueMapping,
    rank,
  }),
)

const mockParseSchema = mock()

// Mock the module at the module level
await mock.module('@frontend/composables/useSchemaBuilder', () => ({
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
    store.$reset()
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
      expect(store.projectId).toBeNull()
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

    it('should track configuration state changes', () => {
      // Add configuration
      store.addLabelMapping('en', { columnName: 'title', dataType: 'VARCHAR' })
      expect(store.labels).toHaveProperty('en')
    })

    it('should react to store state changes', () => {
      // Test reactive behavior with store updates
      expect(store.labels).toEqual({})
      expect(store.descriptions).toEqual({})
      expect(store.statements).toHaveLength(0)

      // Add configuration and verify store updates
      store.addLabelMapping('en', { columnName: 'title', dataType: 'VARCHAR' })
      expect(Object.keys(store.labels)).toHaveLength(1)
      expect(store.labels.en?.columnName).toBe('title')

      store.addDescriptionMapping('fr', { columnName: 'desc', dataType: 'TEXT' })
      expect(Object.keys(store.descriptions)).toHaveLength(1)
      expect(store.descriptions.fr?.columnName).toBe('desc')

      store.addStatement(
        { id: 'P31', label: 'instance of', dataType: 'wikibase-item' },
        {
          type: 'column',
          source: { columnName: 'type', dataType: 'VARCHAR' },
          dataType: 'wikibase-item',
        },
      )
      expect(store.statements).toHaveLength(1)
      expect(store.statements[0]?.property.id).toBe('P31')
    })

    it('should handle store reset correctly', () => {
      // Add some configuration
      store.addLabelMapping('en', { columnName: 'title', dataType: 'VARCHAR' })
      store.addStatement(
        { id: 'P31', label: 'instance of', dataType: 'wikibase-item' },
        {
          type: 'column',
          source: { columnName: 'type', dataType: 'VARCHAR' },
          dataType: 'wikibase-item',
        },
      )

      expect(Object.keys(store.labels)).toHaveLength(1)
      expect(store.statements).toHaveLength(1)

      // Reset store
      store.$reset()

      expect(store.labels).toEqual({})
      expect(store.descriptions).toEqual({})
      expect(store.aliases).toEqual({})
      expect(store.statements).toHaveLength(0)
      expect(store.itemId).toBeNull()
    })

    it('should format statements display text correctly', () => {
      store.addStatement(
        { id: 'P31', label: 'instance of', dataType: 'wikibase-item' },
        {
          type: 'column',
          source: { columnName: 'type_col', dataType: 'VARCHAR' },
          dataType: 'wikibase-item',
        },
      )

      const statement = store.statements[0]
      expect(statement).toBeDefined()
      expect(statement?.property.id).toBe('P31')
      expect(statement?.property.label).toBe('instance of')
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

    it('should store statement rank correctly', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'type_column', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }

      store.addStatement(property, valueMapping, 'normal')

      expect(store.statements[0]?.rank).toBe('normal')
    })

    it('should add multiple statements', () => {
      const property1: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const property2: PropertyReference = {
        id: 'P569',
        label: 'date of birth',
        dataType: 'time',
      }
      const valueMapping1: ValueMapping = {
        type: 'column',
        source: { columnName: 'type_column', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }
      const valueMapping2: ValueMapping = {
        type: 'column',
        source: { columnName: 'birth_date', dataType: 'DATE' },
        dataType: 'time',
      }

      store.addStatement(property1, valueMapping1, 'preferred')
      store.addStatement(property2, valueMapping2, 'normal')

      expect(store.statements).toHaveLength(2)
    })

    it('should maintain statement order when adding multiple statements', () => {
      const property1: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const property2: PropertyReference = {
        id: 'P569',
        label: 'date of birth',
        dataType: 'time',
      }
      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'test_column', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }

      const id1 = store.addStatement(property1, valueMapping)
      const id2 = store.addStatement(property2, { ...valueMapping, dataType: 'time' })

      expect(store.statements[0]?.id).toBe(id1)
      expect(store.statements[1]?.id).toBe(id2)
      expect(store.statements[0]?.property.id).toBe('P31')
      expect(store.statements[1]?.property.id).toBe('P569')
    })

    it('should handle removing non-existent statement', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'type_column', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }
      const nonExistentId = Bun.randomUUIDv7() as UUID

      store.addStatement(property, valueMapping)
      store.removeStatement(nonExistentId)

      expect(store.statements).toHaveLength(1)
    })

    it('should store preferred rank', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'test_column', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }

      store.addStatement(property, valueMapping, 'preferred')

      expect(store.statements[0]?.rank).toBe('preferred')
    })

    it('should store deprecated rank', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'test_column', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }

      store.addStatement(property, valueMapping, 'deprecated')

      expect(store.statements[0]?.rank).toBe('deprecated')
    })

    it('should update statement rank to deprecated', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'test_column', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }

      const statementId = store.addStatement(property, valueMapping, 'preferred')
      store.updateStatementRank(statementId, 'deprecated')

      expect(store.statements[0]?.rank).toBe('deprecated')
    })

    it('should store property with label', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'type_column', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }

      store.addStatement(property, valueMapping, 'preferred')

      expect(store.statements[0]?.property.label).toBe('instance of')
      expect(store.statements[0]?.property.id).toBe('P31')
    })

    it('should store property without label', () => {
      const property: PropertyReference = {
        id: 'P999',
        dataType: 'string',
      }
      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'test_column', dataType: 'VARCHAR' },
        dataType: 'string',
      }

      store.addStatement(property, valueMapping)

      expect(store.statements[0]?.property.label).toBeUndefined()
      expect(store.statements[0]?.property.id).toBe('P999')
    })

    it('should store property data type', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'type_column', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }

      store.addStatement(property, valueMapping)

      expect(store.statements[0]?.property.dataType).toBe('wikibase-item')
    })

    it('should store column value mapping', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'type_column', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }

      store.addStatement(property, valueMapping)

      expect(store.statements[0]?.value.type).toBe('column')
      expect((store.statements[0]?.value.source as any).columnName).toBe('type_column')
    })

    it('should store value data type', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'type_column', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }

      store.addStatement(property, valueMapping)

      expect(store.statements[0]?.value.dataType).toBe('wikibase-item')
    })

    it('should create statement with unique id', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'type_column', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }

      store.addStatement(property, valueMapping)

      expect(store.statements[0]?.id).toBeDefined()
      expect(typeof store.statements[0]?.id).toBe('string')
    })

    it('should create statement with property object', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'type_column', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }

      store.addStatement(property, valueMapping)

      expect(store.statements[0]?.property).toBeDefined()
      expect(typeof store.statements[0]?.property).toBe('object')
    })

    it('should create statement with value object', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'type_column', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }

      store.addStatement(property, valueMapping)

      expect(store.statements[0]?.value).toBeDefined()
      expect(typeof store.statements[0]?.value).toBe('object')
    })

    it('should create statement with default normal rank', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }
      const valueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'type_column', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }

      store.addStatement(property, valueMapping)

      expect(store.statements[0]?.rank).toBe('normal')
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

      expect(mockBuildStatement).toHaveBeenCalledWith(property, valueMapping, 'normal', [], [])
      expect(statementId).toBe(TEST_STATEMENT_ID)
      expect(store.statements).toHaveLength(1)
      expect(store.isDirty).toBe(true)
    })
  })
})
