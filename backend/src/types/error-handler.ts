import type { ErrorCode, ApiError } from '@backend/types/error-schemas'

/**
 * Centralized error handler for creating consistent API error responses
 */
export class ApiErrorHandler {
  /**
   * Create a validation error response with data array
   */
  static validationError(message: string = 'Validation failed', details: unknown[] = []): ApiError {
    return this.createErrorWithData('VALIDATION', message, details)
  }

  /**
   * Create a validation error response with data array (for compatibility)
   */
  static validationErrorWithData(
    message: string = 'Validation failed',
    details: unknown[] = [],
  ): ApiError {
    return this.createErrorWithData('VALIDATION', message, details)
  }

  /**
   * Create a not found error response
   */
  static notFoundError(resource: string = 'Resource', identifier?: string): ApiError {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`
    return this.createErrorWithData('NOT_FOUND', message)
  }

  /**
   * Create a not found error response with data array (for compatibility)
   */
  static notFoundErrorWithData(resource: string = 'Resource', identifier?: string): ApiError {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`
    return this.createErrorWithData('NOT_FOUND', message, [])
  }

  /**
   * Create a missing file path error response with data array
   */
  static missingFilePathError(message: string = 'File path is required'): ApiError {
    return this.createErrorWithData('MISSING_FILE_PATH', message, [])
  }

  /**
   * Create a file not found error response with data array
   */
  static fileNotFoundError(filePath?: string): ApiError {
    const message = 'File not found'
    const details = filePath ? [filePath] : []
    return this.createErrorWithData('FILE_NOT_FOUND', message, details)
  }

  /**
   * Create a table already exists error response with data array
   */
  static tableExistsErrorWithData(tableName: string): ApiError {
    return this.createErrorWithData(
      'TABLE_ALREADY_EXISTS',
      `Table with name '${tableName}' already exists`,
    )
  }

  /**
   * Create an internal server error response with data array
   */
  static internalServerErrorWithData(
    message: string = 'An error occurred while processing the request',
    details: unknown[] = [],
  ): ApiError {
    return this.createErrorWithData('INTERNAL_SERVER_ERROR', message, details)
  }

  /**
   * Create a database error response
   */
  static databaseError(
    message: string = 'Database error occurred',
    details: unknown[] = [],
  ): ApiError {
    return this.createErrorWithData('DATABASE_ERROR', message, details)
  }

  /**
   * Create a database error response with data array
   */
  static databaseErrorWithData(
    message: string = 'Database error occurred',
    details: unknown[] = [],
  ): ApiError {
    return this.createErrorWithData('DATABASE_ERROR', message, details)
  }

  /**
   * Create a file-related error response
   */
  static fileError(
    type: 'MISSING_FILE' | 'INVALID_FILE_TYPE' | 'EMPTY_FILE' | 'FILE_NOT_FOUND',
    message: string,
    details: unknown[] = [],
  ): ApiError {
    return this.createErrorWithData(type, message, details)
  }

  /**
   * Create a project creation error response
   */
  static projectCreationError(
    message: string = 'Failed to create project',
    details: unknown[] = [],
  ): ApiError {
    return this.createErrorWithData('PROJECT_CREATION_FAILED', message, details)
  }

  /**
   * Create a project creation error response with data array
   */
  static projectCreationErrorWithData(
    message: string = 'Failed to create project',
    details: unknown[] = [],
  ): ApiError {
    return this.createErrorWithData('PROJECT_CREATION_FAILED', message, details)
  }

  /**
   * Create a data import error response
   */
  static dataImportError(
    message: string = 'Failed to import data',
    details: unknown[] = [],
  ): ApiError {
    return this.createErrorWithData('DATA_IMPORT_FAILED', message, details)
  }

  /**
   * Create a data import error response with data array
   */
  static dataImportErrorWithData(
    message: string = 'Failed to import data',
    details: unknown[] = [],
  ): ApiError {
    return this.createErrorWithData('DATA_IMPORT_FAILED', message, details)
  }

  /**
   * Create an invalid JSON error response
   */
  static invalidJsonError(
    message: string = 'Invalid JSON format',
    details: unknown[] = [],
  ): ApiError {
    return this.createErrorWithData('INVALID_JSON', message, details)
  }

  /**
   * Create an invalid JSON error response with data array
   */
  static invalidJsonErrorWithData(
    message: string = 'Invalid JSON format',
    details: unknown[] = [],
  ): ApiError {
    return this.createErrorWithData('INVALID_JSON', message, details)
  }

  /**
   * Create an internal server error response
   */
  static internalServerError(
    message: string = 'Internal server error',
    details: unknown[] = [],
  ): ApiError {
    return this.createErrorWithData('INTERNAL_SERVER_ERROR', message, details)
  }

  /**
   * Create a table already exists error response
   */
  static tableExistsError(tableName: string): ApiError {
    return this.createErrorWithData(
      'TABLE_ALREADY_EXISTS',
      `Table with name '${tableName}' already exists`,
    )
  }

  /**
   * Internal method to create an error response with data array (for compatibility with existing schemas)
   * @private
   */
  private static createErrorWithData(
    code: ErrorCode,
    message: string,
    details: unknown[] = [],
  ): ApiError {
    return {
      data: [],
      errors: [
        {
          code,
          message,
          details,
        },
      ],
    }
  }
}
