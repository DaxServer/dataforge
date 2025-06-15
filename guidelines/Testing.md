# Testing Guidelines

This document outlines testing patterns and best practices for the OpenRefine NG project.

> **Note**: Frontend testing is currently **not implemented** in this project. Frontend testing guidelines have been moved to <mcfile name="FrontendTesting.md" path="/Users/sriharithalla/projects/openrefine-ng/guidelines/FrontendTesting.md"></mcfile> for future reference.

## Table of Contents
- [Elysia and Eden Testing Patterns](#elysia-and-eden-testing-patterns)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Response Handling](#response-handling)
- [Database in Tests](#database-in-tests)
- [Test Doubles](#test-doubles)
- [Test Data](#test-data)
- [E2E Testing](#e2e-testing)
- [Running Tests](#running-tests)

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

### Error Testing

When testing error responses:

1. Test the HTTP status code
2. Test that `data` is null
3. Test the error structure using `toMatchObject`
4. Test specific error codes and messages

```typescript
const { data, status, error } = await testApp.api.projects[':id'].get({
  params: { id: 'invalid-id' }
})

expect(status).toBe(400)
expect(data).toBeNull()
expect(error).toMatchObject({
  status: 400,
  value: {
    errors: [
      {
        code: 'VALIDATION',
        message: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: 'id',
            message: 'Invalid uuid',
          }),
        ]),
      },
    ],
  },
})
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

  // 4. Test Cases
  it('should register a new user', async () => {
    const { data, status, error } = await api.user.register.post(testUser)
    // Test implementation
  })

  // 5. Cleanup
  afterEach(async () => {
    await closeDb()
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
- **Never use conditional statements** (if/else, switch, ternary operators) in tests
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

// 3. Test error structure using matchers
expect(error).toBeDefined()
expect(error).toHaveProperty('status', 422)
expect(error).toHaveProperty('value.errors')
expect(error).toMatchObject({
  status: 422,
  value: {
    errors: expect.arrayContaining([
      expect.objectContaining({
        code: 'VALIDATION',
        message: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: '/name',
            message: 'Expected string',
          }),
        ]),
      }),
    ]),
  },
})
```

### Anti-patterns to Avoid

```typescript
// ❌ Don't chain property access on the raw response
expect(response.status).toBe(422)

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
| `expect.objectContaining()` | When testing specific fields in an object | `expect(user).toMatchObject({ id: 1 })` |
| `expect.arrayContaining()` | When testing specific items in an array | `expect(users).toEqual(expect.arrayContaining([{ id: 1 }]))` |
| `expect.any()` | When only the type matters | `expect(user.id).toEqual(expect.any(Number))` |
| `expect.stringContaining()` | When testing partial strings | `expect(error).toEqual(expect.stringContaining('not found'))` |

### Assertion Best Practices

- Be explicit about which parts of the response you're testing
- Test one thing per assertion
- Use the most specific matcher possible
- Avoid testing implementation details

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
- Keep factories in `test/factories`
- Use Faker.js for realistic test data

### Fixtures
- Store complex test data in JSON files
- Keep fixtures in `test/fixtures`
- Use meaningful file names

### Example Factory
```typescript
// test/factories/project.ts
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

## E2E Testing

### Setup
- Use Playwright for E2E tests
- Store tests in `tests/e2e`
- Use page object model pattern

### Best Practices
- Test critical user flows
- Use data-testid attributes for reliable selectors
- Run tests in headless mode in CI
- Take screenshots on failure

### Example Test
```typescript
// tests/e2e/projects.spec.ts
import { test, expect } from '@playwright/test'
import { ProjectsPage } from '../pages/projects-page'

test.describe('Projects', () => {
  test('should create a new project', async ({ page }) => {
    const projectsPage = new ProjectsPage(page)
    await projectsPage.goto()
    await projectsPage.createProject('My New Project')
    
    await expect(page.getByText('Project created successfully')).toBeVisible()
    await expect(page.getByText('My New Project')).toBeVisible()
  })
})
```

## Running Tests

### Test Commands

Always use the package.json scripts to run tests and related commands:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run a specific test file
bun test path/to/test/file.test.ts

# Generate test coverage report
bun test --coverage
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
bun --inspect test/path/to/test.test.ts
```

Then open Chrome DevTools to debug the test execution.

### Important Notes

- Never run testing tools directly (e.g., `vitest`, `eslint`, `typescript`)
- Always use the package.json scripts
- All checks must pass before considering a task complete
- The CI pipeline enforces these same checks
