# OpenRefine REST API Reference (v3.9.3)

This document lists the main REST API endpoints provided by OpenRefine 3.9.3, which uses the Butterfly framework for its web interface and API.

## Project Management

**Source Files:**

- `main/src/com/google/refine/commands/project/*.java`

| Done | Endpoint                             | Method | Description                         |
| ---- | ------------------------------------ | ------ | ----------------------------------- |
| [x]  | `/command/core/create-project`       | `POST` | Create a new project                |
| [x]  | `/command/core/delete-project`       | `POST` | Delete a project                    |
| [ ]  | `/command/core/export-project`       | `GET`  | Export a project                    |
| [ ]  | `/command/core/export-rows`          | `GET`  | Export project data as rows         |
| [ ]  | `/command/core/get-project-metadata` | `GET`  | Get metadata for a specific project |
| [ ]  | `/command/core/get-models`           | `GET`  | Get project models                  |
| [ ]  | `/command/core/import-project`       | `POST` | Import a project                    |
| [ ]  | `/command/core/rename-project`       | `POST` | Rename a project                    |
| [ ]  | `/command/core/set-project-metadata` | `POST` | Update project metadata             |
| [ ]  | `/command/core/set-project-tags`     | `POST` | Set project tags                    |

## Row Operations

**Source Files:**

- `main/src/com/google/refine/commands/row/*.java`

| Done | Endpoint                              | Method | Description                |
| ---- | ------------------------------------- | ------ | -------------------------- |
| [ ]  | `/command/core/add-rows`              | `POST` | Add rows to a project      |
| [ ]  | `/command/core/annotate-one-row`      | `POST` | Annotate a specific row    |
| [ ]  | `/command/core/annotate-rows`         | `POST` | Annotate multiple rows     |
| [ ]  | `/command/core/get-rows`              | `GET`  | Get rows from a project    |
| [ ]  | `/command/core/remove-duplicate-rows` | `POST` | Remove duplicate rows      |
| [ ]  | `/command/core/remove-rows`           | `POST` | Remove rows from a project |
| [ ]  | `/command/core/reorder-rows`          | `POST` | Reorder rows in a project  |

## Column Operations

**Source Files:**

- `main/src/com/google/refine/commands/column/*.java`

| Done | Endpoint                                    | Method | Description                          |
| ---- | ------------------------------------------- | ------ | ------------------------------------ |
| [ ]  | `/command/core/add-column-by-fetching-urls` | `POST` | Add a column by fetching URLs        |
| [ ]  | `/command/core/add-column`                  | `POST` | Add a new column                     |
| [ ]  | `/command/core/get-columns-info`            | `GET`  | Get information about columns        |
| [ ]  | `/command/core/move-column`                 | `POST` | Move a column                        |
| [ ]  | `/command/core/remove-column`               | `POST` | Remove a column                      |
| [ ]  | `/command/core/rename-column`               | `POST` | Rename a column                      |
| [ ]  | `/command/core/reorder-columns`             | `POST` | Reorder columns                      |
| [ ]  | `/command/core/split-column`                | `POST` | Split a column into multiple columns |

## History and Operations

**Source Files:**

- `main/src/com/google/refine/commands/history/*.java`

| Done | Endpoint                         | Method | Description                   |
| ---- | -------------------------------- | ------ | ----------------------------- |
| [ ]  | `/command/core/apply-operations` | `POST` | Apply operations to a project |
| [ ]  | `/command/core/cancel-processes` | `POST` | Cancel running processes      |
| [ ]  | `/command/core/get-history`      | `GET`  | Get project history           |
| [ ]  | `/command/core/get-operations`   | `GET`  | Get operations history        |
| [ ]  | `/command/core/get-processes`    | `GET`  | Get running processes         |
| [ ]  | `/command/core/undo-redo`        | `POST` | Undo or redo operations       |

## Reconciliation

**Source Files:**

- `main/src/com/google/refine/commands/recon/*.java`

| Done | Endpoint                                        | Method | Description                                     |
| ---- | ----------------------------------------------- | ------ | ----------------------------------------------- |
| [ ]  | `/command/core/extend-data`                     | `POST` | Extend data with reconciliation                 |
| [ ]  | `/command/core/guess-types-of-column`           | `POST` | Guess column types                              |
| [ ]  | `/command/core/preview-extend-data`             | `POST` | Preview data extension                          |
| [ ]  | `/command/core/recon-clear-one-cell`            | `POST` | Clear reconciliation for a cell                 |
| [ ]  | `/command/core/recon-clear-similar-cells`       | `POST` | Clear reconciliation for similar cells          |
| [ ]  | `/command/core/recon-copy-across-columns`       | `POST` | Copy reconciliation across columns              |
| [ ]  | `/command/core/recon-discard-judgments`         | `POST` | Discard reconciliation judgments                |
| [ ]  | `/command/core/recon-judge-one-cell`            | `POST` | Judge reconciliation for a cell                 |
| [ ]  | `/command/core/recon-judge-similar-cells`       | `POST` | Judge reconciliation for similar cells          |
| [ ]  | `/command/core/recon-mark-new-topics`           | `POST` | Mark new topics during reconciliation           |
| [ ]  | `/command/core/recon-match-best-candidates`     | `POST` | Match best candidates during reconciliation     |
| [ ]  | `/command/core/recon-match-specific-topic`      | `POST` | Match a specific topic during reconciliation    |
| [ ]  | `/command/core/recon-use-values-as-identifiers` | `POST` | Use values as identifiers during reconciliation |
| [ ]  | `/command/core/reconcile`                       | `POST` | Reconcile data                                  |

## Importing

**Source Files:**

- `main/src/com/google/refine/commands/importing/*.java`

| Done | Endpoint                                    | Method | Description                             |
| ---- | ------------------------------------------- | ------ | --------------------------------------- |
| [ ]  | `/command/core/cancel-importing-job`        | `POST` | Cancel an import job                    |
| [ ]  | `/command/core/create-importing-job`        | `POST` | Create a new import job                 |
| [ ]  | `/command/core/get-importing-configuration` | `GET`  | Get import configuration                |
| [ ]  | `/command/core/get-importing-job-status`    | `GET`  | Get import job status                   |
| [ ]  | `/command/core/importing-controller`        | `POST` | Import data using a specific controller |

## System and Preferences

**Source Files:**

- `main/src/com/google/refine/commands/Get*.java`
- `main/src/com/google/refine/commands/SetPreferenceCommand.java`
- `main/src/com/google/refine/commands/Open*.java`

| Done | Endpoint                            | Method | Description               |
| ---- | ----------------------------------- | ------ | ------------------------- |
| [ ]  | `/command/core/get-all-preferences` | `GET`  | Get all preferences       |
| [ ]  | `/command/core/get-preference`      | `GET`  | Get a specific preference |
| [ ]  | `/command/core/set-preference`      | `POST` | Set a preference          |
| [ ]  | `/command/core/get-version`         | `GET`  | Get OpenRefine version    |
| [ ]  | `/command/core/get-csrf-token`      | `GET`  | Get CSRF token            |
| [ ]  | `/command/core/open-extensions-dir` | `POST` | Open extensions directory |
| [ ]  | `/command/core/open-workspace-dir`  | `POST` | Open workspace directory  |

## Authentication

OpenRefine 3.9.3 supports basic authentication. All API requests should include the appropriate authentication headers if authentication is enabled.

## Rate Limiting

By default, OpenRefine doesn't enforce strict rate limiting, but it's recommended to implement appropriate client-side throttling.

## Error Handling

API errors return a JSON response with an `error` field containing the error message. Common HTTP status codes include:

- 200: Success
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Internal server error
