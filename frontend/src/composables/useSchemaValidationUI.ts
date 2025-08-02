import { computed } from 'vue'
import { useRealTimeValidation } from '@frontend/composables/useRealTimeValidation'
import { useDragDropStore } from '@frontend/stores/drag-drop.store'
import { useValidationStore } from '@frontend/stores/validation.store'
import { useDropZoneStyling } from '@frontend/composables/useDropZoneStyling'
import { useValidationCore } from '@frontend/composables/useValidationCore'
import type { ColumnInfo } from '@frontend/types/wikibase-schema'
import type { DropTarget } from '@frontend/types/drag-drop'

/**
 * Simplified UI composable that wraps shared validation and styling logic
 */
export const useSchemaValidationUI = () => {
  const realTimeValidation = useRealTimeValidation()
  const dragDropStore = useDragDropStore()
  const validationStore = useValidationStore()
  const { getDropZoneClasses, isValidDragForStyling } = useDropZoneStyling()
  const { validateColumnForTarget } = useValidationCore()

  // Reactive state from stores
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

  // Simplified methods using shared logic
  const getPathValidationStatus = (path: string) => {
    return {
      hasErrors: validationStore.hasErrorsForPath(path),
      hasWarnings: validationStore.hasWarningsForPath(path),
      errors: validationStore.getErrorsForPath(path),
      warnings: validationStore.getWarningsForPath(path),
    }
  }

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

  const canDropColumn = (columnInfo: ColumnInfo, target: DropTarget): boolean => {
    return validateColumnForTarget(columnInfo, target).isValid
  }

  const getDropZoneClassesForPath = (targetPath: string) => {
    const target = dragDropStore.availableTargets.find((t) => t.path === targetPath)
    if (!target) {
      return ['drop-zone', 'transition-colors', 'border-surface-200']
    }
    return getDropZoneClasses(target)
  }

  const validateMapping = (columnInfo: ColumnInfo, target: DropTarget) => {
    return realTimeValidation.validateDragOperation(columnInfo, target, true)
  }

  const getMappingSuggestions = (columnInfo: ColumnInfo, target: DropTarget): string[] => {
    return realTimeValidation.getValidationSuggestions(columnInfo, target)
  }

  // Control methods
  const enableRealTimeValidation = () => {
    realTimeValidation.startRealTimeValidation()
  }

  const disableRealTimeValidation = () => {
    realTimeValidation.stopRealTimeValidation()
  }

  const clearAllValidation = () => {
    validationStore.$reset()
  }

  const clearPathValidation = (path: string, exactMatch = false) => {
    validationStore.clearErrorsForPath(path, exactMatch)
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
    isValidDragForStyling,

    // Validation methods
    getPathValidationStatus,
    canDropColumn,
    validateMapping,
    getMappingSuggestions,

    // UI helper methods
    getValidationClasses,
    getValidationIcon,
    getDropZoneClasses: getDropZoneClassesForPath,

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
