# Frontend Development Guidelines

> **Applies to**: Vue 3 Frontend Development

## Related Guidelines
- **[General Guidelines](./GENERAL.md)** - Project-wide standards and setup
- **[Backend Guidelines](./BACKEND.md)** - API contracts and integration
- **[Elysia Eden Reference](../reference/ELYSIA_EDEN.md)** - Type-safe API integration
- **[Style Guide Reference](../reference/STYLE_GUIDE.md)** - Detailed formatting rules

## Table of Contents
- [Overview](#overview)
- [Vue 3 Composition API](#vue-3-composition-api)
- [Component Structure](#component-structure)
- [Styling with Tailwind CSS](#styling-with-tailwind-css)
- [State Management with Pinia](#state-management-with-pinia)
- [Composables](#composables)
- [Auto-imports](#auto-imports)
- [API Integration](#api-integration)
- [Forms and Validation](#forms-and-validation)
- [Performance Optimization](#performance-optimization)

## Overview

### Frontend Tech Stack
- **Framework**: Vue 3 with Composition API
- **UI Library**: PrimeVue
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Type Safety**: TypeScript + Elysia Eden

### Core Principles
- **Type Safety**: All types come from Elysia Eden backend inference
- **Reactive Programming**: Use reactive elements over computed properties
- **Composable Architecture**: Prefer composables over methods
- **Auto-imports**: Leverage automatic imports for better DX
- **Component-based**: Build reusable, well-structured components

## Vue 3 Composition API

### Script Setup Pattern
```vue
<script setup lang="ts">
// MANDATORY: Always use <script setup> syntax
// MANDATORY: Always include lang="ts"

// 1. Imports (auto-imported items don't need explicit imports)
import type { App } from '@backend'
import { useUserStore } from '@/stores/user'

// 2. Props (if any)
interface Props {
  userId: string
  isActive?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  isActive: true
})

// 3. Emits (if any)
interface Emits {
  update: [user: User]
  delete: [id: string]
}
const emit = defineEmits<Emits>()

// 4. Reactive state
const isLoading = ref(false)
const errorMessage = ref('')
const userData = ref<User | null>(null)

// 5. Stores
const userStore = useUserStore()

// 6. Composables
const { api } = useApi()

// 7. Computed properties (use sparingly)
const displayName = computed(() =>
  userData.value ? `${userData.value.firstName} ${userData.value.lastName}` : ''
)

// 8. Watchers (for side effects)
watch(props.userId, async (newUserId) => {
  if (newUserId) {
    await loadUser(newUserId)
  }
}, { immediate: true })

// 9. Methods
const loadUser = async (id: string) => {
  isLoading.value = true
  errorMessage.value = ''

  const response = await api.users.get({ params: { id } })

  if (response.error) {
    errorMessage.value = response.error.message
  } else {
    userData.value = response.data
  }

  isLoading.value = false
}

// 10. Lifecycle hooks
onMounted(() => {
  // onMounted logic
})
</script>
```

### Reactive State Guidelines
```typescript
// MANDATORY: Use reactive elements for state management
const count = ref(0)
const user = ref<User | null>(null)
const items = ref<Item[]>([])

// Use reactive for complex objects
const state = reactive({
  isLoading: false,
  error: null,
  data: []
})

// AVOID: computed properties unless absolutely necessary
// Only use computed for expensive calculations or complex derivations
const expensiveCalculation = computed(() => {
  // Only use when calculation is expensive and needs caching
  return heavyProcessing(largeDataSet.value)
})

// PREFER: Simple reactive derivations
const fullName = ref('')
watch([firstName, lastName], ([first, last]) => {
  fullName.value = `${first} ${last}`
}, { immediate: true })
```

## Component Structure

### Single File Component Order
```vue
<!-- REQUIRED: Vue Single File Components must follow this exact order -->

<!-- 1. Script Setup - Always first -->
<script setup lang="ts">
// Component logic here
</script>

<!-- 2. Template - Always second -->
<template>
  <!-- Component template here -->
</template>

<!-- 3. Style - Always last (if present). Only use for very rare cases -->
<style scoped>
/* Component styles here (rarely used due to Tailwind) */
</style>
```

### Component Design Patterns
```vue
<script setup lang="ts">
// Example: Data display component
interface Props {
  data: TableData[]
  loading?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: ''
})

interface Emits {
  rowClick: [row: TableData]
  refresh: []
}

const emit = defineEmits<Emits>()

const handleRowClick = (row: TableData) => {
  emit('rowClick', row)
}

const handleRefresh = () => {
  emit('refresh')
}
</script>

<template>
  <div class="data-table-container">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center p-4">
      <ProgressSpinner />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-red-500 p-4">
      {{ error }}
    </div>

    <!-- Data display -->
    <DataTable
      v-else
      :value="data"
      @row-click="handleRowClick"
      class="w-full"
    >
      <!-- Table columns -->
    </DataTable>
  </div>
</template>
```

## Styling with Tailwind CSS

### Styling Requirements
```vue
<template>
  <!-- MANDATORY: Use Tailwind CSS for ALL styling -->
  <div class="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
    <h2 class="text-xl font-semibold text-gray-800">
      User Profile
    </h2>
    <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
      Edit
    </button>
  </div>
</template>

<!-- FORBIDDEN: No custom CSS in style blocks -->
<!-- FORBIDDEN: No inline styles using style attribute -->
<style scoped>
/* Only use for very rare cases with explicit approval */
</style>
```

### Responsive Design
```vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Responsive grid layout -->
  </div>

  <div class="text-sm md:text-base lg:text-lg">
    <!-- Responsive typography -->
  </div>
</template>
```

### Component Styling Patterns
```vue
<template>
  <!-- Card component pattern -->
  <div class="bg-white rounded-lg shadow-md overflow-hidden">
    <div class="p-6">
      <!-- Card content -->
    </div>
  </div>

  <!-- Form input pattern -->
  <div class="space-y-4">
    <div class="flex flex-col">
      <label class="text-sm font-medium text-gray-700 mb-1">
        Email Address
      </label>
      <input
        type="email"
        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  </div>
</template>
```

## State Management with Pinia

### Store Structure
```typescript
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters (computed)
  const userDisplayName = computed(() =>
    currentUser.value ? `${currentUser.value.firstName} ${currentUser.value.lastName}` : ''
  )

  // Actions
  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    const { api } = useApi()
    const response = await api.auth.login.post(credentials)

    if (response.error) {
      error.value = response.error.message
    } else {
      currentUser.value = response.data.user
      isAuthenticated.value = true
    }

    isLoading.value = false
  }

  const logout = () => {
    currentUser.value = null
    isAuthenticated.value = false
    error.value = null
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    currentUser: readonly(currentUser),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Getters
    userDisplayName,

    // Actions
    login,
    logout,
    clearError
  }
})
```

### Store Usage in Components
```vue
<script setup lang="ts">
const userStore = useUserStore()

// Access state
const { currentUser, isAuthenticated, isLoading, error } = storeToRefs(userStore)

// Access actions
const { login, logout, clearError } = userStore

// Use in component
const handleLogin = async (credentials: LoginCredentials) => {
  await login(credentials)

  if (!error.value) {
    // Handle successful login
    await navigateTo('/dashboard')
  }
}
</script>
```

## Composables

### Composable Design Principles
```typescript
// composables/useLocalStorage.ts
export const useLocalStorage = <T>(key: string, defaultValue: T) => {
  // CRITICAL: Composables MUST NOT export state that belongs to a Pinia store
  // CRITICAL: Composables MUST NOT proxy store actions
  const storedValue = ref<T>(defaultValue)

  // Initialize from localStorage
  onMounted(() => {
    const item = localStorage.getItem(key)
    if (item) {
      try {
        storedValue.value = JSON.parse(item)
      } catch {
        storedValue.value = defaultValue
      }
    }
  })

  // Watch for changes and update localStorage
  watch(storedValue, (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue))
  }, { deep: true })

  return storedValue
}

// composables/useAsyncData.ts
export const useAsyncData = <T>(fetcher: () => Promise<T>) => {
  const data = ref<T | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const execute = async () => {
    isLoading.value = true
    error.value = null

    try {
      data.value = await fetcher()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  const refresh = () => execute()

  // Auto-execute on mount
  onMounted(execute)

  return {
    data: readonly(data),
    isLoading: readonly(isLoading),
    error: readonly(error),
    refresh
  }
}
```

## Auto-imports

### Available Auto-imports
```typescript
// Vue 3 Composition API (auto-imported)
ref, reactive, computed, watch, watchEffect
onMounted, onUnmounted, onUpdated
nextTick, defineProps, defineEmits

// Vue Router (auto-imported)
useRouter, useRoute, navigateTo

// Pinia (auto-imported)
defineStore, storeToRefs

// Custom composables (auto-imported from composables/)
useApi, useLocalStorage, useAsyncData

// Utilities (auto-imported)
toRefs, toRef, unref, isRef
```

### Type Imports
```typescript
// IMPORTANT: Always explicitly import types from backend
import type { App, User, Project } from '@backend'

// Component props interface
interface Props {
  user: User  // Type comes from backend
  projects: Project[]  // Type comes from backend
}
```

## API Integration

### API Usage Patterns
```vue
<script setup lang="ts">
const { api } = useApi()

// GET request
const loadUsers = async () => {
  const response = await api.users.get()

  if (response.error) {
    console.error('Failed to load users:', response.error)
    return
  }

  users.value = response.data
}

// POST request with body
const createUser = async (userData: CreateUserRequest) => {
  const response = await api.users.post(userData)

  if (response.error) {
    error.value = response.error.message
    return
  }

  // Handle success
  users.value.push(response.data)
}

// GET with parameters
const loadUser = async (userId: string) => {
  const response = await api.users({ id: userId }).get()

  if (response.error) {
    error.value = response.error.message
    return
  }

  user.value = response.data
}

// Query parameters
const searchUsers = async (query: string) => {
  const response = await api.users.get({
    query: { search: query, limit: 10 }
  })

  if (response.error) {
    error.value = response.error.message
    return
  }

  searchResults.value = response.data
}
</script>
```

## Forms and Validation

### Form Handling
```vue
<script setup lang="ts">
import type { CreateUserRequest } from '@backend'

const formData = reactive<CreateUserRequest>({
  firstName: '',
  lastName: '',
  email: '',
  password: ''
})

const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: ''
})

const isSubmitting = ref(false)

const validateForm = () => {
  let isValid = true

  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })

  // Validate fields
  if (!formData.firstName.trim()) {
    errors.firstName = 'First name is required'
    isValid = false
  }

  if (!formData.email.trim()) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Please enter a valid email'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isSubmitting.value = true

  const { api } = useApi()
  const response = await api.users.post(formData)

  if (response.error) {
    // Handle server validation errors
    if (response.error.details) {
      Object.assign(errors, response.error.details)
    }
  } else {
    // Handle success
    await navigateTo('/users')
  }

  isSubmitting.value = false
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        First Name
      </label>
      <input
        v-model="formData.firstName"
        type="text"
        class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="{ 'border-red-500': errors.firstName }"
      />
      <p v-if="errors.firstName" class="text-red-500 text-sm mt-1">
        {{ errors.firstName }}
      </p>
    </div>

    <button
      type="submit"
      :disabled="isSubmitting"
      class="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
    >
      {{ isSubmitting ? 'Creating...' : 'Create User' }}
    </button>
  </form>
</template>
```

## Performance Optimization

### Component Optimization
```vue
<script setup lang="ts">
// Use v-memo for expensive list rendering
const expensiveList = ref([])

// Use shallowRef for large objects that don't need deep reactivity
const largeDataSet = shallowRef({})

// Use markRaw for non-reactive data
const staticConfig = markRaw({
  apiUrl: 'https://api.example.com',
  version: '1.0.0'
})
</script>

<template>
  <!-- Use v-memo for expensive renders -->
  <div
    v-for="item in expensiveList"
    :key="item.id"
    v-memo="[item.id, item.updatedAt]"
  >
    <!-- Expensive rendering logic -->
  </div>

  <!-- Lazy load heavy components -->
  <Suspense>
    <LazyComponent />
    <template #fallback>
      <div>Loading...</div>
    </template>
  </Suspense>
</template>
```

### Reactivity Optimization
```typescript
// Use shallowReactive for objects with many properties
const config = shallowReactive({
  theme: 'dark',
  language: 'en',
  // ... many other properties
})

// Use readonly to prevent unnecessary reactivity
const readonlyData = readonly(expensiveData)

// Use triggerRef for manual reactivity control
const manualRef = shallowRef({})
const updateManualRef = (newData: any) => {
  manualRef.value = newData
  triggerRef(manualRef)
}
```
