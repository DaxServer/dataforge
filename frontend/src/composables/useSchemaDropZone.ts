import { ref, computed } from 'vue'
import type { ColumnInfo } from '@frontend/types/wikibase-schema'
import { useDragDropStore } from '@frontend/stores/drag-drop.store'
import { useSchemaStore } from '@frontend/stores/schema.store'
import { useDragDropHandlers } from '@frontend/composables/useDragDropHandlers'
import { useValidationCore } from '@frontend/composables/useValidationCore'
import { useDropZoneStyling } from '@frontend/composables/useDropZoneStyling'

/**
 * Simplified schema drop zone composable using shared validation and styling
 */
export const useSchemaDropZone = () => {
  // Configuration state
  const termType = ref<'label' | 'description' | 'alias'>('label')
  const languageCode = ref<string>('en')

  // Stores and shared composables
  const dragDropStore = useDragDropStore()
  const schemaStore = useSchemaStore()
  const { createDragEnterHandler, createDragLeaveHandler, createDropHandler } =
    useDragDropHandlers()
  const { validateForDrop } = useValidationCore()
  const { getDropZoneClassObject } = useDropZoneStyling()

  // Text-based fields accept string types
  const acceptedTypes: WikibaseDataType[] = ['string']

  // Local state
  const isOverDropZone = ref(false)

  // Create target object for validation
  const currentTarget = computed(() => ({
    type: termType.value,
    path: `item.terms.${termType.value}s.${languageCode.value}`,
    acceptedTypes,
    language: languageCode.value,
    isRequired: false,
  }))

  const isValidForDrop = computed(() => {
    if (!dragDropStore.draggedColumn) return false
    const existingAliases =
      termType.value === 'alias' ? schemaStore.aliases[languageCode.value] || [] : undefined
    return validateForDrop(dragDropStore.draggedColumn, currentTarget.value, existingAliases)
      .isValid
  })

  // CSS classes using shared styling logic
  const dropZoneClasses = computed(() =>
    getDropZoneClassObject(currentTarget.value, isOverDropZone.value),
  )

  // Drop states for external consumption
  const isValidDropState = computed(() => dragDropStore.isDragging && isValidForDrop.value)
  const isInvalidDropState = computed(
    () => dragDropStore.isDragging && dragDropStore.draggedColumn && !isValidForDrop.value,
  )

  // Event handlers
  const handleDragOver = (event: DragEvent): void => {
    event.preventDefault()
    if (event.dataTransfer) {
      // Use drop validation for cursor behavior to include duplicate checking
      event.dataTransfer.dropEffect =
        dragDropStore.draggedColumn && isValidForDrop.value ? 'copy' : 'none'
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
      // Only add if drop validation passes (includes duplicate checking)
      if (isValidForDrop.value) {
        addColumnMapping(columnInfo)
      }
    },
    () => {
      isOverDropZone.value = false
    },
  )

  // Simplified column mapping - duplicate checking handled by validation
  const addColumnMapping = (dataCol: ColumnInfo): void => {
    const columnMapping = {
      columnName: dataCol.name,
      dataType: dataCol.dataType,
    }

    if (termType.value === 'label') {
      schemaStore.addLabelMapping(languageCode.value, columnMapping)
    } else if (termType.value === 'description') {
      schemaStore.addDescriptionMapping(languageCode.value, columnMapping)
    } else if (termType.value === 'alias') {
      schemaStore.addAliasMapping(languageCode.value, columnMapping)
    }
  }

  // Configuration methods
  const setTermType = (newTermType: 'label' | 'description' | 'alias') => {
    termType.value = newTermType
  }

  const setLanguageCode = (newLanguageCode: string) => {
    languageCode.value = newLanguageCode
  }

  return {
    // Configuration
    termType,
    languageCode,
    setTermType,
    setLanguageCode,

    // State
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
