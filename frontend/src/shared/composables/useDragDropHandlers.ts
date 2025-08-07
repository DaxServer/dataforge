import { useDragDropStore } from '@frontend/features/data-processing/stores/drag-drop.store'
import { useDataTypeCompatibility } from '@frontend/features/data-processing/composables/useDataTypeCompatibility'
import type { ColumnInfo } from '@frontend/shared/types/wikibase-schema'
import type { WikibaseDataType } from '@backend/api/project/project.wikibase'

/**
 * Shared composable for common drag and drop event handling logic
 * Provides consistent cursor behavior and validation across all drop zones
 */
export const useDragDropHandlers = () => {
  const dragDropStore = useDragDropStore()
  const { isDataTypeCompatible } = useDataTypeCompatibility()

  /**
   * Creates a standardized drag over handler that sets appropriate cursor
   * based on data type compatibility
   */
  const createDragOverHandler = (acceptedTypes: WikibaseDataType[]) => {
    return (event: DragEvent): void => {
      event.preventDefault()

      if (!event.dataTransfer) return

      let isValidDrop = false

      if (dragDropStore.draggedColumn) {
        isValidDrop = isDataTypeCompatible(dragDropStore.draggedColumn.dataType, acceptedTypes)
      }

      event.dataTransfer.dropEffect = isValidDrop ? 'copy' : 'none'
    }
  }

  /**
   * Creates a standardized drag enter handler
   */
  const createDragEnterHandler = (onEnter?: () => void) => {
    return (event?: DragEvent): void => {
      event?.preventDefault()
      onEnter?.()
    }
  }

  /**
   * Creates a standardized drag leave handler
   */
  const createDragLeaveHandler = (onLeave?: () => void) => {
    return (event?: DragEvent): void => {
      event?.preventDefault()
      onLeave?.()
    }
  }

  /**
   * Creates a standardized drop handler that validates and parses column data
   */
  const createDropHandler = (
    acceptedTypes: WikibaseDataType[],
    onValidDrop: (columnInfo: ColumnInfo) => void,
    onInvalidDrop?: (error: string) => void,
  ) => {
    return (event: DragEvent): void => {
      event.preventDefault()

      const columnData = event.dataTransfer?.getData('application/x-column-data')
      if (!columnData) {
        onInvalidDrop?.('No column data found')
        return
      }

      try {
        const columnInfo = JSON.parse(columnData) as ColumnInfo

        const isValid = isDataTypeCompatible(columnInfo.dataType, acceptedTypes)

        if (isValid) {
          onValidDrop(columnInfo)
        } else {
          onInvalidDrop?.(
            `Column type '${columnInfo.dataType}' is not compatible with accepted types: ${acceptedTypes.join(', ')}`,
          )
        }
      } catch (error) {
        console.error('Failed to parse column data:', error)
        onInvalidDrop?.('Failed to parse column data')
      }
    }
  }

  /**
   * Validates if a column is compatible with the given accepted types
   */
  const validateColumnCompatibility = (
    columnInfo: ColumnInfo | null,
    acceptedTypes: WikibaseDataType[],
  ): boolean => {
    if (!columnInfo) return false

    return isDataTypeCompatible(columnInfo.dataType, acceptedTypes)
  }

  return {
    createDragOverHandler,
    createDragEnterHandler,
    createDragLeaveHandler,
    createDropHandler,
    validateColumnCompatibility,
  }
}
