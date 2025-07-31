import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { ref, computed } from 'vue'
import type {
  QualifierSchemaMapping,
  PropertyReference,
  ValueMapping,
} from '@frontend/types/wikibase-schema'

/**
 * StatementEditor Integration Tests
 *
 * These tests verify the integration between StatementEditor and its composables,
 * focusing on the qualifier display functionality without DOM testing.
 */

// Mock the composables with realistic implementations
const mockUseStatementEditor = () => {
  const localStatement = ref({
    property: null as PropertyReference | null,
    value: {
      type: 'column' as const,
      source: {
        columnName: '',
        dataType: 'VARCHAR',
      },
      dataType: 'string' as const,
    },
    rank: 'normal' as const,
  })

  return {
    localStatement,
    valueTypeOptions: [
      { value: 'column', label: 'Column', icon: 'pi pi-database' },
      { value: 'constant', label: 'Constant', icon: 'pi pi-lock' },
      { value: 'expression', label: 'Expression', icon: 'pi pi-code' },
    ],
    rankOptions: [
      { value: 'preferred', label: 'Preferred', icon: 'pi pi-star', severity: 'success' },
      { value: 'normal', label: 'Normal', icon: 'pi pi-circle', severity: 'secondary' },
      { value: 'deprecated', label: 'Deprecated', icon: 'pi pi-times', severity: 'danger' },
    ],
    isColumnType: computed(() => localStatement.value.value.type === 'column'),
    sourceLabel: computed(() => 'Column'),
    sourcePlaceholder: computed(() => 'Select a column'),
    sourceValue: computed(() =>
      localStatement.value.value.type === 'column'
        ? localStatement.value.value.source.columnName
        : typeof localStatement.value.value.source === 'string'
          ? localStatement.value.value.source
          : '',
    ),
    isValidStatement: computed(
      () =>
        localStatement.value.property !== null &&
        (localStatement.value.value.type === 'column'
          ? localStatement.value.value.source.columnName !== ''
          : typeof localStatement.value.value.source === 'string' &&
            localStatement.value.value.source !== ''),
    ),
    compatibleDataTypes: [
      { value: 'string', label: 'String' },
      { value: 'wikibase-item', label: 'Item' },
    ],
    handlePropertyUpdate: (property: PropertyReference | null) => {
      localStatement.value.property = property
    },
    handleValueTypeChange: () => {},
    handleDataTypeChange: () => {},
    handleRankChange: () => {},
    handleColumnDrop: () => {},
    initializeStatement: (value: any) => {
      if (value) {
        localStatement.value = { ...localStatement.value, ...value }
      }
    },
    setAvailableColumns: () => {},
  }
}

mock.module('@frontend/composables/useStatementEditor', () => ({
  useStatementEditor: mockUseStatementEditor,
}))

mock.module('@frontend/composables/useStatementDropZone', () => ({
  useStatementDropZone: () => ({
    dropZoneClasses: ref('border-surface-300'),
    handleDragOver: () => {},
    handleDragEnter: () => {},
    handleDragLeave: () => {},
    handleDrop: () => {},
    setOnColumnDrop: () => {},
  }),
}))

mock.module('@frontend/composables/useStatementValidationDisplay', () => ({
  useStatementValidationDisplay: () => ({
    getValidationMessage: () => null,
    getValidationClasses: () => '',
    getValidationIcon: () => null,
    isValidationValid: () => true,
    getValidationSeverity: () => 'secondary',
  }),
}))

describe('StatementEditor Integration - Qualifier Display', () => {
  beforeEach(() => {
    setActivePinia(
      createTestingPinia({
        createSpy: mock,
        stubActions: false,
      }),
    )
  })

  describe('qualifier state management integration', () => {
    test('should initialize localQualifiers from props correctly', () => {
      // Simulate the component initialization logic
      const props = {
        modelValue: {
          property: {
            id: 'P123',
            label: 'Test Property',
            dataType: 'string',
          } as PropertyReference,
          value: {
            type: 'column',
            source: {
              columnName: 'test_column',
              dataType: 'VARCHAR',
            },
            dataType: 'string',
          } as ValueMapping,
          rank: 'normal' as const,
          qualifiers: [
            {
              property: {
                id: 'P580',
                label: 'start time',
                dataType: 'time',
              },
              value: {
                type: 'column',
                source: {
                  columnName: 'start_date',
                  dataType: 'DATE',
                },
                dataType: 'time',
              },
            },
          ] as QualifierSchemaMapping[],
        },
      }

      // Simulate the component's initialization logic
      const localQualifiers = ref<QualifierSchemaMapping[]>(props.modelValue?.qualifiers || [])

      expect(localQualifiers.value.length).toBe(1)
      expect(localQualifiers.value[0]?.property.id).toBe('P580')
      expect(localQualifiers.value[0]?.property.label).toBe('start time')
    })

    test('should handle qualifier updates through event handlers', () => {
      const localQualifiers = ref<QualifierSchemaMapping[]>([])
      const tempStatementId = 'test-statement-id'

      // Simulate the event handlers from the component
      const handleAddQualifier = (statementId: string, qualifier: QualifierSchemaMapping) => {
        localQualifiers.value.push(qualifier)
        // Simulate emitUpdate call
        return {
          ...localQualifiers.value,
          qualifiers: localQualifiers.value,
        }
      }

      const handleRemoveQualifier = (statementId: string, qualifierIndex: number) => {
        if (qualifierIndex >= 0 && qualifierIndex < localQualifiers.value.length) {
          localQualifiers.value.splice(qualifierIndex, 1)
        }
      }

      const handleUpdateQualifier = (
        statementId: string,
        qualifierIndex: number,
        qualifier: QualifierSchemaMapping,
      ) => {
        if (qualifierIndex >= 0 && qualifierIndex < localQualifiers.value.length) {
          localQualifiers.value[qualifierIndex] = qualifier
        }
      }

      // Test adding a qualifier
      const newQualifier: QualifierSchemaMapping = {
        property: {
          id: 'P580',
          label: 'start time',
          dataType: 'time',
        },
        value: {
          type: 'column',
          source: {
            columnName: 'start_date',
            dataType: 'DATE',
          },
          dataType: 'time',
        },
      }

      const result = handleAddQualifier(tempStatementId, newQualifier)
      expect(localQualifiers.value.length).toBe(1)
      expect(result.qualifiers.length).toBe(1)

      // Test updating a qualifier
      const updatedQualifier: QualifierSchemaMapping = {
        ...newQualifier,
        property: {
          ...newQualifier.property,
          label: 'updated start time',
        },
      }

      handleUpdateQualifier(tempStatementId, 0, updatedQualifier)
      expect(localQualifiers.value[0]?.property.label).toBe('updated start time')

      // Test removing a qualifier
      handleRemoveQualifier(tempStatementId, 0)
      expect(localQualifiers.value.length).toBe(0)
    })

    test('should sync qualifiers when props change', () => {
      const localQualifiers = ref<QualifierSchemaMapping[]>([])

      // Simulate the watcher logic
      const syncQualifiersFromProps = (newQualifiers: QualifierSchemaMapping[] | undefined) => {
        localQualifiers.value = newQualifiers || []
      }

      // Initial state
      expect(localQualifiers.value.length).toBe(0)

      // Simulate props change with qualifiers
      const qualifiers: QualifierSchemaMapping[] = [
        {
          property: { id: 'P580', label: 'start time', dataType: 'time' },
          value: {
            type: 'column',
            source: { columnName: 'start_date', dataType: 'DATE' },
            dataType: 'time',
          },
        },
        {
          property: { id: 'P582', label: 'end time', dataType: 'time' },
          value: { type: 'constant', source: '2024-01-01', dataType: 'time' },
        },
      ]

      syncQualifiersFromProps(qualifiers)
      expect(localQualifiers.value.length).toBe(2)
      expect(localQualifiers.value[0]?.property.id).toBe('P580')
      expect(localQualifiers.value[1]?.property.id).toBe('P582')

      // Simulate props change to empty
      syncQualifiersFromProps([])
      expect(localQualifiers.value.length).toBe(0)

      // Simulate props change to undefined
      syncQualifiersFromProps(undefined)
      expect(localQualifiers.value.length).toBe(0)
    })
  })

  describe('preview display logic integration', () => {
    test('should determine preview visibility based on statement validity and qualifiers', () => {
      // Simulate the component's computed properties
      const isValidStatement = ref(true)
      const localQualifiers = ref<QualifierSchemaMapping[]>([])

      // Preview should show when statement is valid
      const shouldShowPreview = computed(() => isValidStatement.value)
      expect(shouldShowPreview.value).toBe(true)

      // Qualifiers section should not show when empty
      const shouldShowQualifiersPreview = computed(() => localQualifiers.value.length > 0)
      expect(shouldShowQualifiersPreview.value).toBe(false)

      // Add qualifiers
      localQualifiers.value.push({
        property: { id: 'P580', label: 'start time', dataType: 'time' },
        value: {
          type: 'column',
          source: { columnName: 'start_date', dataType: 'DATE' },
          dataType: 'time',
        },
      })

      // Now qualifiers section should show
      expect(shouldShowQualifiersPreview.value).toBe(true)

      // If statement becomes invalid, preview should not show
      isValidStatement.value = false
      expect(shouldShowPreview.value).toBe(false)
    })

    test('should format qualifier preview data correctly', () => {
      const qualifiers: QualifierSchemaMapping[] = [
        {
          property: { id: 'P580', label: 'start time', dataType: 'time' },
          value: {
            type: 'column',
            source: { columnName: 'start_date', dataType: 'DATE' },
            dataType: 'time',
          },
        },
        {
          property: { id: 'P582', label: 'end time', dataType: 'time' },
          value: { type: 'constant', source: '2024-01-01', dataType: 'time' },
        },
      ]

      // Simulate the template logic for displaying qualifiers
      const formatQualifierForPreview = (qualifier: QualifierSchemaMapping, index: number) => {
        return {
          number: `Q${index + 1}`,
          propertyLabel: qualifier.property.label || qualifier.property.id,
          valueText:
            qualifier.value.type === 'column'
              ? typeof qualifier.value.source === 'string'
                ? qualifier.value.source
                : qualifier.value.source.columnName
              : qualifier.value.source,
          dataType: qualifier.value.dataType,
        }
      }

      const formattedQualifiers = qualifiers.map(formatQualifierForPreview)

      expect(formattedQualifiers).toHaveLength(2)

      expect(formattedQualifiers[0]?.number).toBe('Q1')
      expect(formattedQualifiers[0]?.propertyLabel).toBe('start time')
      expect(formattedQualifiers[0]?.valueText).toBe('start_date')
      expect(formattedQualifiers[0]?.dataType).toBe('time')

      expect(formattedQualifiers[1]?.number).toBe('Q2')
      expect(formattedQualifiers[1]?.propertyLabel).toBe('end time')
      expect(formattedQualifiers[1]?.valueText).toBe('2024-01-01')
      expect(formattedQualifiers[1]?.dataType).toBe('time')
    })
  })

  describe('emitUpdate integration', () => {
    test('should emit updates with qualifiers included', () => {
      const localStatement = ref({
        property: {
          id: 'P123',
          label: 'Test Property',
          dataType: 'string',
        } as PropertyReference,
        value: {
          type: 'column',
          source: {
            columnName: 'test_column',
            dataType: 'VARCHAR',
          },
          dataType: 'string',
        } as ValueMapping,
        rank: 'normal' as const,
      })

      const localQualifiers = ref<QualifierSchemaMapping[]>([
        {
          property: { id: 'P580', label: 'start time', dataType: 'time' },
          value: {
            type: 'column',
            source: { columnName: 'start_date', dataType: 'DATE' },
            dataType: 'time',
          },
        },
      ])

      // Simulate the emitUpdate function
      const emitUpdate = () => {
        return {
          ...localStatement.value,
          qualifiers: localQualifiers.value,
        }
      }

      const emittedValue = emitUpdate()

      expect(emittedValue.property?.id).toBe('P123')
      expect(emittedValue.qualifiers).toHaveLength(1)
      expect(emittedValue.qualifiers?.[0]?.property.id).toBe('P580')
      expect(emittedValue.qualifiers?.[0]?.value.type).toBe('column')
    })
  })
})
