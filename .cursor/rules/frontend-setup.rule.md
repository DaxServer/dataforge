# Frontend Setup and Best Practices Rule

## Tech Stack
- **Framework**: Vue 3 (Composition API, <script setup lang="ts">)
- **UI Library**: PrimeVue
- **State Management**: Pinia
- **Styling**: Tailwind CSS (MANDATORY for all styling)
- **Build Tool**: Vite
- **Type Safety**: TypeScript, types from Elysia Eden backend

## Component Structure
- Use `<script setup lang="ts">` at the top, template second, style last (rarely used)
- Prefer composables over methods
- Use auto-imports for Vue, Pinia, composables, and utilities
- Props and emits must use explicit TypeScript interfaces

## Styling
- Use Tailwind CSS utility classes for all styling
- Do NOT use custom CSS in `<style>` blocks except with explicit approval
- No inline `style` attributes
- Ensure responsive design with Tailwind breakpoints

## State Management
- Use Pinia stores for global state
- Do not export store state from composables
- Use `storeToRefs` for state in components

## Composables
- Place in `composables/` directory
- Do not proxy or export Pinia store state/actions from composables
- Use for logic that is not global state

## API Integration
- Use `useApi` composable (Elysia Eden) for all API calls
- Always use backend-inferred types for API data
- Handle errors and loading states reactively

## Forms & Validation
- Use reactive objects for form state and errors
- Validate on client and handle server errors
- Use Tailwind for form styling

## Performance
- Use `v-memo`, `shallowRef`, `markRaw`, and `Suspense` for optimization
- Use `readonly` and `shallowReactive` for large/expensive data

## General Principles
- Type safety everywhere
- Prefer reactivity over computed unless necessary
- Build reusable, well-structured components
- Follow the order: script, template, style

---
**Reference: guidelines/core/FRONTEND.md** 