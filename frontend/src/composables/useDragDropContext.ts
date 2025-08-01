import { ref } from 'vue'
import { useDragDropStore } from '@frontend/stores/drag-drop.store'
import { useDataTypeCompatibility } from '@frontend/composables/useDataTypeCompatibility'
import { useDragDropHandlers } from '@frontend/composables/useDragDropHandlers'
import { useRealTimeValidation } from '@frontend/composables/useRealTimeValidation'
import type {
  SchemaDragDropContext,
  DropTarget,
  DropFeedback,
  DropValidation,
  DropZoneConfig,
} from '@frontend/types/drag-drop'
import type { ColumnInfo, WikibaseDataType } from '@frontend/types/wikibase-schema'

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
  // Use the global drag-drop store and real-time validation
  const store = useDragDropStore()
  const { isDataTypeCompatible } = useDataTypeCompatibility()
  const { createDragOverHandler } = useDragDropHandlers()
  const realTimeValidation = useRealTimeValidation()

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

      // Create new listener
      const dragStartHandler = (event: DragEvent) => {
        event.dataTransfer?.setData('application/x-column-data', JSON.stringify(columnInfo))
        event.dataTransfer?.setData('text/plain', columnInfo.name)
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

    // Update feedback based on validation using real-time validation
    if (store.draggedColumn) {
      const target = store.availableTargets.find((t) => t.path === targetPath)
      if (target) {
        const feedback = realTimeValidation.getValidationFeedback(store.draggedColumn, target)
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
    // Use the real-time validation system for consistency
    const validation = realTimeValidation.validateDragOperation(columnInfo, target)

    if (validation.isValid) {
      return {
        isValid: true,
        reason: 'Compatible mapping',
      }
    } else {
      const primaryError = validation.errors[0]
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
