import type {
  ValidationContext,
  ValidationError,
  ValidationErrorCode,
} from '@frontend/shared/types/wikibase-schema'
import { ValidationMessages } from '@frontend/shared/types/wikibase-schema'

/**
 * Composable for managing validation errors in the Wikibase Schema Editor
 */
export const useValidationErrors = () => {
  /**
   * Create a validation error with consistent formatting
   */
  const createError = (
    code: ValidationErrorCode,
    path: string,
    context?: ValidationContext,
    customMessage?: string,
  ): ValidationError => {
    const message = customMessage || ValidationMessages[code]

    return {
      type: 'error',
      code,
      message,
      path,
      context,
    }
  }

  /**
   * Create a validation warning with consistent formatting
   */
  const createWarning = (
    code: ValidationErrorCode,
    path: string,
    context?: ValidationContext,
    customMessage?: string,
  ): ValidationError => {
    const message = customMessage || ValidationMessages[code]

    return {
      type: 'warning',
      code,
      message,
      path,
      context,
    }
  }

  /**
   * Format error message for display
   */
  const formatErrorMessage = (error: ValidationError): string => {
    let message = error.message

    if (error.context) {
      // Add context information to the message
      if (error.context.columnName) {
        message += ` (Column: ${error.context.columnName})`
      }
      if (error.context.propertyId) {
        message += ` (Property: ${error.context.propertyId})`
      }
      if (error.context.languageCode) {
        message += ` (Language: ${error.context.languageCode})`
      }
    }

    return message
  }

  /**
   * Get error severity class for styling
   */
  const getErrorSeverityClass = (error: ValidationError): string => {
    return error.type === 'error' ? 'error' : 'warning'
  }

  return {
    createError,
    createWarning,
    formatErrorMessage,
    getErrorSeverityClass,
  }
}
