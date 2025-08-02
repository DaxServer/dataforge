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

// Schema validation UI for enhanced drop zone styling
const { getDropZoneClasses, currentDragFeedback } = useSchemaValidationUI()

// Computed drop zone classes that combine both systems
const enhancedDropZoneClasses = computed(() => {
  const targetPath = `item.terms.${props.termType}s.${props.languageCode}`
  const validationClasses = getDropZoneClasses(targetPath)

  // dropZoneClasses returns an object for Vue class binding
  // validationClasses returns an array of class names
  // We need to combine them properly
  return [
    dropZoneClasses.value, // Object for Vue class binding
    ...validationClasses, // Array of class strings
  ]
})

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
      'grow flex flex-row items-center justify-center border-2 border-dashed rounded-lg text-center transition-colors',
      enhancedDropZoneClasses,
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
      v-if="currentDragFeedback"
      class="mt-2 text-xs px-2 py-1 rounded"
      :class="[
        currentDragFeedback.type === 'success'
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700',
      ]"
    >
      {{ currentDragFeedback.message }}
    </div>
  </div>
</template>
