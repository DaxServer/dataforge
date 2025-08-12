<script setup lang="ts">
// Define props
const props = defineProps<{
  termType: 'label' | 'description' | 'alias'
  icon: string
  placeholder: string
  testId: string
  languageCode: string
}>()

const schemaStore = useSchemaStore()
const dragDropStore = useDragDropStore()

const isOverDropZone = ref(false)

// Drag drop context for drag feedback
const { createDragEnterHandler, createDragLeaveHandler, createDropHandler } = useDragDropHandlers()
const { validateForDrop } = useValidationCore()
const { getDropZoneClassObject } = useDropZoneStyling()

// Text-based fields accept string types
const acceptedTypes: WikibaseDataType[] = ['string']

const currentTarget = computed(() => ({
  type: props.termType,
  path: `item.terms.${props.termType}s.${props.languageCode}`,
  acceptedTypes,
  language: props.languageCode,
  isRequired: false,
}))

const isValidForDrop = computed(() => {
  if (!dragDropStore.draggedColumn) return false
  const existingAliases =
    props.termType === 'alias' ? schemaStore.aliases[props.languageCode] || [] : undefined
  return validateForDrop(dragDropStore.draggedColumn, currentTarget.value, existingAliases).isValid
})

// CSS classes using shared styling logic
const dropZoneClasses = computed(() =>
  getDropZoneClassObject(currentTarget.value, isOverDropZone.value),
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

  if (props.termType === 'label') {
    schemaStore.addLabelMapping(props.languageCode, columnMapping)
  } else if (props.termType === 'description') {
    schemaStore.addDescriptionMapping(props.languageCode, columnMapping)
  } else if (props.termType === 'alias') {
    schemaStore.addAliasMapping(props.languageCode, columnMapping)
  }
}
</script>

<template>
  <div
    :data-testid="testId"
    :class="[
      'grow flex flex-row items-center justify-center border-2 border-dashed border-gray-400 rounded-lg text-center transition-colors',
      dropZoneClasses,
    ]"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <i :class="[icon, 'text-2xl text-surface-400']" />
    <p class="text-surface-600">{{ placeholder }}</p>
  </div>
</template>
