# Testing Reference

> **Comprehensive testing strategies and patterns for backend**

## Related Guidelines
- **[Backend Guidelines](../core/BACKEND.md)** - Core backend testing principles
- **[General Guidelines](../core/GENERAL.md)** - Project-wide testing philosophy
- **[Error Handling Reference](./ERROR_HANDLING.md)** - Testing error scenarios
- **[Elysia Eden Reference](./ELYSIA_EDEN.md)** - Testing type-safe APIs

## Table of Contents
- [Elysia and Eden Testing Patterns](#elysia-and-eden-testing-patterns)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Response Handling](#response-handling)
- [Temporary File Cleanup Patterns](#temporary-file-cleanup-patterns)
- [Writing Assertions](#writing-assertions)
- [Database in Tests](#database-in-tests)
- [Test Doubles](#test-doubles)
- [Test Data](#test-data)
- [Running Tests](#running-tests)
- [Testing Private Methods](#testing-private-methods)
- [Important Notes](#important-notes)

## Elysia and Eden Testing Patterns

### Test Application Setup

When testing Elysia applications with Eden:

1. **Create a test client factory** directly in your test file
2. **Use in-memory database** for all tests
3. **Create a new app instance** for each test to ensure isolation
4. **Use Eden's treaty client** for type-safe API calls

```typescript
// In your test file
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { projectRoutes } from '@backend/api/project'
import { initializeDb, closeDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'

// Create a test app with the project routes
const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}

describe('Project API', () => {
  let api: ReturnType<typeof createTestApi>

  beforeEach(async () => {
    // Initialize a fresh in-memory database
    await initializeDb(':memory:')

    // Create a fresh app instance for each test
    api = createTestApi()
  })

  afterEach(async () => {
    await closeDb()
  })

  it('should do something', async () => {
    const { data, status, error } = await api.endpoint.get(params)
    // assertions
  })
})
```

### Response Handling

When testing Eden API responses:

1. Always destructure the Eden response into `{ data, status, error }`
2. Test the response status code directly using the destructured `status`
3. Test the response data structure directly using the destructured `data`
4. Test the error structure directly using the destructured `error`
5. **Do not further destructure** the `data`, `status`, or `error` properties - test them directly

**Important**: The destructuring applies only to the initial Eden response. Once you have `data`, `status`, and `error`, test these properties directly without additional destructuring.

#### Do's and Don'ts

**✅ Do:**

```typescript
// Destructure the Eden response once
const { data, status, error } = await api.endpoint.get(params)

// Test data, status, and error directly
expect(status).toBe(200)
expect(data).toBeDefined()
expect(error).toBeNull()

// Use toHaveProperty() for nested properties
expect(data).toHaveProperty('data')
expect(data).toHaveProperty('data.id', 'some-id')
expect(error).toHaveProperty('status', 400)

// Check error is defined before accessing its properties
expect(error).toBeDefined()
expect(error).toHaveProperty('value.errors')
```

**❌ Don't:**

```typescript
// Don't chain property access on the raw response
const response = await api.endpoint.get(params)
expect(response.status).toBe(200) // ❌ Avoid this

// Don't further destructure data, status, or error
const { data, status, error } = await api.endpoint.get(params)
const { id } = data // ❌ Avoid this

// Don't access nested properties directly
expect(data.data.id).toBe('some-id') // ❌ Avoid this

// Don't use toMatchObject for error structure testing
expect(error).toMatchObject({ status: 400 }) // ❌ Prefer toHaveProperty

// Don't forget to check if error is defined
expect(error.status).toBe(400) // ❌ This might throw if error is undefined

// Don't use incorrect error structure assertions
expect(error).toHaveProperty('data') // ❌ Wrong path, should be 'value.data'
```

### Error Testing

When testing error responses:

1. Test the HTTP status code
2. Test that `data` is null
3. Test the error structure using `toHaveProperty`
4. Test specific error codes and messages

```typescript
const { data, status, error } = await testApp.api.projects({
  id: 'invalid-id'
}).get()

expect(status).toBe(400)
expect(data).toBeNull()
expect(error).toBeDefined()
expect(error).toHaveProperty('status', 400)
expect(error).toHaveProperty('value.data', [])
expect(error).toHaveProperty('value.errors', [
  {
    code: 'VALIDATION',
    message: 'Validation failed',
    details: [
       {
         path: 'id',
         message: 'Invalid uuid',
       },
     ],
   },
 ])
```

## Test Structure

All test files should follow this structure:

1. **Imports**
2. **Test Data**
3. **Test Suite**
4. **Test Cases**
5. **Cleanup**

Example:

```typescript
// 1. Imports
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { userRoutes } from '@backend/api/user'
import { initializeDb, closeDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'

// 2. Test Data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'securepassword123!'
}

// Create a test client factory
const createTestApi = () => {
  return treaty(new Elysia().use(userRoutes)).api
}

describe('User Authentication', () => {
  let api: ReturnType<typeof createTestApi>

  // 3. Setup
  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()
  })

  // 4. Cleanup
  afterEach(async () => {
    await closeDb()
  })

  // 5. Test Cases
  it('should register a new user', async () => {
    // Test implementation
  })
})
```

- Tests are co-located with the code they test in `__tests__` directories
- Test files are named with `.test.ts` suffix
- Each test file should test a single module or component

## Writing Tests

### Best Practices

- Test behavior, not implementation
- Use descriptive test names (e.g., `should return 404 when resource not found`)
- Keep tests focused and independent
- Avoid complex logic in tests
- Mock external dependencies
- Never use `try...catch` in tests
- Never use conditional statements (if/else, switch, ternary operators) in tests
- Never throw in tests
- Test edge cases and error conditions
- Keep tests deterministic (same input should always produce same output)

## Response Handling

When testing API responses, follow this pattern to ensure consistent and maintainable tests:

### Response Structure

1. **Destructure the Eden response** to access `status`, `data`, and `error`
2. **Test the response structure** using the destructured values with appropriate matchers
3. **Do not access nested properties directly** - use `toHaveProperty()` matcher instead
4. **Do not further destructure** the `data`, `status`, or `error` properties
5. **Use matchers** for flexible and maintainable assertions

### Example: Testing Success Responses

```typescript
// 1. Destructure the Eden response only
const { data, status, error } = await api.project({ id: projectId }).get()

// 2. Test the response structure using matchers
expect(status).toBe(200)
expect(error).toBeNull()
expect(data).toBeDefined()

// 3. Test nested properties using toHaveProperty matcher
expect(data).toHaveProperty('data')
expect(data).toHaveProperty('meta')
expect(data).toHaveProperty('data.length', 3)
expect(data).toHaveProperty('meta.total', 3)
```

### Example: Testing Error Responses

```typescript
// 1. Destructure the Eden response only
const { data, status, error } = await api.project.post({})

// 2. Test the response structure using matchers
expect(status).toBe(422)
expect(data).toBeNull()

// 3. Test error structure using toHaveProperty
expect(error).toBeDefined()
expect(error).toHaveProperty('status', 422)
expect(error).toHaveProperty('value.data', [])
expect(error).toHaveProperty('value.errors', [
  {
    code: 'VALIDATION',
    message: 'Validation failed',
    details: [
      {
        path: '/name',
        message: 'Expected string',
        received: undefined,
      },
    ],
  },
])
```

### Error Structure Patterns

All API error responses follow a consistent structure. The error object contains:

- `status`: HTTP status code
- `value.data`: Always an empty array `[]` for error responses
- `value.errors`: Array of error objects with details

**Note**: Error responses do not include stack traces for security and cleanliness reasons.

#### Validation Errors (422)

```typescript
const { data, status, error } = await api.project.post({ name: '' })

expect(status).toBe(422)
expect(data).toBeNull()
expect(error).toBeDefined()
expect(error).toHaveProperty('status', 422)
expect(error).toHaveProperty('value.data', [])
expect(error).toHaveProperty('value.errors', [
  {
    code: 'VALIDATION',
    message: 'Validation failed',
    details: [
      {
        path: '/name',
        message: 'String must contain at least 1 character(s)',
        received: '',
      },
    ],
  },
])
```

#### Client Errors (400)

When testing client errors (e.g., 400 Bad Request, 422 Unprocessable Entity), focus on asserting the correct HTTP status code, the absence of data, and the structure of the error object. The error object should typically contain a `status` property matching the HTTP status, and a `value.data.errors` array detailing the specific validation or client-side issues.

```typescript
// Example for a 422 Unprocessable Entity error
expect(status).toBe(422)
expect(data).toBeNull()
expect(error).toHaveProperty('status', 422)
expect(error).toHaveProperty('value.data')
expect(error).toHaveProperty('value.data.errors')
expect(error).toHaveProperty('value.data.errors.length', 1)
expect(error).toHaveProperty('value.data.errors[0].code', 'VALIDATION_ERROR')
expect(error).toHaveProperty('value.data.errors[0].message', 'Validation failed')
```
#### Not Found Errors (404)

When testing for resources not found (404), the focus should be on verifying the 404 HTTP status code, ensuring no data is returned, and confirming the error object's structure, which typically includes a `status` property matching 404 and a `value.errors` array with a `NOT_FOUND` code.

```typescript
// Example for a 404 Not Found error
const { data, status, error } = await api.project({ id: 'non-existent' }).delete()

expect(status).toBe(404)
expect(data).toBeNull()
expect(error).toBeDefined()
expect(error).toHaveProperty('status', 404)
expect(error).toHaveProperty('value.data', [])
expect(error).toHaveProperty('value.errors', [
  {
    code: 'NOT_FOUND',
    message: 'Resource not found',
    details: [],
  },
])
```

#### Conflict Errors (409)

When testing for conflict errors (409), assert the correct HTTP status code, ensure no data is returned, and verify the error object's structure. The error object should typically include a `status` property matching 409 and a `value.errors` array with a specific conflict code, such as `TABLE_ALREADY_EXISTS`.

```typescript
// Example for a 409 Conflict error
const { data, status, error } = await api.project({ id: projectId }).import.post({ file })

expect(status).toBe(409)
expect(data).toBeNull()
expect(error).toBeDefined()
expect(error).toHaveProperty('status', 409)
expect(error).toHaveProperty('value.data', [])
expect(error).toHaveProperty('value.errors', [
  {
    code: 'TABLE_ALREADY_EXISTS',
    message: 'Table already exists for this project',
    details: [],
  },
])
```

#### Server Errors (500)

When testing for server errors (500), verify the 500 HTTP status code, ensure no data is returned, and confirm the error object's structure. The error object should typically include a `status` property matching 500 and a `value.errors` array with a generic server error code like `INTERNAL_SERVER_ERROR`.

```typescript
// Example for a 500 Internal Server Error
const { data, status, error } = await api.project({ id: projectId }).import.post({ file })

expect(status).toBe(500)
expect(data).toBeNull()
expect(error).toBeDefined()
expect(error).toHaveProperty('status', 500)
expect(error).toHaveProperty('value.data', [])
expect(error).toHaveProperty('value.errors', [
  {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    details: [],
  },
])
```

### Anti-patterns to Avoid

```typescript
// ❌ Don't chain property access on the raw response
expect(response.status).toBe(422)

// ❌ Don't use toMatchObject for error structure testing
expect(error).toMatchObject({ status: 422 })  // Use toHaveProperty instead

// ❌ Don't use incorrect error structure assertions
expect(error).toHaveProperty('data', [])  // Wrong - should be 'value.data'
expect(error).toHaveProperty('errors')    // Wrong - should be 'value.errors'

// ❌ Don't use generic error checking for specific error types
expect(error).toHaveProperty('value')  // Too generic - be specific about structure

// ❌ Don't forget to check error is defined first
expect(error).toHaveProperty('status', 422)  // Missing: expect(error).toBeDefined()

// ❌ Don't use deep property access on the raw response
expect(response.error.status).toBe(422)

// ❌ Don't skip destructuring the Eden response
const result = await api.project.post({})
expect(result.status).toBe(422) // Wrong - should destructure first

// ❌ Don't further destructure the data, status, or error properties
const { data, status, error } = await api.project.post({})
const { data: innerData, meta } = data // Wrong - use toHaveProperty instead

// ❌ Don't access nested properties directly
expect(data.data).toBeInstanceOf(Array) // Wrong - use toHaveProperty
expect(data.data.length).toBe(3) // Wrong - use toHaveProperty
expect(data.meta.total).toBe(3) // Wrong - use toHaveProperty

// ✅ Correct way - use toHaveProperty matcher
expect(data).toHaveProperty('data')
expect(data).toHaveProperty('data.length', 3)
expect(data).toHaveProperty('meta.total', 3)
```

### Matcher Guidelines

| Matcher | When to Use | Example |
|---------|-------------|---------|
| `expect.objectContaining()` | When testing specific fields in an object | `expect(user).toHaveProperty('id', 1)` |
| `expect.arrayContaining()` | When testing specific items in an array | `expect(users).toEqual(expect.arrayContaining([{ id: 1 }]))` |
| `expect.any()` | When only the type matters | `expect(user.id).toEqual(expect.any(Number))` |
| `expect.stringContaining()` | When testing partial strings | `expect(error).toEqual(expect.stringContaining('not found'))` |

## Temporary File Cleanup Patterns

When tests create temporary files, they **MUST** be cleaned up to prevent test pollution and avoid leaving artifacts in the project directory.

### ✅ Recommended Pattern: afterEach Cleanup

```typescript
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

describe('File operations', () => {
  afterEach(async () => {
    // Clean up temporary files created during tests
    const tempFiles = [
      './temp-test-file.json',
      './temp-invalid-json-file.json'
    ]

    await Promise.all(
      tempFiles.map(async filePath => {
        await Bun.file(filePath).delete().catch(() => {})
      })
    )
  })

  test('should process file', async () => {
    const tempFilePath = './temp-test-file.json'
    await Bun.write(tempFilePath, JSON.stringify({ test: 'data' }))

    // Test logic here
    // No manual cleanup needed - afterEach handles it
  })
})
```

### ✅ Alternative Pattern: Directory Cleanup

```typescript
import { readdir } from 'node:fs/promises'

afterEach(async () => {
  // Clean up entire temporary directory
  const tempDir = new URL('../../temp', import.meta.url).pathname
  const files = await readdir(tempDir).catch(() => [])
  await Promise.all(
    files.map(async file => {
      const filePath = `${tempDir}/${file}`
      await Bun.file(filePath).delete().catch(() => {})
    })
  )
})
```

### ❌ Anti-patterns

```typescript
// ❌ Don't rely on manual cleanup in each test
test('should process file', async () => {
  const tempFilePath = './temp-test-file.json'
  await Bun.write(tempFilePath, JSON.stringify({ test: 'data' }))

  // Test logic

  await Bun.file(tempFilePath).delete() // Fragile - may not run if test fails
})

// ❌ Don't create files in project root without cleanup
test('should process file', async () => {
  await Bun.write('./some-file.json', 'data')
  // No cleanup - leaves artifacts
})

// ❌ Don't ignore cleanup errors without good reason
await Bun.file(tempFilePath).delete() // May throw if file doesn't exist
```

### Best Practices

1. **Use afterEach for cleanup**: Ensures cleanup runs even if tests fail
2. **List all temp files explicitly**: Makes cleanup predictable and thorough
3. **Use .catch(() => {})**: Prevents cleanup failures from breaking tests
4. **Prefer temp directories**: Keep temporary files organized in dedicated directories
5. **Document temp file patterns**: Make it clear what files tests create

## Writing Assertions

Assertions are the core of any test, verifying that the code behaves as expected. Bun's test runner provides a familiar `expect` API, similar to Jest or Vitest, allowing for a wide range of assertions.

- **Be Specific**: Assertions should be as specific as possible. Instead of `expect(result).toBeDefined()`, prefer `expect(result).toEqual({ key: 'value' })`.
- **One Assertion Per Test (Ideally)**: While not always strictly possible or practical, aiming for one logical assertion per test makes tests easier to understand and debug. If a test fails, you know exactly what failed.
- **Avoid Over-Testing Implementation Details**: Test the observable behavior of your code, not its internal implementation. Refactoring should not break tests unless the behavior changes.
- **Use Matchers Appropriately**: Choose the right matcher for the job. For example, use `toEqual` for deep equality checks on objects and arrays, and `toBe` for primitive value equality or referential equality.
- **Clear Error Messages**: When writing custom matchers or complex assertions, ensure that the failure messages are clear and helpful.

### Common Assertions and Examples

Here are some common assertion patterns you'll use, based on typical backend testing scenarios:

- **`toBe(value)`**: Checks for strict equality (===) for primitive values or referential equality for objects.

  ```typescript
  expect(status).toBe(201)
  expect(data).toBeNull()
  ```

- **`toHaveProperty(property, value?)`**: Checks if an object has a property, optionally verifying its value.

  ```typescript
  expect(data).toHaveProperty('data')
  expect(data).toHaveProperty('data.name', projectData.name)
  expect(error).toHaveProperty('status', 422)
  ```

- **`toBeNull()`**: Verifies that a value is `null`.

  ```typescript
  expect(data).toBeNull()
  expect(error).toBeNull()
  ```

- **`toBeDefined()`**: Verifies that a value is not `undefined`.

  ```typescript
  expect(error).toBeDefined()
  ```

- **`stringMatching(regex)`**: Checks if a string matches a regular expression.

  ```typescript
  expect(data).toHaveProperty('data.id', expect.stringMatching(UUID_REGEX_PATTERN))
  expect(data).toHaveProperty(
    'data.created_at',
    expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,3})?$/)
  )
  ```

- **`toEqual(value)`**: Recursively checks for deep equality of all properties of objects or elements of arrays.

  ```typescript
  expect(error).toHaveProperty('value.errors', [
    {
      code: 'VALIDATION',
      message: 'Project name is required and must be at least 1 character long',
      details: [
        {
          path: '/name',
          message: 'Expected string',
          schema: {
            error: 'Project name is required and must be at least 1 character long',
            minLength: 1,
            type: 'string',
          },
        },
      ],
    },
  ])
  ```

## Database in Tests

### Test Database Setup

- **Always** use an in-memory database (`:memory:`) for tests
- Configure the database plugin with the in-memory path in test setup
- Let the database plugin handle all schema migrations and initialization

### Test Data Management

- **Do** use the application's API to create test data when possible
- **Do** use factory functions to create test data
- **Don't** manually insert data directly into the database
- **Don't** assume any pre-existing data in tests

### Example Test Setup

```typescript
// In your test file
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { projectRoutes } from '@backend/api/project'
import { initializeDb, closeDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'

// Create a test client factory
const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}

describe('Project API', () => {
  let api: ReturnType<typeof createTestApi>

  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()
  })

  afterEach(async () => {
    await closeDb()
  })

  // Tests go here
})
```

### Best Practices

| Do | Don't |
|----|-------|
| ✅ Use application API for test data | ❌ Manually initialize the database |
| ✅ Let plugin handle migrations | ❌ Create tables in test code |
| ✅ Use in-memory database | ❌ Use file-based database |
| ✅ Assume clean state | ❌ Assume database state between tests |
| ✅ Use factory functions | ❌ Hardcode test data in multiple places |

### Cleanup

- The in-memory database is automatically cleaned up after each test
- No explicit cleanup is needed in most cases
- For complex test scenarios, use `afterEach` or `afterAll` hooks for cleanup

## Test Doubles

### Mocks
- Use mocks for external dependencies
- Keep mock implementations close to the tests that use them
- Use `vi.fn()` for function mocks
- Clear mocks between tests with `vi.clearAllMocks()`

### Stubs
- Use stubs for complex dependencies
- Return consistent test data
- Avoid over-specifying stub behavior

### Spies
- Use spies to verify function calls
- Check call counts and arguments
- Use `toHaveBeenCalledWith()` for precise assertions

## Test Data

### Factories
- Use factory functions for creating test data
- Keep factories in `tests/factories`
- Use Faker.js for realistic test data

### Fixtures
- Store complex test data in JSON files
- Keep fixtures in `tests/fixtures`
- Use meaningful file names

### Example Factory
```typescript
// tests/factories/project.ts
import { faker } from '@faker-js/faker'

export const createProject = (overrides = {}) => {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }
}
```

## Running Tests

### Test Commands

Always use the package.json scripts to run tests and related commands:

```bash
# Run all tests
bun test

# Run a specific test file
bun test path/to/test/file.test.ts
```

### Required Checks Before Completion

Before considering any task complete, ensure all these checks pass:

```bash
# Run all tests
bun test

# Check TypeScript types
bun typecheck

# Lint the code
bun lint

# Format code (fixes formatting issues)
bun format
```

### Debugging Tests

To debug tests, use:

```bash
# Run with Node.js inspector
bun --inspect tests/path/to/test.test.ts
```

Then open Chrome DevTools to debug the test execution.

### Testing Private Methods

**Do NOT test private methods directly**:

- Private methods are implementation details and should not be tested directly
- TypeScript will show compilation errors when accessing private methods from tests
- If you need to test functionality in a private method, test it through the public API
- If a private method contains complex logic that needs testing, consider refactoring it into a separate utility function

```typescript
// ❌ DON'T: Test private methods directly
describe('createErrorWithData', () => {
  it('should create error with data', () => {
    // This will cause TypeScript compilation errors
    const result = ApiErrorHandler.createErrorWithData('ERROR', 'message', [], {})
    expect(result).toBeDefined()
  })
})

// ✅ DO: Test through public API
describe('ApiErrorHandler', () => {
  it('should create validation error', () => {
    const result = ApiErrorHandler.validationError('Invalid input', [])
    expect(result.status).toBe(422)
    expect(result.value.errors[0].code).toBe('VALIDATION')
  })
})
```

### Important Notes

- Never run testing tools directly (e.g., `vitest`, `eslint`, `typescript`)
- Always use the package.json scripts
- All checks must pass before considering a task complete
- The CI pipeline enforces these same checks
- Do not test private methods directly - test through public APIs only
