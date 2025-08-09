import { describe, it, expect, beforeEach } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useDragDropContext } from '@frontend/shared/composables/useDragDropContext'
import { useValidation } from '@frontend/features/wikibase-schema/composables/useValidation'
import { useDragDropStore } from '@frontend/features/data-processing/stores/drag-drop.store'
import { useValidationStore } from '@frontend/features/wikibase-schema/stores/validation.store'
import type { ColumnInfo } from '@frontend/shared/types/wikibase-schema'
import type { DropTarget } from '@frontend/shared/types/drag-drop'
import type { WikibaseDataType } from '@backend/api/project/project.wikibase'

describe('Drag-Drop Validation Integration', () => {
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

  describe('Drag-Drop Context Integration', () => {
    it('should integrate validation with drag-drop context', () => {
      const dragDropContext = useDragDropContext()
      const validation = useValidation()

      // Set up available targets
      dragDropStore.setAvailableTargets([mockDropTarget])

      // Validate using both systems
      const contextValidation = dragDropContext.validateDrop(mockColumnInfo, mockDropTarget)
      const validationResult = validation.validateDragOperation(mockColumnInfo, mockDropTarget)

      // Both should agree on validity
      expect(contextValidation.isValid).toBe(validationResult.isValid)
      expect(contextValidation.isValid).toBe(true)
    })

    it('should provide consistent validation results for invalid drops', () => {
      const dragDropContext = useDragDropContext()
      const validation = useValidation()

      const incompatibleColumn: ColumnInfo = {
        name: 'numeric_column',
        dataType: 'INTEGER',
        sampleValues: ['1', '2'],
        nullable: false,
      }

      // Set up available targets
      dragDropStore.setAvailableTargets([mockDropTarget])

      // Validate using both systems
      const contextValidation = dragDropContext.validateDrop(incompatibleColumn, mockDropTarget)
      const validationResult = validation.validateDragOperation(incompatibleColumn, mockDropTarget)

      // Both should agree on invalidity
      expect(contextValidation.isValid).toBe(validationResult.isValid)
      expect(contextValidation.isValid).toBe(false)
    })

    it('should handle complex validation scenarios consistently', () => {
      const dragDropContext = useDragDropContext()
      const validation = useValidation()

      const nullableColumn: ColumnInfo = {
        ...mockColumnInfo,
        nullable: true,
      }

      const requiredTarget: DropTarget = {
        ...mockDropTarget,
        isRequired: true,
      }

      // Set up available targets
      dragDropStore.setAvailableTargets([requiredTarget])

      // Validate using both systems
      const contextValidation = dragDropContext.validateDrop(nullableColumn, requiredTarget)
      const validationResult = validation.validateDragOperation(nullableColumn, requiredTarget)

      // Both should detect the nullable constraint violation
      expect(contextValidation.isValid).toBe(validationResult.isValid)
      expect(contextValidation.isValid).toBe(false)
      expect(contextValidation.reason).toContain('nullable')
    })
  })

  describe('Store Integration', () => {
    it('should sync validation errors with validation store', () => {
      const validation = useValidation()

      const incompatibleColumn: ColumnInfo = {
        name: 'numeric_column',
        dataType: 'INTEGER',
        sampleValues: ['1', '2'],
        nullable: false,
      }

      // Validate with auto-store enabled
      validation.validateDragOperation(incompatibleColumn, mockDropTarget, true)

      // Check that error was added to validation store
      expect(validationStore.hasErrors).toBe(true)
      expect(validationStore.hasErrorsForPath(mockDropTarget.path)).toBe(true)

      const errors = validationStore.getErrorsForPath(mockDropTarget.path)
      expect(errors).toHaveLength(1)
      expect(errors[0]?.code).toBe('INCOMPATIBLE_DATA_TYPE')
    })

    it('should clear validation errors when validation becomes valid', () => {
      const validation = useValidation()

      const incompatibleColumn: ColumnInfo = {
        name: 'numeric_column',
        dataType: 'INTEGER',
        sampleValues: ['1', '2'],
        nullable: false,
      }

      // Add error first
      validation.validateDragOperation(incompatibleColumn, mockDropTarget, true)
      expect(validationStore.hasErrorsForPath(mockDropTarget.path)).toBe(true)

      // Now validate with compatible column
      validation.validateDragOperation(mockColumnInfo, mockDropTarget, true)

      // Should clear previous errors for this path
      expect(validationStore.hasErrorsForPath(mockDropTarget.path)).toBe(false)
    })

    it('should handle multiple validation errors for different paths', () => {
      const validation = useValidation()

      const incompatibleColumn: ColumnInfo = {
        name: 'numeric_column',
        dataType: 'INTEGER',
        sampleValues: ['1', '2'],
        nullable: false,
      }

      const target1 = mockDropTarget
      const target2: DropTarget = {
        type: 'description',
        path: 'item.terms.descriptions.en',
        acceptedTypes: ['string'],
        language: 'en',
      }

      // Add errors for both targets
      validation.validateDragOperation(incompatibleColumn, target1, true)
      validation.validateDragOperation(incompatibleColumn, target2, true)

      // Both paths should have errors
      expect(validationStore.hasErrorsForPath(target1.path)).toBe(true)
      expect(validationStore.hasErrorsForPath(target2.path)).toBe(true)
      expect(validationStore.errorCount).toBe(2)

      // Clear one path
      validation.validateDragOperation(mockColumnInfo, target1, true)

      // Only target2 should still have errors
      expect(validationStore.hasErrorsForPath(target1.path)).toBe(false)
      expect(validationStore.hasErrorsForPath(target2.path)).toBe(true)
      expect(validationStore.errorCount).toBe(1)
    })
  })

  describe('Drag Store Integration', () => {
    it('should work with drag store valid targets computation', () => {
      const validation = useValidation()

      const targets = [
        mockDropTarget,
        {
          type: 'statement' as const,
          path: 'item.statements[0].value',
          acceptedTypes: ['time'] as WikibaseDataType[], // Incompatible with VARCHAR
          propertyId: 'P585',
        },
        {
          type: 'description' as const,
          path: 'item.terms.descriptions.en',
          acceptedTypes: ['string'] as WikibaseDataType[], // Compatible
          language: 'en',
        },
      ]

      // Set up available targets
      dragDropStore.setAvailableTargets(targets)

      // Get valid targets from drag store
      const validTargets = dragDropStore.getValidTargetsForColumn(mockColumnInfo)

      // Should only include compatible targets
      expect(validTargets).toHaveLength(2)
      expect(validTargets.map((t) => t.type)).toEqual(['label', 'description'])

      // Validate each target using validation
      for (const target of validTargets) {
        const validationResult = validation.validateDragOperation(mockColumnInfo, target)
        expect(validationResult.isValid).toBe(true)
      }
    })

    it('should handle drag state changes with validation', () => {
      const validation = useValidation()

      // Set up available targets
      dragDropStore.setAvailableTargets([mockDropTarget])

      // Initially no drag operation
      expect(validation.isValidDragOperation.value).toBe(false)

      // Start drag operation
      dragDropStore.startDrag(mockColumnInfo)
      dragDropStore.setHoveredTarget(mockDropTarget.path)

      // Should be valid
      expect(validation.isValidDragOperation.value).toBe(true)

      // Change to incompatible column
      const incompatibleColumn: ColumnInfo = {
        name: 'numeric_column',
        dataType: 'INTEGER',
        sampleValues: ['1', '2'],
        nullable: false,
      }

      dragDropStore.startDrag(incompatibleColumn)
      dragDropStore.setHoveredTarget(mockDropTarget.path)

      // Should be invalid
      expect(validation.isValidDragOperation.value).toBe(false)

      // End drag operation
      dragDropStore.endDrag()

      // Should be false (no drag in progress)
      expect(validation.isValidDragOperation.value).toBe(false)
    })
  })

  describe('Complex Validation Scenarios', () => {
    it('should handle statement validation with property requirements', () => {
      const validation = useValidation()

      const statementTarget: DropTarget = {
        type: 'statement',
        path: 'item.statements[0].value',
        acceptedTypes: ['string'],
        propertyId: 'P31',
      }

      const statementTargetWithoutProperty: DropTarget = {
        type: 'statement',
        path: 'item.statements[1].value',
        acceptedTypes: ['string'],
        // Missing propertyId
      }

      // Valid statement target
      const validValidation = validation.validateDragOperation(mockColumnInfo, statementTarget)
      expect(validValidation.isValid).toBe(true)

      // Invalid statement target (missing property)
      const invalidValidation = validation.validateDragOperation(
        mockColumnInfo,
        statementTargetWithoutProperty,
      )
      expect(invalidValidation.isValid).toBe(false)
      expect(invalidValidation.errors[0]?.code).toBe('INVALID_PROPERTY_ID')
    })

    it('should handle length constraints for labels and aliases', () => {
      const validation = useValidation()

      const longValueColumn: ColumnInfo = {
        name: 'long_text',
        dataType: 'VARCHAR',
        sampleValues: ['a'.repeat(300)], // Very long value
        nullable: false,
      }

      const labelTarget = mockDropTarget
      const aliasTarget: DropTarget = {
        type: 'alias',
        path: 'item.terms.aliases.en[0]',
        acceptedTypes: ['string'],
        language: 'en',
      }

      // Both should fail due to length constraints
      const labelValidation = validation.validateDragOperation(longValueColumn, labelTarget)
      const aliasValidation = validation.validateDragOperation(longValueColumn, aliasTarget)

      expect(labelValidation.isValid).toBe(false)
      expect(aliasValidation.isValid).toBe(false)
      expect(labelValidation.errors[0]?.message).toContain('250 characters')
      expect(aliasValidation.errors[0]?.message).toContain('100 characters')
    })

    it('should provide appropriate validation suggestions', () => {
      const validation = useValidation()

      const incompatibleColumn: ColumnInfo = {
        name: 'numeric_column',
        dataType: 'INTEGER',
        sampleValues: ['1', '2'],
        nullable: true,
      }

      const requiredTarget: DropTarget = {
        ...mockDropTarget,
        isRequired: true,
      }

      const suggestions = validation.getValidationSuggestions(incompatibleColumn, requiredTarget)

      // Should suggest both data type and nullable fixes
      expect(suggestions).toHaveLength(2)
      expect(suggestions.some((s) => s.includes('data type'))).toBe(true)
      expect(suggestions.some((s) => s.includes('non-nullable'))).toBe(true)
    })
  })

  describe('Error Recovery and Cleanup', () => {
    it('should handle validation errors gracefully', () => {
      const validation = useValidation()

      // Test with malformed target
      const malformedTarget: DropTarget = {
        type: 'statement',
        path: 'invalid.path',
        acceptedTypes: [],
        // Missing required fields
      }

      // Should not throw errors
      expect(() => {
        validation.validateDragOperation(mockColumnInfo, malformedTarget)
      }).not.toThrow()

      // Should return invalid result
      const validationResult = validation.validateDragOperation(mockColumnInfo, malformedTarget)
      expect(validationResult.isValid).toBe(false)
    })

    it('should clean up validation state properly', () => {
      const validation = useValidation()

      // Add some validation errors
      validation.validateDragOperation(
        { ...mockColumnInfo, dataType: 'INTEGER' },
        mockDropTarget,
        true,
      )

      expect(validationStore.hasErrors).toBe(true)

      // Reset validation store
      validationStore.$reset()

      expect(validationStore.hasErrors).toBe(false)
      expect(validationStore.errorCount).toBe(0)
    })
  })
})
