import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type {
  ValidationError,
  ValidationErrorCode,
  ValidationResult,
} from '@frontend/types/wikibase-schema'

export const useValidationStore = defineStore('validation', () => {
  // State
  const errors = ref<ValidationError[]>([])
  const warnings = ref<ValidationError[]>([])

  // Actions
  const addError = (error: ValidationError) => {
    // Avoid duplicate errors for the same path and code
    const exists = errors.value.some((e) => e.path === error.path && e.code === error.code)
    if (!exists) {
      errors.value.push(error)
    }
  }

  const addWarning = (warning: ValidationError) => {
    // Avoid duplicate warnings for the same path and code
    const exists = warnings.value.some((w) => w.path === warning.path && w.code === warning.code)
    if (!exists) {
      warnings.value.push(warning)
    }
  }

  const clearError = (error: ValidationError) => {
    const errorIndex = errors.value.findIndex(
      (e) => e.path === error.path && e.code === error.code && e.message === error.message,
    )
    if (errorIndex !== -1) {
      errors.value.splice(errorIndex, 1)
    }

    const warningIndex = warnings.value.findIndex(
      (w) => w.path === error.path && w.code === error.code && w.message === error.message,
    )
    if (warningIndex !== -1) {
      warnings.value.splice(warningIndex, 1)
    }
  }

  const clearErrorsForPath = (path: string, exactMatch = false) => {
    if (exactMatch) {
      errors.value = errors.value.filter((error) => error.path !== path)
      warnings.value = warnings.value.filter((warning) => warning.path !== path)
    } else {
      errors.value = errors.value.filter((error) => !error.path.startsWith(path))
      warnings.value = warnings.value.filter((warning) => !warning.path.startsWith(path))
    }
  }

  const clearErrorsByCode = (code: ValidationErrorCode) => {
    errors.value = errors.value.filter((error) => error.code !== code)
    warnings.value = warnings.value.filter((warning) => warning.code !== code)
  }

  const clearAll = () => {
    errors.value = []
    warnings.value = []
  }

  // Getters
  const getErrorsForPath = (path: string): ValidationError[] => {
    return errors.value.filter((error) => error.path.startsWith(path))
  }

  const getWarningsForPath = (path: string): ValidationError[] => {
    return warnings.value.filter((warning) => warning.path.startsWith(path))
  }

  const hasErrorsForPath = (path: string): boolean => {
    return errors.value.some((error) => error.path.startsWith(path))
  }

  const hasWarningsForPath = (path: string): boolean => {
    return warnings.value.some((warning) => warning.path.startsWith(path))
  }

  const getValidationResult = (): ValidationResult => {
    return {
      isValid: errors.value.length === 0,
      errors: [...errors.value],
      warnings: [...warnings.value],
    }
  }

  // Computed properties
  const hasErrors = computed(() => errors.value.length > 0)
  const hasWarnings = computed(() => warnings.value.length > 0)
  const hasAnyIssues = computed(() => hasErrors.value || hasWarnings.value)
  const errorCount = computed(() => errors.value.length)
  const warningCount = computed(() => warnings.value.length)
  const totalIssueCount = computed(() => errorCount.value + warningCount.value)

  return {
    // State
    errors: readonly(errors),
    warnings: readonly(warnings),

    // Actions
    addError,
    addWarning,
    clearError,
    clearErrorsForPath,
    clearErrorsByCode,
    clearAll,

    // Getters
    getErrorsForPath,
    getWarningsForPath,
    hasErrorsForPath,
    hasWarningsForPath,
    getValidationResult,

    // Computed
    hasErrors,
    hasWarnings,
    hasAnyIssues,
    errorCount,
    warningCount,
    totalIssueCount,
  }
})
