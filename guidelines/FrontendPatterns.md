# Frontend Patterns

> **Note**: These guidelines cover frontend-specific patterns and best practices for the project.

## Table of Contents
- [Auto-Imports](#auto-imports)
- [Component Design](#component-design)
- [State Management](#state-management)
- [Composables](#composables)
- [Forms and Validation](#forms-and-validation)
- [Performance](#performance)

## Auto-Imports

This project uses [unplugin-auto-import](https://github.com/unplugin/unplugin-auto-import) and [unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components) to automatically import Vue APIs, components, and composables.

### What's Auto-Imported

- **Vue APIs**: All Vue Composition API functions are auto-imported (e.g., `ref`, `computed`, `onMounted`)
- **Vue Router**: Router functions like `useRoute` and `useRouter`
- **Pinia**: Store utilities like `defineStore` and `storeToRefs`
- **Components**: Vue components in `src/components` are auto-imported
- **Composables**: Functions in `src/composables` are auto-imported

### Best Practices

1. **No Manual Imports**
   - Remove manual imports for Vue APIs, components, and composables
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

4. **TypeScript Support**
   - TypeScript types are automatically generated in `auto-imports.d.ts`
   - No need to manually type auto-imported functions

5. **IDE Support**
   - Ensure your IDE is configured to read TypeScript types from `auto-imports.d.ts`
   - Restart TypeScript server if auto-imports aren't recognized

### Example Usage

```vue
<script setup>
// No need to import ref, computed, or onMounted
const count = ref(0)
const double = computed(() => count.value * 2)

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

### Atomic Design
- Follow atomic design principles:
  - **Atoms**: Basic building blocks (buttons, inputs, etc.)
  - **Molecules**: Groups of atoms (search bar, form field with label)
  - **Organisms**: Complex UI components (header, sidebar)
  - **Templates**: Page layouts
  - **Pages**: Complete views

### Props and Emits
- Use TypeScript interfaces for props
- Define default values for optional props
- Use `defineEmits` with type safety
- Document props with JSDoc

### Example Component
```vue
<script setup lang="ts">
interface Props {
  /** The user's full name */
  name: string
  /** Whether the user is active */
  isActive?: boolean
  /** User's score (0-100) */
  score?: number
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  score: 0
})

const emit = defineEmits<{
  (e: 'update:isActive', value: boolean): void
  (e: 'delete'): void
}>()

const statusClass = computed(() => ({
  'bg-green-100 text-green-800': props.isActive,
  'bg-gray-100 text-gray-800': !props.isActive
}))
</script>

<template>
  <div class="flex items-center p-4 border rounded">
    <div class="flex-1">
      <h3 class="text-lg font-medium">{{ name }}</h3>
      <span :class="['px-2 py-1 text-xs rounded-full', statusClass]">
        {{ isActive ? 'Active' : 'Inactive' }}
      </span>
    </div>
    <div class="flex items-center space-x-2">
      <button 
        @click="emit('update:isActive', !isActive)"
        class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Toggle
      </button>
      <button 
        @click="emit('delete')"
        class="p-1 text-red-500 hover:text-red-700"
      >
        <TrashIcon class="w-5 h-5" />
      </button>
    </div>
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

### Example Store
```typescript
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const fullName = computed(() => 
    user.value ? `${user.value.firstName} ${user.value.lastName}` : ''
  )

  async function fetchUser() {
    isLoading.value = true
    error.value = null
    
    try {
      const { data } = await api.users.me.get()
      user.value = data
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function $reset() {
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

export function useLocalStorage<T>(key: string, initialValue: T) {
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
- Use `v-model` with form inputs
- Group related fields with `v-model` and an object
- Use computed properties for derived form values
- Handle form submission with `@submit.prevent`

### Validation
- Use Zod for schema validation
- Show validation errors near the relevant fields
- Disable submit button when form is invalid
- Show loading state during submission

### Example Form
```vue
<script setup lang="ts">
// No need to import ref, useForm, toTypedSchema, or z - they're auto-imported

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

const { handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    email: '',
    password: '',
    confirmPassword: ''
  }
})

const isSubmitting = ref(false)
const submitError = ref('')

const onSubmit = handleSubmit(async (values) => {
  try {
    isSubmitting.value = true
    submitError.value = ''
    await api.auth.register.post(values)
    // Handle success
  } catch (error) {
    submitError.value = error.message
  } finally {
    isSubmitting.value = false
  }
})
</script>

<template>
  <form @submit="onSubmit" class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
      <input
        id="email"
        v-model="email"
        type="email"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        :class="{ 'border-red-500': errors.email }"
      />
      <p v-if="errors.email" class="mt-1 text-sm text-red-600">
        {{ errors.email }}
      </p>
    </div>
    
    <!-- Other form fields -->
    
    <div v-if="submitError" class="p-4 text-red-700 bg-red-100 rounded">
      {{ submitError }}
    </div>
    
    <button
      type="submit"
      :disabled="isSubmitting"
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {{ isSubmitting ? 'Submitting...' : 'Submit' }}
    </button>
  </form>
</template>
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
<script setup>
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

<script setup>
// No need to import RecycleScroller - it's auto-imported
// The CSS is imported in main.ts

const items = ref([
  { id: 1, name: 'Item 1' },
  // ... more items
])
</script>
```

### Memory Management
- Clean up event listeners in `onUnmounted`
- Use weak references for large objects
- Avoid memory leaks with `setInterval` and `setTimeout`
