# Elysia Eden Integration Reference

> **Detailed implementation guide for type-safe API integration**

## Related Guidelines

- **[Backend Guidelines](../core/BACKEND.md)** - Core backend development with Elysia
- **[Frontend Guidelines](../core/FRONTEND.md)** - API consumption patterns
- **[General Guidelines](../core/GENERAL.md)** - Project-wide type safety principles
- **[Testing Reference](./TESTING.md)** - Testing type-safe APIs

## Quick Links

- [Backend Setup](#backend-setup)
- [Frontend Integration](#frontend-integration)
- [Type Safety](#type-safety)
- [Best Practices](#best-practices)

## Table of Contents

- [Backend Setup](#backend-setup)
- [Frontend Integration](#frontend-integration)
- [Best Practices](#best-practices)
- [Testing](#testing)

## Backend Setup

When setting up Elysia with Eden on the backend, follow these conventions:

1. **Route Definitions**
   - Organize routes by resource
   - Use consistent naming for route parameters
   - Validate all inputs with schemas
   - Document response types

### Route Definitions

Define routes with proper schemas for type inference:

```typescript
// @backend/api/project/index.ts
import { t } from 'elysia'

const ProjectSchema = {
  params: t.Object({
    id: t.String(),
  }),
  response: t.Object({
    id: t.String(),
    name: t.String(),
    // ... other fields
  }),
}

export const projectRoutes = new Elysia({ prefix: '/api/project' }).get(
  '/:id',
  async ({ params: { id } }) => {
    // Implementation
  },
  ProjectSchema,
)
```

## Frontend Integration

### Using API Client in Components

```vue
<script setup lang="ts">
// MANDATORY: Always use useApi() composable
const { api } = useApi()
const projects = ref([])
const error = ref(null)

const fetchProjects = async () => {
  const { data, error: apiError } = await api.project.get()
  if (apiError) {
    error.value = 'Failed to fetch projects'
    return
  }
  projects.value = data
}

// Call on component mount
onMounted(fetchProjects)
</script>

<template>
  <div>
    <div
      v-if="error"
      class="text-red-500"
    >
      {{ error }}
    </div>
    <div v-else>
      <div
        v-for="project in projects"
        :key="project.id"
        class="p-4 border-b"
      >
        {{ project.name }}
      </div>
    </div>
  </div>
</template>
```

## Best Practices

### Type Safety

- Always define input/output schemas in your backend routes
- Use the generated `App` type in your frontend
- Enable strict mode in TypeScript
- **NEVER create custom types for data structures** - use Elysia Eden inferred types
- **Reuse Backend Schemas**: For complex data structures, export and import backend schemas directly into the frontend for type definitions. This ensures consistency and avoids hardcoding types.
- **Rare exceptions**: Internal utility types, configuration types, or helper types not related to API data

#### Automatic Type Inference

Elysia Eden provides full type safety - **NEVER create custom types**:

```typescript
// CORRECT: Use Elysia Eden inferred types
import type { App } from '@backend'

// Extract types from the backend API
type User = Awaited<ReturnType<App['api']['users']['get']>>['data']
type CreateUserBody = Parameters<App['api']['users']['post']>[0]['body']
type UpdateUserBody = Parameters<App['api']['users']['patch']>[0]['body']

// Types are automatically inferred from backend
const { api } = useApi()
const user = await api.users({ id: '123' }).get()
// user is typed as the response from GET /users/:id

const newUser = await api.users.post({
  name: 'John Doe',
  email: 'john@example.com',
})
// Request body is typed according to the backend schema

// WRONG: Never create custom interfaces
// interface User { id: string; name: string } // DON'T DO THIS
```

### Error Handling

**Frontend Context (Stores/Composables)**: Use reactive error state instead of throwing

```typescript
// ✅ DO: Set error state in frontend stores
const createProject = async (projectData: { name: string }) => {
  const { api } = useApi()
  isLoading.value = true
  error.value = null

  try {
    const { data, error: apiError } = await api.project.post(projectData)

    if (apiError) {
      // Type-safe error handling
      // error.value is automatically typed based on the route's error responses
      const errorMessage = apiError.value?.errors?.[0]?.message || 'Failed to create project'
      error.value = new Error(errorMessage)
      return
    }

    // data is automatically typed based on the route's success response
    project.value = data
  } catch (err) {
    error.value = err as Error
  } finally {
    isLoading.value = false
  }
}
```

**Service/Utility Context**: Return error results instead of throwing

```typescript
// ✅ DO: Return error results in utility functions
const createProjectService = async (projectData: { name: string }) => {
  const { data, error } = await api.project.post(projectData)

  if (error) {
    const errorMessage = error.value?.errors?.[0]?.message || 'Failed to create project'
    console.error(`Project creation failed: ${errorMessage}`)
    return { error: errorMessage, data: null }
  }

  return { error: null, data }
}
```

### Query Parameters

```typescript
// Backend
.get(
  '/',
  ({ query }) => {
    const { limit = 10, offset = 0 } = query
    // ...
  },
  {
    query: t.Object({
      limit: t.Optional(t.Numeric()),
      offset: t.Optional(t.Numeric())
    })
  }
)

// Frontend
const { api } = useApi()
const { data, error } = await api.project({
  query: { limit: 10, offset: 0 }
}).get()
```

## Testing

For comprehensive testing information, please refer to the Elysia section in <mcurl name="TESTING.md#elysia-and-eden-testing-patterns" url="guidelines/reference/TESTING.md#elysia-and-eden-testing-patterns"></mcurl>.
