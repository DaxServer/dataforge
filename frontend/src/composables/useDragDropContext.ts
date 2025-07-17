import { ref, computed } from 'vue'
import type {
  SchemaDragDropContext,
  DropTarget,
  DropFeedback,
  DragState,
  DropValidation,
  DropEventData,
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

const extractPropertyIdFromPath = (path: string): string | undefined => {
  // This would extract property ID from context or path metadata
  // For now, return undefined as property IDs are typically set separately
  return undefined
}

const isDataTypeCompatible = (columnType: string, acceptedTypes: WikibaseDataType[]): boolean => {
  const compatibilityMap: Record<string, WikibaseDataType[]> = {
    VARCHAR: ['string', 'url', 'external-id', 'monolingualtext'],
    TEXT: ['string', 'monolingualtext'],
    STRING: ['string', 'url', 'external-id', 'monolingualtext'],
    INTEGER: ['quantity'],
    DECIMAL: ['quantity'],
    NUMERIC: ['quantity'],
    FLOAT: ['quantity'],
    DOUBLE: ['quantity'],
    DATE: ['time'],
    DATETIME: ['time'],
    TIMESTAMP: ['time'],
    BOOLEAN: [],
    JSON: ['string'], // JSON can be serialized to string
    ARRAY: ['string'], // Arrays can be serialized to string
  }

  const compatibleTypes = compatibilityMap[columnType.toUpperCase()] || []
  return acceptedTypes.some((type) => compatibleTypes.includes(type))
}

/**
 * Composable for managing drag and drop context in the schema editor
 */
export const useDragDropContext = (): SchemaDragDropContext & {
  // Additional utility methods
  startDrag: (column: ColumnInfo, sourceElement: HTMLElement) => void
  endDrag: () => void
  enterDropZone: (targetPath: string) => void
  leaveDropZone: () => void
  validateDrop: (column: ColumnInfo, target: DropTarget) => DropValidation
  performDrop: (column: ColumnInfo, target: DropTarget) => Promise<boolean>
  getValidTargetsForColumn: (column: ColumnInfo) => DropTarget[]
  setAvailableTargets: (targets: DropTarget[]) => void
} => {
  // Core reactive state
  const draggedColumn = ref<ColumnInfo | null>(null)
  const dragState = ref<DragState>('idle')
  const isOverDropZone = ref(false)
  const hoveredTarget = ref<string | null>(null)
  const dropFeedback = ref<DropFeedback | null>(null)

  // Available drop targets (would be populated from schema configuration)
  const availableTargets = ref<DropTarget[]>([])

  // Store reference to dragstart listener for cleanup
  const dragStartListeners = new WeakMap<HTMLElement, (event: DragEvent) => void>()

  // Computed properties
  const validDropTargets = computed(() => {
    if (!draggedColumn.value) return []
    return getValidTargetsForColumn(draggedColumn.value)
  })

  const isValidDrop = computed(() => {
    if (!draggedColumn.value || !hoveredTarget.value) return false
    const target = availableTargets.value.find((t) => t.path === hoveredTarget.value)
    if (!target) return false
    return validateDrop(draggedColumn.value, target).isValid
  })

  // Utility methods
  const startDrag = (column: ColumnInfo, sourceElement: HTMLElement): void => {
    draggedColumn.value = column
    dragState.value = 'dragging'
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
        event.dataTransfer?.setData('application/x-column-data', JSON.stringify(column))
        event.dataTransfer?.setData('text/plain', column.name)
      }

      // Add new listener and store reference
      sourceElement.addEventListener('dragstart', dragStartHandler)
      dragStartListeners.set(sourceElement, dragStartHandler)
    }
  }

  const endDrag = (): void => {
    draggedColumn.value = null
    dragState.value = 'idle'
    isOverDropZone.value = false
    hoveredTarget.value = null
    dropFeedback.value = null
  }

  const enterDropZone = (targetPath: string): void => {
    isOverDropZone.value = true
    hoveredTarget.value = targetPath

    // Update feedback based on validation
    if (draggedColumn.value) {
      const target = availableTargets.value.find((t) => t.path === targetPath)
      if (target) {
        const validation = validateDrop(draggedColumn.value, target)
        dropFeedback.value = {
          type: validation.isValid ? 'success' : 'error',
          message:
            validation.reason || (validation.isValid ? 'Valid drop target' : 'Invalid drop target'),
        }
      }
    }
  }

  const leaveDropZone = (): void => {
    isOverDropZone.value = false
    hoveredTarget.value = null
    dropFeedback.value = null
  }

  const validateDrop = (column: ColumnInfo, target: DropTarget): DropValidation => {
    // Check data type compatibility
    const isCompatible = isDataTypeCompatible(column.dataType, target.acceptedTypes)

    if (!isCompatible) {
      return {
        isValid: false,
        reason: `Column type '${column.dataType}' is not compatible with target types: ${target.acceptedTypes.join(', ')}`,
      }
    }

    // Check for nullable constraints
    if (target.isRequired && column.nullable) {
      return {
        isValid: false,
        reason: 'Required field cannot accept nullable column',
      }
    }

    // Additional validation based on target type
    const typeValidation = validateByTargetType(column, target)
    if (!typeValidation.isValid) {
      return typeValidation
    }

    return {
      isValid: true,
      reason: 'Compatible mapping',
    }
  }

  const performDrop = async (column: ColumnInfo, target: DropTarget): Promise<boolean> => {
    const validation = validateDrop(column, target)

    if (!validation.isValid) {
      dropFeedback.value = {
        type: 'error',
        message: validation.reason || 'Drop operation failed',
      }
      return false
    }

    // Create drop event data
    const dropEventData: DropEventData = {
      column,
      target,
      position: { x: 0, y: 0 }, // Would be populated from actual mouse position
      timestamp: Date.now(),
    }

    // Emit drop event or call callback
    // This would typically trigger a store action to update the schema mapping

    dragState.value = 'dropping'

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
        message: `Successfully mapped '${column.name}' to ${target.type}`,
      }

      success = true
    } catch (error) {
      // Handle async operation errors
      dropFeedback.value = {
        type: 'error',
        message: 'Failed to complete drop operation',
      }

      success = false
    } finally {
      // Clear drag state but preserve feedback for UI
      draggedColumn.value = null
      dragState.value = 'idle'
      isOverDropZone.value = false
      hoveredTarget.value = null
      // Don't clear dropFeedback here so it can be checked by tests/UI
    }

    return success
  }

  const getValidTargetsForColumn = (column: ColumnInfo): DropTarget[] => {
    return availableTargets.value.filter((target) => validateDrop(column, target).isValid)
  }

  const validateByTargetType = (column: ColumnInfo, target: DropTarget): DropValidation => {
    switch (target.type) {
      case 'label':
      case 'description':
      case 'alias':
        // Terms should be text-based and reasonably short for labels/aliases
        if (target.type === 'label' || target.type === 'alias') {
          const maxLength = target.type === 'label' ? 250 : 100
          const hasLongValues = column.sampleValues?.some((val) => val.length > maxLength)
          if (hasLongValues) {
            return {
              isValid: false,
              reason: `${target.type} values should be shorter than ${maxLength} characters`,
            }
          }
        }
        break

      case 'statement':
        // Statements need property validation
        if (!target.propertyId) {
          return {
            isValid: false,
            reason: 'Statement target must have a property ID',
          }
        }
        break

      case 'qualifier':
      case 'reference':
        // Qualifiers and references also need property validation
        if (!target.propertyId) {
          return {
            isValid: false,
            reason: `${target.type} target must have a property ID`,
          }
        }
        break
    }

    return { isValid: true }
  }

  // Method to set available targets (would be called when schema is loaded)
  const setAvailableTargets = (targets: DropTarget[]): void => {
    availableTargets.value = targets
  }

  return {
    // Core context properties
    draggedColumn,
    dragState,
    isOverDropZone,
    hoveredTarget,
    validDropTargets,
    isValidDrop,
    dropFeedback,

    // Utility methods
    startDrag,
    endDrag,
    enterDropZone,
    leaveDropZone,
    validateDrop,
    performDrop,
    getValidTargetsForColumn,
    setAvailableTargets,
  }
}

/**
 * Create a drop zone configuration for HTML5 drag and drop
 */
export const createDropZoneConfig = (
  targetPath: string,
  acceptedTypes: WikibaseDataType[],
  onDropCallback: (column: ColumnInfo, target: DropTarget) => Promise<void> | void,
): DropZoneConfig => {
  return {
    acceptedDataTypes: ['application/x-column-data'],

    onDragOver: (event: DragEvent) => {
      event.preventDefault()
      event.dataTransfer!.dropEffect = 'copy'
    },

    onDragEnter: (event: DragEvent) => {
      event.preventDefault()
      // Visual feedback would be handled by the component
    },

    onDragLeave: (event: DragEvent) => {
      event.preventDefault()
      // Visual feedback would be handled by the component
    },

    onDrop: async (event: DragEvent) => {
      event.preventDefault()

      const columnData = event.dataTransfer?.getData('application/x-column-data')
      if (!columnData) return

      try {
        const column = JSON.parse(columnData) as ColumnInfo
        const target: DropTarget = {
          type: getTargetTypeFromPath(targetPath),
          path: targetPath,
          acceptedTypes,
          language: extractLanguageFromPath(targetPath),
          propertyId: extractPropertyIdFromPath(targetPath),
        }

        await onDropCallback(column, target)
      } catch (error) {
        console.error('Failed to parse drop data:', error)
      }
    },

    validateDrop: (data: string) => {
      try {
        const column = JSON.parse(data) as ColumnInfo
        return isDataTypeCompatible(column.dataType, acceptedTypes)
      } catch {
        return false
      }
    },
  }
}
