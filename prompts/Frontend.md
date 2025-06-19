# Frontend Guidelines

This document provides the core guidelines and rules for frontend development tasks within this project.

## 1. General Principles
- **Development**: Agile, TDD, single task focus.
- **Documentation**: Always refer to the latest documentation using Context7 or web search. All MCP tools and resources are allowed.
- **Error Handling**: NEVER `throw new Error()`. Always return `{ error: string | null, data: any }`.

## 2. Tech Stack
- **Runtime**: Bun (latest stable).
- **Frontend**: Vue 3 (Composition API), PrimeVue, TypeScript, Vite, Pinia.

### Bun Usage
- Use `bun` for all operations. Prefer Bun APIs over Node.js equivalents (except `fs` for file system operations).
- Project uses Bun Catalog for monorepo workspace management.

## 3. TypeScript Guidelines
- **Type Checking**: `bun tsc`.
- **Variables**: `let` for reassigned, `const` for others.
- **Loops**: `for...of` for arrays, `for...in` for objects.
- **Async**: `async`/`await`.
- **Functions**: Always arrow functions.
- **Error Handling**: No nested `try...catch`.
- **Type Definitions**: NEVER create custom types for data structures. Always use Elysia Eden inferred types from backend (dynamic schema).

## 4. Frontend Guidelines (Vue)
- **Framework**: Vue Composition API, PrimeVue, Pinia, Vite, TypeScript.
- **API Interaction**: Always use Elysia Eden for types and APIs.
- **Auto-Imports**: Vue APIs, Router, Pinia, components, composables are auto-imported.
- **State Management**: Pinia.
- **Reactivity**: Use reactive elements (`ref`) over computed properties (unless extreme cases).
- **Composables**: Use composables over methods.
- **Styling**: MANDATORY Tailwind CSS for ALL styling. FORBIDDEN hardcoded CSS, inline styles, or custom CSS outside Tailwind.
- **Component Structure**: SFC order: `<script setup>`, `<template>`, `<style>`.

## 5. Testing Guidelines
- **Runner**: `bun test`.
- **Documentation**: Refer to Bun docs.
- **Error Handling**: Never throw, `try...catch`, or use conditional statements in tests.
- Response Handling: Always destructure Elysia Eden responses as `{ data, status, error }`.
- **Type Handling**: CRITICAL: Never create mock types. Always use Elysia Eden inferred types (`import type { App } from '@backend'`). **Note: `@backend` path alias imports are required.**
- **Frontend Testing**: Currently not implemented.

## 6. Code Style and Formatting
- **Linters**: `eslint`, `prettier`.
- **TypeScript/JavaScript**: 2 spaces indent, type annotations, `const` by default, template literals, semicolons, single quotes, trailing commas.
- **Terminology**: Consistent (e.g., "Frontend", "TypeScript").

## 7. Security
- **Input Validation**: Server-side validation (Zod), sanitize output.
- **Auth**: JWT for stateless auth, proper session management, least privilege.
- **Headers**: Configure secure headers.

## 8. Environment Configuration
- **.env Files**: `.env` for defaults, `.env.local` for local overrides (git-ignored). Never commit sensitive data.
- **Type-Safe Config**: Zod for validation.
- **Environment-Specific**: Use env vars, maintain parity, feature flags.

---

## Current Task

[INSERT TASK HERE]
