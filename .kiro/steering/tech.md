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
# Run backend tests
bun test

# Run linting across all packages
bun lint

# Format code
bun format

# Type checking
bun --cwd backend typecheck
bun --cwd frontend typecheck
```

## Key Dependencies
- **@elysiajs/eden**: Type-safe API client generation
- **@duckdb/node-api**: DuckDB integration
- **wikibase-sdk**: Wikibase API integration
- **@vueuse/core**: Vue composition utilities
- **primevue**: UI components with auto-import resolver
