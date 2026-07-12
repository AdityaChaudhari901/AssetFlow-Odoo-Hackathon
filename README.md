# AssetFlow — Enterprise Asset & Resource Management System

A centralized ERP platform for tracking, allocating, and maintaining physical assets and shared resources. Any organization with equipment, furniture, vehicles, or shared spaces (offices, schools, hospitals, factories, agencies) can use it to replace spreadsheets and paper logs with structured asset lifecycles, conflict-free resource booking, and real-time visibility into who holds what, where it is, and its condition.

> Odoo Hackathon project. Built with clean ERP architecture, secure role-based workflows, and reusable module design — without touching purchasing, invoicing, or accounting.

---

## 🌐 Live Demo

| | URL |
|---|---|
| **App** | **https://assetflow-web-arjuns-projects-7e499434.vercel.app** |
| API | https://assetflow-api-arjuns-projects-7e499434.vercel.app/api/v1 |
| API docs (Swagger) | https://assetflow-api-arjuns-projects-7e499434.vercel.app/docs |

The frontend proxies `/api/*` to the backend, so the app talks to the API same-origin (first-party session cookie, no CORS).

---

## 🔐 Login Credentials (RBAC demo accounts)

All accounts share the password **`Assetflow@123`**.

| Role | Email | What they can do |
|---|---|---|
| **Admin** | `admin@assetflow.dev` | Organization setup (departments, categories), **assign/promote roles**, create audit cycles, view all analytics & activity logs |
| **Asset Manager** | `manager@assetflow.dev` | Register/edit assets, allocate & process returns, approve transfers & maintenance, close audits, reports |
| **Department Head** | `head.eng@assetflow.dev` | View their department's assets, approve transfers into their department, book resources, dept-scoped reports |
| **Employee** | `priya@assetflow.dev` | View own assets, book resources, raise maintenance requests, initiate return/transfer requests |
| **Employee** | `raj@assetflow.dev` | (same as above — currently holds an overdue asset for the dashboard demo) |

> **Roles are never self-assigned.** Signup always creates an **Employee**; only an Admin promotes users to Department Head or Asset Manager from the Employee Directory (Organization → Employees). This is the only place roles change.

### Suggested demo walkthrough
1. **Sign up** a new account → note it joins as *Employee* with no role picker.
2. Log in as **Admin** → Organization → Employees → promote that user.
3. As **Asset Manager**, register an asset (auto-tagged `AF-00xx`) and allocate it to Priya.
4. Try allocating the **same asset** to Raj → blocked with *"currently held by Priya Sharma"* + a **Request Transfer** button.
5. Approve the transfer → history is preserved automatically.
6. **Book Room B2** for 09:30–10:30 (today already has 09:00–10:00) → rejected for overlap; 10:00–11:00 succeeds.
7. Raise & approve a **maintenance** request → asset flips to *Under Maintenance*, then back on resolve.
8. Open the **audit cycle**, mark an asset *Missing*, **close** it → asset becomes *Lost*, discrepancy report generated.
9. Check the **Dashboard** KPIs, the **overdue** returns (red), and the **notifications** bell.

---

## ✨ Features

- **Organization setup** — departments (with hierarchy + heads), asset categories with custom fields (e.g. warranty period for Electronics), and the employee directory.
- **Asset registry** — register with auto-generated Asset Tags (`AF-0001`), serial, acquisition date/cost, condition, location, photos, and a "bookable" flag. Search/filter by tag, serial, category, status, department, location.
- **Full lifecycle** — `Available · Allocated · Reserved · Under Maintenance · Lost · Retired · Disposed`, with workflow-driven and manual transitions.
- **Allocation & transfer** — allocate to employee/department; **double-allocation is impossible** (a single asset can have only one active holder); transfer workflow (request → approve → re-allocate) with automatic history; returns with condition check-in; overdue auto-flagging.
- **Resource booking** — time-slot booking of shared resources with **overlap validation** (back-to-back allowed); calendar view; cancel/reschedule; reminders.
- **Maintenance** — approval workflow (`Pending → Approved/Rejected → Assigned → In Progress → Resolved`) that flips asset status on approve/resolve; per-asset maintenance history.
- **Audit cycles** — scoped by department/location, assigned auditors, per-asset verification (Verified/Missing/Damaged), auto discrepancy report, and cycle close that marks missing assets Lost.
- **Dashboard & reports** — KPI cards, overdue vs upcoming returns, utilization trends, maintenance frequency, needs-attention assets, department allocation, booking heatmap, CSV export.
- **Notifications & activity log** — event notifications per role and a full admin audit log of who did what, when.

---

## 🏗️ Architecture

```
┌─────────────────┐   /api/* proxied same-origin   ┌──────────────────────┐
│  React SPA       │ ─────────────────────────────▶ │  FastAPI (Vercel)     │
│  (Vercel static) │ ◀───────────────────────────── │  /api/v1/*            │
└─────────────────┘   JSON: {data} / {error}        └─────────┬────────────┘
                                                              │ service-role key
                                                              ▼
                                                   ┌──────────────────────┐
                                                   │  Supabase             │
                                                   │  • Postgres (RLS on)  │
                                                   │  • Auth (email/pass)  │
                                                   │  • Storage (photos)   │
                                                   └──────────────────────┘
```

**Key design decisions**
- The frontend never talks to Supabase directly — all auth and data go through FastAPI, giving one integration surface and server-side role enforcement.
- **Concurrency-critical invariants live in Postgres, not Python:** a partial unique index makes double-allocation impossible even under race, and a GiST exclusion constraint on `tstzrange` prevents overlapping bookings. Multi-row operations (allocate, return, transfer-approve, maintenance approve/resolve, audit-close) are atomic Postgres RPC functions.
- RLS is enabled on every table with no anon policies; the backend uses the service-role key and is the sole authorization surface.
- Auth tokens (Supabase JWT, ES256) are verified locally against the project JWKS — no per-request network hop.
- Serverless-friendly: overdue detection is computed at read time; a daily Vercel Cron (`/api/v1/jobs/scan`) materializes overdue/reminder notifications.

---

## 🧰 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, React Router, Tailwind CSS v4, shadcn/ui, TanStack Query, axios, react-hook-form + zod, recharts, date-fns |
| Backend | FastAPI (Python 3.12), Pydantic v2, Supabase Python SDK, PyJWT |
| Database | Supabase — Postgres (+ `btree_gist`), Auth, Storage |
| Hosting | Vercel (frontend static + Python serverless API), Vercel Cron |

---

## 📁 Repository Layout

```
AssetFlow-Odoo-Hackathon/
├── Backend/                    FastAPI service (deployed as its own Vercel project)
│   ├── api/index.py            Vercel serverless entrypoint (exposes the ASGI app)
│   ├── app/main.py             App composition (CORS, middleware, routers)
│   ├── config/                 Settings (env-backed)
│   ├── core/                   auth (JWT/JWKS), permissions, errors, pagination
│   ├── database/               Supabase clients + DB error mapping
│   ├── routers/                One module per domain (auth, assets, allocations, …)
│   ├── services/               All business logic (thin routers → services → DB)
│   ├── schemas/                Pydantic request/response models
│   ├── db/                     SQL migrations 000–006 (run in Supabase SQL editor)
│   ├── scripts/seed.py         Demo data + accounts seeder
│   └── vercel.json             Rewrites + daily cron
├── Frontend/                   React SPA (deployed as its own Vercel project)
│   ├── src/api/                API client (axios) + per-domain modules
│   ├── src/features/           Feature components (allocations, bookings, …)
│   ├── src/pages/              Route pages (dashboard, assets, audits, …)
│   ├── src/components/         Shared UI + shadcn primitives
│   └── vercel.json             SPA fallback + /api proxy to the backend
├── BACKEND_IMPLEMENTATION_PLAN.md   Full backend spec (schema, API contract, RBAC)
└── FRONTEND_IMPLEMENTATION_PLAN.md  Full frontend spec (screens, components, contract)
```

The implementation plans (`*_IMPLEMENTATION_PLAN.md`) are the shared source of truth for the API contract, enums, and error codes.

---

## 🚀 Local Development

### Prerequisites
- Python 3.12, Node 18+, a Supabase project.

### 1. Database
In the Supabase SQL editor, run the migrations **in order**: `Backend/db/000_extensions.sql` → `006_seed.sql` (or paste `Backend/db/_all_migrations.sql`). Then:
- Auth → disable **Confirm email** (so signups get a session immediately).
- Storage → create a public bucket named `assetflow-files`.

### 2. Backend
```bash
cd Backend
cp .env.example .env          # fill in Supabase URL + publishable + secret keys
python -m venv .venv && source .venv/bin/activate   # or: uv venv .venv
pip install -r requirements.txt                     # or: uv pip install -r requirements.txt
python scripts/seed.py        # creates the demo accounts + scenario data
fastapi dev app/main.py       # http://localhost:8000  (docs at /docs)
```

### 3. Frontend
```bash
cd Frontend
npm install
echo 'VITE_API_BASE_URL=http://localhost:8000/api/v1' > .env
echo 'VITE_USE_FIXTURES=false' >> .env
npm run dev                   # http://localhost:5173
```

---

## 🔧 Environment Variables

**Backend** (`ASSETFLOW_` prefix)

| Variable | Purpose |
|---|---|
| `ASSETFLOW_SUPABASE_URL` | Supabase project URL |
| `ASSETFLOW_SUPABASE_PUBLISHABLE_KEY` | Publishable key (auth client) |
| `ASSETFLOW_SUPABASE_SECRET_KEY` | Service-role key (data/storage — server only) |
| `ASSETFLOW_SUPABASE_JWT_SECRET` | Optional; legacy HS256 secret. Omit to verify via project JWKS (ES256) |
| `ASSETFLOW_FRONTEND_URL` | Password-reset redirect target |
| `ASSETFLOW_CORS_ORIGINS` | Allowed origins (comma-separated) |
| `ASSETFLOW_STORAGE_BUCKET` | Storage bucket name (`assetflow-files`) |
| `ASSETFLOW_ENVIRONMENT` | `development` \| `staging` \| `production` |
| `CRON_SECRET` | Bearer secret for `/api/v1/jobs/scan` (Vercel Cron sends it) |

**Frontend**

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | API base. Prod: `/api/v1` (same-origin via proxy). Dev: `http://localhost:8000/api/v1` |
| `VITE_USE_FIXTURES` | `false` to use the real API |

---

## ☁️ Deployment (Vercel)

Two projects from this monorepo:

| Project | Root directory | Framework | Notes |
|---|---|---|---|
| `assetflow-api` | `Backend` | Python (FastAPI) | Env vars above; daily cron in `vercel.json` |
| `assetflow-web` | `Frontend` | Vite | `VITE_API_BASE_URL=/api/v1`; `vercel.json` proxies `/api/*` to the API |

The frontend's `/api/*` rewrite makes the API same-origin, so the session cookie is first-party and works across all browsers (no third-party-cookie issues, no CORS).

---

## 🗄️ Data Model (13 tables)

`profiles` (1:1 with `auth.users`) · `departments` · `asset_categories` · `assets` · `allocations` · `transfer_requests` · `bookings` · `maintenance_requests` · `audit_cycles` · `audit_auditors` · `audit_records` · `notifications` · `activity_logs`.

See `Backend/db/001_tables.sql` for the full schema and `BACKEND_IMPLEMENTATION_PLAN.md` for column-level detail, the API contract, enums, and error codes.
