import { describe, it, expect } from 'bun:test'
import type {
  ValidationError,
  ValidationResult,
  ValidationContext,
  ValidationErrorCode,
  ValidationErrorType,
} from '@frontend/types/wikibase-schema'
import { ValidationMessages } from '@frontend/types/wikibase-schema'

describe('ValidationError Types', () => {
  it('should create ValidationError, ValidationResult, and ValidationContext types', () => {
    // Complete ValidationError with optional fields
    const completeError: ValidationError = {
      type: 'error',
      code: 'MISSING_REQUIRED_MAPPING',
      message: 'Required mapping is missing',
      path: 'item.terms.labels.en',
      field: 'label',
      context: { columnName: 'title' },
    }

    // Minimal ValidationError with required fields only
    const minimalError: ValidationError = {
      type: 'error',
      code: 'MISSING_REQUIRED_MAPPING',
      message: 'Required mapping is missing',
      path: 'item.terms.labels.en',
    }

    // ValidationResult with errors and warnings
    const result: ValidationResult = {
      isValid: false,
      errors: [minimalError],
      warnings: [
        {
          type: 'warning',
          code: 'INCOMPATIBLE_DATA_TYPE',
          message: 'Data type may not be optimal',
          path: 'item.statements[0].value',
        },
      ],
    }

    // ValidationContext with optional fields
    const context: ValidationContext = {
      columnName: 'title',
      propertyId: 'P31',
      languageCode: 'en',
      dataType: 'VARCHAR',
      targetType: 'label',
      schemaPath: 'item.terms.labels.en',
    }

    expect(completeError.field).toBe('label')
    expect(completeError.context?.columnName).toBe('title')
    expect(minimalError.field).toBeUndefined()
    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.warnings).toHaveLength(1)
    expect(context.propertyId).toBe('P31')
  })

  it('should validate error codes and types', () => {
    const errorCodes: ValidationErrorCode[] = [
      'MISSING_REQUIRED_MAPPING',
      'INCOMPATIBLE_DATA_TYPE',
      'DUPLICATE_LANGUAGE_MAPPING',
      'INVALID_PROPERTY_ID',
      'MISSING_STATEMENT_VALUE',
      'INVALID_LANGUAGE_CODE',
      'MISSING_ITEM_CONFIGURATION',
      'DUPLICATE_PROPERTY_MAPPING',
    ]

    const errorTypes: ValidationErrorType[] = ['error', 'warning']

    // Test all error codes have messages
    errorCodes.forEach((code) => {
      expect(ValidationMessages[code]).toBeDefined()
      expect(typeof ValidationMessages[code]).toBe('string')
      expect(ValidationMessages[code].length).toBeGreaterThan(0)
    })

    // Test error type discrimination
    errorTypes.forEach((type) => {
      expect(['error', 'warning']).toContain(type)
    })

    expect(errorCodes).toHaveLength(8)
    expect(errorTypes).toHaveLength(2)
  })
})
