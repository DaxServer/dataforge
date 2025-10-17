# Product Overview

DataForge is a specialized data processing tool tailored for working with large datasets. While inspired by OpenRefine's approach to data cleaning and transformation, this is not a replacement or alternative to OpenRefine itself. Instead, it focuses on providing high-performance data processing capabilities specifically optimized for large-scale data operations with Wikibase integration.

## Core Features

- **Data Import & Management**: Create and manage data projects with file upload capabilities
- **Wikibase Integration**: Schema mapping and reconciliation with Wikibase instances
- **Data Transformation**: Column operations, row manipulation, and data cleaning tools
- **Project Persistence**: SQLite-based storage with DuckDB for data processing
- **REST API**: Complete API coverage for all data operations and project management

## Target Users

Data analysts, researchers, and developers who need to clean, transform, and reconcile structured data with knowledge bases like Wikidata.

## Architecture Philosophy

Modern web application with clear separation between frontend (Vue 3) and backend (Elysia), emphasizing type safety, developer experience, and performance.
