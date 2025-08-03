import { computed } from 'vue'
import { useDragDropStore } from '@frontend/features/data-processing/stores/drag-drop.store'
import { useValidationCore } from '@frontend/features/wikibase-schema/composables/useValidationCore'
import type { DropTarget } from '@frontend/shared/types/drag-drop'

/**
 * Common drop zone styling logic
 */
export const useDropZoneStyling = () => {
  const dragDropStore = useDragDropStore()
  const { validateForStyling } = useValidationCore()

  /**
   * Get CSS classes for drop zone based on current drag state
   */
  const getDropZoneClasses = (target: DropTarget) => {
    const baseClasses = ['drop-zone', 'transition-colors', 'duration-200']

    if (!dragDropStore.draggedColumn) {
      return [...baseClasses, 'border-surface-200']
    }

    const validation = validateForStyling(dragDropStore.draggedColumn, target)
    const isValidTarget = validation.isValid
    const isHovered = dragDropStore.hoveredTarget === target.path

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

  /**
   * Get CSS classes object for Vue class binding
   */
  const getDropZoneClassObject = (target: DropTarget, isOverDropZone = false) => {
    if (!dragDropStore.draggedColumn) {
      return {
        'border-primary-400 bg-primary-50': isOverDropZone,
      }
    }

    const isValidTarget = validateForStyling(dragDropStore.draggedColumn, target).isValid

    return {
      'border-primary-400 bg-primary-50': isOverDropZone,
      'border-green-400 bg-green-50': dragDropStore.isDragging && isValidTarget,
      'border-red-400 bg-red-50': dragDropStore.isDragging && !isValidTarget,
    }
  }

  /**
   * Check if current drag operation is valid for styling
   */
  const isValidDragForStyling = computed(() => {
    if (!dragDropStore.draggedColumn || !dragDropStore.hoveredTarget) {
      return false
    }

    // Find the target being hovered
    const target = dragDropStore.availableTargets.find(
      (t) => t.path === dragDropStore.hoveredTarget,
    )
    if (!target) return false

    return validateForStyling(dragDropStore.draggedColumn, target).isValid
  })

  return {
    getDropZoneClasses,
    getDropZoneClassObject,
    isValidDragForStyling,
  }
}
