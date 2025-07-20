# Coding Guidelines

## General Standards
- **Function Declarations**: Always use arrow functions (`const fn = () => {}`) instead of function declarations (`function fn() {}`)
- **TypeScript**: Use strict typing throughout the codebase
- **Path Aliases**: Always use `@frontend/` and `@backend/` instead of relative paths

## Testing Standards

### Test Framework
- **Bun Test**: Use Bun's native test runner for all tests
- **Import Pattern**: `import { describe, test, expect } from 'bun:test'`
- **File Naming**: Tests must use `.test.ts` or `.spec.ts` suffix

### Test Structure
- **Frontend Tests**: Place in `src/**/__tests__/` directories
- **Backend Tests**: Place in `tests/` directory mirroring `src/` structure
- **Test Organization**: Group related tests using `describe` blocks
- **Test Naming**: Use descriptive names that explain the behavior being tested

### Testing Approach
- **Logic Testing**: Focus on testing component logic, business rules, and data transformations
- **Type Validation**: Test TypeScript interfaces and type definitions
- **State Management**: Test store interactions and state mutations
- **Integration**: Test composable interactions and data flow
- **Avoid DOM Testing**: Prefer logic testing over complex DOM manipulation tests

### Test Examples
```typescript
import { describe, test, expect } from 'bun:test'

describe('Component Logic', () => {
  test('should compute values correctly', () => {
    const input = 'test'
    const result = processInput(input)
    expect(result).toBe('expected')
  })

  test('should handle edge cases', () => {
    const emptyInput = ''
    const result = processInput(emptyInput)
    expect(result).toBe('default')
  })
})
```

## Vue Component Standards

### Single File Component Structure
Vue components MUST follow this exact order:
1. **`<script setup lang="ts">`** - Always at the top
2. **`<template>`** - In the middle  
3. **`<style scoped>`** - Should not be used

### Styling Guidelines
- **Tailwind Only**: Always use Tailwind CSS utility classes instead of custom CSS
- **No Custom CSS**: `<style>` sections should not be used
- **Custom CSS Exception**: Only use `<style scoped>` for complex animations or styles that cannot be achieved with Tailwind utilities

### Component Best Practices
- Use `<script setup lang="ts">` syntax exclusively
- Define props with `defineProps<Props>()` and `withDefaults()`
- Define emits with `defineEmits<{}>()`
- Use computed properties for reactive derived state
- Leverage auto-imports for Vue APIs and PrimeVue components

## Auto-Import Configuration

The frontend uses `unplugin-auto-import` and `unplugin-vue-components` for automatic imports.

### Auto-Import Rules
- **Framework APIs**: All Vue, Vue Router, and Pinia APIs are automatically imported
- **Third-party Libraries**: VueUse composables and PrimeVue utilities are auto-imported
- **Custom Code**: All files in `src/**` (all subdirectories under src) are auto-imported
- **Components**: All PrimeVue components and custom components in `src/*` (direct subdirectories) are auto-imported

### Usage Guidelines
- No need to import Vue APIs, VueUse composables, or PrimeVue components
- All exported functions from any file under `src/` are automatically available
- Components from direct subdirectories of `src/` are automatically available
- Type definitions are generated in `auto-imports.d.ts` and `components.d.ts`
- ESLint configuration is automatically updated for auto-imports
- Avoid manual imports for auto-imported items to prevent conflicts

## Path Aliasing

The project uses TypeScript path mapping for clean imports across the monorepo.

### Path Mapping Rules
- `@backend` → `./backend/src`
- `@backend/*` → `./backend/src/*`
- `@backend/tests/*` → `./backend/tests/*`
- `@frontend` → `./frontend/src`
- `@frontend/*` → `./frontend/src/*`

### Best Practices
- Always use path aliases `@frontend/` and `@backend/` instead of relative paths
- Use aliases consistently across both TypeScript and test files
- Path aliases work in both development and build environments

## Code Review Checklist

When reviewing code for compliance, check in this order:

### 1. Basic Structure (Check First)
- [ ] `<script setup lang="ts">` is at the top (Vue components)
- [ ] `<template>` is in the middle (Vue components)
- [ ] `<style scoped>` is at bottom (if present in exception cases)
- [ ] All functions use arrow function syntax

### 2. Styling Compliance
- [ ] No custom CSS that can be replaced with Tailwind utilities
- [ ] All styling uses Tailwind classes where possible
- [ ] `<style>` section only exists for complex animations or unavoidable custom styles

### 3. TypeScript & Composition API
- [ ] Uses `<script setup lang="ts">` syntax (Vue components)
- [ ] Props defined with `defineProps<Props>()` and `withDefaults()` (Vue components)
- [ ] Emits defined with `defineEmits<{}>()` (Vue components)
- [ ] Proper TypeScript typing throughout

### 4. Auto-Imports & Path Aliases
- [ ] No manual imports for auto-imported Vue APIs or PrimeVue components
- [ ] Uses `@frontend/` and `@backend/` path aliases instead of relative paths
- [ ] No import conflicts with auto-import system

## Backend Coding Standards

### API Development
- Use Elysia framework patterns and conventions
- Implement proper error handling with Elysia plugins
- Define schemas in `_schemas.ts` files
- Group routes by domain (e.g., `/api/project/*`)

### Database Operations
- Use DuckDB for data processing operations
- Use SQLite for project persistence
- Implement proper connection management
- Use prepared statements for security

## Testing Standards

### Test Structure
- Backend tests mirror `src/` structure
- Frontend tests in `__tests__/` subdirectories
- Integration tests for API endpoints
- Unit tests for composables and utilities

### Test Naming
- Descriptive test names that explain the behavior being tested
- Group related tests using `describe` blocks
- Use `it` or `test` for individual test cases
