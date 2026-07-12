# AssetFlow Backend

Python FastAPI service for AssetFlow's versioned REST API.

## Current foundation

- FastAPI application factory and ASGI entrypoint
- Environment-backed settings through `pydantic-settings`
- Explicit CORS origins for the React development server
- Versioned `/api/v1` router composition
- Root and versioned health endpoints
- Request ID middleware for traceable responses
- Stable JSON envelopes for validation and unexpected errors
- One cached Supabase client using the project URL and publishable key

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
- `database/`: Supabase client and future persistence code
- `middleware/`: request context and centralized exception handling
- `routers/`: HTTP route definitions and versioned composition
- `schemas/`: Pydantic request and response schemas

## Environment variables

Copy `.env.example` to `.env` and configure:

- `ASSETFLOW_APP_NAME`
- `ASSETFLOW_APP_VERSION`
- `ASSETFLOW_ENVIRONMENT`
- `ASSETFLOW_DEBUG`
- `ASSETFLOW_API_V1_PREFIX`
- `ASSETFLOW_CORS_ORIGINS`: comma-separated allowed frontend origins
- `ASSETFLOW_SUPABASE_URL`: Supabase project URL
- `ASSETFLOW_SUPABASE_PUBLISHABLE_KEY`: low-privilege project key for RLS-protected operations

`Backend/.env` and environment-specific variants are ignored by Git. Commit only placeholder values in `.env.example`.

The backend currently uses the official Python `supabase` client and its Data API. A direct PostgreSQL connection, persistence models, table schema, RLS policies, and authentication remain separate implementation increments.
