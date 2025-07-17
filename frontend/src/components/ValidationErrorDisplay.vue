<script setup lang="ts">
interface Props {
  /** Show error count summary */
  showSummary?: boolean
  /** Show error paths for debugging */
  showPath?: boolean
  /** Show dismiss buttons for individual errors */
  showDismiss?: boolean
  /** Show clear all button */
  showClearAll?: boolean
  /** Filter errors by path prefix */
  pathFilter?: string
  /** Maximum number of errors to display */
  maxErrors?: number
}

const props = withDefaults(defineProps<Props>(), {
  showSummary: true,
  showPath: false,
  showDismiss: false,
  showClearAll: false,
  maxErrors: 50,
})

const emit = defineEmits<{
  errorDismissed: [error: ValidationError]
  warningDismissed: [error: ValidationError]
  allCleared: []
}>()

// Use the validation store for state management
const validationStore = useValidationStore()

// Use the composable for utility functions
const { formatErrorMessage } = useValidationErrors()

// Destructure store properties
const {
  errors: allErrors,
  warnings: allWarnings,
  hasErrors,
  hasWarnings,
  hasAnyIssues,
  clearAll: clearAllErrors,
  clearErrorsForPath,
} = validationStore

// Filter errors based on path filter
const errors = computed(() => {
  let filtered = props.pathFilter
    ? allErrors.filter((error) => error.path.startsWith(props.pathFilter!))
    : allErrors

  return filtered.slice(0, props.maxErrors)
})

const warnings = computed(() => {
  let filtered = props.pathFilter
    ? allWarnings.filter((warning) => warning.path.startsWith(props.pathFilter!))
    : allWarnings

  return filtered.slice(0, props.maxErrors)
})

const errorCount = computed(() => errors.value.length)
const warningCount = computed(() => warnings.value.length)

const getErrorClasses = (error: ValidationError): string => {
  const baseClasses = 'p-3 rounded-lg border'
  const severityClass =
    error.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'

  return `${baseClasses} ${severityClass}`
}

const dismissError = (error: ValidationError) => {
  if (props.pathFilter) {
    clearErrorsForPath(error.path)
  }
  emit('errorDismissed', error)
}

const dismissWarning = (warning: ValidationError) => {
  if (props.pathFilter) {
    clearErrorsForPath(warning.path)
  }
  emit('warningDismissed', warning)
}

const clearAll = () => {
  if (props.pathFilter) {
    clearErrorsForPath(props.pathFilter)
  } else {
    clearAllErrors()
  }
  emit('allCleared')
}
</script>

<template>
  <div
    v-if="hasAnyIssues"
    class="w-full"
  >
    <!-- Error Summary -->
    <div
      v-if="showSummary"
      class="error-summary mb-4"
    >
      <div class="flex items-center gap-2 text-sm">
        <i
          v-if="hasErrors"
          class="pi pi-exclamation-triangle text-red-500"
        />
        <i
          v-else-if="hasWarnings"
          class="pi pi-info-circle text-yellow-500"
        />
        <span class="font-medium">
          {{ errorCount }} {{ errorCount === 1 ? 'error' : 'errors' }}
          <span v-if="hasWarnings">
            , {{ warningCount }} {{ warningCount === 1 ? 'warning' : 'warnings' }}
          </span>
        </span>
      </div>
    </div>

    <!-- Error List -->
    <div class="error-list space-y-2">
      <!-- Errors -->
      <div
        v-for="error in errors"
        :key="`error-${error.path}-${error.code}`"
        class="transition-all duration-200 ease-in-out hover:shadow-sm"
        :class="getErrorClasses(error)"
      >
        <div class="flex items-start gap-3">
          <i class="pi pi-times-circle text-red-500 mt-0.5 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="break-words font-medium text-red-700">
              {{ formatErrorMessage(error) }}
            </div>
            <div
              v-if="showPath"
              class="font-mono text-xs text-gray-500 mt-1"
            >
              {{ error.path }}
            </div>
          </div>
          <Button
            v-if="showDismiss"
            icon="pi pi-times"
            text
            rounded
            size="small"
            severity="secondary"
            class="flex-shrink-0"
            @click="dismissError(error)"
          />
        </div>
      </div>

      <!-- Warnings -->
      <div
        v-for="warning in warnings"
        :key="`warning-${warning.path}-${warning.code}`"
        class="transition-all duration-200 ease-in-out hover:shadow-sm"
        :class="getErrorClasses(warning)"
      >
        <div class="flex items-start gap-3">
          <i class="pi pi-exclamation-triangle text-yellow-500 mt-0.5 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="break-words font-medium text-yellow-700">
              {{ formatErrorMessage(warning) }}
            </div>
            <div
              v-if="showPath"
              class="font-mono text-xs text-gray-500 mt-1"
            >
              {{ warning.path }}
            </div>
          </div>
          <Button
            v-if="showDismiss"
            icon="pi pi-times"
            text
            rounded
            size="small"
            severity="secondary"
            class="flex-shrink-0"
            @click="dismissWarning(warning)"
          />
        </div>
      </div>
    </div>

    <!-- Clear All Button -->
    <div
      v-if="showClearAll && hasAnyIssues"
      class="mt-4 text-center"
    >
      <Button
        label="Clear All"
        icon="pi pi-trash"
        text
        size="small"
        severity="secondary"
        @click="clearAll"
      />
    </div>
  </div>
</template>
