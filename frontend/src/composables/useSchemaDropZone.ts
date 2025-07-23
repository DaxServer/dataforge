import { ref, computed } from 'vue'
import type { ColumnInfo } from '@frontend/types/wikibase-schema'
import { useDragDropStore } from '@frontend/stores/drag-drop.store'
import { useSchemaStore } from '@frontend/stores/schema.store'
import { useDragDropHandlers } from '@frontend/composables/useDragDropHandlers'

/**
 * Composable for handling schema drop zone functionality
 */
export const useSchemaDropZone = (
  termType: 'label' | 'description' | 'alias',
  languageCode: string,
) => {
  const dragDropStore = useDragDropStore()
  const schemaStore = useSchemaStore()
  const {
    createDragEnterHandler,
    createDragLeaveHandler,
    createDropHandler,
    validateColumnCompatibility,
  } = useDragDropHandlers()

  // Text-based fields (labels, descriptions, aliases) accept string types
  const acceptedTypes: WikibaseDataType[] = ['string']

  // Reactive state
  const isOverDropZone = ref(false)

  // Direct reactive references to drag store
  const draggedColumn = computed(() => dragDropStore.draggedColumn)
  const isDragging = computed(() => dragDropStore.isDragging)

  // Reactive validation using shared logic
  const isColumnValid = computed(() => {
    if (!draggedColumn.value) return false

    // First check basic type compatibility
    if (!validateColumnCompatibility(draggedColumn.value, acceptedTypes)) {
      return false
    }

    // For aliases, also check for duplicates
    if (termType === 'alias') {
      const existingAliases = schemaStore.aliases[languageCode] || []
      const isDuplicate = existingAliases.some(
        (alias) =>
          alias.columnName === draggedColumn.value!.name &&
          alias.dataType === draggedColumn.value!.dataType,
      )
      return !isDuplicate
    }

    return true
  })

  // Reactive CSS classes
  const dropZoneClasses = computed(() => ({
    'border-primary-400 bg-primary-50': isOverDropZone.value,
    'border-green-400 bg-green-50': isDragging.value && isColumnValid.value,
    'border-red-400 bg-red-50': isDragging.value && draggedColumn.value && !isColumnValid.value,
  }))

  // Reactive drop states
  const isValidDropState = computed(() => isDragging.value && isColumnValid.value)
  const isInvalidDropState = computed(
    () => isDragging.value && draggedColumn.value && !isColumnValid.value,
  )

  // Event handlers using shared logic with custom validation for aliases
  const handleDragOver = (event: DragEvent): void => {
    event.preventDefault()
    if (event.dataTransfer) {
      // Use the same validation logic as isColumnValid for consistent behavior
      event.dataTransfer.dropEffect = isColumnValid.value ? 'copy' : 'none'
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
      addColumnMapping(columnInfo)
    },
    () => {
      isOverDropZone.value = false
    },
  )

  // Add column mapping action
  const addColumnMapping = (dataCol: ColumnInfo): void => {
    const columnMapping = {
      columnName: dataCol.name,
      dataType: dataCol.dataType,
    }

    if (termType === 'label') {
      schemaStore.addLabelMapping(languageCode, columnMapping)
    } else if (termType === 'description') {
      schemaStore.addDescriptionMapping(languageCode, columnMapping)
    } else if (termType === 'alias') {
      // Check for duplicates before adding alias
      const existingAliases = schemaStore.aliases[languageCode] || []
      const isDuplicate = existingAliases.some(
        (alias) =>
          alias.columnName === columnMapping.columnName &&
          alias.dataType === columnMapping.dataType,
      )

      if (!isDuplicate) {
        schemaStore.addAliasMapping(languageCode, columnMapping)
      }
      // Silently ignore duplicates - this is expected behavior
    }
  }

  return {
    // Reactive state
    isOverDropZone,
    isValidDropState,
    isInvalidDropState,
    dropZoneClasses,

    // Event handlers
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    addColumnMapping,
  }
}
