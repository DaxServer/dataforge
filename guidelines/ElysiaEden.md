# Elysia Eden Guidelines

> **Note**: These guidelines cover the usage of Elysia Eden for type-safe API interactions between frontend and backend. All documentation should follow the [Style Guide](../guidelines/StyleGuide.md).

## Table of Contents
- [Backend Setup](#backend-setup)
- [Frontend Integration](#frontend-integration)
- [Best Practices](#best-practices)
- [Testing](#testing)

## Backend Setup

When setting up Elysia with Eden on the backend, follow these conventions:

1. **Export App Type**
   - Always export the `App` type from your main application file
   - Use proper TypeScript types for all route handlers
   - Document all endpoints with JSDoc

2. **Route Definitions**
   - Organize routes by resource
   - Use consistent naming for route parameters
   - Validate all inputs with Zod schemas
   - Document response types

Example backend setup:

```typescript
// @backend/index.ts
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { userRoutes } from '@backend/routes/users'

// Create the Elysia app
export const app = new Elysia()
  .use(swagger())
  .use(userRoutes)
  .listen(3000)

// Export the app type for Eden
export type App = typeof app

console.log(
  `🦊 Elysia server is running at ${app.server?.hostname}:${app.server?.port}`
)
```

### Export App Type
Ensure your main Elysia app exports its type:

```typescript
// @backend/index.ts
export const app = new Elysia({
  // ... config
})

export type App = typeof app
```

### Route Definitions
Define routes with proper schemas for type inference:

```typescript
// @backend/api/project/routes.ts
import { t } from 'elysia'

export const projectRoutes = new Elysia({ prefix: '/api/project' })
  .get(
    '/:id',
    async ({ params: { id } }) => {
      // Implementation
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: t.Object({
        id: t.String(),
        name: t.String(),
        // ... other fields
      })
    }
  )
```

## Frontend Integration

### API Client Setup
```typescript
// @frontend/composables/useApi.ts
// No need to import edenTreaty - it's auto-imported
import type { App } from '@backend/index'

export const api = edenTreaty<App>('http://localhost:3000').api
```

### Using in Components
```vue
<script setup lang="ts">
// No need to import - it's auto-imported
const projects = ref([])
const error = ref(null)

const fetchProjects = async () => {
  try {
    const { data, error: apiError } = await api.project.get()
    if (apiError) throw apiError
    projects.value = data
  } catch (err) {
    error.value = err.message
  }
}

// Call on component mount
onMounted(fetchProjects)
</script>

<template>
  <div>
    <div v-if="error" class="text-red-500">{{ error }}</div>
    <div v-else>
      <div v-for="project in projects" :key="project.id" class="p-4 border-b">
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

### Error Handling
```typescript
// No need to import InferRouteResponse - Eden Treaty handles types automatically

const createProject = async (projectData: { name: string }) => {
  try {
    const { data, error } = await api.project.post(projectData)
    
    if (error) {
      // Type-safe error handling
      // error.value is automatically typed based on the route's error responses
      const errorMessage = error.value?.errors?.[0]?.message || 'Failed to create project'
      throw new Error(errorMessage)
    }
    
    // data is automatically typed based on the route's success response
    return data
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Project creation failed: ${err.message}`)
      throw new Error(`Project creation failed: ${err.message}`)
    }
    throw new Error('An unexpected error occurred')
  }
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
const { data } = await api.project.get({
  query: { limit: 10, offset: 0 }
})
```

### File Uploads
```typescript
// Backend
.post(
  '/import',
  async ({ body: { file } }) => {
    // Handle file upload
    return { success: true, filename: file.name }
  },
  {
    body: t.Object({
      file: t.File()
    })
  }
)

// Frontend
const handleFileUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const { data, error } = await api.project.import.post({
      file: file  // Direct file upload
    })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('File upload failed:', error)
    throw error
  }
}
```

## Testing

### Backend Tests
```typescript
// test/api/project/getById.test.ts
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { projectRoutes } from '@backend/api/project'
import { initializeDb, closeDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'

// Create a test client factory
const createTestApi = () => {
  return treaty(new Elysia().use(projectRoutes)).api
}

describe('Project API - GET /:id', () => {
  let api: ReturnType<typeof createTestApi>
  let projectId: string

  beforeEach(async () => {
    await initializeDb(':memory:')
    api = createTestApi()
    const { data } = await api.project.post({ name: 'Test Project' })
    projectId = data?.id as string
  })

  afterEach(async () => {
    if (projectId) {
      await api.project({ id: projectId }).delete()
    }
    await closeDb()
    }
  })

  it('should return project by id', async () => {
    const { data, status, error } = await api.project[':id'].get({
      params: { id: projectId }
    })

    expect(status).toBe(200)
    expect(error).toBeUndefined()
    expect(data).toHaveProperty('data')
    expect(data?.data).toMatchObject({ name: 'Test Project' })
  })
})
```

### Frontend Tests
```typescript
// frontend/tests/unit/useApi.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '@frontend/composables/useApi'
import type { App } from '@backend'

// Mock the API client
vi.mock('@frontend/composables/useApi', () => ({
  api: {
    project: {
      get: vi.fn(),
      post: vi.fn(),
      ':id': {
        get: vi.fn(),
        delete: vi.fn()
      }
    }
  }
}))

describe('useApi', () => {
  const mockProject = { id: '1', name: 'Test Project' }

  it('fetches projects', async () => {
    // Setup mock
    api.project.get.mockResolvedValue({ 
      data: [mockProject],
      status: 200 
    })
    
    // Test the API call
    const { data, status } = await api.project.get()
    
    // Assertions
    expect(status).toBe(200)
    expect(data).toEqual([mockProject])
    expect(api.project.get).toHaveBeenCalledTimes(1)
  })
})
```

### Test Client Pattern
```typescript
// In your test file
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { projectRoutes } from '@backend/api/project'
import { initializeDb, closeDb } from '@backend/plugins/database'
import { treaty } from '@elysiajs/eden'

// Create a test client factory directly in the test file
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
  
  // Your tests here
})
```
