# General Guidelines

> **Note**: These guidelines cover general project standards, coding conventions, and development workflows. For specific technical guidelines, see the relevant documentation.

## Table of Contents
- [Tech Stack](#tech-stack)
- [Documentation and Resources](#documentation-and-resources)
- [Code Style](#code-style)
- [Local Development](#local-development)
- [Package Management](#package-management)
- [Documentation Style](#documentation-style)
- [File Organization](#file-organization)

## Tech Stack

### Core Technologies
- **Runtime**: [Bun](https://bun.sh/) (latest stable version)
- **Frontend**: Vue 3, PrimeVue, TypeScript, Vite, Pinia
- **Backend**: Elysia, TypeScript
- **Database**: DuckDB
- **Testing**: Bun Test

## Architecture Overview

### Backend (Elysia)
- RESTful API with type-safe routes
- **Dynamic database schema** - table structure created at runtime
- Database integration with Drizzle ORM
- Authentication and authorization
- File upload handling
- Real-time features with WebSockets

### Frontend (Vue 3)
- Composition API with TypeScript
- **NO custom types or interfaces** - relies solely on Elysia Eden
- Pinia for state management
- Vue Router for navigation
- Tailwind CSS for styling
- Elysia Eden for API client and all type information

### Database Schema Philosophy
- Database table structure is **dynamically created** in the backend
- Schema is **never known deterministically** at build time
- Frontend **must never hardcode** any database structure
- All type information flows from backend through Elysia Eden

## Error Handling

### Project-Wide Error Handling Principles

**Universal No-Throw Pattern:**

- **NEVER use `throw new Error()` anywhere in the codebase**
- Always return error results in the format `{ error: string | null, data: any }`
- Set reactive error state in frontend stores/composables
- Return early on errors
- Let components handle error display

**Context-Specific Approaches:**

1. **Frontend Stores/Composables**: 
   - Set reactive error state instead of throwing
   - Return early on errors
   - Use the pattern: `if (error) { errorState.value = 'message'; return }`
   - Clear error state at the beginning of operations

2. **Frontend Services/Utilities**: 
   - Return error results instead of throwing
   - Use the pattern: `return { error: 'message', data: null }`

3. **Backend (Elysia)**:
   - Return error results instead of throwing
   - Use the pattern: `return { error: 'message', data: null }`
   - Let Elysia handle HTTP status codes based on error results

4. **Testing**:
   - Never throw errors in tests
   - Never use try/catch in tests
   - Test error states through return values and error properties

### Error Types
- Use custom error classes that extend `Error`
- Categorize errors by type (e.g., `ValidationError`, `NotFoundError`)
- Include error codes for programmatic handling

### Error Responses
- Follow a consistent error response format:
  ```typescript
  {
    errors: [
      {
        code: string;      // Machine-readable error code
        message: string;   // Human-readable message
        details?: any;     // Additional error details
        path?: string;     // Path to the error in the request
      }
    ]
  }
  ```
- Include appropriate HTTP status codes
- Log errors with sufficient context

## Security

### Input Validation
- Validate all user input on the server
- Use Zod or similar for request validation
- Sanitize output to prevent XSS

### Authentication & Authorization
- Use JWT for stateless authentication
- Implement proper session management
- Follow principle of least privilege
- Validate permissions on all protected routes

### Secure Headers
- Configure security headers:
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - X-XSS-Protection
  - Strict-Transport-Security

## Environment Configuration

### .env Files
- Use `.env` for default values
- Create `.env.local` for local overrides (git-ignored)
- Never commit sensitive data to version control

### Type-Safe Config
```typescript
// config.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().url(),
})

export const config = envSchema.parse(process.env)
```

### Environment-Specific Configuration
- Use environment variables for environment-specific settings
- Keep environment parity between development and production
- Use feature flags for gradual rollouts

## Documentation Style

All project documentation should follow the [Style Guide](./StyleGuide.md). Key points:

- Use consistent terminology (e.g., "frontend" not "front-end")
- Follow the code example formatting guidelines
- Use proper heading hierarchy
- Include tables of contents for longer documents
- Cross-reference related documents

## Documentation and Resources

### Always Refer to Documentation

- **Consult documentation** before implementing new features or solving problems
- Use the most up-to-date and relevant documentation sources
- When in doubt, verify with official documentation

### Available Resources

1. **Official Documentation**
   - Framework and library documentation (Vue, Elysia, Bun, etc.)
   - Language specifications (TypeScript, JavaScript)
   - Tooling documentation (Vite, Pinia, etc.)

2. **Web Search**
   - Use web search to find solutions to specific problems
   - Look for official documentation, GitHub issues, and reputable sources
   - Prefer recent resources (last 1-2 years) for current best practices

3. **Context7**
   - Use Context7 for:
     - Finding relevant documentation
     - Searching for code examples
     - Getting context about libraries and frameworks
   - Always verify information from Context7 with official sources

4. **Project Documentation**
   - Review existing project documentation
   - Check for established patterns and practices
   - Look at similar implementations in the codebase

### When to Ask for Help
- After exhausting available documentation and resources
- When facing a blocker that's not covered in documentation
- When you need clarification on project-specific implementations

## Code Style

### General
- Use TypeScript with strict mode enabled
- Prefer named exports over default exports
- Use arrow functions exclusively
- Follow consistent indentation (2 spaces)
- Use meaningful variable and function names following these patterns:
  - `camelCase` for variables and functions
  - `PascalCase` for types, interfaces, and classes
  - `UPPER_CASE` for constants
  - `_prefix` for private class members
- Keep functions small and focused (max 20-30 lines)
- Avoid deep nesting of conditionals (max 3 levels)
- Use early returns when possible
- Group related code together with a blank line between groups

### TypeScript Specific
- Always provide explicit return types for functions
- Use interfaces for object types that represent domain models or DTOs
- Prefer `type` over `interface` for union/intersection types
- Use `readonly` for immutable properties
- Avoid `any` type - use `unknown` instead when type is uncertain
- Use type guards for runtime type checking
- Use `as` type assertions sparingly and only when you have more information than TypeScript

### TypeScript Specific
- Always provide explicit return types for functions
- Use interfaces for object types
- Prefer `type` over `interface` for union/intersection types
- Use `readonly` for immutable properties
- Avoid `any` type - use `unknown` instead when type is uncertain

## Development Workflow

### Local Development

1. **Write tests first** following TDD approach
2. Implement the feature/fix
3. **Run all checks** using the package.json scripts:
   ```bash
   # Run all tests
   bun test
   
   # Check TypeScript types
   bun typecheck
   
   # Lint the code
   bun lint
   
   # Format code (fixes formatting issues)
   bun format
   ```
4. **All checks must pass** before considering a task complete:
   - All tests must pass
   - No TypeScript errors or warnings
   - No linting errors
   - Code must be properly formatted

## Package Management

### Using Bun
- Always use Bun for package management
- **Always use package.json scripts** instead of running tools directly
- Install dependencies:
  ```bash
  # Regular dependencies
  bun add <package>
  
  # Dev dependencies
  bun add -d <package>
  ```
- **Never run tools directly** (e.g., `eslint`, `typescript`, `vitest`). Always use the package.json scripts:
  ```bash
  # ❌ Don't do this
  npx eslint .
  
  # ✅ Do this instead
  bun lint
  ```
- Never commit `node_modules` to version control
- Always commit `bun.lockb` to version control

### Required Checks

Before considering any task complete, ensure all these pass:

```bash
# Run all tests
bun test

# Check TypeScript types
bun typecheck

# Lint the code
bun lint
```

These checks are also enforced in the CI pipeline.

### Dependency Management
- Keep dependencies up to date
- Review and update dependencies regularly
- Document any required environment variables in `.env.example`
- Never commit sensitive information to version control

## File Organization

### Project Structure
```
project-root/
├── backend/          # Backend source code
├── frontend/         # Frontend source code
├── guidelines/       # Project guidelines
├── scripts/          # Build and utility scripts
└── tests/            # Integration and E2E tests
```

### Naming Conventions
- Files: `kebab-case.ts`
- Components: `PascalCase.vue`
- Test files: `*.test.ts`
- Configuration files: `.filenamerc` or `filename.config.ts`
- Environment files: `.env`, `.env.development`, `.env.test`, `.env.production`

## Documentation

### Writing Documentation
- Keep documentation up to date
- Use Markdown format (`.md`)
- Include examples where helpful
- Document public APIs and components
- Update documentation when making changes

### Required Documentation
- `README.md` in project root
- `CONTRIBUTING.md` for contribution guidelines
- `CHANGELOG.md` for tracking changes
- API documentation for public interfaces

## Best Practices

### Error Handling
- Use typed error classes
- Provide meaningful error messages
- Log errors appropriately
- Handle errors at the appropriate level

### Performance
- Optimize critical paths
- Use efficient algorithms and data structures
- Avoid unnecessary re-renders (frontend)
- Optimize database queries (backend)

### Security
- Validate all inputs
- Sanitize user input
- Use parameterized queries
- Follow the principle of least privilege
- Keep dependencies updated

## Code Quality

### Linting
- Use ESLint for JavaScript/TypeScript
- Follow consistent code style
- Fix all linting errors before committing

### Formatting
- Use Prettier for code formatting
- Configure editor to format on save
- Maintain consistent code style across the project

### Testing
- Write unit tests for all new features
- Aim for good test coverage
- Test edge cases and error conditions
- Keep tests independent and isolated
