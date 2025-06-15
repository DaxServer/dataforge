# Style Guide for Documentation

This document defines the writing and formatting standards for all project documentation to ensure consistency across all files.

## Terminology

### Always Use
- **Frontend** (not front-end or Frontend)
- **Backend** (not back-end or Backend)
- **TypeScript** (not Typescript or TS)
- **JavaScript** (not JS in prose)
- **Node.js** (not Node or NodeJS)
- **npm** (lowercase, not NPM)
- **Bun** (capitalized, not bun unless at start of sentence)
- **API** (all caps)
- **UI** (all caps)
- **URL** (all caps)
- **Git** (capitalized)
- **GitHub** (camel case)

## Code Examples

### TypeScript/JavaScript
- Use 2 spaces for indentation
- Include type annotations in all examples
- Use `const` by default, `let` only when necessary
- Use template literals for string interpolation
- Always include semicolons
- Use single quotes for strings
- Use trailing commas in multi-line objects/arrays

### Vue Components
- Use `<script setup>` syntax
- **REQUIRED**: Vue Single File Components (SFC) must follow this exact order:
  1. `<script setup>` (or `<script>`) - Always first
  2. `<template>` - Always second
  3. `<style>` - Always last (if present)
- This order is mandatory and must be consistent across all Vue components
- Use PascalCase for component names
- Use kebab-case for component files
- Use `ref` for reactive primitives
- **Always use reactive elements** for state management
- Use `computed` **only in extreme cases with explicit approval**
- Use `watch` and `watchEffect` sparingly

### Styling Requirements
- **MANDATORY**: Use Tailwind CSS for ALL styling
- **FORBIDDEN**: No hardcoded CSS styles in `<style>` blocks
- **FORBIDDEN**: No inline styles using `style` attribute
- **FORBIDDEN**: No custom CSS classes outside of Tailwind
- Use Tailwind utility classes exclusively for styling
- If `<style>` blocks exist, they should only contain component-specific CSS that cannot be achieved with Tailwind (extremely rare cases)
- All spacing, colors, typography, and layout must use Tailwind classes

## Documentation Structure

### File Headers
Each file should start with:
```markdown
# [Document Title]

> **Note**: Brief description of the document's purpose and scope.
> Reference related documents when applicable.
```

### Headers
- Use sentence case for headers (only first word and proper nouns capitalized)
- Use ATX-style headers with closing hashes for better readability
- Be concise but descriptive

### Lists
- Use hyphens for unordered lists
- Add blank lines before and after lists
- Use ordered lists for sequential steps
- Use task lists for checklists

### Code Blocks
- Always specify the language after the opening ```
- Include a brief description above the code block
- Keep code blocks focused and concise
- Use comments to explain non-obvious parts

## TypeScript Guidelines

### Type Definitions

- **NEVER create custom interfaces or types for data structures**
- **Rare exceptions**: Internal utility types, component props, or configuration types not related to API data
- **ALWAYS use Elysia Eden inferred types from the backend**
- Use `unknown` over `any` for truly unknown data
- Use strict type checking
- Database schema is dynamic - frontend must not hardcode any structure

### Example

```typescript
// CORRECT - Use Elysia Eden types
import type { App } from '@backend'

type User = Awaited<ReturnType<App['api']['users']['get']>>['data']
type CreateUserBody = Parameters<App['api']['users']['post']>[0]['body']
type UpdateUserBody = Parameters<App['api']['users']['patch']>[0]['body']

// WRONG - Never create custom types
interface User {
  id: string
  name: string
  email: string
}

type Status = 'active' | 'inactive' | 'pending'
```

### Tables
- Use pipe syntax for tables
- Align columns with colons
- Keep tables simple and scannable

## Writing Style

### Voice and Tone
- Use active voice
- Be concise but clear
- Use second person for user instructions
- Use first person plural for team guidelines

### Formatting Conventions
- **Bold** for UI elements and buttons
- `code` for file names, paths, and commands
- _Italics_ for emphasis
- Use backticks for inline code and file paths

### Capitalization
- Sentence case for headings
- Title Case for proper nouns and product names
- lowercase for general terms unless starting a sentence

## Cross-Referencing

- Link to other documents using relative paths
- Use descriptive link text
- When referencing sections, use the format: [Section Name](#section-name)
- For external links, include the full URL in angle brackets after the link

## Images and Diagrams

- Store images in `/docs/images/`
- Use descriptive file names
- Include alt text for accessibility
- Prefer SVG for diagrams
- Use Mermaid.js for generated diagrams

## Versioning

- Use semantic versioning (MAJOR.MINOR.PATCH)
- Document breaking changes clearly
- Include a changelog entry for significant updates

## Review Process

- All documentation changes should be reviewed
- Check for:
  - Consistency with this style guide
  - Accuracy of information
  - Clarity and readability
  - Broken links
  - Code examples work as shown

## Common Pitfalls to Avoid

- Mixing terminology (e.g., "frontend" and "front-end")
- Inconsistent capitalization
- Overly complex sentences
- Assumed knowledge without links
- Outdated information
- Missing or incorrect code examples

## Updating This Guide

1. Propose changes via pull request
2. Get approval from at least one other team member
3. Update the version number
4. Update the changelog
5. Communicate significant changes to the team
