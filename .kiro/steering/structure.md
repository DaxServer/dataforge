# Project Structure

## Root Level Organization

```
dataforge/
├── backend/           # Elysia API server
├── frontend/          # Vue 3 web application
├── guidelines/        # Development documentation
├── prompts/          # AI assistant prompts
├── package.json      # Workspace configuration
└── bun.lock          # Dependency lock file
```

## Backend Structure (`backend/`)

```
backend/
├── src/
│   ├── api/          # API route handlers
│   │   ├── project/  # Project-related endpoints
│   │   └── health.ts # Health check endpoint
│   ├── plugins/      # Elysia plugins (database, error handling)
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Utility functions
├── tests/            # Test files mirroring src structure
└── package.json      # Backend dependencies
```

## Frontend Structure (`frontend/`)

```
frontend/
├── src/
│   ├── components/   # Reusable Vue components
│   ├── composables/  # Vue composition functions
│   ├── pages/        # Page-level components
│   ├── stores/       # Pinia state stores
│   ├── types/        # Frontend-specific types
│   ├── plugins/      # Vue plugins (API client)
│   └── views/        # Route view components
├── public/           # Static assets
└── package.json      # Frontend dependencies
```

## Key Architectural Patterns

### API Organization

- Routes grouped by domain (`/api/project/*`)
- Schema definitions in `_schemas.ts` files
- Separate files for each major operation
- Tests mirror the API structure

### Frontend Organization

- **Components**: Reusable UI components (PrimeVue-based)
- **Composables**: Business logic and state management
- **Stores**: Global state with Pinia
- **Pages**: Route-level components
- **Types**: Frontend-specific type definitions

### Configuration Files

- **Root**: Workspace and shared configuration
- **Backend**: Elysia-specific TypeScript config
- **Frontend**: Vite and Vue-specific configuration
- **Shared**: Base TypeScript config with path aliases

### Testing Structure

- Backend tests mirror `src/` structure
- Frontend tests in `__tests__/` subdirectories
- Integration tests for API endpoints
- Unit tests for composables and utilities

### Development Guidelines Location

- **guidelines/core/**: Essential development standards
- **guidelines/reference/**: Detailed implementation guides
- **.kiro/steering/**: AI assistant guidance rules
