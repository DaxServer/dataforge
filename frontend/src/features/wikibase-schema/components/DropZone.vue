<script setup lang="ts">
import { LucideX } from 'lucide-vue-next'

// Props
const props = defineProps<{
  icon: string
  placeholder: string
  testId: string
  acceptedTypes: WikibaseDataType[]
  disabled?: boolean
  validator?: (columnInfo: ColumnInfo) => boolean
  selectedColumn?: {
    name: string
    dataType: string
  }
}>()

// Emits
const emit = defineEmits<{
  'column-dropped': [columnInfo: ColumnInfo]
  'clear-selection': []
}>()

const dragDropStore = useDragDropStore()
const isOverDropZone = ref(false)

const { isDataTypeCompatible } = useDataTypeCompatibility()

/**
 * Core validation function for column-target compatibility
 */
const validateColumnForTarget = (columnInfo: ColumnInfo | null) => {
  if (!columnInfo) {
    return false
  }

  // Use validator if provided
  if (props.validator) {
    return props.validator(columnInfo)
  }

  // Default validation logic - data type compatibility
  if (!isDataTypeCompatible(columnInfo.dataType, props.acceptedTypes)) {
    return false
  }

  return true
}

// CSS classes using shared styling logic
const dropZoneClasses = computed(() => {
  if (!dragDropStore.draggedColumn) {
    return {
      'border-primary-400 bg-primary-50': isOverDropZone.value,
    }
  }

  const isValidTarget = validateColumnForTarget(dragDropStore.draggedColumn)

  return {
    'border-primary-400 bg-primary-50': isOverDropZone.value,
    'border-green-400 bg-green-50': dragDropStore.isDragging && isValidTarget,
    'border-red-400 bg-red-50': dragDropStore.isDragging && !isValidTarget,
  }
})

// Event handlers
const handleDragOver = (event: DragEvent): void => {
  if (props.disabled) return

  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = validateColumnForTarget(dragDropStore.draggedColumn)
      ? 'copy'
      : 'none'
  }
}

const handleDragEnter = (event?: DragEvent) => {
  if (props.disabled) return

  event?.preventDefault()
  isOverDropZone.value = true
}

const handleDragLeave = (event?: DragEvent) => {
  if (props.disabled) return

  event?.preventDefault()
  isOverDropZone.value = false
}

const handleDrop = (event: DragEvent): void => {
  if (props.disabled) return

  event.preventDefault()

  const columnData = event.dataTransfer?.getData('application/x-column-data')
  if (!columnData) {
    isOverDropZone.value = false
    return
  }

  try {
    const columnInfo = JSON.parse(columnData) as ColumnInfo

    // Only proceed if drop validation passes
    if (validateColumnForTarget(columnInfo)) {
      emit('column-dropped', columnInfo)
    }
  } catch (error) {
    console.error('Failed to parse column data:', error)
  } finally {
    isOverDropZone.value = false
  }
}
</script>

<template>
  <div
    :data-testid="testId"
    :class="[
      'grow flex flex-row items-center justify-center border-2 border-dashed border-gray-400 rounded-lg text-center transition-colors',
      dropZoneClasses,
      { 'opacity-50 cursor-not-allowed': disabled },
    ]"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- Show selected column info if column is selected -->
    <div
      v-if="selectedColumn"
      class="flex items-center justify-center gap-3"
    >
      <div class="flex items-center gap-2 bg-white border border-surface-200 rounded px-3 py-2">
        <i class="pi pi-database text-primary-600" />
        <span class="font-medium text-surface-900">
          {{ selectedColumn.name }}
        </span>
        <Tag
          :value="selectedColumn.dataType"
          size="small"
          severity="secondary"
        />
      </div>
      <Button
        v-tooltip="'Clear column selection'"
        size="sm"
        variant="secondary"
        :disabled="disabled"
        @click="emit('clear-selection')"
      >
        <LucideX />
      </Button>
    </div>

    <!-- Default drop zone content when no column is selected -->
    <template v-else>
      <i :class="[icon, 'text-2xl text-surface-400']" />
      <p class="text-surface-600">{{ placeholder }}</p>
    </template>
  </div>
</template>
