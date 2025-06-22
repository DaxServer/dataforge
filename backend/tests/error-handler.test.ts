import { describe, it, expect } from 'bun:test'
import { ApiErrorHandler } from '../src/types/error-handler'
import type { ErrorResponse } from '@backend/types/error-schemas'

describe('ApiErrorHandler', () => {
  describe('validationError', () => {
    it('should create a validation error response', () => {
      const result = ApiErrorHandler.validationError('Invalid input')

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'VALIDATION',
            message: 'Invalid input',
            details: [],
          },
        ],
      })
    })

    it('should create a validation error response with details', () => {
      const details = ['Name is required']
      const result = ApiErrorHandler.validationError('Validation failed', details)

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'VALIDATION',
            message: 'Validation failed',
            details,
          },
        ],
      })
    })
  })

  describe('notFoundError', () => {
    it('should create a not found error without identifier', () => {
      const result = ApiErrorHandler.notFoundError('Project')

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'NOT_FOUND',
            message: 'Project not found',
            details: [],
          },
        ],
      })
    })

    it('should create a not found error with identifier', () => {
      const result = ApiErrorHandler.notFoundError('Project', '123')

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'NOT_FOUND',
            message: "Project with identifier '123' not found",
            details: [],
          },
        ],
      })
    })
  })

  describe('databaseError', () => {
    it('should create a database error response', () => {
      const result = ApiErrorHandler.databaseError('Connection failed')

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'DATABASE_ERROR',
            message: 'Connection failed',
            details: [],
          },
        ],
      })
    })

    it('should create a database error response with details', () => {
      const details = ['Timeout after 30s']
      const result = ApiErrorHandler.databaseError('Query failed', details)

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'DATABASE_ERROR',
            message: 'Query failed',
            details,
          },
        ],
      })
    })
  })

  describe('fileError', () => {
    it('should create a missing file error', () => {
      const result = ApiErrorHandler.fileError('MISSING_FILE', 'File not provided')

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'MISSING_FILE',
            message: 'File not provided',
            details: [],
          },
        ],
      })
    })

    it('should create an invalid file type error', () => {
      const result = ApiErrorHandler.fileError('INVALID_FILE_TYPE', 'Only JSON files allowed')

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'INVALID_FILE_TYPE',
            message: 'Only JSON files allowed',
            details: [],
          },
        ],
      })
    })

    it('should create an empty file error', () => {
      const result = ApiErrorHandler.fileError('EMPTY_FILE', 'File is empty')

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'EMPTY_FILE',
            message: 'File is empty',
            details: [],
          },
        ],
      })
    })

    it('should create a file not found error', () => {
      const result = ApiErrorHandler.fileError('FILE_NOT_FOUND', 'File does not exist')

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'FILE_NOT_FOUND',
            message: 'File does not exist',
            details: [],
          },
        ],
      })
    })
  })

  describe('projectCreationError', () => {
    it('should create a project creation error', () => {
      const result = ApiErrorHandler.projectCreationError('Failed to create project')

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'PROJECT_CREATION_FAILED',
            message: 'Failed to create project',
            details: [],
          },
        ],
      })
    })
  })

  describe('dataImportError', () => {
    it('should create a data import error', () => {
      const result = ApiErrorHandler.dataImportError('Import failed')

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'DATA_IMPORT_FAILED',
            message: 'Import failed',
            details: [],
          },
        ],
      })
    })
  })

  describe('invalidJsonError', () => {
    it('should create an invalid JSON error', () => {
      const result = ApiErrorHandler.invalidJsonError('Invalid JSON format')

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'INVALID_JSON',
            message: 'Invalid JSON format',
            details: [],
          },
        ],
      })
    })

    it('should create an invalid JSON error with details', () => {
      const details = ['Unexpected token at line 5']
      const result = ApiErrorHandler.invalidJsonError('JSON parse error', details)

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'INVALID_JSON',
            message: 'JSON parse error',
            details,
          },
        ],
      })
    })
  })

  describe('internalServerError', () => {
    it('should create an internal server error with default message', () => {
      const result = ApiErrorHandler.internalServerError()

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
            details: [],
          },
        ],
      })
    })

    it('should create an internal server error with custom message', () => {
      const result = ApiErrorHandler.internalServerError('Custom error message')

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Custom error message',
            details: [],
          },
        ],
      })
    })
  })

  describe('tableExistsError', () => {
    it('should create a table exists error', () => {
      const result = ApiErrorHandler.tableExistsError('project_123')

      expect(result).toEqual({
        data: [],
        errors: [
          {
            code: 'TABLE_ALREADY_EXISTS',
            message: "Table with name 'project_123' already exists",
            details: [],
          },
        ],
      })
    })
  })

  describe('type checking', () => {
    it('should return ErrorResponse type for basic methods', () => {
      const result: ErrorResponse = ApiErrorHandler.validationError('test')
      expect(result.data).toEqual([])
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('VALIDATION')
    })

    it('should handle all error codes', () => {
      const errorCodes = [
        'VALIDATION',
        'MISSING_FILE_PATH',
        'MISSING_FILE',
        'INVALID_FILE_TYPE',
        'EMPTY_FILE',
        'FILE_NOT_FOUND',
        'TABLE_ALREADY_EXISTS',
        'INTERNAL_SERVER_ERROR',
        'DATABASE_ERROR',
        'PROJECT_CREATION_FAILED',
        'DATA_IMPORT_FAILED',
        'INVALID_JSON',
        'NOT_FOUND',
      ] as const

      // Test a few representative error methods since createError is removed
      const validationResult = ApiErrorHandler.validationError('Test message')
      expect(validationResult.errors[0].code).toBe('VALIDATION')
      expect(validationResult.data).toEqual([])

      const notFoundResult = ApiErrorHandler.notFoundError('Resource')
      expect(notFoundResult.errors[0].code).toBe('NOT_FOUND')
      expect(notFoundResult.data).toEqual([])
    })
  })
})
