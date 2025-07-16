# DataForge - Development Guidelines

> **Comprehensive development standards and practices for the DataForge project**

This documentation provides a complete guide to developing with our tech stack: **Bun + Elysia + Vue 3 + DuckDB**.

## 📋 Quick Navigation

### Core Guidelines (Start Here)
- **[General Guidelines](./core/GENERAL.md)** - Project-wide standards, workflow, and setup
- **[Frontend Guidelines](./core/FRONTEND.md)** - Vue 3, Tailwind, Pinia, composables
- **[Backend Guidelines](./core/BACKEND.md)** - Elysia, DuckDB, API design, testing

### Reference Documentation
- **[Error Handling Reference](./reference/ERROR_HANDLING.md)** - Detailed error patterns and examples
- **[Elysia Eden Integration](./reference/ELYSIA_EDEN.md)** - Type-safe API integration guide
- **[Testing Patterns](./reference/TESTING.md)** - Comprehensive testing strategies
- **[Style Guide Reference](./reference/STYLE_GUIDE.md)** - Detailed code formatting rules

### Project Management
- **[Conflicts & Decisions](./conflicts/CONFLICTS_TO_RESOLVE.md)** - Outstanding decisions needed
- **[Migration Guide](./conflicts/MIGRATION_GUIDE.md)** - Moving from old to new guidelines

## 📁 Documentation Structure

```
guidelines/
├── README.md                    # This navigation file
├── core/                        # Essential guidelines
│   ├── GENERAL.md              # Project-wide standards
│   ├── FRONTEND.md             # Vue 3 + Tailwind + Pinia
│   └── BACKEND.md              # Elysia + DuckDB + APIs
└── reference/                   # Detailed implementation guides
    ├── ERROR_HANDLING.md       # Error patterns & examples
    ├── ELYSIA_EDEN.md         # Type-safe API integration
    ├── TESTING.md             # Testing strategies
    └── STYLE_GUIDE.md         # Code formatting details
```

## 🎯 Key Principles

### Type Safety First
- All types flow from **Elysia Eden** backend inference
- Frontend gets automatic type safety through Eden integration
- No manual type definitions for API contracts

### Modern Development Practices
- **Bun** for runtime and package management
- **Vue 3 Composition API** with `<script setup>`
- **Reactive programming** over computed properties
- **Composables** over methods
- **Test-driven development** with Bun test

### Performance & Developer Experience
- **Auto-imports** for Vue composables and utilities
- **Tailwind CSS** for consistent styling
- **Pinia** for predictable state management
- **ESLint + Prettier** for code consistency

## 🔄 Workflow Integration

### Before Starting Development
1. Review relevant core guidelines

### During Development
1. Follow the appropriate core guidelines
2. Reference detailed patterns from reference documentation
3. Run tests and linting as specified in guidelines
