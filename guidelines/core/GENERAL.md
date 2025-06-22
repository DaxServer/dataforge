# General Development Guidelines

> **Applies to**: Both Frontend and Backend development

## Related Guidelines
- **[Frontend Guidelines](./FRONTEND.md)** - Vue 3, Tailwind, Pinia specifics
- **[Backend Guidelines](./BACKEND.md)** - Elysia, DuckDB, API design
- **[Error Handling Reference](../reference/ERROR_HANDLING.md)** - Detailed error patterns
- **[Testing Reference](../reference/TESTING.md)** - Comprehensive testing guide
- **[Conflicts & Decisions](../conflicts/CONFLICTS_TO_RESOLVE.md)** - Outstanding team decisions

## Table of Contents
- [Project Overview](#project-overview)
- [Development Workflow](#development-workflow)
- [Code Style Standards](#code-style-standards)
- [TypeScript Guidelines](#typescript-guidelines)
- [Documentation Standards](#documentation-standards)
- [Testing Philosophy](#testing-philosophy)
- [Project Structure](#project-structure)

## Project Overview

This project re-implements OpenRefine using modern web technologies:

### Tech Stack
- **Runtime**: Bun (package manager, runtime, test runner)
- **Backend**: Elysia + Elysia Eden + TypeScript
- **Frontend**: Vue 3 Composition API + PrimeVue + Pinia + Vite + TypeScript
- **Database**: DuckDB with NodeJS Neo client
- **Styling**: Tailwind CSS
- **Testing**: Bun test framework

### Core Principles
- **Type Safety**: Leverage Elysia Eden for end-to-end type inference
- **No Runtime Errors**: Use TypeScript and proper error handling patterns
- **Developer Experience**: Auto-imports, hot reload, comprehensive tooling
- **Performance**: Bun for speed, reactive patterns for efficiency

## Development Workflow

### Package Management
- **MANDATORY**: Use `bun` for all package management and script execution
- **FORBIDDEN**: npm, yarn, pnpm, or any other package managers
- **FORBIDDEN**: Node.js runtime - use Bun exclusively

### Script Execution
```bash
# Always run scripts from package.json
bun dev         # Start development servers
bun run build   # Build for production
bun test        # Run all tests
bun lint        # Run ESLint
bun format      # Run Prettier
```

## Code Style Standards

### ESLint and Prettier
- **MANDATORY**: Use ESLint and Prettier for code formatting
- **MANDATORY**: Follow the project's ESLint configuration
- **MANDATORY**: Format code before committing

### Code Formatting Rules
```typescript
// Use 2 spaces for indentation
const example = {
  property: 'value',
  nested: {
    item: 'data'
  }
}

// Use single quotes for strings
const message = 'Hello, world!'

// Use trailing commas in multiline structures
const array = [
  'item1',
  'item2',
  'item3', // <- trailing comma
]
```

## TypeScript Guidelines

### Variable Declarations
```typescript
// Use 'const' for variables that are not reassigned
const apiUrl = 'http://localhost:3000'
const config = { timeout: 5000 }

// Use 'let' for variables that are reassigned
let counter = 0
let currentUser = null
```

### Function Declarations
```typescript
// MANDATORY: Always use arrow functions
const processData = (data: string) => {
  return data.toUpperCase()
}

// FORBIDDEN: Function declarations
// function processData(data: string) { ... }
```

### Async Operations
```typescript
// MANDATORY: Use async/await for asynchronous operations
const fetchUserData = async (userId: string) => {
  const response = await api.users.get({ params: { id: userId } })
  return response.data
}

// FORBIDDEN: Promise chains
// api.users.get().then(response => response.data)
```

### Loops and Iteration
```typescript
// Use for...of for arrays
for (const item of items) {
  console.log(item)
}

// Use for...in for objects
for (const key in object) {
  console.log(key, object[key])
}
```

### Error Handling
```typescript
// FORBIDDEN: Nested try...catch blocks
// try {
//   try {
//     // nested try...catch
//   } catch (innerError) {}
// } catch (outerError) {}

// GOOD: Single level error handling
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw error
}
```

### Type Definitions
```typescript
// Prefer 'type' over 'interface' for union/intersection types
type Status = 'pending' | 'completed' | 'failed'
type UserWithPermissions = User & { permissions: Permission[] }

// Use 'interface' for object shapes that might be extended
interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}
```

## Documentation Standards

### Code Documentation
```typescript
/**
 * Processes user data and returns formatted result
 * @param userData - Raw user data from API
 * @param options - Processing options
 * @returns Formatted user data
 * @throws {ValidationError} When user data is invalid
 */
const processUserData = async (
  userData: RawUserData,
  options: ProcessingOptions
): Promise<FormattedUserData> => {
  // Implementation
}
```

### File Headers
```typescript
/**
 * @fileoverview User management utilities
 * @author Your Name
 * @created 2024-01-01
 */
```

### README Standards
- Include clear setup instructions
- Document all available scripts
- Provide examples for common use cases
- Keep documentation up to date

## Testing Philosophy

### General Testing Rules
```typescript
// MANDATORY: Use Bun test framework
import { test, expect } from 'bun:test'

// FORBIDDEN: Never throw errors in tests
// FORBIDDEN: Never use try...catch in test logic

test('should process data correctly', async () => {
  const result = await processData('input')
  expect(result).toBe('expected')
})
```

### Test Organization
- Co-locate tests with source code in `__tests__` directories
- Use descriptive test names that explain the expected behavior
- Group related tests using `describe` blocks
- Test both success and error scenarios

## Project Structure

### Path Aliases
```typescript
// MANDATORY: Use path aliases for imports
import { db } from '@backend/database'
import { User } from '@backend/models'
import { useApi } from '@frontend/composables'

// FORBIDDEN: Relative imports across major boundaries
// import { db } from '../../../backend/src/database'
```

### Directory Organization
```
project-root/
├── backend/           # Backend application
│   ├── src/
│   │   ├── api/       # Route handlers
│   │   ├── plugins/   # Elysia plugins
│   │   └── types/     # Backend-specific types
│   └── tests/         # Backend tests
├── frontend/          # Frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── stores/
│   │   └── pages/
└── guidelines/        # Project documentation
```

### File Naming Conventions
- Use kebab-case for file names: `user-profile.vue`, `api-client.ts`
- Use PascalCase for component files: `UserProfile.vue`, `DataTable.vue`
- Use camelCase for utility files: `dateUtils.ts`, `apiHelpers.ts`

---

**Related Guidelines:**
- [Frontend Guidelines](./FRONTEND.md) - Vue 3, Pinia, Tailwind CSS
- [Backend Guidelines](./BACKEND.md) - Elysia, Database, API design
- [Conflicts to Resolve](./CONFLICTS_TO_RESOLVE.md) - Outstanding decisions needed
