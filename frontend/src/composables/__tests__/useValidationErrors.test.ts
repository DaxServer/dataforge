import { describe, it, expect, beforeEach } from 'bun:test'
import { useValidationErrors } from '@frontend/composables/useValidationErrors'
import type { ValidationError, ValidationContext } from '@frontend/types/wikibase-schema'

describe('useValidationErrors', () => {
  let validationErrors: ReturnType<typeof useValidationErrors>

  beforeEach(() => {
    validationErrors = useValidationErrors()
  })

  describe('createError', () => {
    it('should create an error with default message', () => {
      const error = validationErrors.createError('MISSING_REQUIRED_MAPPING', 'item.terms.labels.en')

      expect(error).toEqual({
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      })
    })

    it('should create an error with custom message', () => {
      const customMessage = 'Custom error message'
      const error = validationErrors.createError(
        'MISSING_REQUIRED_MAPPING',
        'item.terms.labels.en',
        undefined,
        customMessage,
      )

      expect(error.message).toBe(customMessage)
    })

    it('should create an error with context', () => {
      const context: ValidationContext = {
        columnName: 'title',
        languageCode: 'en',
      }

      const error = validationErrors.createError(
        'MISSING_REQUIRED_MAPPING',
        'item.terms.labels.en',
        context,
      )

      expect(error.context).toEqual(context)
    })
  })

  describe('createWarning', () => {
    it('should create a warning with default message', () => {
      const warning = validationErrors.createWarning(
        'INCOMPATIBLE_DATA_TYPE',
        'item.statements[0].value',
      )

      expect(warning).toEqual({
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Column data type is incompatible with target',
        path: 'item.statements[0].value',
      })
    })
  })

  describe('formatErrorMessage', () => {
    it('should format error message with context', () => {
      const error: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
        context: {
          columnName: 'title',
          propertyId: 'P31',
          languageCode: 'en',
        },
      }

      const formatted = validationErrors.formatErrorMessage(error)

      expect(formatted).toContain('Required mapping is missing')
      expect(formatted).toContain('Column: title')
      expect(formatted).toContain('Property: P31')
      expect(formatted).toContain('Language: en')
    })

    it('should return original message when no context', () => {
      const error: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }

      const formatted = validationErrors.formatErrorMessage(error)

      expect(formatted).toBe('Required mapping is missing')
    })
  })

  describe('getErrorSeverityClass', () => {
    it('should return "error" class for error type', () => {
      const error: ValidationError = {
        type: 'error',
        code: 'MISSING_REQUIRED_MAPPING',
        message: 'Required mapping is missing',
        path: 'item.terms.labels.en',
      }

      expect(validationErrors.getErrorSeverityClass(error)).toBe('error')
    })

    it('should return "warning" class for warning type', () => {
      const warning: ValidationError = {
        type: 'warning',
        code: 'INCOMPATIBLE_DATA_TYPE',
        message: 'Data type may not be optimal',
        path: 'item.statements[0].value',
      }

      expect(validationErrors.getErrorSeverityClass(warning)).toBe('warning')
    })
  })
})
