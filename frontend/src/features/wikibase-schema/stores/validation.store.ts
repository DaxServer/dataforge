import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type {
  ValidationError,
  ValidationErrorCode,
  ValidationResult,
} from '@frontend/shared/types/wikibase-schema'

export interface ValidationRuleConfig {
  id: string
  name: string
  fieldPath: string
  message: string
  severity: 'error' | 'warning'
  enabled: boolean
  validator: (value: unknown, context: unknown) => boolean
}

export const useValidationStore = defineStore('validation', () => {
  // State
  const errors = ref<ValidationError[]>([])
  const warnings = ref<ValidationError[]>([])
  const rules = ref<ValidationRuleConfig[]>([])

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

  const $reset = () => {
    errors.value = []
    warnings.value = []
    rules.value = []
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

  // Rules Actions
  const addRule = (rule: ValidationRuleConfig) => {
    const existingIndex = rules.value.findIndex((r) => r.id === rule.id)
    if (existingIndex >= 0) {
      rules.value[existingIndex] = rule
    } else {
      rules.value.push(rule)
    }
  }

  const removeRule = (ruleId: string) => {
    const index = rules.value.findIndex((rule) => rule.id === ruleId)
    if (index >= 0) {
      rules.value.splice(index, 1)
    }
  }

  const updateRule = (ruleId: string, updates: Partial<ValidationRuleConfig>) => {
    const rule = rules.value.find((r) => r.id === ruleId)
    if (rule) {
      Object.assign(rule, updates)
    }
  }

  const enableRule = (ruleId: string) => {
    updateRule(ruleId, { enabled: true })
  }

  const disableRule = (ruleId: string) => {
    updateRule(ruleId, { enabled: false })
  }

  const getRuleById = (ruleId: string) => {
    return rules.value.find((rule) => rule.id === ruleId)
  }

  const getRulesByFieldPath = (fieldPath: string) => {
    return enabledRules.value.filter((rule) => rule.fieldPath === fieldPath)
  }

  const clearAllRules = () => {
    rules.value = []
  }

  // Computed properties
  const hasErrors = computed(() => errors.value.length > 0)
  const hasWarnings = computed(() => warnings.value.length > 0)
  const hasAnyIssues = computed(() => hasErrors.value || hasWarnings.value)
  const errorCount = computed(() => errors.value.length)
  const warningCount = computed(() => warnings.value.length)
  const totalIssueCount = computed(() => errorCount.value + warningCount.value)

  // Rules Computed
  const enabledRules = computed(() => rules.value.filter((rule) => rule.enabled))
  const errorRules = computed(() => enabledRules.value.filter((rule) => rule.severity === 'error'))
  const warningRules = computed(() =>
    enabledRules.value.filter((rule) => rule.severity === 'warning'),
  )

  return {
    // State
    errors: readonly(errors),
    warnings: readonly(warnings),
    rules,

    // Actions
    addError,
    addWarning,
    clearError,
    clearErrorsForPath,
    clearErrorsByCode,
    $reset,

    // Rules Actions
    addRule,
    removeRule,
    updateRule,
    enableRule,
    disableRule,
    getRuleById,
    getRulesByFieldPath,
    clearAllRules,

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

    // Rules Computed
    enabledRules,
    errorRules,
    warningRules,
  }
})
