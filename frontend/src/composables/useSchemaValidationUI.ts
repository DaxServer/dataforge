import { computed } from 'vue'
import { useRealTimeValidation } from '@frontend/composables/useRealTimeValidation'
import { useDragDropStore } from '@frontend/stores/drag-drop.store'
import { useValidationStore } from '@frontend/stores/validation.store'
import type { ColumnInfo } from '@frontend/types/wikibase-schema'
import type { DropTarget } from '@frontend/types/drag-drop'

/**
 * Composable for integrating real-time validation with UI components
 * Provides easy-to-use reactive properties and methods for schema validation UI
 */
export const useSchemaValidationUI = () => {
  const realTimeValidation = useRealTimeValidation()
  const dragDropStore = useDragDropStore()
  const validationStore = useValidationStore()

  // Computed properties for UI state
  const isDragInProgress = computed(() => dragDropStore.isDragging)
  const hasValidationErrors = computed(() => validationStore.hasErrors)
  const hasValidationWarnings = computed(() => validationStore.hasWarnings)
  const validationErrorCount = computed(() => validationStore.errorCount)
  const validationWarningCount = computed(() => validationStore.warningCount)

  // Current drag validation state
  const currentDragValidation = computed(() => {
    if (!dragDropStore.draggedColumn || !dragDropStore.hoveredTarget) {
      return null
    }

    const target = dragDropStore.availableTargets.find(
      (t) => t.path === dragDropStore.hoveredTarget,
    )
    if (!target) return null

    return realTimeValidation.validateDragOperation(dragDropStore.draggedColumn, target)
  })

  // UI feedback for current drag operation
  const currentDragFeedback = computed(() => {
    if (!dragDropStore.draggedColumn || !dragDropStore.hoveredTarget) {
      return null
    }

    const target = dragDropStore.availableTargets.find(
      (t) => t.path === dragDropStore.hoveredTarget,
    )
    if (!target) return null

    return realTimeValidation.getValidationFeedback(dragDropStore.draggedColumn, target)
  })

  // Get validation status for a specific path
  const getPathValidationStatus = (path: string) => {
    return {
      hasErrors: validationStore.hasErrorsForPath(path),
      hasWarnings: validationStore.hasWarningsForPath(path),
      errors: validationStore.getErrorsForPath(path),
      warnings: validationStore.getWarningsForPath(path),
    }
  }

  // Get validation CSS classes for styling
  const getValidationClasses = (path: string) => {
    const status = getPathValidationStatus(path)

    if (status.hasErrors) {
      return ['border-red-300', 'bg-red-50', 'text-red-900']
    } else if (status.hasWarnings) {
      return ['border-yellow-300', 'bg-yellow-50', 'text-yellow-900']
    } else {
      return ['border-surface-200', 'bg-surface-0']
    }
  }

  // Get validation icon for a path
  const getValidationIcon = (path: string) => {
    const status = getPathValidationStatus(path)

    if (status.hasErrors) {
      return {
        icon: 'pi pi-times-circle',
        class: 'text-red-500',
        severity: 'error' as const,
      }
    } else if (status.hasWarnings) {
      return {
        icon: 'pi pi-exclamation-triangle',
        class: 'text-yellow-500',
        severity: 'warning' as const,
      }
    } else {
      return null
    }
  }

  // Check if a column can be dropped on a target
  const canDropColumn = (column: ColumnInfo, target: DropTarget): boolean => {
    const validation = realTimeValidation.validateDragOperation(column, target)
    return validation.isValid
  }

  // Get drop zone classes based on current drag state
  const getDropZoneClasses = (targetPath: string, acceptedTypes: string[]) => {
    const baseClasses = ['drop-zone', 'transition-colors', 'duration-200']

    if (!dragDropStore.draggedColumn) {
      return [...baseClasses, 'border-surface-200']
    }

    const isValidTarget = dragDropStore.validDropTargets.includes(targetPath)
    const isHovered = dragDropStore.hoveredTarget === targetPath

    if (isValidTarget) {
      if (isHovered) {
        return [...baseClasses, 'border-green-400', 'bg-green-50', 'border-2']
      } else {
        return [...baseClasses, 'border-green-300', 'bg-green-25', 'border-dashed']
      }
    } else {
      if (isHovered) {
        return [...baseClasses, 'border-red-400', 'bg-red-50', 'border-2']
      } else {
        return [...baseClasses, 'border-surface-200', 'opacity-50']
      }
    }
  }

  // Start real-time validation (typically called in component setup)
  const enableRealTimeValidation = () => {
    realTimeValidation.startRealTimeValidation()
  }

  // Stop real-time validation (typically called in component cleanup)
  const disableRealTimeValidation = () => {
    realTimeValidation.stopRealTimeValidation()
  }

  // Clear all validation errors
  const clearAllValidation = () => {
    validationStore.$reset()
  }

  // Clear validation for a specific path
  const clearPathValidation = (path: string, exactMatch = false) => {
    validationStore.clearErrorsForPath(path, exactMatch)
  }

  // Validate a specific mapping and add to store
  const validateMapping = (column: ColumnInfo, target: DropTarget) => {
    return realTimeValidation.validateDragOperation(column, target, true)
  }

  // Get suggestions for improving a mapping
  const getMappingSuggestions = (column: ColumnInfo, target: DropTarget): string[] => {
    return realTimeValidation.getValidationSuggestions(column, target)
  }

  return {
    // Reactive state
    isDragInProgress,
    hasValidationErrors,
    hasValidationWarnings,
    validationErrorCount,
    validationWarningCount,
    currentDragValidation,
    currentDragFeedback,

    // Validation methods
    getPathValidationStatus,
    canDropColumn,
    validateMapping,
    getMappingSuggestions,

    // UI helper methods
    getValidationClasses,
    getValidationIcon,
    getDropZoneClasses,

    // Control methods
    enableRealTimeValidation,
    disableRealTimeValidation,
    clearAllValidation,
    clearPathValidation,

    // Direct access to underlying composables
    realTimeValidation,
    dragDropStore,
    validationStore,
  }
}
