import { ref } from 'vue'
import { useDragDropStore } from '@frontend/features/data-processing/stores/drag-drop.store'
import { useDataTypeCompatibility } from '@frontend/features/data-processing/composables/useDataTypeCompatibility'
import { useDragDropHandlers } from '@frontend/shared/composables/useDragDropHandlers'
import { useValidation } from '@frontend/features/wikibase-schema/composables/useValidation'
import type {
  SchemaDragDropContext,
  DropTarget,
  DropFeedback,
  DropValidation,
  DropZoneConfig,
} from '@frontend/shared/types/drag-drop'
import type { ColumnInfo } from '@frontend/shared/types/wikibase-schema'
import type { WikibaseDataType } from '@backend/api/project/project.wikibase'

// Helper functions for path parsing
const getTargetTypeFromPath = (path: string): DropTarget['type'] => {
  if (path.includes('.labels.')) return 'label'
  if (path.includes('.descriptions.')) return 'description'
  if (path.includes('.aliases.')) return 'alias'
  if (path.includes('.qualifiers.')) return 'qualifier'
  if (path.includes('.references.')) return 'reference'
  if (path.includes('.statements.')) return 'statement'
  return 'statement' // default
}

const extractLanguageFromPath = (path: string): string | undefined => {
  const match = path.match(/\.(labels|descriptions|aliases)\.([a-z]{2,3})/)
  return match ? match[2] : undefined
}

const extractPropertyIdFromPath = (): string | undefined => {
  // This would extract property ID from context or path metadata
  // For now, return undefined as property IDs are typically set separately
  return undefined
}

/**
 * Composable for managing drag and drop context in the schema editor
 * Integrates with the global drag-drop store for state management
 */
export const useDragDropContext = (): SchemaDragDropContext & {
  startDrag: (columnInfo: ColumnInfo, sourceElement: HTMLElement) => void
  endDrag: () => void
  enterDropZone: (targetPath: string) => void
  leaveDropZone: () => void
  validateDrop: (columnInfo: ColumnInfo, target: DropTarget) => DropValidation
  performDrop: (columnInfo: ColumnInfo, target: DropTarget) => Promise<boolean>
  createDropZoneConfig: (
    targetPath: string,
    acceptedTypes: WikibaseDataType[],
    onDropCallback: (columnInfo: ColumnInfo, target: DropTarget) => Promise<void> | void,
  ) => DropZoneConfig
} => {
  // Use the global drag-drop store and validation
  const store = useDragDropStore()
  const { isDataTypeCompatible } = useDataTypeCompatibility()
  const { createDragOverHandler } = useDragDropHandlers()
  const validation = useValidation()

  const isOverDropZone = ref(false)
  const dropFeedback = ref<DropFeedback | null>(null)

  // Store reference to dragstart listener for cleanup
  const dragStartListeners = new WeakMap<HTMLElement, (event: DragEvent) => void>()

  // Utility methods that coordinate with the store
  const startDrag = (columnInfo: ColumnInfo, sourceElement: HTMLElement): void => {
    // Update global store state
    store.startDrag(columnInfo)

    // Clear local feedback
    dropFeedback.value = null

    // Store drag data for HTML5 drag and drop
    if (sourceElement.draggable) {
      // Remove existing listener if it exists
      const existingListener = dragStartListeners.get(sourceElement)
      if (existingListener) {
        sourceElement.removeEventListener('dragstart', existingListener)
      }

      // Create new listener that triggers validation on dragstart
      const dragStartHandler = (event: DragEvent) => {
        event.dataTransfer?.setData('application/x-column-data', JSON.stringify(columnInfo))
        event.dataTransfer?.setData('text/plain', columnInfo.name)
        
        // Trigger validation immediately on dragstart event
        // This ensures validation is always active and triggers synchronously
        validation.triggerDragStartValidation(columnInfo)
      }

      // Add new listener and store reference
      sourceElement.addEventListener('dragstart', dragStartHandler)
      dragStartListeners.set(sourceElement, dragStartHandler)
    }
  }

  const endDrag = (): void => {
    // Update global store state
    store.endDrag()

    // Clear local state
    isOverDropZone.value = false
    dropFeedback.value = null
  }

  const enterDropZone = (targetPath: string): void => {
    isOverDropZone.value = true
    store.setHoveredTarget(targetPath)

    // Update feedback based on validation
    if (store.draggedColumn) {
      const target = store.availableTargets.find((t) => t.path === targetPath)
      if (target) {
        const feedback = validation.getValidationFeedback(store.draggedColumn, target)
        dropFeedback.value = feedback
      }
    }
  }

  const leaveDropZone = (): void => {
    isOverDropZone.value = false
    store.setHoveredTarget(null)
    dropFeedback.value = null
  }

  const validateDrop = (columnInfo: ColumnInfo, target: DropTarget): DropValidation => {
    // Use the validation system for consistency
    const validationResult = validation.validateDragOperation(columnInfo, target)

    if (validationResult.isValid) {
      return {
        isValid: true,
        reason: 'Compatible mapping',
      }
    } else {
      const primaryError = validationResult.errors[0]
      return {
        isValid: false,
        reason: primaryError?.message || 'Invalid mapping',
      }
    }
  }

  const performDrop = async (columnInfo: ColumnInfo, target: DropTarget): Promise<boolean> => {
    const validation = validateDrop(columnInfo, target)

    if (!validation.isValid) {
      dropFeedback.value = {
        type: 'error',
        message: validation.reason || 'Drop operation failed',
      }
      return false
    }

    // Update store state to dropping
    store.setDragState('dropping')

    let success = false

    try {
      // Perform the actual drop operation (e.g., API call, store update)
      // This would be replaced with actual async logic like:
      // await schemaStore.updateMapping(dropEventData)
      // or emit an event: emit('drop', dropEventData)

      // For now, simulate async operation with a Promise
      await new Promise<void>((resolve) => {
        // This could be replaced with actual async operations like:
        // - API calls to save the mapping
        // - Store actions to update the schema
        // - Event emission to parent components
        setTimeout(resolve, 100)
      })

      // Success feedback after async operation completes
      dropFeedback.value = {
        type: 'success',
        message: `Successfully mapped '${columnInfo.name}' to ${target.type}`,
      }

      success = true
    } catch {
      // Handle async operation errors
      dropFeedback.value = {
        type: 'error',
        message: 'Failed to complete drop operation',
      }

      success = false
    } finally {
      // Clear drag state but preserve feedback for UI
      store.endDrag()
      isOverDropZone.value = false
      // Don't clear dropFeedback here so it can be checked by tests/UI
    }

    return success
  }

  /**
   * Create a drop zone configuration for HTML5 drag and drop
   */
  const createDropZoneConfig = (
    targetPath: string,
    acceptedTypes: WikibaseDataType[],
    onDropCallback: (columnInfo: ColumnInfo, target: DropTarget) => Promise<void> | void,
  ): DropZoneConfig => {
    return {
      acceptedDataTypes: ['application/x-column-data'],

      // Use shared drag over handler for consistent cursor behavior
      onDragOver: createDragOverHandler(acceptedTypes),

      onDragEnter: (event: DragEvent) => {
        event.preventDefault()
        // Visual feedback would be handled by the component
      },

      onDragLeave: (event: DragEvent) => {
        event.preventDefault()
        // Visual feedback would be handled by the component
      },

      onDrop: (event: DragEvent) => {
        event.preventDefault()

        const columnData = event.dataTransfer?.getData('application/x-column-data')
        if (!columnData) return

        try {
          const columnInfo = JSON.parse(columnData) as ColumnInfo
          const target: DropTarget = {
            type: getTargetTypeFromPath(targetPath),
            path: targetPath,
            acceptedTypes,
            language: extractLanguageFromPath(targetPath),
            propertyId: extractPropertyIdFromPath(),
          }

          const result = onDropCallback(columnInfo, target)
          if (result instanceof Promise) {
            result.catch((error) => {
              console.error('Failed to handle drop:', error)
            })
          }
        } catch (error) {
          console.error('Failed to parse drop data:', error)
        }
      },

      validateDrop: (data: string) => {
        try {
          const columnInfo = JSON.parse(data) as ColumnInfo
          return isDataTypeCompatible(columnInfo.dataType, acceptedTypes)
        } catch {
          return false
        }
      },
    }
  }

  return {
    isOverDropZone,
    dropFeedback,
    createDropZoneConfig,
    startDrag,
    endDrag,
    enterDropZone,
    leaveDropZone,
    validateDrop,
    performDrop,
  }
}
