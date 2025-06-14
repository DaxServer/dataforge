# Testing Guidelines

## Test Structure

- Tests are co-located with the code they test in `__tests__` directories
- Test files are named with `.test.ts` suffix
- Each test file should test a single module or component

## Writing Tests

- Test behavior, not implementation
- Use descriptive test names
- Keep tests focused and independent
- Avoid complex logic in tests
- Mock external dependencies
- Never use `try...catch` in tests
- Test the response directly without destructuring

### Example: "Test the response directly without destructuring"
Valid:
```ts
const { data, status, error } = await api.project.post({})

expect(status).toBe(422)
expect(data).toBeNull()

// Check that the error object has the expected structure
expect(error).toBeDefined()
expect(error).toHaveProperty('status', 422)
expect(error).toHaveProperty('value', {
  errors: [
    {
      code: 'VALIDATION',
      message: 'Validation failed',
      details: [
        {
          path: '/name',
          message: 'Expected string',
        },
      ],
    },
  ],
})
```

Invalid:
```ts
const response = await api.project.post({})

expect(response.status).toBe(422)
expect(response.data).toBeNull()
expect(response.error.status).toBe(422)
expect(response.error.value.errors).toHaveLength(1)
expect(response.error.value.errors[0].code).toBe('VALIDATION')
expect(response.error.value.errors[0].message).toBe('Validation failed')
expect(response.error.value.errors[0].details).toHaveLength(1)
expect(response.error.value.errors[0].details[0].path).toBe('/name')
expect(response.error.value.errors[0].details[0].message).toBe('Expected string')
```

## Running Tests

Run all tests:
```bash
bun test
```

Run TypeScript type checking:
```bash
bun typecheck
```

Run Eslint:
```bash
bun lint
```

Run Prettier:
```bash
bun format
```
