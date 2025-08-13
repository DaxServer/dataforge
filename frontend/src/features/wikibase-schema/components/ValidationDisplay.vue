<script setup lang="ts">
interface Props {
  /** Display mode */
  mode?: 'full' | 'status' | 'suggestions'
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
  /** Show detailed error breakdown */
  showDetails?: boolean
  /** Compact mode for smaller spaces */
  compact?: boolean
  /** Column information for generating suggestions */
  columnInfo?: ColumnInfo
  /** Target information for generating suggestions */
  target?: DropTarget
  /** Maximum number of suggestions to show */
  maxSuggestions?: number
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'full',
  showSummary: true,
  showPath: false,
  showDismiss: false,
  showClearAll: false,
  maxErrors: 50,
  showDetails: false,
  compact: false,
  maxSuggestions: 3,
})

const emit = defineEmits<{
  errorDismissed: [error: ValidationError]
  warningDismissed: [error: ValidationError]
  allCleared: []
}>()

// Use the composable for utility functions
const { formatErrorMessage } = useValidationErrors()

// Use validation store directly
const validationStore = useValidationStore()

// Use schema validation UI for enhanced functionality
const { getFieldHighlightClass } = useSchemaValidationUI()

// Use validation for drag feedback
const { validationFeedback, getValidationSuggestions } = useValidation()

// Use drag-drop store for drag state
const dragDropStore = useDragDropStore()

// Filter errors based on path filter
const errors = computed(() => {
  let filtered = props.pathFilter
    ? validationStore.errors.filter((error) => error.path.startsWith(props.pathFilter!))
    : validationStore.errors

  return filtered.slice(0, props.maxErrors)
})

const warnings = computed(() => {
  let filtered = props.pathFilter
    ? validationStore.warnings.filter((warning) => warning.path.startsWith(props.pathFilter!))
    : validationStore.warnings

  return filtered.slice(0, props.maxErrors)
})

const errorCount = computed(() => errors.value.length)
const warningCount = computed(() => warnings.value.length)

// Status bar computed properties
const isDragInProgress = computed(() => dragDropStore.dragState !== 'idle')

const statusMessage = computed(() => {
  if (isDragInProgress.value && validationFeedback.value) {
    return validationFeedback.value.message
  }

  if (validationStore.hasErrors) {
    return `${validationStore.errorCount} validation ${validationStore.errorCount === 1 ? 'error' : 'errors'}`
  }

  if (validationStore.hasWarnings) {
    return `${validationStore.warningCount} validation ${validationStore.warningCount === 1 ? 'warning' : 'warnings'}`
  }

  return 'Schema validation passed'
})

const statusIcon = computed(() => {
  if (isDragInProgress.value) {
    return validationFeedback.value?.type === 'success'
      ? 'pi pi-check-circle'
      : 'pi pi-times-circle'
  }

  if (validationStore.hasErrors) {
    return 'pi pi-times-circle'
  }

  if (validationStore.hasWarnings) {
    return 'pi pi-exclamation-triangle'
  }

  return 'pi pi-check-circle'
})

const statusClasses = computed(() => {
  const baseClasses = [
    'flex',
    'items-center',
    'gap-2',
    'px-3',
    'py-2',
    'rounded-lg',
    'text-sm',
    'transition-colors',
  ]

  if (isDragInProgress.value) {
    const feedbackType = validationFeedback.value?.type
    if (feedbackType === 'success') {
      return [...baseClasses, 'bg-green-50', 'border', 'border-green-200', 'text-green-700']
    } else if (feedbackType === 'error') {
      return [...baseClasses, 'bg-red-50', 'border', 'border-red-200', 'text-red-700']
    } else {
      return [...baseClasses, 'bg-blue-50', 'border', 'border-blue-200', 'text-blue-700']
    }
  }

  if (validationStore.hasErrors) {
    return [...baseClasses, 'bg-red-50', 'border', 'border-red-200', 'text-red-700']
  }

  if (validationStore.hasWarnings) {
    return [...baseClasses, 'bg-yellow-50', 'border', 'border-yellow-200', 'text-yellow-700']
  }

  return [...baseClasses, 'bg-green-50', 'border', 'border-green-200', 'text-green-700']
})

// Suggestions computed properties
const suggestions = computed(() => {
  if (!props.columnInfo || !props.target) return []

  const allSuggestions = getValidationSuggestions(props.columnInfo, props.target)
  return allSuggestions.slice(0, props.maxSuggestions)
})

const hasSuggestions = computed(() => suggestions.value.length > 0)

// Methods
const getErrorClasses = (error: ValidationError): string => {
  // Use the validation UI composable for consistent styling
  const highlightClass = getFieldHighlightClass(error.path)
  return `p-3 rounded-lg border ${highlightClass}`
}

const dismissError = (error: ValidationError) => {
  validationStore.clearError(error)
  emit('errorDismissed', error)
}

const dismissWarning = (warning: ValidationError) => {
  validationStore.clearError(warning)
  emit('warningDismissed', warning)
}

const clearAll = () => {
  if (props.pathFilter) {
    validationStore.clearErrorsForPath(props.pathFilter)
  } else {
    validationStore.$reset()
  }
  emit('allCleared')
}
</script>

<template>
  <div class="mb-4">
    <!-- Full Error Display Mode -->
    <div
      v-if="mode === 'full' && validationStore.hasAnyIssues"
      class="w-full"
    >
      <!-- Error Summary -->
      <div
        v-if="showSummary"
        class="error-summary mb-4"
      >
        <div class="flex items-center gap-2 text-sm">
          <i
            v-if="validationStore.hasErrors"
            class="pi pi-exclamation-triangle text-red-500"
          />
          <i
            v-else-if="validationStore.hasWarnings"
            class="pi pi-info-circle text-yellow-500"
          />
          <span class="font-medium">
            {{ errorCount }} {{ errorCount === 1 ? 'error' : 'errors' }}
            <span v-if="validationStore.hasWarnings">
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
        v-if="showClearAll && validationStore.hasAnyIssues"
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

    <!-- Status Bar Mode -->
    <div
      v-else-if="
        mode === 'status' && (validationStore.hasAnyIssues || isDragInProgress || !compact)
      "
      class="validation-status-bar"
    >
      <div :class="statusClasses">
        <i :class="statusIcon" />
        <span class="font-medium">{{ statusMessage }}</span>

        <!-- Detailed breakdown -->
        <div
          v-if="showDetails && validationStore.hasAnyIssues && !isDragInProgress"
          class="flex items-center gap-4 ml-2 text-xs"
        >
          <span
            v-if="validationStore.hasErrors"
            class="flex items-center gap-1"
          >
            <i class="pi pi-times-circle text-red-500" />
            {{ validationStore.errorCount }}
            {{ validationStore.errorCount === 1 ? 'error' : 'errors' }}
          </span>
          <span
            v-if="validationStore.hasWarnings"
            class="flex items-center gap-1"
          >
            <i class="pi pi-exclamation-triangle text-yellow-500" />
            {{ validationStore.warningCount }}
            {{ validationStore.warningCount === 1 ? 'warning' : 'warnings' }}
          </span>
        </div>

        <!-- Clear all button -->
        <Button
          v-if="showClearAll && validationStore.hasAnyIssues && !isDragInProgress"
          label="Clear All"
          icon="pi pi-trash"
          text
          size="small"
          severity="secondary"
          class="ml-auto"
          @click="clearAll"
        />
      </div>
    </div>

    <!-- Suggestions Mode -->
    <div
      v-else-if="mode === 'suggestions' && hasSuggestions"
      class="validation-suggestions mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
    >
      <div class="flex items-start gap-2">
        <i class="pi pi-lightbulb text-blue-600 mt-0.5 flex-shrink-0" />
        <div class="flex-1">
          <h4 class="text-sm font-medium text-blue-800 mb-2">Suggestions</h4>
          <ul class="space-y-1">
            <li
              v-for="(suggestion, index) in suggestions"
              :key="index"
              class="text-sm text-blue-700 flex items-start gap-1"
            >
              <span class="text-blue-400 mt-1">•</span>
              <span>{{ suggestion }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
