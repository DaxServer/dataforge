# OpenRefine Backend

This is the backend service for OpenRefine, built with Bun and DuckDB.

## Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or later)
- Node.js (v18 or later)

## Setup

1. Install dependencies:

```bash
bun install
```

2. Initialize the database:

```bash
bun run db:init
```

This will create a `openrefine.db` file in the project root.

## Development

Start the development server:

```bash
bun run dev
```

The server will be available at `http://localhost:8000` by default.

## Available Scripts

- `bun run dev` - Start the development server with hot reload
- `bun start` - Start the production server
- `bun test` - Run tests
- `bun run db:init` - Initialize the database schema
- `bun run db:cleanup` - Clean up test data from the database
- `bun run test:api` - Run API tests against a local server

## API Endpoints

### Projects

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Get a project by ID
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Health Check

- `GET /api/health` - Check if the API is running

## Database

The application uses DuckDB as its database, stored in a local file at the project root (`openrefine.db`).

## Project Structure

- `src/` - Source code
  - `db/` - Database connection and utilities
  - `models/` - Data models
  - `routes/` - API route handlers
  - `services/` - Business logic
  - `utils/` - Utility functions
- `scripts/` - Database scripts and utilities
- `tests/` - Test files

## Testing

Run the test suite:

```bash
bun test
```

## License

MIT
