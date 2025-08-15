# Error Handling Reference

> **Detailed implementation guide for centralized error handling**

## Related Guidelines

- **[Backend Guidelines](../core/BACKEND.md)** - Core backend development standards
- **[General Guidelines](../core/GENERAL.md)** - Project-wide error handling philosophy
- **[Testing Reference](./TESTING.md)** - Error handling test patterns

## Quick Links

- [Error Handler Class](#error-handler-class)
- [Error Response Format](#error-response-format)
- [Available Error Types](#available-error-types)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Overview

The backend uses a centralized error handling approach through the `ApiErrorHandler` class, which creates consistent error responses across all API endpoints.

## Error Handler Class

The `ApiErrorHandler` class is located at `src/types/error-handler.ts` and provides static methods for creating standardized error responses.

### Key Features

- **Centralized Error Creation**: All errors are created through static methods
- **Consistent Format**: All errors follow the `ErrorResponseWithData` schema
- **Type Safety**: Uses TypeScript types for error codes and responses
- **Detailed Information**: Supports error details for debugging

## Error Response Format

All error responses follow this standardized format:

```typescript
{
  data: [],
  errors: [
    {
      code: 'ERROR_CODE',
      message: 'Human readable message',
      details: [] // Optional array of additional details
    }
  ]
}
```

## Available Error Types

### Validation Errors

```typescript
// Basic validation error
ApiErrorHandler.validationError('Invalid input format')

// Validation error with details
ApiErrorHandler.validationError('Validation failed', [
  { field: 'email', message: 'Invalid email format' },
])
```

### Not Found Errors

```typescript
// Basic not found
ApiErrorHandler.notFoundError('Project')

// Not found with identifier
ApiErrorHandler.notFoundError('Project', 'project-123')
```

### Database Errors

```typescript
// Basic database error
ApiErrorHandler.databaseError('Connection failed')

// Database error with details
ApiErrorHandler.databaseError('Query failed', [{ query: 'SELECT * FROM projects' }])
```

### File Errors

```typescript
// Specific file error types
ApiErrorHandler.fileError('MISSING_FILE', 'File is required')
ApiErrorHandler.fileError('INVALID_FILE_TYPE', 'Only CSV files are allowed')
ApiErrorHandler.fileError('EMPTY_FILE', 'File cannot be empty')
ApiErrorHandler.fileError('FILE_NOT_FOUND', 'File does not exist')

// Convenience methods
ApiErrorHandler.fileNotFoundError('/path/to/file.csv')
ApiErrorHandler.missingFilePathError('File path is required')
```

### Project Errors

```typescript
// Project creation errors
ApiErrorHandler.projectCreationError('Failed to create project')
ApiErrorHandler.projectCreationError('Invalid project data', [details])
```

### Data Import Errors

```typescript
// Data import errors
ApiErrorHandler.dataImportError('Failed to import CSV')
ApiErrorHandler.dataImportError('Invalid data format', [rowErrors])
```

### Server Errors

```typescript
// Internal server errors
ApiErrorHandler.internalServerError('Unexpected error occurred')
ApiErrorHandler.internalServerError('Service unavailable', [serviceDetails])
```

### Table Errors

```typescript
// Table already exists
ApiErrorHandler.tableExistsError('users')
```

### JSON Errors

```typescript
// Invalid JSON format
ApiErrorHandler.invalidJsonError('Malformed JSON')
ApiErrorHandler.invalidJsonError('Invalid JSON structure', [parseErrors])
```

## Usage in Routes

### Basic Usage

```typescript
import { ApiErrorHandler } from '@backend/types/error-handler'

app.get('/projects/:id', async ({ params }) => {
  const project = await findProject(params.id)

  if (!project) {
    return ApiErrorHandler.notFoundError('Project', params.id)
  }

  return { data: project }
})
```

### With Validation

```typescript
app.post('/projects', async ({ body }) => {
  const validation = validateProjectData(body)

  if (!validation.valid) {
    return ApiErrorHandler.validationError('Invalid project data', validation.errors)
  }

  try {
    const project = await createProject(body)
    return { data: project }
  } catch (error) {
    return ApiErrorHandler.projectCreationError('Failed to create project', [error.message])
  }
})
```

### Database Operations

```typescript
app.get('/projects', async () => {
  try {
    const projects = await db.selectFrom('projects').selectAll().execute()
    return { data: projects }
  } catch (error) {
    return ApiErrorHandler.databaseError('Failed to fetch projects', [error.message])
  }
})
```

## Error Codes

The following error codes are available:

- `VALIDATION` - Input validation failures
- `NOT_FOUND` - Resource not found
- `DATABASE_ERROR` - Database operation failures
- `INTERNAL_SERVER_ERROR` - Unexpected server errors
- `PROJECT_CREATION_FAILED` - Project creation failures
- `DATA_IMPORT_FAILED` - Data import failures
- `INVALID_JSON` - JSON parsing errors
- `MISSING_FILE_PATH` - Missing file path
- `MISSING_FILE` - Missing file
- `INVALID_FILE_TYPE` - Invalid file type
- `EMPTY_FILE` - Empty file
- `FILE_NOT_FOUND` - File not found
- `TABLE_ALREADY_EXISTS` - Table already exists

## Best Practices

1. **Always use ApiErrorHandler**: Never create error responses manually
2. **Provide meaningful messages**: Use descriptive error messages for users
3. **Include details for debugging**: Add relevant details for development/debugging
4. **Use appropriate error types**: Choose the most specific error type available
5. **Consistent error handling**: Handle similar errors in the same way across routes

## Testing Error Responses

```typescript
import { expect, test } from 'bun:test'
import { ApiErrorHandler } from '@backend/types/error-handler'

test('should create validation error', () => {
  const error = ApiErrorHandler.validationError('Test error')

  expect(error.data).toEqual([])
  expect(error.errors).toHaveLength(1)
  expect(error.errors[0].code).toBe('VALIDATION')
  expect(error.errors[0].message).toBe('Test error')
  expect(error.errors[0].details).toEqual([])
})
```

## Migration from Old Error Handling

If you encounter old error handling patterns, update them as follows:

```typescript
// ❌ Old pattern
return { error: 'Project not found', data: null }

// ✅ New pattern
return ApiErrorHandler.notFoundError('Project', projectId)
```

```typescript
// ❌ Old pattern
throw new Error('Validation failed')

// ✅ New pattern
return ApiErrorHandler.validationError('Validation failed', details)
```
