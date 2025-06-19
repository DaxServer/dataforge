# Frontend Patterns

> **Note**: These guidelines cover frontend-specific patterns and best practices for the project.

## Table of Contents
- [Auto-Imports](#auto-imports)
- [Component Design](#component-design)
- [State Management](#state-management)
  - [Error Handling in Stores](#error-handling-in-stores)
- [Composables](#composables)
- [Forms and Validation](#forms-and-validation)
- [Performance](#performance)

## Auto-Imports

This project uses [unplugin-auto-import](https://github.com/unplugin/unplugin-auto-import) and [unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components) to automatically import Vue APIs, components, and composables.

### What's Auto-Imported

- **Vue APIs**: All Vue Composition API functions are auto-imported (e.g., `ref`, `watch`, `onMounted`)
- **Vue Router**: Router functions like `useRoute` and `useRouter`
- **Pinia**: Store utilities like `defineStore` and `storeToRefs`
- **Components**: Vue components in `src/components` are auto-imported
- **Composables**: Functions in `src/composables` are auto-imported

### Auto-imports

The following are auto-imported and don't need explicit imports:

```typescript
// Vue APIs
ref, reactive, watch, watchEffect, onMounted, onUnmounted, 
nextTick, defineProps, defineEmits, defineExpose, withDefaults

// Vue Router
useRouter, useRoute

// Pinia
defineStore, storeToRefs

// Utilities
toRefs, toRef, unref, isRef

// IMPORTANT: Always explicitly import types from '@backend'. `@backend` path alias imports are required.
import type { App } from '@backend'
```

### Best Practices

1. **No Manual Imports**
   - Imports are autoloaded. Explicit imports, except for backend-prefixed ones, are not allowed in the frontend.
   - Example: Instead of `import { ref } from 'vue'`, just use `ref` directly

2. **Component Naming**
   - Use PascalCase for component names
   - Components are auto-imported based on their file name
   - Example: `MyComponent.vue` can be used as `<MyComponent />`

3. **Composables**
   - Place composables in `src/composables`
   - Use camelCase for composable names
   - They are auto-imported based on their file name
   - Example: `useMyComposable.ts` can be used as `useMyComposable()`
   - **CRITICAL**: Composables MUST NOT export state that belongs to a Pinia store. Instead, composables should use the store directly via `storeToRefs` or `store.property`.
   - Composables MUST NOT proxy store actions. If a function in a composable simply calls a store action, move that function directly into the store.

4. **TypeScript Support**
   - TypeScript types are automatically generated in `auto-imports.d.ts`
   - No need to manually type auto-imported functions

5. **IDE Support**
   - Ensure your IDE is configured to read TypeScript types from `auto-imports.d.ts`
   - Restart TypeScript server if auto-imports aren't recognized

### Example Usage

```vue
<script setup lang="ts">
// No need to import ref or onMounted
const count = ref(0)
const double = ref(0)

// Update double reactively when count changes
watch(count, (newCount) => {
  double.value = newCount * 2
}, { immediate: true })

onMounted(() => {
  console.log('Component mounted')
})

// Using an auto-imported composable
const { data, error } = useMyComposable()
</script>

<template>
  <!-- Auto-imported component -->
  <MyComponent />
  
  <div>
    Count: {{ count }}
    <button @click="count++">Increment</button>
  </div>
</template>
```

### Troubleshooting

If auto-imports aren't working:
1. Check that the function/component is in the correct directory
2. Verify that `vite.config.ts` includes the correct auto-import configuration
3. Restart your IDE's TypeScript server
4. Check the `auto-imports.d.ts` file to see what's being auto-imported

## Component Design

### Component Structure

Components should follow this structure:

1. **Script Setup** - Composition API with TypeScript
2. **Template** - Clean, semantic HTML with Tailwind CSS classes
3. **Style** - Only for extremely rare cases where Tailwind cannot achieve the desired styling

### Best Practices

- Use `<script setup>` syntax for all components
- **REQUIRED**: Vue Single File Components must follow this exact order:
  1. `<script setup>` (or `<script>`) - Always first
  2. `<template>` - Always second
  3. `<style>` - Always last (if present)
- **NEVER create custom types or interfaces for data structures** - rely solely on Elysia Eden types
- **Rare exceptions**: Internal utility types, component props, or configuration types not related to API data
- Use `ref` for reactive primitives
- MANDATORY: Use Tailwind CSS for ALL styling
- FORBIDDEN: No hardcoded CSS styles or inline styles
- Use Tailwind utility classes exclusively for layout, spacing, colors, typography, and responsive design
- Use `defineEmits` with type safety
- Importing types from the Elysia Eden App type.
- Referencing the [Elysia Eden guidelines](./ElysiaEden.md) for detailed information on API interaction.
- Always destructure Elysia Eden responses as `{ data, status, error }`.

## Tailwind CSS Usage

### Mandatory Requirements
- **ALL styling must use Tailwind CSS utility classes**
- **NO custom CSS** in `<style>` blocks unless absolutely necessary
- **NO inline styles** using the `style` attribute
- **NO hardcoded CSS values** anywhere in components

### Styling Guidelines
- Use Tailwind classes for all spacing: `p-4`, `m-2`, `space-y-4`, etc.
- Use Tailwind classes for colors: `bg-primary-500`, `text-surface-600`, etc.
- Use Tailwind classes for typography: `text-lg`, `font-semibold`, etc.
- Use Tailwind classes for layout: `flex`, `grid`, `items-center`, etc.
- Use Tailwind classes for responsive design: `md:flex`, `lg:grid-cols-3`, etc.
- Use Tailwind classes for states: `hover:bg-primary-600`, `focus:ring-2`, etc.

### Example: Proper Tailwind Usage
```vue
<script setup lang="ts">
// Component logic here
</script>

<template>
  <!-- Good: Using Tailwind classes -->
  <div class="p-6 bg-white rounded-lg shadow-md border border-gray-200">
    <h2 class="text-2xl font-bold text-gray-900 mb-4">Title</h2>
    <p class="text-gray-600 leading-relaxed">Content here</p>
    <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
      Action
    </button>
  </div>
</template>
```

### What NOT to Do
```vue
<!-- Bad: Custom CSS -->
<style scoped>
.custom-card {
  padding: 24px;
  background: white;
  border-radius: 8px;
}
</style>

<!-- Bad: Inline styles -->
<div style="padding: 24px; background: white;">
  Content
</div>
```

### Example Component

```vue
<script setup lang="ts">
import type { App } from '@backend'

// Use Elysia Eden inferred types - never create custom interfaces
type UserType = Awaited<ReturnType<App['api']['users']['get']>>['data'][0]

interface Props {
  user: UserType
}

interface Emits {
  edit: [userId: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleEdit = () => {
  emit('edit', props.user.id)
}
</script>

<template>
  <div class="p-4 border border-surface-border rounded-md">
    <h3 class="text-lg font-semibold mb-2">{{ user.name }}</h3>
    <p class="text-surface-600 mb-4">{{ user.email }}</p>
    <Button @click="handleEdit">Edit</Button>
  </div>
</template>
```

## State Management

### Pinia Stores
- Use Pinia for global state management
- Keep stores focused and domain-specific
- Use `storeToRefs` for destructuring stores in components
- Use actions for async operations
- Use getters for derived state

### Error Handling in Stores
- **NEVER use `throw new Error()` in store actions**
- Always set the `error` state and return early instead of throwing
- Use reactive error state to communicate errors to components
- Clear error state at the beginning of new operations
- Handle both API errors and unexpected errors consistently

```typescript
// ❌ DON'T: Throw errors in store actions
const fetchData = async () => {
  try {
    const { data, error: apiError } = await api.getData()
    if (apiError) {
      throw new Error('API Error') // DON'T DO THIS
    }
  } catch (err) {
    throw err // DON'T DO THIS
  }
}

// ✅ DO: Set error state and return early
const fetchData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const { data, error: apiError } = await api.getData()
    
    if (apiError) {
      error.value = new Error(apiError.value?.message || 'Failed to fetch data')
      return
    }
    
    // Handle success
    items.value = data
  } catch (err) {
    error.value = err as Error
  } finally {
    isLoading.value = false
  }
}
```

### Example Store
```typescript
// stores/user.ts
import type { App } from '@backend'

// Use Elysia Eden inferred types only - NEVER create custom types
type UserType = Awaited<ReturnType<App['api']['users']['me']['get']>>['data']

export const useUserStore = defineStore('user', () => {
  const user = ref<UserType | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const isAuthenticated = ref(false)
  const fullName = ref('')

  // Update authentication status and full name reactively when user changes
  watch(user, (newUser) => {
    isAuthenticated.value = !!newUser
    fullName.value = newUser ? `${newUser.firstName} ${newUser.lastName}` : ''
  }, { immediate: true })

  const fetchUser = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const { data, error: apiError } = await api.users.me.get()
      
      if (apiError) {
        error.value = new Error(apiError.value?.message || 'Failed to fetch user')
        return
      }
      
      user.value = data
    } catch (err) {
      error.value = err as Error
    } finally {
      isLoading.value = false
    }
  }

  const $reset = () => {
    user.value = null
    error.value = null
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    fullName,
    fetchUser,
    $reset
  }
})
```

## Composables

### Creating Composables
- Use the `use` prefix (e.g., `useFetch`, `useLocalStorage`)
- Return a single ref or an object of refs
- Accept options as a single parameter object
- Handle cleanup in `onUnmounted` if needed

### Example Composable
```typescript
// composables/useLocalStorage.ts
// No need to import ref or watch - they're auto-imported

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const stored = localStorage.getItem(key)
  const value = ref(stored ? JSON.parse(stored) : initialValue)

  watch(value, (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue))
  }, { deep: true })

  return value
}

// Usage
const theme = useLocalStorage('theme', 'light')
```

## Forms and Validation

### Form Handling

- **NEVER create custom form types** - use Elysia Eden inferred types
- Use reactive elements with watchers for derived form values
- Leverage Elysia's built-in validation (backend validates dynamically)
- Handle form submission with proper error handling
- Use loading states during submission

### Example Form

```vue
<script setup lang="ts">
import type { App } from '@backend'

// Use Elysia Eden inferred types for form data
type CreateUserBody = Parameters<App['api']['users']['post']>[0]['body']

const form = ref<CreateUserBody>({
  name: '',
  email: '',
  age: 0
})

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

// Let backend handle validation - no client-side schema needed
const submitForm = async () => {
  isSubmitting.value = true
  errors.value = {}
  
  try {
    const response = await api.users.post(form.value)
    // Handle success - backend validates dynamically
  } catch (error) {
    // Handle validation errors from backend
    if (error.status === 422) {
      errors.value = error.data.errors
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>
```

## Performance

### Lazy Loading
- Use `defineAsyncComponent` for route components
- Split large components into smaller, focused ones
- Lazy load heavy dependencies

### Optimizing Renders
- Use `v-once` for static content
- Use `v-memo` for expensive component re-renders
- Use `shallowRef` for large lists

### Asset Optimization
- Optimize images
- Use modern image formats (WebP, AVIF)
- Lazy load below-the-fold images
- Use `loading="lazy"` for images

### Example: Lazy Loading
```vue
<script setup lang="ts">
// No need to import defineAsyncComponent - it's auto-imported
const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)
</script>

<template>
  <div>
    <Suspense>
      <template #default>
        <HeavyComponent />
      </template>
      <template #fallback>
        <div>Loading...</div>
      </template>
    </Suspense>
  </div>
</template>
```

### Virtual Scrolling
- Use virtual scrolling for long lists
- Consider `vue-virtual-scroller` for complex cases

### Example: Virtual Scrolling
```vue
<script setup lang="ts">
// No need to import RecycleScroller - it's auto-imported
// The CSS is imported in main.ts

const items = ref([
  { id: 1, name: 'Item 1' },
  // ... more items
])
</script>

<template>
  <RecycleScroller
    class="h-[400px]"
    :items="items"
    :item-size="32"
    key-field="id"
    v-slot="{ item }"
  >
    <div class="p-2 border-b">
      {{ item.name }}
    </div>
  </RecycleScroller>
</template>
```

### Memory Management
- Clean up event listeners in `onUnmounted`
- Use weak references for large objects
- Avoid memory leaks with `setInterval` and `setTimeout`
