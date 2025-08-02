<script setup lang="ts">
interface Props {
  title: string
  termType: 'label' | 'description' | 'alias'
  icon: string
  placeholder: string
  testId: string
  validationPath: string
}

const props = defineProps<Props>()

// Schema validation UI for section-level validation feedback
const { getPathValidationStatus, getValidationIcon } = useSchemaValidationUI()

// Get validation status and icon for this term type
const validation = computed(() => getPathValidationStatus(props.validationPath))
const validationIcon = computed(() => getValidationIcon(props.validationPath))

// Compute border and background classes based on validation status
const containerClasses = computed(() => [
  'border rounded-lg p-4',
  validation.value.hasErrors
    ? 'border-red-300 bg-red-50'
    : validation.value.hasWarnings
      ? 'border-yellow-300 bg-yellow-50'
      : 'border-surface-200',
])

// Compute total issues count
const totalIssues = computed(
  () => validation.value.errors.length + validation.value.warnings.length,
)
</script>

<template>
  <div :class="containerClasses">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold">{{ title }}</h3>
      <div
        v-if="validationIcon"
        class="flex items-center gap-1"
      >
        <i :class="[validationIcon.icon, validationIcon.class]" />
        <span class="text-xs text-surface-600">{{ totalIssues }} issues</span>
      </div>
    </div>
    <LanguageDropZone
      :term-type="termType"
      :icon="icon"
      :placeholder="placeholder"
      :test-id="testId"
    />
  </div>
</template>
