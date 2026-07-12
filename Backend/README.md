# AssetFlow Backend

Python FastAPI service for AssetFlow's versioned REST API.

## Current foundation

- FastAPI application factory and ASGI entrypoint
- Environment-backed settings through `pydantic-settings`
- Explicit CORS origins for the React development server
- Versioned `/api/v1` router composition
- Root and versioned health endpoints
- Request ID middleware for traceable responses
- Stable JSON envelopes for application, validation, and unexpected errors

## Local setup

```bash
cd Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Start the development server when runtime execution is authorized:

```bash
fastapi dev app/main.py
```

The API documentation is exposed at `/docs`. Liveness is exposed at `/health`, and the versioned equivalent is `/api/v1/health`.

## Structure

- `app/`: application entrypoint and composition
- `config/`: validated runtime configuration
- `controllers/`: optional request orchestration when a route requires it
- `database/`: future database clients, migrations, and repositories
- `middleware/`: request context and centralized exception handling
- `models/`: future persistence models
- `routers/`: HTTP route definitions and versioned composition
- `schemas/`: Pydantic request and response schemas
- `services/`: framework-independent business workflows
- `types/`: shared backend types when needed
- `utils/`: framework-independent helpers
- `tests/`: future backend tests

## Environment variables

Copy `.env.example` to `.env` and configure:

- `ASSETFLOW_APP_NAME`
- `ASSETFLOW_APP_VERSION`
- `ASSETFLOW_ENVIRONMENT`
- `ASSETFLOW_DEBUG`
- `ASSETFLOW_API_V1_PREFIX`
- `ASSETFLOW_CORS_ORIGINS`: comma-separated allowed frontend origins

The database, authentication strategy, and persistence models remain intentionally unselected for the next backend increment.
