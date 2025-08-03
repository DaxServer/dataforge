import type { PropertyReference, ValueMapping } from '@frontend/shared/types/wikibase-schema'
import { useStatementDataTypeValidation } from '@frontend/features/wikibase-schema/composables/useStatementDataTypeValidation'

/**
 * Interface for validation display message
 */
interface ValidationDisplayMessage {
  type: 'error' | 'warning'
  message: string
  suggestions?: string[]
}

/**
 * Interface for validation display icon
 */
interface ValidationDisplayIcon {
  icon: string
  class: string
}

/**
 * Composable for displaying statement validation feedback in the UI
 */
export const useStatementValidationDisplay = () => {
  const { validateStatementDataType, getCompatibilityWarnings, getSuggestedDataTypes } =
    useStatementDataTypeValidation()

  /**
   * Get validation message for display in the UI
   */
  const getValidationMessage = (
    valueMapping: ValueMapping,
    property: PropertyReference | null,
  ): ValidationDisplayMessage | null => {
    // Only validate column-type mappings
    if (valueMapping.type !== 'column') {
      return null
    }

    // Check for errors first
    const validationResult = validateStatementDataType(valueMapping, property, 'temp')

    if (validationResult.errors.length > 0) {
      const error = validationResult.errors[0]!
      const suggestions: string[] = []

      // Add suggestions for data type compatibility errors
      if (error.code === 'INCOMPATIBLE_DATA_TYPE' && error.context?.dataType) {
        const suggestedTypes = getSuggestedDataTypes(error.context.dataType)
        if (suggestedTypes.length > 0) {
          suggestions.push(`Try using: ${suggestedTypes.slice(0, 3).join(', ')}`)
        }
      }

      return {
        type: 'error',
        message: error.message,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      }
    }

    // Check for warnings
    const warnings = getCompatibilityWarnings(valueMapping, property, 'temp')
    if (warnings.length > 0) {
      const warning = warnings[0]!
      const suggestions: string[] = []

      // Add suggestions for suboptimal mappings
      if (warning.context?.dataType) {
        const suggestedTypes = getSuggestedDataTypes(warning.context.dataType)
        if (suggestedTypes.length > 0) {
          suggestions.push(`Consider using: ${suggestedTypes.slice(0, 2).join(' or ')}`)
        }
      }

      return {
        type: 'warning',
        message: warning.message,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      }
    }

    return null
  }

  /**
   * Get CSS classes for validation state styling
   */
  const getValidationClasses = (
    valueMapping: ValueMapping,
    property: PropertyReference | null,
  ): string => {
    const message = getValidationMessage(valueMapping, property)

    if (!message) {
      return 'border-surface-200 bg-white'
    }

    if (message.type === 'error') {
      return 'border-red-300 bg-red-50'
    }

    if (message.type === 'warning') {
      return 'border-yellow-300 bg-yellow-50'
    }

    return 'border-surface-200 bg-white'
  }

  /**
   * Get validation icon for display
   */
  const getValidationIcon = (
    valueMapping: ValueMapping,
    property: PropertyReference | null,
  ): ValidationDisplayIcon | null => {
    const message = getValidationMessage(valueMapping, property)

    if (!message) {
      return null
    }

    if (message.type === 'error') {
      return {
        icon: 'pi pi-times-circle',
        class: 'text-red-500',
      }
    }

    if (message.type === 'warning') {
      return {
        icon: 'pi pi-exclamation-triangle',
        class: 'text-yellow-500',
      }
    }

    return null
  }

  /**
   * Check if validation state is valid (no errors)
   */
  const isValidationValid = (
    valueMapping: ValueMapping,
    property: PropertyReference | null,
  ): boolean => {
    const message = getValidationMessage(valueMapping, property)
    return !message || message.type !== 'error'
  }

  /**
   * Check if validation state has warnings
   */
  const hasValidationWarnings = (
    valueMapping: ValueMapping,
    property: PropertyReference | null,
  ): boolean => {
    const message = getValidationMessage(valueMapping, property)
    return message?.type === 'warning'
  }

  /**
   * Get validation severity for PrimeVue components
   */
  const getValidationSeverity = (
    valueMapping: ValueMapping,
    property: PropertyReference | null,
  ): 'success' | 'warn' | 'error' | 'secondary' => {
    const message = getValidationMessage(valueMapping, property)

    if (!message) {
      return 'secondary'
    }

    if (message.type === 'error') {
      return 'error'
    }

    if (message.type === 'warning') {
      return 'warn'
    }

    return 'secondary'
  }

  return {
    getValidationMessage,
    getValidationClasses,
    getValidationIcon,
    isValidationValid,
    hasValidationWarnings,
    getValidationSeverity,
  }
}
