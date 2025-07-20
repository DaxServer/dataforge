# Technology Stack

## Build System & Runtime
- **Bun**: Primary runtime and package manager (>=1.0.0)
- **Workspaces**: Monorepo with `frontend` and `backend` packages
- **TypeScript**: Strict mode with ES2022 target

## Backend Stack
- **Elysia**: Web framework for API development
- **DuckDB**: High-performance analytical database via `@duckdb/node-api`
- **SQLite**: Project persistence (dataforge.db)
- **Wikibase SDK**: Integration with Wikibase instances
- **Elysia Eden**: Type-safe client generation from Elysia

## Frontend Stack
- **Vue 3**: Composition API with `<script setup lang="ts">`
- **Vite**: Build tool and dev server
- **Pinia**: State management
- **PrimeVue**: UI component library with PrimeIcons
- **Tailwind CSS**: Utility-first styling with PrimeUI integration
- **Vue Router**: Client-side routing
- **VueUse**: Composition utilities

## Development Tools
- **ESLint**: Code linting with TypeScript and Vue support
- **Prettier**: Code formatting
- **Auto-imports**: Automatic imports for Vue composables and PrimeVue components
- **TypeScript**: Strict type checking across the stack
- **Bun Test**: Native testing framework for unit and integration tests

## Common Commands

### Development
```bash
# Start both frontend and backend in development mode
bun dev

# Start backend only
bun --cwd backend dev

# Start frontend only  
bun --cwd frontend dev
```

### Testing & Quality
```bash
# Run all tests
bun test

# Run backend tests only
bun --cwd backend test

# Run frontend tests only
bun --cwd frontend test

# Run specific test file
bun test path/to/test.test.ts --run

# Run linting across all packages
bun lint

# Format code
bun format

# Type checking
bun --cwd backend typecheck
bun --cwd frontend typecheck
```

## Testing Framework

### Bun Test
- **Native Testing**: Uses Bun's built-in test runner for optimal performance
- **Test Structure**: Tests follow the pattern `*.test.ts` or `*.spec.ts`
- **Location**: Frontend tests in `frontend/src/**/__tests__/` directories
- **Backend Tests**: Backend tests in `backend/tests/` mirroring `src/` structure

### Testing Patterns
```typescript
import { describe, test, expect } from 'bun:test'

describe('Component Logic', () => {
  test('should validate expected behavior', () => {
    // Test implementation
    expect(result).toBe(expected)
  })
})
```

### Frontend Testing
- **Logic Testing**: Focus on component logic, computed properties, and business rules
- **State Management**: Test store interactions and state mutations
- **Type Safety**: Validate TypeScript interfaces and type definitions
- **Integration**: Test composable interactions and data flow

## Key Dependencies
- **@elysiajs/eden**: Type-safe API client generation
- **@duckdb/node-api**: DuckDB integration
- **wikibase-sdk**: Wikibase API integration
- **@vueuse/core**: Vue composition utilities
- **primevue**: UI components with auto-import resolver
- **@vue/test-utils**: Vue component testing utilities (for future DOM testing)
