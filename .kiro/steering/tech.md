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

## Auto-Import Configuration (Frontend)

The frontend uses `unplugin-auto-import` and `unplugin-vue-components` for automatic imports:

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

### Configuration
- **Base Config**: `tsconfig.base.json` defines all path mappings
- **Frontend**: Uses `vite-tsconfig-paths` plugin for Vite compatibility
- **Backend**: Inherits paths from base configuration
- **Root Level**: Paths resolve from project root directory

### Path Mapping Rules
- `@backend` → `./backend/src`
- `@backend/*` → `./backend/src/*`
- `@backend/tests/*` → `./backend/tests/*`
- `@frontend` → `./frontend/src`
- `@frontend/*` → `./frontend/src/*`

### Best Practices
- Always use path aliases `@frontend/` and `@backend/` but not relative paths
- Use aliases consistently across both TypeScript and test files
- Path aliases work in both development and build environments

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
