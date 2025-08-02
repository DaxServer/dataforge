import { describe, it, expect, beforeEach } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useSchemaValidationUI } from '@frontend/composables/useSchemaValidationUI'
import { useDragDropStore } from '@frontend/stores/drag-drop.store'
import { useValidationStore } from '@frontend/stores/validation.store'
import type { ColumnInfo } from '@frontend/types/wikibase-schema'
import type { DropTarget } from '@frontend/types/drag-drop'

describe('useSchemaValidationUI', () => {
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

  describe('Reactive State', () => {
    it('should provide reactive drag state', () => {
      const ui = useSchemaValidationUI()

      expect(ui.isDragInProgress.value).toBe(false)

      dragDropStore.startDrag(mockColumnInfo)
      expect(ui.isDragInProgress.value).toBe(true)

      dragDropStore.endDrag()
      expect(ui.isDragInProgress.value).toBe(false)
    })

    it('should provide reactive validation state', () => {
      const ui = useSchemaValidationUI()

      expect(ui.hasValidationErrors.value).toBe(false)
      expect(ui.hasValidationWarnings.value).toBe(false)
      expect(ui.validationErrorCount.value).toBe(0)
      expect(ui.validationWarningCount.value).toBe(0)

      // Add an error
      validationStore.addError({
        type: 'error',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Test error',
        path: 'test.path',
      })

      expect(ui.hasValidationErrors.value).toBe(true)
      expect(ui.validationErrorCount.value).toBe(1)

      // Add a warning
      validationStore.addWarning({
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Test warning',
        path: 'test.path2',
      })

      expect(ui.hasValidationWarnings.value).toBe(true)
      expect(ui.validationWarningCount.value).toBe(1)
    })

    it('should provide current drag validation state', () => {
      const ui = useSchemaValidationUI()

      // Initially no drag validation
      expect(ui.currentDragValidation.value).toBeNull()
      expect(ui.currentDragFeedback.value).toBeNull()

      // Set up drag operation with a target that will be found
      const validTarget: DropTarget = {
        type: 'label',
        path: 'item.terms.labels.en',
        acceptedTypes: ['string'],
        language: 'en',
        isRequired: false,
      }

      dragDropStore.setAvailableTargets([validTarget])
      dragDropStore.startDrag(mockColumnInfo)
      dragDropStore.setHoveredTarget('item.terms.labels.en')

      // Should have validation state
      expect(ui.currentDragValidation.value).toBeDefined()
      expect(ui.currentDragValidation.value?.isValid).toBe(true)
      expect(ui.currentDragFeedback.value).toBeDefined()
      expect(ui.currentDragFeedback.value?.type).toBe('success')
    })
  })

  describe('Path Validation Status', () => {
    it('should get validation status for a path', () => {
      const ui = useSchemaValidationUI()
      const testPath = 'item.terms.labels.en'

      // Initially no errors
      const initialStatus = ui.getPathValidationStatus(testPath)
      expect(initialStatus.hasErrors).toBe(false)
      expect(initialStatus.hasWarnings).toBe(false)
      expect(initialStatus.errors).toHaveLength(0)
      expect(initialStatus.warnings).toHaveLength(0)

      // Add error for path
      validationStore.addError({
        type: 'error',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Test error',
        path: testPath,
      })

      const errorStatus = ui.getPathValidationStatus(testPath)
      expect(errorStatus.hasErrors).toBe(true)
      expect(errorStatus.errors).toHaveLength(1)
    })

    it('should get validation CSS classes', () => {
      const ui = useSchemaValidationUI()
      const testPath = 'item.terms.labels.en'

      // Initially neutral classes
      const initialClasses = ui.getValidationClasses(testPath)
      expect(initialClasses).toContain('border-surface-200')
      expect(initialClasses).toContain('bg-surface-0')

      // Add error
      validationStore.addError({
        type: 'error',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Test error',
        path: testPath,
      })

      const errorClasses = ui.getValidationClasses(testPath)
      expect(errorClasses).toContain('border-red-300')
      expect(errorClasses).toContain('bg-red-50')
      expect(errorClasses).toContain('text-red-900')

      // Clear error and add warning
      validationStore.clearErrorsForPath(testPath)
      validationStore.addWarning({
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Test warning',
        path: testPath,
      })

      const warningClasses = ui.getValidationClasses(testPath)
      expect(warningClasses).toContain('border-yellow-300')
      expect(warningClasses).toContain('bg-yellow-50')
      expect(warningClasses).toContain('text-yellow-900')
    })

    it('should get validation icons', () => {
      const ui = useSchemaValidationUI()
      const testPath = 'item.terms.labels.en'

      // Initially no icon
      expect(ui.getValidationIcon(testPath)).toBeNull()

      // Add error
      validationStore.addError({
        type: 'error',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Test error',
        path: testPath,
      })

      const errorIcon = ui.getValidationIcon(testPath)
      expect(errorIcon).toBeDefined()
      expect(errorIcon?.icon).toBe('pi pi-times-circle')
      expect(errorIcon?.class).toBe('text-red-500')
      expect(errorIcon?.severity).toBe('error')

      // Clear error and add warning
      validationStore.clearErrorsForPath(testPath)
      validationStore.addWarning({
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Test warning',
        path: testPath,
      })

      const warningIcon = ui.getValidationIcon(testPath)
      expect(warningIcon).toBeDefined()
      expect(warningIcon?.icon).toBe('pi pi-exclamation-triangle')
      expect(warningIcon?.class).toBe('text-yellow-500')
      expect(warningIcon?.severity).toBe('warning')
    })
  })

  describe('Drop Zone Classes', () => {
    it('should provide appropriate classes when no drag is in progress', () => {
      const ui = useSchemaValidationUI()
      const classes = ui.getDropZoneClasses('item.terms.labels.en')

      expect(classes).toContain('drop-zone')
      expect(classes).toContain('transition-colors')
      expect(classes).toContain('border-surface-200')
    })

    it('should provide valid target classes during drag with compatible column', () => {
      const ui = useSchemaValidationUI()

      // Create a target that will definitely be valid for VARCHAR columns
      const validTarget: DropTarget = {
        type: 'label',
        path: 'item.terms.labels.en',
        acceptedTypes: ['string'],
        language: 'en',
        isRequired: false,
      }

      // Set up drag operation with compatible column
      dragDropStore.setAvailableTargets([validTarget])
      dragDropStore.startDrag(mockColumnInfo)

      // Verify the target is considered valid
      const validTargets = dragDropStore.getValidTargetsForColumn(mockColumnInfo)
      expect(validTargets.length).toBeGreaterThan(0)
      expect(dragDropStore.validDropTargets).toContain('item.terms.labels.en')

      // Valid target, not hovered
      const validClasses = ui.getDropZoneClasses('item.terms.labels.en')
      expect(validClasses).toContain('border-green-300')
      expect(validClasses).toContain('bg-green-25')
      expect(validClasses).toContain('border-dashed')

      // Valid target, hovered
      dragDropStore.setHoveredTarget('item.terms.labels.en')
      const hoveredValidClasses = ui.getDropZoneClasses('item.terms.labels.en')
      expect(hoveredValidClasses).toContain('border-green-400')
      expect(hoveredValidClasses).toContain('bg-green-50')
      expect(hoveredValidClasses).toContain('border-2')
    })

    it('should provide invalid target classes during drag', () => {
      const ui = useSchemaValidationUI()

      // Set up drag operation with incompatible column
      const incompatibleColumn: ColumnInfo = {
        name: 'numeric_column',
        dataType: 'INTEGER',
        sampleValues: ['1', '2'],
        nullable: false,
      }

      dragDropStore.setAvailableTargets([mockDropTarget])
      dragDropStore.startDrag(incompatibleColumn)

      // Invalid target, not hovered
      const invalidClasses = ui.getDropZoneClasses('item.terms.labels.en')
      expect(invalidClasses).toContain('border-surface-200')
      expect(invalidClasses).toContain('opacity-50')

      // Invalid target, hovered
      dragDropStore.setHoveredTarget('item.terms.labels.en')
      const hoveredInvalidClasses = ui.getDropZoneClasses('item.terms.labels.en')
      expect(hoveredInvalidClasses).toContain('border-red-400')
      expect(hoveredInvalidClasses).toContain('bg-red-50')
      expect(hoveredInvalidClasses).toContain('border-2')
    })
  })

  describe('Validation Methods', () => {
    it('should check if column can be dropped on target', () => {
      const ui = useSchemaValidationUI()

      // Compatible column and target
      expect(ui.canDropColumn(mockColumnInfo, mockDropTarget)).toBe(true)

      // Incompatible column and target
      const incompatibleColumn: ColumnInfo = {
        name: 'numeric_column',
        dataType: 'INTEGER',
        sampleValues: ['1', '2'],
        nullable: false,
      }
      expect(ui.canDropColumn(incompatibleColumn, mockDropTarget)).toBe(false)
    })

    it('should validate mapping and add to store', () => {
      const ui = useSchemaValidationUI()

      const incompatibleColumn: ColumnInfo = {
        name: 'numeric_column',
        dataType: 'INTEGER',
        sampleValues: ['1', '2'],
        nullable: false,
      }

      const validation = ui.validateMapping(incompatibleColumn, mockDropTarget)

      expect(validation.isValid).toBe(false)
      expect(validationStore.hasErrorsForPath(mockDropTarget.path)).toBe(true)
    })

    it('should get mapping suggestions', () => {
      const ui = useSchemaValidationUI()

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

      const suggestions = ui.getMappingSuggestions(incompatibleColumn, requiredTarget)

      expect(suggestions).toHaveLength(2)
      expect(suggestions.some((s) => s.includes('data type'))).toBe(true)
      expect(suggestions.some((s) => s.includes('non-nullable'))).toBe(true)
    })
  })

  describe('Control Methods', () => {
    it('should enable and disable real-time validation', () => {
      const ui = useSchemaValidationUI()

      expect(ui.realTimeValidation.isRealTimeValidationActive.value).toBe(false)

      ui.enableRealTimeValidation()
      expect(ui.realTimeValidation.isRealTimeValidationActive.value).toBe(true)

      ui.disableRealTimeValidation()
      expect(ui.realTimeValidation.isRealTimeValidationActive.value).toBe(false)
    })

    it('should clear validation', () => {
      const ui = useSchemaValidationUI()

      // Add some validation errors
      validationStore.addError({
        type: 'error',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Test error',
        path: 'test.path1',
      })
      validationStore.addError({
        type: 'error',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Test error',
        path: 'test.path2',
      })

      expect(validationStore.errorCount).toBe(2)

      // Clear specific path
      ui.clearPathValidation('test.path1', true)
      expect(validationStore.errorCount).toBe(1)

      // Clear all validation
      ui.clearAllValidation()
      expect(validationStore.errorCount).toBe(0)
    })
  })

  describe('Direct Access', () => {
    it('should provide direct access to underlying composables', () => {
      const ui = useSchemaValidationUI()

      expect(ui.realTimeValidation).toBeDefined()
      expect(ui.dragDropStore).toBeDefined()
      expect(ui.validationStore).toBeDefined()

      // Should be the same instances
      expect(ui.dragDropStore).toBe(dragDropStore)
      expect(ui.validationStore).toBe(validationStore)
    })
  })
})
