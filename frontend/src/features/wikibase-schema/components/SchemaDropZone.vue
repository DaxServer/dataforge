<script setup lang="ts">
// Define props
const props = defineProps({
  termType: {
    type: String,
    required: true,
    validator: (value: string) => ['label', 'description', 'alias'].includes(value),
  },
  icon: {
    type: String,
    default: 'pi pi-tag',
  },
  placeholder: {
    type: String,
    required: true,
  },
  testId: {
    type: String,
    required: true,
  },
  languageCode: {
    type: String,
    default: 'en',
  },
})

const {
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  dropZoneClasses,
  setTermType,
  setLanguageCode,
} = useSchemaDropZone()

// Drag drop context for drag feedback
const { dropFeedback } = useDragDropContext()

// Set configuration from props
setTermType(props.termType as 'label' | 'description' | 'alias')
setLanguageCode(props.languageCode)

// Watch for prop changes
watch(
  () => props.termType,
  (newTermType) => {
    setTermType(newTermType as 'label' | 'description' | 'alias')
  },
)

watch(
  () => props.languageCode,
  (newLanguageCode) => {
    setLanguageCode(newLanguageCode)
  },
)
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

    <!-- Real-time validation feedback -->
    <div
      v-if="dropFeedback"
      class="mt-2 text-xs px-2 py-1 rounded"
      :class="[
        dropFeedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
      ]"
    >
      {{ dropFeedback.message }}
    </div>
  </div>
</template>
