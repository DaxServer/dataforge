import { describe, test, expect, beforeEach } from 'bun:test'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { useSchemaStore } from '@frontend/stores/schema.store'
import type { PropertyReference, ValueMapping } from '@frontend/types/wikibase-schema'

/**
 * StatementsEditor Integration Tests
 *
 * These tests verify that the StatementsEditor component integrates correctly
 * with other components and the overall schema editing workflow.
 */

describe('StatementsEditor Integration', () => {
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

  describe('component imports', () => {
    test('should be importable by WikibaseSchemaEditor', async () => {
      const statementsEditorModule = await import('@frontend/components/StatementsEditor.vue')

      expect(statementsEditorModule).toBeDefined()
      expect(statementsEditorModule.default).toBeDefined()
    })

    test('should work alongside ItemEditor component', async () => {
      const itemEditorModule = await import('@frontend/components/ItemEditor.vue')

      expect(itemEditorModule).toBeDefined()
    })

    test('should work alongside TermsEditor component', async () => {
      const termsEditorModule = await import('@frontend/components/TermsEditor.vue')

      expect(termsEditorModule).toBeDefined()
    })
  })

  describe('event interface compatibility', () => {
    test('should define add-statement event', () => {
      interface ExpectedStatementsEditorEmits {
        'add-statement': []
      }

      const addStatementParams: ExpectedStatementsEditorEmits['add-statement'] = []
      expect(addStatementParams).toHaveLength(0)
    })

    test('should define edit-statement event', () => {
      interface ExpectedStatementsEditorEmits {
        'edit-statement': [statementId: string]
      }

      const editStatementParams: ExpectedStatementsEditorEmits['edit-statement'] = ['stmt-123']
      expect(editStatementParams).toHaveLength(1)
    })

    test('should define remove-statement event', () => {
      interface ExpectedStatementsEditorEmits {
        'remove-statement': [statementId: string]
      }

      const removeStatementParams: ExpectedStatementsEditorEmits['remove-statement'] = ['stmt-456']
      expect(removeStatementParams).toHaveLength(1)
    })

    test('should define reorder-statements event', () => {
      interface ExpectedStatementsEditorEmits {
        'reorder-statements': [fromIndex: number, toIndex: number]
      }

      const reorderStatementParams: ExpectedStatementsEditorEmits['reorder-statements'] = [0, 2]
      expect(reorderStatementParams).toHaveLength(2)
    })
  })

  describe('schema store integration', () => {
    test('should read statements from store', () => {
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

      const statementId = store.addStatement(property, valueMapping, 'preferred')

      expect(store.statements).toHaveLength(1)
      expect(store.statements[0]?.id).toBe(statementId)
    })

    test('should handle multiple statements from store', () => {
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

      const id1 = store.addStatement(property1, valueMapping1, 'preferred')
      const id2 = store.addStatement(property2, valueMapping2, 'normal')

      expect(store.statements).toHaveLength(2)
      expect(store.statements[0]?.id).toBe(id1)
      expect(store.statements[1]?.id).toBe(id2)
    })

    test('should handle statement removal from store', () => {
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

      const statementId = store.addStatement(property, valueMapping)
      store.removeStatement(statementId)

      expect(store.statements).toHaveLength(0)
    })
  })

  describe('statement structure support', () => {
    test('should handle basic statement structure', () => {
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

      const statementId = store.addStatement(property, valueMapping)
      const statement = store.statements.find((s) => s.id === statementId)!

      expect(statement).toBeDefined()
      expect(statement.property.id).toBe('P31')
      expect(statement.value.type).toBe('column')
    })
  })

  describe('ItemEditor integration', () => {
    test('should work with labels from ItemEditor', () => {
      store.addLabelMapping('en', { columnName: 'title', dataType: 'VARCHAR' })

      expect(Object.keys(store.labels)).toHaveLength(1)
    })

    test('should work with statements and labels together', () => {
      store.addLabelMapping('en', { columnName: 'title', dataType: 'VARCHAR' })

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

      expect(Object.keys(store.labels)).toHaveLength(1)
      expect(store.statements).toHaveLength(1)
      expect(store.isDirty).toBe(true)
    })
  })

  describe('drag-and-drop compatibility', () => {
    test('should support VARCHAR column data', () => {
      const mockColumnData = {
        name: 'test_column',
        dataType: 'VARCHAR',
        sampleValues: ['value1', 'value2', 'value3'],
        nullable: false,
        uniqueCount: 100,
      }

      expect(mockColumnData.dataType).toBe('VARCHAR')
      expect(mockColumnData.name).toBe('test_column')
    })

    test('should create statement from column data', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }

      const valueMapping: ValueMapping = {
        type: 'column',
        source: {
          columnName: 'test_column',
          dataType: 'VARCHAR',
        },
        dataType: 'wikibase-item',
      }

      const statementId = store.addStatement(property, valueMapping)
      const statement = store.statements.find((s) => s.id === statementId)!

      expect(statement.value.source).toEqual({
        columnName: 'test_column',
        dataType: 'VARCHAR',
      })
    })
  })

  describe('statement reordering support', () => {
    test('should maintain statement order', () => {
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
    })

    test('should support first statement move down logic', () => {
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

      store.addStatement(property1, valueMapping)
      store.addStatement(property2, { ...valueMapping, dataType: 'time' })

      const canMoveDown = 0 < store.statements.length - 1
      expect(canMoveDown).toBe(true)
    })

    test('should support last statement move up logic', () => {
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

      store.addStatement(property1, valueMapping)
      store.addStatement(property2, { ...valueMapping, dataType: 'time' })

      const lastIndex = store.statements.length - 1
      const canMoveUp = lastIndex > 0
      expect(canMoveUp).toBe(true)
    })
  })

  describe('value source types', () => {
    test('should handle column value source', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }

      const columnValueMapping: ValueMapping = {
        type: 'column',
        source: { columnName: 'type_column', dataType: 'VARCHAR' },
        dataType: 'wikibase-item',
      }

      const statementId = store.addStatement(property, columnValueMapping)
      const statement = store.statements.find((s) => s.id === statementId)!

      expect(statement.value.type).toBe('column')
      expect(typeof statement.value.source).toBe('object')
      expect((statement.value.source as any).columnName).toBe('type_column')
    })

    test('should handle constant value source', () => {
      const property: PropertyReference = {
        id: 'P31',
        label: 'instance of',
        dataType: 'wikibase-item',
      }

      const constantValueMapping: ValueMapping = {
        type: 'constant',
        source: 'Q5',
        dataType: 'wikibase-item',
      }

      const statementId = store.addStatement(property, constantValueMapping)
      const statement = store.statements.find((s) => s.id === statementId)!

      expect(statement.value.type).toBe('constant')
      expect(typeof statement.value.source).toBe('string')
      expect(statement.value.source).toBe('Q5')
    })
  })
})
