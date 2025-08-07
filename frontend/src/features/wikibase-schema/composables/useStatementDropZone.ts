import { ref, computed } from 'vue'
import { useDragDropStore } from '@frontend/features/data-processing/stores/drag-drop.store'
import { useDragDropHandlers } from '@frontend/shared/composables/useDragDropHandlers'
import type { ColumnInfo } from '@frontend/shared/types/wikibase-schema'
import type { WikibaseDataType } from '@backend/api/project/project.wikibase'

/**
 * Composable for handling statement drop zone functionality
 */
export const useStatementDropZone = () => {
  const dragDropStore = useDragDropStore()
  const { createDragEnterHandler, createDragLeaveHandler, createDropHandler } =
    useDragDropHandlers()

  // Statement editor accepts all data types since it has its own validation
  const acceptedTypes: WikibaseDataType[] = [
    'string',
    'url',
    'external-id',
    'wikibase-item',
    'wikibase-property',
    'commonsMedia',
    'globe-coordinate',
    'quantity',
    'time',
    'monolingualtext',
  ]

  // Reactive state
  const isOverDropZone = ref(false)
  const onColumnDropCallback = ref<((columnInfo: ColumnInfo) => void) | null>(null)

  // Direct reactive references to drag store
  const draggedColumn = computed(() => dragDropStore.draggedColumn)
  const isDragging = computed(() => dragDropStore.isDragging)

  // Reactive CSS classes
  const dropZoneClasses = computed(() => ({
    'border-primary-400 bg-primary-50': isOverDropZone.value,
    'border-green-400 bg-green-50': isDragging.value && draggedColumn.value,
    'border-red-400 bg-red-50': false, // Statement editor accepts all types
  }))

  // Event handlers using shared logic
  const handleDragOver = (event: DragEvent): void => {
    event.preventDefault()
    if (event.dataTransfer) {
      // Statement editor accepts all types
      event.dataTransfer.dropEffect = draggedColumn.value ? 'copy' : 'none'
    }
  }

  const handleDragEnter = createDragEnterHandler(() => {
    isOverDropZone.value = true
  })

  const handleDragLeave = createDragLeaveHandler(() => {
    isOverDropZone.value = false
  })

  const handleDrop = createDropHandler(
    acceptedTypes,
    (columnInfo) => {
      isOverDropZone.value = false
      if (onColumnDropCallback.value) {
        onColumnDropCallback.value(columnInfo)
      }
    },
    () => {
      isOverDropZone.value = false
    },
  )

  // Method to set the callback
  const setOnColumnDrop = (callback: (columnInfo: ColumnInfo) => void) => {
    onColumnDropCallback.value = callback
  }

  return {
    // Reactive state
    isOverDropZone,
    dropZoneClasses,

    // Event handlers
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,

    // Methods
    setOnColumnDrop,
  }
}
