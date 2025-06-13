This project will re-implement the OpenRefine project (https://github.com/OpenRefine/OpenRefine) (https://openrefine.org/).

# Project

- Based on Bun Catalogs

# Backend

- Based on Elysia, Elysia Eden, Bun, TypeScript.
- Do not use try...catch, let the handler handle it.

# Frontend

- Based on Vue Composition API, PrimeVue, Pinia, Vite, TypeScript.
- Always use Elysia Eden for types and APIs.
- Imports are autoloaded.
- Always use Pinia to store the state.
- Always use reactive elements, instead of computed properties.
- Always use composables, instead of methods.

# Database

- Based on DuckDB
- NodeJS Neo client is used.

# Testing

- Use Elysia Eden for types in testing
