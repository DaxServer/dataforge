import { beforeEach, describe, expect, it } from 'bun:test'
import type { WikibaseDataType } from '@backend/types/wikibase-schema'
import { useDragDropStore } from '@frontend/features/data-processing/stores/drag-drop.store'
import { useValidation } from '@frontend/features/wikibase-schema/composables/useValidation'
import { useValidationStore } from '@frontend/features/wikibase-schema/stores/validation.store'
import type { DropTarget } from '@frontend/shared/types/drag-drop'
import type { ColumnInfo } from '@frontend/shared/types/wikibase-schema'
import { createPinia, setActivePinia } from 'pinia'

describe('useValidation', () => {
  let mockColumnInfo: ColumnInfo
  let mockDropTarget: DropTarget
  let dragDropStore: ReturnType<typeof useDragDropStore>
  let validationStore: ReturnType<typeof useValidationStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    dragDropStore = useDragDropStore()
    validationStore = useValidationStore()

    mockColumnInfo = {
      name: 'test_column',
      dataType: 'VARCHAR',
      sampleValues: ['value1', 'value2'],
      nullable: false,
      uniqueCount: 100,
    }

    mockDropTarget = {
      type: 'label',
      path: 'item.terms.labels.en',
      acceptedTypes: ['string'],
      language: 'en',
      isRequired: false,
    }
  })

  describe('Drag Validation', () => {
    it('should validate drag operations', () => {
      const { validateDragOperation, isValidDragOperation } = useValidation()

      // Set up available targets
      dragDropStore.setAvailableTargets([mockDropTarget])

      // Start drag operation
      dragDropStore.startDrag(mockColumnInfo)
      dragDropStore.setHoveredTarget('item.terms.labels.en')

      // Validate the drag operation
      const validation = validateDragOperation(mockColumnInfo, mockDropTarget)

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(isValidDragOperation.value).toBe(true)
    })

    it('should detect invalid drag operations', () => {
      const { validateDragOperation, isValidDragOperation } = useValidation()

      const incompatibleColumn: ColumnInfo = {
        name: 'numeric_column',
        dataType: 'INTEGER',
        sampleValues: ['1', '2', '3'],
        nullable: false,
      }

      // Set up available targets
      dragDropStore.setAvailableTargets([mockDropTarget])

      // Start drag operation with incompatible column
      dragDropStore.startDrag(incompatibleColumn)

      // Validate the drag operation
      const validation = validateDragOperation(incompatibleColumn, mockDropTarget)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(1)
      expect(validation.errors[0]?.code).toBe('INCOMPATIBLE_DATA_TYPE')
      expect(isValidDragOperation.value).toBe(false)
    })

    it('should validate nullable constraints', () => {
      const { validateDragOperation } = useValidation()

      const nullableColumn: ColumnInfo = {
        ...mockColumnInfo,
        nullable: true,
      }

      const requiredTarget: DropTarget = {
        ...mockDropTarget,
        isRequired: true,
      }

      const validation = validateDragOperation(nullableColumn, requiredTarget)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(1)
      expect(validation.errors[0]?.code).toBe('MISSING_REQUIRED_MAPPING')
    })

    it('should validate property requirements for statements', () => {
      const { validateDragOperation } = useValidation()

      const statementTarget: DropTarget = {
        type: 'statement',
        path: 'item.statements[0].value',
        acceptedTypes: ['string'],
        // Missing propertyId
      }

      const validation = validateDragOperation(mockColumnInfo, statementTarget)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(1)
      expect(validation.errors[0]?.code).toBe('INVALID_PROPERTY_ID')
    })

    it('should validate length constraints for labels and aliases', () => {
      const { validateDragOperation } = useValidation()

      const longValueColumn: ColumnInfo = {
        name: 'long_text',
        dataType: 'VARCHAR',
        sampleValues: ['a'.repeat(300)], // Very long value
        nullable: false,
      }

      const validation = validateDragOperation(longValueColumn, mockDropTarget)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(1)
      expect(validation.errors[0]?.message).toContain('shorter than 250 characters')
    })
  })

  describe('Invalid Mapping Detection', () => {
    it('should detect duplicate language mappings', () => {
      const { detectInvalidMappings } = useValidation()

      const existingMappings = [
        {
          path: 'item.terms.labels.en',
          columnName: 'existing_column',
          language: 'en',
        },
      ]

      const newMapping = {
        path: 'item.terms.labels.en',
        columnName: 'test_column',
        language: 'en',
      }

      const invalidMappings = detectInvalidMappings(existingMappings, newMapping)

      expect(invalidMappings).toHaveLength(1)
      expect(invalidMappings[0]?.code).toBe('DUPLICATE_LANGUAGE_MAPPING')
    })

    it('should detect duplicate property mappings', () => {
      const { detectInvalidMappings } = useValidation()

      const existingMappings = [
        {
          path: 'item.statements[0].value',
          columnName: 'existing_column',
          propertyId: 'P31',
        },
      ]

      const newMapping = {
        path: 'item.statements[1].value',
        columnName: 'test_column',
        propertyId: 'P31',
      }

      const invalidMappings = detectInvalidMappings(existingMappings, newMapping)

      expect(invalidMappings).toHaveLength(1)
      expect(invalidMappings[0]?.code).toBe('DUPLICATE_PROPERTY_MAPPING')
    })

    it('should detect missing required mappings', () => {
      const { detectMissingRequiredMappings } = useValidation()

      const requiredTargets: DropTarget[] = [
        {
          type: 'label',
          path: 'item.terms.labels.en',
          acceptedTypes: ['string'],
          isRequired: true,
        },
        {
          type: 'statement',
          path: 'item.statements[0].value',
          acceptedTypes: ['string'],
          propertyId: 'P31',
          isRequired: true,
        },
      ]

      const existingMappings = [
        {
          path: 'item.terms.labels.en',
          columnName: 'label_column',
        },
        // Missing required statement mapping
      ]

      const missingMappings = detectMissingRequiredMappings(requiredTargets, existingMappings)

      expect(missingMappings).toHaveLength(1)
      expect(missingMappings[0]?.code).toBe('MISSING_REQUIRED_MAPPING')
      expect(missingMappings[0]?.path).toBe('item.statements[0].value')
    })

    it('should validate data type compatibility across all mappings', () => {
      const { validateAllMappings } = useValidation()

      const mappings = [
        {
          path: 'item.terms.labels.en',
          columnName: 'text_column',
          columnDataType: 'VARCHAR',
          targetTypes: ['string'] as WikibaseDataType[],
        },
        {
          path: 'item.statements[0].value',
          columnName: 'numeric_column',
          columnDataType: 'INTEGER',
          targetTypes: ['string'] as WikibaseDataType[], // Incompatible
        },
      ]

      const validationResult = validateAllMappings(mappings)

      expect(validationResult.isValid).toBe(false)
      expect(validationResult.errors).toHaveLength(1)
      expect(validationResult.errors[0]?.code).toBe('INCOMPATIBLE_DATA_TYPE')
      expect(validationResult.errors[0]?.path).toBe('item.statements[0].value')
    })
  })

  describe('Validation Feedback', () => {
    it('should provide immediate feedback for valid operations', () => {
      const { getValidationFeedback } = useValidation()

      const feedback = getValidationFeedback(mockColumnInfo, mockDropTarget)

      expect(feedback).toBeDefined()
      expect(feedback?.type).toBe('success')
      expect(feedback?.message).toContain('Compatible')
    })

    it('should provide error feedback for invalid operations', () => {
      const { getValidationFeedback } = useValidation()

      const incompatibleColumn: ColumnInfo = {
        name: 'numeric_column',
        dataType: 'INTEGER',
        sampleValues: ['1', '2'],
        nullable: false,
      }

      const feedback = getValidationFeedback(incompatibleColumn, mockDropTarget)

      expect(feedback).toBeDefined()
      expect(feedback?.type).toBe('error')
      expect(feedback?.message).toContain('not compatible')
    })

    it('should provide validation suggestions', () => {
      const { getValidationSuggestions } = useValidation()

      const incompatibleColumn: ColumnInfo = {
        name: 'numeric_column',
        dataType: 'INTEGER',
        sampleValues: ['1', '2'],
        nullable: false,
      }

      const suggestions = getValidationSuggestions(incompatibleColumn, mockDropTarget)

      expect(suggestions).toHaveLength(1)
      expect(suggestions[0]).toContain('Consider using a column with data type')
    })

    it('should provide suggestions for nullable constraints', () => {
      const { getValidationSuggestions } = useValidation()

      const nullableColumn: ColumnInfo = {
        ...mockColumnInfo,
        nullable: true,
      }

      const requiredTarget: DropTarget = {
        ...mockDropTarget,
        isRequired: true,
      }

      const suggestions = getValidationSuggestions(nullableColumn, requiredTarget)

      expect(suggestions).toHaveLength(1)
      expect(suggestions[0]).toContain('non-nullable column')
    })
  })

  describe('Integration with Validation Store', () => {
    it('should automatically add validation errors to store', () => {
      const { validateDragOperation } = useValidation()

      const incompatibleColumn: ColumnInfo = {
        name: 'numeric_column',
        dataType: 'INTEGER',
        sampleValues: ['1', '2'],
        nullable: false,
      }

      // Validate with auto-store enabled
      validateDragOperation(incompatibleColumn, mockDropTarget, true)

      expect(validationStore.hasErrors).toBe(true)
      expect(validationStore.errors).toHaveLength(1)
      expect(validationStore.errors[0]?.code).toBe('INCOMPATIBLE_DATA_TYPE')
    })

    it('should clear validation errors when drag becomes valid', () => {
      const { validateDragOperation } = useValidation()

      const incompatibleColumn: ColumnInfo = {
        name: 'numeric_column',
        dataType: 'INTEGER',
        sampleValues: ['1', '2'],
        nullable: false,
      }

      // Add error first
      validateDragOperation(incompatibleColumn, mockDropTarget, true)
      expect(validationStore.hasErrors).toBe(true)

      // Now validate with compatible column
      validateDragOperation(mockColumnInfo, mockDropTarget, true)

      // Should clear previous errors for this path
      expect(validationStore.hasErrorsForPath(mockDropTarget.path)).toBe(false)
    })
  })

  describe('Performance and Reactivity', () => {
    it('should be reactive to drag store changes', () => {
      const { isValidDragOperation } = useValidation()

      // Set up available targets
      dragDropStore.setAvailableTargets([mockDropTarget])

      expect(isValidDragOperation.value).toBe(false) // No drag in progress

      // Start drag operation
      dragDropStore.startDrag(mockColumnInfo)
      dragDropStore.setHoveredTarget('item.terms.labels.en')

      expect(isValidDragOperation.value).toBe(true)

      // End drag operation
      dragDropStore.endDrag()

      expect(isValidDragOperation.value).toBe(false)
    })
  })
})
