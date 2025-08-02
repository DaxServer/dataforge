import { watch, ref } from 'vue'
import { useSchemaStore } from '@frontend/stores/schema.store'
import { useValidationStore } from '@frontend/stores/validation.store'
import { useValidationErrors } from '@frontend/composables/useValidationErrors'
import { useSchemaCompletenessValidation } from '@frontend/composables/useSchemaCompletenessValidation'
import type { ValidationError } from '@frontend/types/wikibase-schema'

/**
 * Interface for validation status
 */
interface ValidationStatus {
  hasErrors: boolean
  hasWarnings: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

/**
 * Interface for validation icon
 */
interface ValidationIcon {
  icon: string
  class: string
}

/**
 * Composable for integrating schema completeness validation with the UI
 * Handles validation error display, field highlighting, and reactive updates
 */
export const useSchemaValidationUI = () => {
  const schemaStore = useSchemaStore()
  const validationStore = useValidationStore()
  const { createError } = useValidationErrors()
  const { validateSchemaCompleteness, getRequiredFieldHighlights, isComplete } =
    useSchemaCompletenessValidation()

  const isAutoValidationEnabled = ref(false)
  let unwatchSchema: (() => void) | null = null

  /**
   * Update validation errors in the validation store based on schema completeness
   */
  const updateValidationErrors = () => {
    // Clear existing completeness validation errors
    validationStore.clearErrorsByCode('MISSING_REQUIRED_MAPPING')

    const highlights = getRequiredFieldHighlights()

    // Add new validation errors for missing required fields
    highlights.forEach((highlight) => {
      const error: ValidationError = createError(
        'MISSING_REQUIRED_MAPPING',
        highlight.path,
        {
          schemaPath: highlight.path,
        },
        highlight.message,
      )

      if (highlight.severity === 'error') {
        validationStore.addError(error)
      } else {
        validationStore.addWarning(error)
      }
    })
  }

  /**
   * Get CSS class for field highlighting based on validation state
   */
  const getFieldHighlightClass = (fieldPath: string): string => {
    if (validationStore.hasErrorsForPath(fieldPath)) {
      return 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500'
    }

    if (validationStore.hasWarningsForPath(fieldPath)) {
      return 'border-yellow-500 bg-yellow-50 focus:ring-yellow-500 focus:border-yellow-500'
    }

    return ''
  }

  /**
   * Check if a field has validation errors
   */
  const hasFieldError = (fieldPath: string): boolean => {
    return validationStore.hasErrorsForPath(fieldPath)
  }

  /**
   * Check if a field has validation warnings
   */
  const hasFieldWarning = (fieldPath: string): boolean => {
    return validationStore.hasWarningsForPath(fieldPath)
  }

  /**
   * Get error message for a specific field
   */
  const getFieldErrorMessage = (fieldPath: string): string => {
    const errors = validationStore.getErrorsForPath(fieldPath)
    return errors.length > 0 ? errors[0]!.message : ''
  }

  /**
   * Get warning message for a specific field
   */
  const getFieldWarningMessage = (fieldPath: string): string => {
    const warnings = validationStore.getWarningsForPath(fieldPath)
    return warnings.length > 0 ? warnings[0]!.message : ''
  }

  /**
   * Get all validation messages for a field (errors and warnings)
   */
  const getFieldMessages = (fieldPath: string): { errors: string[]; warnings: string[] } => {
    const errors = validationStore.getErrorsForPath(fieldPath).map((e) => e.message)
    const warnings = validationStore.getWarningsForPath(fieldPath).map((w) => w.message)

    return { errors, warnings }
  }

  /**
   * Enable automatic validation updates when schema changes
   */
  const enableAutoValidation = () => {
    if (isAutoValidationEnabled.value) return

    isAutoValidationEnabled.value = true

    // Initial validation
    updateValidationErrors()

    // Watch for schema changes and update validation
    unwatchSchema = watch(
      [
        () => schemaStore.schemaName,
        () => schemaStore.wikibase,
        () => schemaStore.labels,
        () => schemaStore.descriptions,
        () => schemaStore.aliases,
        () => schemaStore.statements,
      ],
      () => {
        updateValidationErrors()
      },
      { deep: true },
    )
  }

  /**
   * Disable automatic validation updates
   */
  const disableAutoValidation = () => {
    if (!isAutoValidationEnabled.value) return

    isAutoValidationEnabled.value = false

    if (unwatchSchema) {
      unwatchSchema()
      unwatchSchema = null
    }
  }

  /**
   * Manually trigger validation update
   */
  const triggerValidation = () => {
    updateValidationErrors()
  }

  /**
   * Clear all completeness validation errors
   */
  const clearValidationErrors = () => {
    validationStore.clearErrorsByCode('MISSING_REQUIRED_MAPPING')
  }

  /**
   * Get validation summary for display
   */
  const getValidationSummary = () => {
    const result = validateSchemaCompleteness()

    return {
      isComplete: result.isComplete,
      totalErrors: validationStore.errorCount,
      totalWarnings: validationStore.warningCount,
      missingFieldsCount: result.missingRequiredFields.length,
      requiredFieldHighlights: result.requiredFieldHighlights,
    }
  }

  /**
   * Get field-specific validation state for component props
   */
  const getFieldValidationState = (fieldPath: string) => {
    return {
      hasError: hasFieldError(fieldPath),
      hasWarning: hasFieldWarning(fieldPath),
      errorMessage: getFieldErrorMessage(fieldPath),
      warningMessage: getFieldWarningMessage(fieldPath),
      highlightClass: getFieldHighlightClass(fieldPath),
      isValid: !hasFieldError(fieldPath) && !hasFieldWarning(fieldPath),
    }
  }

  /**
   * Get validation status for a specific path
   */
  const getPathValidationStatus = (path: string): ValidationStatus => {
    const errors = validationStore.getErrorsForPath(path)
    const warnings = validationStore.getWarningsForPath(path)

    return {
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0,
      errors,
      warnings,
    }
  }

  /**
   * Get validation icon for a specific path
   */
  const getValidationIcon = (path: string): ValidationIcon | null => {
    const status = getPathValidationStatus(path)

    if (status.hasErrors) {
      return {
        icon: 'pi pi-times-circle',
        class: 'text-red-500',
      }
    }

    if (status.hasWarnings) {
      return {
        icon: 'pi pi-exclamation-triangle',
        class: 'text-yellow-500',
      }
    }

    return null
  }

  return {
    // Core validation methods
    updateValidationErrors,
    triggerValidation,
    clearValidationErrors,

    // Field validation state
    hasFieldError,
    hasFieldWarning,
    getFieldErrorMessage,
    getFieldWarningMessage,
    getFieldMessages,
    getFieldHighlightClass,
    getFieldValidationState,

    // Path validation methods
    getPathValidationStatus,
    getValidationIcon,

    // Auto-validation control
    enableAutoValidation,
    disableAutoValidation,
    isAutoValidationEnabled,

    // Validation summary
    getValidationSummary,

    // Reactive properties from completeness validation
    isComplete,
  }
}
