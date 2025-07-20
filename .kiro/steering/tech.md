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
The development server is run manually and should not be triggered.

### Testing & Quality
```bash
# Run all tests
bun test

# Run backend tests only
bun test backend/

# Run frontend tests only
bun test frontend/

# Run specific test file
bun test path/to/test.test.ts

# Run linting across all packages
bun lint
bun lint:backend
bun lint:backend path/to/file/relative-to-backend-folder
bun lint:frontend
bun lint:frontend path/to/file/relative-to-frontend-folder

# Format code
bun format

# Type checking
bun typecheck
bun -F backend typecheck
bun -F frontend typecheck
```

## Testing Framework

### Bun Test
- **Native Testing**: Uses Bun's built-in test runner
- **Test Structure**: Tests follow the pattern `*.test.ts` or `*.spec.ts`
- **Location**: Frontend tests in `frontend/src/**/__tests__/` directories
- **Backend Tests**: Backend tests in `backend/tests/` mirroring `src/` structure

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
