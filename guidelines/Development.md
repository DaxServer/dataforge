# Development Guidelines

> **Note**: For general project guidelines and testing practices, please refer to the [General Guidelines](./General.md) and [Testing Guidelines](./Testing.md). All documentation should follow the [Style Guide](./StyleGuide.md).

## Table of Contents
- [Tech Stack](#tech-stack)
- [Code Style](#code-style)
- [Frontend Development](#frontend-development)
- [Frontend Patterns](./FrontendPatterns.md)
- [Backend Development](#backend-development)
- [Elysia Eden](./ElysiaEden.md)
- [Database](#database)
- [Documentation](#documentation)
- [Performance](#performance)
- [Security](#security)
- [Error Handling](#error-handling)

## Tech Stack

### Core Technologies
- **Runtime**: [Bun](https://bun.sh/) (latest stable version)
- **Frontend**: Vue 3, PrimeVue, TypeScript, Vite, Pinia
- **Backend**: Elysia, TypeScript
- **Database**: DuckDB
- **Testing**: Bun Test

### Using Bun APIs

We leverage Bun's built-in APIs throughout our codebase for better performance and consistency. Here's how we use them:

1. **Backend Services**
   - Use `Bun.serve()` for HTTP servers
   - Utilize `Bun.file()` for file operations
   - Leverage `Bun.password` for password hashing and verification
   - Use `Bun.semver` for semantic version comparisons

2. **Frontend (Tests Only)**
   - Use `Bun` APIs in test files
   - Example: `Bun.spawnSync()` for running commands in tests
   - Use `Bun.file()` for test fixtures

3. **Common Patterns**
   ```typescript
   // File operations
   const file = Bun.file('path/to/file.txt')
   const contents = await file.text()
   
   // Environment variables
   const isProd = Bun.env.NODE_ENV === 'production'
   
   // Process management
   const process = Bun.spawn(['ls', '-la'])
   const text = await new Response(process.stdout).text()
   
   // JSON operations (faster than JSON.parse/stringify)
   const data = { hello: 'world' }
   await Bun.write('data.json', Bun.JSON.stringify(data))
   const parsed = Bun.JSON.parse(await Bun.file('data.json').text())
   ```

4. **When to Use Bun APIs**
   - Always prefer Bun's native APIs over Node.js equivalents
   - Use `Bun.file()` instead of `fs/promises`
   - Use `Bun.serve()` instead of `http.createServer`
   - Use `Bun.password` for password hashing
   - Use `Bun.semver` for version comparisons

5. **When Not to Use Bun APIs**
   - In frontend application code (except tests)
   - When a specific Node.js module is required and has no Bun equivalent
   - When working with browser-specific APIs

6. **Testing with Bun**
   - Use `Bun.test()` for writing tests
   - Leverage `Bun.spawn()` for integration tests
   - Use `Bun.file()` for test fixtures
   - Example test:
     ```typescript
     import { expect, test } from 'bun:test'
     
     test('2 + 2', () => {
       expect(2 + 2).toBe(4)
     })
     ```

### Workspace Management with Bun Catalog

> **Note**: The following section is specific to Bun's workspace management features. For general Bun API usage, see [Using Bun APIs](#using-bun-apis) above.

We use [Bun Catalog](https://bun.sh/docs/cli/catalog) for managing our monorepo workspace. This provides several benefits:

We use [Bun Catalog](https://bun.sh/docs/cli/catalog) for managing our monorepo workspace. This provides several benefits:

1. **Package Management**
   - All packages are managed through the root `package.json`
   - Dependencies are hoisted to the root `node_modules`
   - Workspace-aware commands for running scripts

2. **Project Structure**
   ```
   .
   ├── backend/           # Backend services
   ├── frontend/          # Frontend application
   ├── packages/          # Shared packages
   │   ├── ui/           # Shared UI components
   │   └── utils/        # Shared utilities
   └── bun.lockb         # Bun lockfile
   ```

3. **Common Commands**
   ```bash
   # Install all dependencies
   bun install
   
   # Run script in a specific workspace
   bun --cwd frontend dev
   
   # Add a dependency to a workspace
   bun add -w @openrefine/ui react
   
   # Run tests across all workspaces
   bun test
   ```

4. **Workspace Dependencies**
   - Use workspace protocol (`workspace:^`) in package.json
   - Example:
     ```json
     {
       "dependencies": {
         "@openrefine/ui": "workspace:^"
       }
     }
     ```

5. **Versioning and Publishing**
   - Use `bun version` to bump versions
   - Publish packages with `bun publish`
   - Follow semantic versioning (semver)

6. **Best Practices**
   - Keep shared code in the `packages` directory
   - Use TypeScript project references for better dependency tracking
   - Document workspace-specific configuration in each package's README
   - Run `bun install` after pulling changes that modify dependencies

## Code Style

### General
- Use TypeScript with strict mode enabled
- Follow consistent indentation (2 spaces)
- Use meaningful variable and function names
- Keep functions small and focused (max 20-30 lines)
- Avoid deep nesting of conditionals
- Use early returns when possible
- Follow the project's ESLint and Prettier configurations

### TypeScript Specific
- Always provide explicit return types for functions
- Use interfaces for object types
- Prefer `type` over `interface` for union/intersection types
- Use `readonly` for immutable properties
- Avoid `any` type - use `unknown` instead when type is uncertain
- Use type guards for type narrowing

## Frontend Development

### Vue 3 Composition API
- Use `<script setup>` syntax for components
- Organize component code in this order:
  1. Component props and emits
  2. Reactive state (ref, reactive)
  3. Computed properties
  4. Watchers
  5. Lifecycle hooks
  6. Methods
  7. Template

### Component Structure
```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed } from 'vue'

// 2. Props and emits
defineProps<{
  /** Description of the prop */
  title: string
}>()

// 3. Reactive state
const count = ref(0)

// 4. Computed properties
const doubleCount = computed(() => count.value * 2)

// 5. Methods
function increment() {
  count.value++
}
</script>

<template>
  <div class="component">
    <h2>{{ title }}</h2>
    <p>Count: {{ count }}</p>
    <p>Double: {{ doubleCount }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<style scoped>
.component {
  /* Styles go here */
}
</style>
```

### State Management
- Use Pinia for global state management
- Keep stores focused and domain-specific
- Use actions for async operations
- Use getters for derived state

## Backend Development

### Elysia Eden

Elysia Eden is a type-safe client generator for Elysia that provides end-to-end type safety between your backend and frontend. It must always be used for all API interactions.

#### Key Features
- **Type Safety**: Automatic TypeScript types for all API endpoints
- **IntelliSense**: Full code completion in your IDE
- **Error Prevention**: Catches type errors at compile time
- **Consistent API**: Enforces consistent API contracts

#### Backend Setup

1. **Export App Type**
   Ensure your main Elysia app exports its type:
   ```typescript
   // backend/src/index.ts
   export const app = new Elysia({
     // ... config
   })
   
   export type App = typeof app
   ```

2. **Route Definitions**
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

#### Frontend Integration

1. **Installation**
   The frontend already has `@elysiajs/eden` in its dependencies.

2. **API Client Setup**
   ```typescript
   // frontend/src/composables/useApi.ts
   import { edenTreaty } from '@elysiajs/eden'
   import type { App } from '../../backend/src/index'
   
   export const api = edenTreaty<App>('http://localhost:3000')
   ```

3. **Using in Components**
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

#### Best Practices

1. **Type Safety**
   - Always define input/output schemas in your backend routes
   - Use the generated `App` type in your frontend

2. **Error Handling**
   ```typescript
   async function createProject(projectData) {
     try {
       const { data, error } = await api.project.post(projectData)
       if (error) {
         // Handle API validation errors
         const validationError = error.value?.errors?.[0]?.details[0]?.message
         throw new Error(validationError || 'Failed to create project')
       }
       return data
     } catch (err) {
       // Handle network/other errors
       console.error('Project creation failed:', err)
       throw err
     }
   }
   ```

3. **Query Parameters**
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

4. **File Uploads**
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

#### Testing

1. **Backend Tests**
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

2. **Frontend Tests**
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

### API Design
- Follow RESTful principles
- Use consistent endpoint naming (kebab-case)
- Use appropriate HTTP methods (GET, POST, PUT, DELETE, etc.)
- Return consistent response structures
- Document endpoints with JSDoc

### Error Handling
- Use appropriate HTTP status codes
- Provide meaningful error messages
- Log errors appropriately
- Handle async errors with try/catch

### Example Endpoint
```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
  .get('/api/items', async () => {
    try {
      const items = await db.selectFrom('items').selectAll().execute()
      return { data: items }
    } catch (error) {
      console.error('Failed to fetch items:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch items',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { status: 500 }
      )
    }
  })
```

## Database

### Schema Design
- Use snake_case for table and column names
- Add appropriate indexes for frequently queried columns
- Use foreign keys for relationships
- Add comments to document schema

### Queries
- Use parameterized queries to prevent SQL injection
- Use transactions for multiple related operations
- Keep queries focused and efficient
- Use appropriate indexes

### Example Query
```typescript
async function getUserWithPosts(userId: string) {
  return db.transaction().execute(async (trx) => {
    const user = await trx
      .selectFrom('users')
      .where('id', '=', userId)
      .selectAll()
      .executeTakeFirst()

    if (!user) {
      throw new Error('User not found')
    }

    const posts = await trx
      .selectFrom('posts')
      .where('user_id', '=', userId)
      .select(['id', 'title', 'created_at'])
      .execute()

    return {
      ...user,
      posts,
    }
  })
}
```

## Documentation

### Code Comments
- Use JSDoc for functions, classes, and methods
- Document complex logic
- Keep comments up to date

### API Documentation
- Document all public endpoints
- Include request/response examples
- Document error responses

## Performance

### Frontend
- Use `v-if` over `v-show` when possible
- Use `v-for` with `:key`
- Lazy load components when appropriate
- Optimize asset loading

### Backend
- Optimize database queries
- Use pagination for large datasets
- Cache responses when appropriate
- Use appropriate indexes

## Security

### Frontend
- Sanitize user input
- Use Content Security Policy (CSP)
- Implement proper authentication/authorization

### Backend
- Validate all input
- Use parameterized queries
- Implement rate limiting
- Use secure headers
- Keep dependencies updated
