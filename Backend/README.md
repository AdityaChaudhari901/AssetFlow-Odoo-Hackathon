# AssetFlow Backend

This directory reserves the backend application boundaries before a runtime or database library is selected.

## Structure

- `app/`: application entrypoints and composition
- `config/`: runtime and environment configuration
- `controllers/`: request handlers
- `database/`: database clients, migrations, and repositories
- `middleware/`: authentication, authorization, validation, and error handling
- `models/`: persistence models
- `routers/`: HTTP route definitions
- `schemas/`: request and response schemas
- `services/`: business workflows
- `types/`: shared backend types
- `utils/`: framework-independent helpers
- `tests/`: backend tests

The backend framework, database client, and package manager will be added in the next implementation step.
