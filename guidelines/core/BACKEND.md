# Backend Development Guidelines

> **Applies to**: Elysia Server, Database, API Development

## Related Guidelines
- **[General Guidelines](./GENERAL.md)** - Project-wide standards and setup
- **[Frontend Guidelines](./FRONTEND.md)** - API consumption patterns
- **[Error Handling Reference](../reference/ERROR_HANDLING.md)** - Detailed error patterns
- **[Elysia Eden Reference](../reference/ELYSIA_EDEN.md)** - Type-safe integration guide
- **[Testing Reference](../reference/TESTING.md)** - Backend testing strategies

## Table of Contents
- [Overview](#overview)
- [Elysia Server Setup](#elysia-server-setup)
- [API Design](#api-design)
- [Database Operations](#database-operations)
- [Error Handling](#error-handling)
- [Type Safety](#type-safety)
- [File Uploads](#file-uploads)
- [Testing](#testing)
- [Performance & Security](#performance--security)

## Overview

### Backend Tech Stack
- **Runtime**: Bun
- **Framework**: Elysia
- **Database**: DuckDB
- **Type Safety**: Elysia Eden for frontend integration
- **Testing**: Bun test
- **File Handling**: Native Bun APIs

### Core Principles
- **Type-First Development**: All types are inferred and shared with frontend
- **Eden Integration**: Mandatory use of Elysia Eden for type safety
- **Centralized Error Handling**: Consistent error responses across all endpoints
- **Database Schema Flexibility**: Dynamic schema creation based on data
- **Performance**: Leverage Bun's speed for optimal performance

## Elysia Server Setup

### Route Organization

Routes should be organized into separate modules with clear separation of concerns. Each API module should contain the following files:

- **`routes.ts`** - Route definitions and middleware
- **`handlers.ts`** - Business logic handlers
- **`schemas.ts`** - Type definitions and validation schemas
- **`index.ts`** - Module exports
- **Additional files** - Specialized functionality (e.g., `import.ts`)

#### File Structure Example
```
src/api/project/
├── routes.ts      # Route definitions
├── handlers.ts    # Handler functions
├── schemas.ts     # Schemas and types
├── import.ts      # Specialized import handlers
└── index.ts       # Module exports
```

#### Routes File (`routes.ts`)
```typescript
import { Elysia } from 'elysia'
import {
  createProject,
  deleteProject,
  getAllProjects,
  getProjectById,
  importWithFile,
} from '@backend/api/project/handlers'
import {
  CreateProjectSchema,
  DeleteProjectSchema,
  GetAllProjectsSchema,
  GetProjectByIdSchema,
  ImportProjectSchema,
  ImportFileProjectSchema,
  ImportWithFileSchema,
} from './schemas'
import { importProject, importProjectFile } from '@backend/api/project/import'
import { ApiErrorHandler } from '@backend/types/error-handler'

export const projectRoutes = new Elysia({ prefix: '/api/project' })
  .get('/', getAllProjects, GetAllProjectsSchema)
  .get('/:id', getProjectById, GetProjectByIdSchema)
  .post('/', createProject, CreateProjectSchema)
  .delete('/:id', deleteProject, DeleteProjectSchema)
  .post('/:id/import', importProject, ImportProjectSchema)
  .post('/:id/import/file', importProjectFile, ImportFileProjectSchema)
  .post('/import', importWithFile, ImportWithFileSchema)
```

#### Handlers File (`handlers.ts`)
```typescript
import type { Context } from 'elysia'
import type {
  CreateProjectInput,
  Project,
  GetProjectByIdInput,
} from '@backend/api/project/schemas'
import { getDb } from '@backend/plugins/database'
import { ApiErrorHandler } from '@backend/types/error-handler'

export const getProjectById = async ({ params, set }: Context<{ params: GetProjectByIdInput }>) => {
   // Handler implementation logic...
 }

export const createProject = async ({
   body,
   set,
 }: Context<{
   body: CreateProjectInput
 }>) => {
   // Handler implementation logic...
 }

// Additional handlers...
```

#### Schemas File (`schemas.ts`)
```typescript
import { t } from 'elysia'
import { ErrorResponseWithDataSchema } from '@backend/types/error-schemas'

// Schema definitions and validation rules...
// Type exports and schema objects...
```

#### Index File (`index.ts`)
```typescript
export * from '@backend/api/project/routes'
export * from '@backend/api/project/handlers'
```

#### Specialized Files (e.g., `import.ts`)
```typescript
import { getDb } from '@backend/plugins/database'
import type { Context } from 'elysia'
import type { ImportProjectInput } from './schemas'
import { ApiErrorHandler } from '@backend/types/error-handler'

export const importProject = async ({
   params: { id },
   body,
   set,
 }: Context<{ body: ImportProjectInput }>) => {
   // Handler implementation logic...
 }

// Additional specialized handlers...
```

## API Design

### Response Format Standards

ToDo

### Validation Schemas

ToDo

### Path Parameters

ToDo

## Database Operations

### Database usage

```typescript
// DuckDB usage
import { getDb } from '@backend/plugins/database'

// Query execution with DuckDB connection...
// Data retrieval and manipulation operations...
// Result processing and error handling...
```

### Transaction Handling

ToDo

## Error Handling

### Centralized Error Handler

The project uses a centralized error handling system with two main components:

#### Error Schemas and Types

```typescript
// src/types/error-schemas.ts
import { t } from 'elysia'

// Predefined error codes
export const ErrorCodeSchema = t.Union([
  t.Literal('VALIDATION'),
  t.Literal('NOT_FOUND'),
  t.Literal('FILE_NOT_FOUND'),
  t.Literal('DATABASE_ERROR'),
  // ... other error codes
])

// Standard error response format
export const ErrorResponseWithDataSchema = t.Object({
  data: t.Array(t.Any()),
  errors: t.Array(t.Object({
    code: ErrorCodeSchema,
    message: t.String(),
    details: t.Optional(t.Array(t.Any())),
  })),
})
```

#### ApiErrorHandler Class

```typescript
// src/types/error-handler.ts
export class ApiErrorHandler {
  // Create standardized error responses
  static notFoundError(resource: string, identifier?: string): ErrorResponseWithData {
    // Implementation creates consistent error format...
  }

  static validationError(message: string, details: unknown[]): ErrorResponseWithData {
    // Implementation creates validation error format...
  }

  static databaseError(message: string, details: unknown[]): ErrorResponseWithData {
    // Implementation creates database error format...
  }

  // ... other error methods
}
```

#### Usage in Handlers

```typescript
// src/api/project/handlers.ts
import { ApiErrorHandler } from '@backend/types/error-handler'

export const getProjectById = async ({ params, set }) => {
  // Check if resource exists
  if (projects.length === 0) {
    set.status = 404
    return ApiErrorHandler.notFoundErrorWithData('Project')
  }

  // Handle database errors
  try {
    // Database operations...
  } catch (error) {
    if (error.message.includes('does not exist')) {
      set.status = 404
      return ApiErrorHandler.notFoundErrorWithData('Project', params.id)
    }

    // Handle specific error cases...
    if (...) {
      set.status = ...
      return ApiErrorHandler....
    }

    throw error // Let route error handler catch it
  }
}
```

## Type Safety

### Elysia Eden Integration
```typescript
// Export app type for frontend
export type App = typeof app

// Frontend usage (automatic type inference)
// The frontend will import this type and get full type safety
```

### Type Definitions
```typescript
// src/types/index.ts
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  email?: string
}

export interface Project {
  id: string
  name: string
  description: string
  userId: string
  createdAt: string
  updatedAt: string
}
```

### Schema Validation

ToDo

## Testing

## Testing

### Test Structure

The backend uses **Bun's built-in test runner** with the following organization:

```
backend/test/
├── api/
│   └── project/
│       ├── create.test.ts
│       ├── delete.test.ts
│       ├── getAll.test.ts
│       ├── getById.test.ts
│       ├── import-file.test.ts
│       ├── import-with-file.test.ts
│       └── import.test.ts
├── db.test.ts
└── error-handler.test.ts
```

### Testing Framework

- **Test Runner**: Bun's native test runner (`bun:test`)
- **API Testing**: Elysia with Eden Treaty for type-safe API testing
- **Database**: In-memory DuckDB instances for isolated tests
- **Assertions**: Bun's built-in `expect` assertions

### Database Testing Setup

Each test uses isolated in-memory DuckDB instances:

```typescript
// Database lifecycle management
beforeEach(async () => {
  // Fresh in-memory database for each test
  await initializeDb(':memory:')
})

afterEach(async () => {
  // Clean up database connections
  await closeDb()
})
```

**Key Features:**
- Isolated test environments
- No shared state between tests
- Fast in-memory database operations
- Automatic cleanup after each test

### API Testing Patterns

#### Test App Creation
```typescript
// Type-safe API client creation
const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}
```

#### Common Test Patterns
- **Validation Testing**: Input validation and error responses
- **Success Path Testing**: Valid operations and expected responses
- **Error Handling**: 404, 422, and 500 error scenarios
- **Data Integrity**: Response structure and data validation

#### Test Data Management
```typescript
// Test data setup and cleanup
const setupTestData = async () => {
  // Create test projects and import sample data
}

const cleanupTestData = async () => {
  // Remove test projects and temporary files
}
```

### Unit Testing

#### Database Operations
- Database initialization and connection management
- CRUD operations validation
- Error handling for database failures

#### Error Handler Testing
- Validation error responses
- Not found error handling
- Internal server error scenarios
- Error response structure validation

### Integration Testing

#### Project API Endpoints
- **Create**: Project creation with validation
- **Read**: Project retrieval by ID and listing
- **Update**: Project modification operations
- **Delete**: Project removal and cleanup
- **Import**: File import functionality with various formats

#### File Operations
- File upload and processing
- Invalid file handling
- Temporary file cleanup
- File path validation

### Test Utilities

#### Assertions
- UUID format validation
- Timestamp format verification
- Response structure validation
- Error code and message verification

#### Test Helpers
- API client creation
- Database setup and teardown
- Test data generation
- File cleanup utilities

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test test/api/project/create.test.ts
```
