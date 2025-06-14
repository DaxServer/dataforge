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
// backend/src/index.ts
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { userRoutes } from './routes/users'

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
// backend/src/index.ts
export const app = new Elysia({
  // ... config
})

export type App = typeof app
```

### Route Definitions
Define routes with proper schemas for type inference:

```typescript
// backend/src/api/project/routes.ts
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
// frontend/src/composables/useApi.ts
import { edenTreaty } from '@elysiajs/eden'
import type { App } from '../../backend/src/index'

export const api = edenTreaty<App>('http://localhost:3000')
```

### Using in Components
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/composables/useApi'

const projects = ref([])
const error = ref(null)

async function fetchProjects() {
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
async function createProject(projectData) {
  try {
    const { data, error } = await api.project.post(projectData)
    if (error) {
      const validationError = error.value?.errors?.[0]?.details[0]?.message
      throw new Error(validationError || 'Failed to create project')
    }
    return data
  } catch (err) {
    console.error('Project creation failed:', err)
    throw err
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
  $query: { limit: 10, offset: 0 }
})
```

### File Uploads
```typescript
// Backend
.post(
  '/import',
  async ({ body: { file } }) => {
    // Handle file upload
  },
  {
    body: t.Object({
      file: t.File()
    })
  }
)

// Frontend
async function handleFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  const formData = new FormData()
  formData.append('file', file)
  
  const { data, error } = await api.project.import.post(formData, {
    $fetch: { body: formData }
  })
}
```

## Testing

### Backend Tests
```typescript
// backend/test/api/project.test.ts
import { app } from '../../src/index'
import { edenTreaty } from '@elysiajs/eden'
import type { App } from '../../src/index'

const api = edenTreaty<App>(app)

describe('Project API', () => {
  it('should create a project', async () => {
    const projectData = { name: 'Test Project' }
    const { data, error } = await api.project.post(projectData)
    
    expect(error).toBeNull()
    expect(data).toMatchObject(projectData)
    expect(data).toHaveProperty('id')
  })
})
```

### Frontend Tests
```typescript
// frontend/tests/unit/useApi.test.ts
import { api } from '@/composables/useApi'
import { vi } from 'vitest'

vi.mock('@/composables/useApi')

describe('useApi', () => {
  it('fetches projects', async () => {
    const mockProjects = [{ id: '1', name: 'Test Project' }]
    api.project.get.mockResolvedValue({ data: mockProjects })
    
    const { data } = await api.project.get()
    expect(data).toEqual(mockProjects)
  })
})
```
