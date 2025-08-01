import { describe, test, expect, beforeEach } from 'bun:test'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { useSchemaStore } from '@frontend/stores/schema.store'
import type {
  PropertyReference,
  ValueMapping,
  WikibaseDataType,
} from '@frontend/types/wikibase-schema'
import type { UUID } from 'crypto'

const NON_EXISTENT_ID: UUID = Bun.randomUUIDv7() as UUID

/**
 * StatementsEditor Component Tests
 *
 * These tests verify the store integration and data flow for the StatementsEditor component
 * without recreating component logic in the tests.
 */

// Test data factories and constants
const createInstanceOfProperty = (): PropertyReference => ({
  id: 'P31',
  label: 'instance of',
  dataType: 'wikibase-item',
})

const createDateOfBirthProperty = (): PropertyReference => ({
  id: 'P569',
  label: 'date of birth',
  dataType: 'time',
})

const createPropertyWithoutLabel = (): PropertyReference => ({
  id: 'P999',
  dataType: 'string',
})

const createColumnValueMapping = (
  columnName = 'type_column',
  columnDataType = 'VARCHAR',
  dataType: WikibaseDataType = 'wikibase-item',
): ValueMapping => ({
  type: 'column',
  source: { columnName, dataType: columnDataType },
  dataType,
})

const createTestColumnValueMapping = (): ValueMapping => ({
  type: 'column',
  source: { columnName: 'test_column', dataType: 'VARCHAR' },
  dataType: 'wikibase-item',
})

const createBirthDateValueMapping = (): ValueMapping => ({
  type: 'column',
  source: { columnName: 'birth_date', dataType: 'DATE' },
  dataType: 'time',
})

const createStringValueMapping = (): ValueMapping => ({
  type: 'column',
  source: { columnName: 'test_column', dataType: 'VARCHAR' },
  dataType: 'string',
})

describe('StatementsEditor Component Logic', () => {
  let store: ReturnType<typeof useSchemaStore>

  beforeEach(() => {
    // Create testing pinia
    setActivePinia(
      createTestingPinia({
        stubActions: false,
      }),
    )

    store = useSchemaStore()
  })

  describe('adding statements', () => {
    test('should add statement to store', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      const statementId = store.addStatement(property, valueMapping, 'normal')

      expect(store.statements).toHaveLength(1)
      expect(store.statements[0]?.id).toBe(statementId)
    })

    test('should store statement property correctly', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      store.addStatement(property, valueMapping, 'normal')

      expect(store.statements[0]?.property.id).toBe('P31')
      expect(store.statements[0]?.property.label).toBe('instance of')
    })

    test('should store statement rank correctly', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      store.addStatement(property, valueMapping, 'normal')

      expect(store.statements[0]?.rank).toBe('normal')
    })

    test('should mark store as dirty when adding statement', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      store.addStatement(property, valueMapping, 'normal')

      expect(store.isDirty).toBe(true)
    })

    test('should add multiple statements', () => {
      const property1 = createInstanceOfProperty()
      const property2 = createDateOfBirthProperty()
      const valueMapping1 = createColumnValueMapping()
      const valueMapping2 = createBirthDateValueMapping()

      store.addStatement(property1, valueMapping1, 'preferred')
      store.addStatement(property2, valueMapping2, 'normal')

      expect(store.statements).toHaveLength(2)
    })

    test('should maintain statement order when adding multiple statements', () => {
      const property1 = createInstanceOfProperty()
      const property2 = createDateOfBirthProperty()
      const valueMapping = createTestColumnValueMapping()

      const id1 = store.addStatement(property1, valueMapping)
      const id2 = store.addStatement(property2, { ...valueMapping, dataType: 'time' })

      expect(store.statements[0]?.id).toBe(id1)
      expect(store.statements[1]?.id).toBe(id2)
      expect(store.statements[0]?.property.id).toBe('P31')
      expect(store.statements[1]?.property.id).toBe('P569')
    })
  })

  describe('removing statements', () => {
    test('should remove statement from store', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      const statementId = store.addStatement(property, valueMapping)
      store.removeStatement(statementId)

      expect(store.statements).toHaveLength(0)
    })

    test('should mark store as dirty when removing statement', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      const statementId = store.addStatement(property, valueMapping)
      store.markAsSaved() // Reset dirty state
      store.removeStatement(statementId)

      expect(store.isDirty).toBe(true)
    })

    test('should handle removing non-existent statement', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      store.addStatement(property, valueMapping)
      store.removeStatement(NON_EXISTENT_ID)

      expect(store.statements).toHaveLength(1)
    })
  })

  describe('statement ranks', () => {
    test('should store preferred rank', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createTestColumnValueMapping()

      store.addStatement(property, valueMapping, 'preferred')

      expect(store.statements[0]?.rank).toBe('preferred')
    })

    test('should store normal rank', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createTestColumnValueMapping()

      store.addStatement(property, valueMapping, 'normal')

      expect(store.statements[0]?.rank).toBe('normal')
    })

    test('should store deprecated rank', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createTestColumnValueMapping()

      store.addStatement(property, valueMapping, 'deprecated')

      expect(store.statements[0]?.rank).toBe('deprecated')
    })

    test('should update statement rank to preferred', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createTestColumnValueMapping()

      const statementId = store.addStatement(property, valueMapping, 'normal')
      store.updateStatementRank(statementId, 'preferred')

      expect(store.statements[0]?.rank).toBe('preferred')
    })

    test('should update statement rank to deprecated', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createTestColumnValueMapping()

      const statementId = store.addStatement(property, valueMapping, 'preferred')
      store.updateStatementRank(statementId, 'deprecated')

      expect(store.statements[0]?.rank).toBe('deprecated')
    })
  })

  describe('statement properties', () => {
    test('should store property with label', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      store.addStatement(property, valueMapping, 'preferred')

      expect(store.statements[0]?.property.label).toBe('instance of')
      expect(store.statements[0]?.property.id).toBe('P31')
    })

    test('should store property without label', () => {
      const property = createPropertyWithoutLabel()
      const valueMapping = createStringValueMapping()

      store.addStatement(property, valueMapping)

      expect(store.statements[0]?.property.label).toBeUndefined()
      expect(store.statements[0]?.property.id).toBe('P999')
    })

    test('should store property data type', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      store.addStatement(property, valueMapping)

      expect(store.statements[0]?.property.dataType).toBe('wikibase-item')
    })
  })

  describe('statement values', () => {
    test('should store column value mapping', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      store.addStatement(property, valueMapping)

      expect(store.statements[0]?.value.type).toBe('column')
      expect((store.statements[0]?.value.source as any).columnName).toBe('type_column')
    })

    test('should store value data type', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      store.addStatement(property, valueMapping)

      expect(store.statements[0]?.value.dataType).toBe('wikibase-item')
    })
  })

  describe('statement structure', () => {
    test('should create statement with unique id', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      store.addStatement(property, valueMapping)

      expect(store.statements[0]?.id).toBeDefined()
      expect(typeof store.statements[0]?.id).toBe('string')
    })

    test('should create statement with property object', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      store.addStatement(property, valueMapping)

      expect(store.statements[0]?.property).toBeDefined()
      expect(typeof store.statements[0]?.property).toBe('object')
    })

    test('should create statement with value object', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      store.addStatement(property, valueMapping)

      expect(store.statements[0]?.value).toBeDefined()
      expect(typeof store.statements[0]?.value).toBe('object')
    })

    test('should create statement with default normal rank', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      store.addStatement(property, valueMapping)

      expect(store.statements[0]?.rank).toBe('normal')
    })
  })

  describe('store state management', () => {
    test('should start with empty statements array', () => {
      expect(store.statements).toHaveLength(0)
    })

    test('should start with clean dirty state', () => {
      expect(store.isDirty).toBe(false)
    })

    test('should reset statements to empty array', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      store.addStatement(property, valueMapping)
      store.$reset()

      expect(store.statements).toHaveLength(0)
    })

    test('should reset dirty state to false', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      store.addStatement(property, valueMapping)
      store.$reset()

      expect(store.isDirty).toBe(false)
    })

    test('should mark as saved and reset dirty state', () => {
      const property = createInstanceOfProperty()
      const valueMapping = createColumnValueMapping()

      store.addStatement(property, valueMapping)
      store.markAsSaved()

      expect(store.isDirty).toBe(false)
    })
  })
})
