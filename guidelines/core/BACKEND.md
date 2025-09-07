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

**IMPORTANT**: All endpoints must be declared in the `index.ts` file with inline handlers to ensure type safety in Elysia. Do not separate handlers into individual files.

Routes should be organized into modules with the following structure. Each API module should contain:

- **`index.ts`** - Route definitions with **inline handlers** (required for type safety)
- **`schemas.ts`** - Shared type definitions and validation schemas
- **Additional files** - Specialized functionality, rare cases only (e.g., `import.ts`)

#### Type Safety Requirement

Inline handlers in `index.ts` ensure that Elysia can properly infer types and maintain type safety throughout the application. Separating handlers into different files breaks this type inference.

#### File Structure Example

```
src/api/project/
├── index.ts                    # Routes with inline handlers
├── schemas.ts                  # Schemas and types
├── project.wikibase.ts         # Wikibase-related schemas
└── import.ts                   # Import-related schemas
```

#### Routes File (`index.ts`)

```typescript
import { Elysia, t } from 'elysia'
import cors from '@elysiajs/cors'
import { errorHandlerPlugin } from '@backend/plugins/error-handler'
import { databasePlugin } from '@backend/plugins/database'
import {
  ProjectCreateSchema,
  ProjectDeleteSchema,
  GetProjectByIdSchema,
  ProjectResponseSchema,
  UUIDPattern,
} from '@backend/api/project/schemas'

export const projectRoutes = new Elysia({ prefix: '/api/project' })
  .use(errorHandlerPlugin)
  .use(databasePlugin)
  .use(cors())

  .get(
    '/',
    async ({ db }) => {
      const reader = await db().runAndReadAll(
        'SELECT * FROM _meta_projects ORDER BY created_at DESC',
      )
      const projects = reader.getRowObjectsJson()
      return {
        data: projects as (typeof ProjectResponseSchema.static)[],
      }
    },
    ProjectsGetAllSchema,
  )

  .post(
    '/',
    async ({ db, body: { name } }) => {
      const reader = await db().runAndReadAll(
        `INSERT INTO _meta_projects (name)
         VALUES (?)
         RETURNING *`,
        [name],
      )
      const projects = reader.getRowObjectsJson()
      return {
        data: projects[0] as typeof ProjectResponseSchema.static,
      }
    },
    ProjectCreateSchema,
  )

// Additional routes with inline handlers...
```

#### Schemas and Types File (`schemas.ts`)

```typescript
import { t } from 'elysia'

// Single UUID regex pattern that accepts any valid UUID version with hyphens (case-insensitive)
export const UUID_REGEX =
  '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'

// RegExp version of UUID_REGEX for test matching
export const UUID_REGEX_PATTERN = new RegExp(UUID_REGEX, 'i')

export const ProjectResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  created_at: t.String(),
  updated_at: t.String(),
})

export type Project = typeof ProjectResponseSchema.static

export const UUIDPattern = t.String({ pattern: UUID_REGEX })

export const PaginationQuery = t.Object({
  offset: t.Optional(t.Numeric({ minimum: 0, default: 0 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 1000, default: 25 })),
})

export const ProjectCreateSchema = {
  body: t.Object({
    name: t.String({
      minLength: 1,
      error: 'Project name is required and must be at least 1 character long',
    }),
  }),
  response: {
    201: t.Object({
      data: ProjectResponseSchema,
    }),
    422: ApiError,
    500: ApiError,
  },
}
```

## API Design

### Response Format Standards

ToDo

### Validation Schemas

**IMPORTANT**: All Elysia endpoint schemas must be complete and use correct types. Follow DRY (Don't Repeat Yourself) principles.

#### Schema Completeness Requirements

- **Complete Type Definitions**: All schema properties must use appropriate Elysia types
- **Correct Type Usage**: Use `t.Number()` for numeric values, not `t.String()` masquerading as numbers
- **DRY Principle**: Reuse common schemas and patterns across endpoints
- **Exceptions Only**: Incomplete schemas like `t.Any()` should only be used in exceptional cases

#### Type Usage Examples

```typescript
// CORRECT: Use appropriate types
export const ProjectCreateSchema = {
  body: t.Object({
    name: t.String({ minLength: 1 }),
    budget: t.Number({ minimum: 0 }), // Use t.Number for numeric values
    priority: t.Union([
      // Use unions for enums
      t.Literal('low'),
      t.Literal('medium'),
      t.Literal('high'),
    ]),
    isActive: t.Boolean(), // Use t.Boolean for booleans
    tags: t.Array(t.String()), // Use t.Array for arrays
    metadata: t.Optional(
      t.Object({
        // Use t.Optional for optional fields
        description: t.String(),
        category: t.String(),
      }),
    ),
  }),
  response: {
    201: t.Object({
      data: ProjectResponseSchema,
    }),
    422: ApiError,
    500: ApiError,
  },
}

// WRONG: Incorrect type usage
export const BadProjectSchema = {
  body: t.Object({
    name: t.String(),
    budget: t.String(), // DON'T: Use t.String for numbers
    priority: t.String(), // DON'T: Use t.String for enums
    isActive: t.String(), // DON'T: Use t.String for booleans
    tags: t.Any(), // DON'T: Use t.Any unless exceptional
  }),
}
```

#### DRY Schema Patterns

```typescript
// Reusable base schemas
export const BaseEntitySchema = t.Object({
  id: UUIDPattern,
  created_at: t.String(),
  updated_at: t.String(),
})

// Extend base schemas
export const ProjectResponseSchema = t.Intersect([
  BaseEntitySchema,
  t.Object({
    name: t.String(),
    budget: t.Number(),
    priority: ProjectPrioritySchema,
  }),
])

// Reusable query schemas
export const PaginationQuery = t.Object({
  offset: t.Optional(t.Numeric({ minimum: 0, default: 0 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 1000, default: 25 })),
})

// Reusable response wrappers
export const createDataResponse = <T extends TSchema>(schema: T) =>
  t.Object({
    data: schema,
  })

export const createPaginatedResponse = <T extends TSchema>(schema: T) =>
  t.Object({
    data: t.Array(schema),
    pagination: PaginationMetaSchema,
  })
```

#### Exceptional Cases

Use incomplete schemas only when absolutely necessary:

```typescript
// Acceptable: Dynamic data structures
export const DynamicDataSchema = {
  body: t.Object({
    tableName: t.String(),
    data: t.Any(), // Acceptable: Unknown structure from file import
  }),
}

// Acceptable: Legacy system integration
export const LegacyApiSchema = {
  response: {
    200: t.Object({
      result: t.Any(), // Acceptable: Third-party API with unknown structure
    }),
  },
}
```

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

**Important**: All error responses MUST follow the `ApiError` format. Never create custom error response structures.

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
  errors: t.Array(
    t.Object({
      code: ErrorCodeSchema,
      message: t.String(),
      details: t.Optional(t.Array(t.Any())),
    }),
  ),
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
// src/api/project/index.ts
import { ApiErrorHandler } from '@backend/types/error-handler'

// Resource not found
.onBeforeHandle(async ({ params: { projectId }, projects, status }) => {
  if (projects.length === 0) {
    return status(404, ApiErrorHandler.notFoundErrorWithData('Project', projectId))
  }
})

// Database operation errors
.get('/:projectId', async ({ db, params: { projectId }, status }) => {
  try {
    const tableName = `project_${projectId}`
    const reader = await db().runAndReadAll(`SELECT * FROM "${tableName}"`)
    return { data: reader.getRowObjectsJson() }
  } catch (error) {
    if (error instanceof Error && error.message.includes('does not exist')) {
      return status(404, ApiErrorHandler.notFoundErrorWithData('Project', projectId))
    }
    throw error // Let global error handler catch it
  }
})

// File validation errors
.post('/import', async ({ body: { file }, status }) => {
  const fileExists = await Bun.file(filePath).exists()
  if (!fileExists) {
    return status(400, ApiErrorHandler.fileNotFoundError(filePath))
  }

  // JSON parsing errors
  try {
    await Bun.file(tempFilePath).json()
  } catch (parseError) {
    return status(400, ApiErrorHandler.invalidJsonErrorWithData(
      'Invalid JSON format in uploaded file',
      [parseError.message]
    ))
  }

  // Table exists errors
  const tableExistsReader = await db().runAndReadAll(
    `SELECT 1 FROM duckdb_tables() WHERE table_name = 'project_${projectId}'`
  )
  if (tableExistsReader.getRows().length > 0) {
    return status(409, ApiErrorHandler.tableExistsErrorWithData(`project_${projectId}`))
  }

  // Project creation errors
  if (projects.length === 0) {
    return status(500, ApiErrorHandler.projectCreationErrorWithData(
      'Failed to create project: No project returned from database'
    ))
  }
})
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
backend/tests/
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
bun test tests/api/project/create.test.ts
```
