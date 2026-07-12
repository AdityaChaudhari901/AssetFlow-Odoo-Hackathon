# AssetFlow — Frontend Implementation Plan

> **Owner:** Frontend developer
> **Stack (already scaffolded in `Frontend/`):** React 19 (JavaScript, no TS) · Vite · Tailwind CSS v4 · shadcn/ui · React Router 8 · Deployed on Vercel
> **Shared contract:** No `BACKEND_IMPLEMENTATION_PLAN.md` is currently tracked. Until one is added, Sections 3, 8, and 9 below are the shared frontend/backend source of truth. Any backend contract change must update this file in the same commit.

This document is self-contained: everything you need (endpoints, payloads, enums, error shapes) is in here. You never talk to Supabase directly — **all auth and data go through the FastAPI backend**.

---

## Table of Contents

1. [Setup & Dependencies](#1-setup--dependencies)
2. [Project Structure](#2-project-structure)
3. [API Contract (what the backend gives you)](#3-api-contract)
4. [API Client & Auth Plumbing](#4-api-client--auth-plumbing)
5. [Routing Map & Role Guards](#5-routing-map--role-guards)
6. [Screen-by-Screen Specs (the 10 PDF screens)](#6-screen-by-screen-specs)
7. [Shared Components Inventory](#7-shared-components-inventory)
8. [Enums, Labels & Badge Colors](#8-enums-labels--badge-colors)
9. [Error Handling UX](#9-error-handling-ux)
10. [Dates, Times & Formatting](#10-dates-times--formatting)
11. [Vercel Deployment](#11-vercel-deployment)
12. [Build Milestones (synced with backend)](#12-build-milestones)

---

## 1. Setup & Dependencies

Already in place: React 19, react-router 8, Tailwind v4, shadcn (button + card), lucide-react, Geist font, `@/` alias.

Install:

```bash
cd Frontend
npm i @tanstack/react-query axios react-hook-form zod @hookform/resolvers date-fns recharts sonner
```

Add shadcn components as needed (JSX output is configured via `components.json`):

```bash
npx shadcn@latest add input label select textarea checkbox switch dialog alert-dialog \
  dropdown-menu table tabs badge avatar popover calendar skeleton sheet tooltip \
  separator alert form pagination command
```

| Library | Used for |
|---|---|
| `@tanstack/react-query` | ALL server state (queries + mutations + cache invalidation). No Redux/Zustand needed. |
| `axios` | API client with interceptors (token attach, 401 refresh-and-retry) |
| `react-hook-form` + `zod` | Every form; zod schemas mirror backend validation |
| `date-fns` | Formatting, overdue math, calendar grid |
| `recharts` | Reports charts + booking heatmap |
| `sonner` | Toasts (success + error) |

Env: create `Frontend/.env` with

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

(Production value: your same-site FastAPI origin ending in `/api/v1`.)

---

## 2. Project Structure

```
Frontend/src/
├── main.jsx                     (exists — wrap with QueryClientProvider + AuthProvider + Toaster)
├── app.jsx                      (exists — replace with routes.jsx content)
├── routes.jsx                   ★ route table (Section 5)
├── api/
│   ├── client.js                ★ axios instance + interceptors (Section 4)
│   ├── auth.js                  ★ one function per endpoint, per domain:
│   ├── employees.js, departments.js, categories.js, assets.js,
│   ├── allocations.js, transfers.js, bookings.js, maintenance.js,
│   └── audits.js, dashboard.js, reports.js, notifications.js, uploads.js
├── hooks/
│   ├── use-auth.js              ★ consume AuthContext
│   └── queries/                 ★ react-query hooks per domain (keys in Section 4.3)
├── context/
│   └── auth-context.jsx         ★ user, login/logout/signup, role helpers
├── lib/
│   ├── constants.js             ★ ALL enums/labels/colors from Section 8 — single file
│   ├── utils.js                 (exists — cn())
│   └── format.js                ★ date/currency/relative-time helpers
├── components/
│   ├── ui/                      shadcn (generated)
│   ├── layout/
│   │   ├── app-shell.jsx        ★ sidebar + topbar + <Outlet/>
│   │   ├── sidebar.jsx          ★ role-filtered nav
│   │   ├── topbar.jsx           ★ search, notifications bell, user menu
│   │   └── notifications-popover.jsx ★
│   ├── guards/
│   │   ├── require-auth.jsx     ★ redirect to /login if no session
│   │   └── require-role.jsx     ★ 403 page / hide if role not allowed
│   └── shared/                  ★ Section 7
└── pages/
    ├── auth/    login.jsx, signup.jsx, forgot-password.jsx, reset-password.jsx
    ├── dashboard.jsx
    ├── organization/ index.jsx (tabs), departments-tab.jsx, categories-tab.jsx, employees-tab.jsx
    ├── assets/  asset-list.jsx, asset-detail.jsx, asset-form-dialog.jsx
    ├── allocations/ allocation-list.jsx, allocate-dialog.jsx, return-dialog.jsx, transfer-dialog.jsx
    ├── bookings/ booking-page.jsx, booking-calendar.jsx, booking-form-dialog.jsx
    ├── maintenance/ maintenance-list.jsx, maintenance-detail-drawer.jsx, raise-request-dialog.jsx
    ├── audits/  audit-list.jsx, audit-detail.jsx, create-audit-dialog.jsx
    ├── reports/ reports-page.jsx
    ├── notifications.jsx
    ├── activity-logs.jsx
    └── not-found.jsx / forbidden.jsx
```

---

## 3. API Contract

> This section is the shared source of truth until a synchronized backend implementation plan is tracked.

### 3.0 Conventions

- Base URL: `import.meta.env.VITE_API_BASE_URL` (ends with `/api/v1`).
- Public auth endpoints are signup, login, refresh, forgot-password, and reset-password. `/auth/me` is protected with `Authorization: Bearer <access_token>`; logout is an idempotent cookie-authenticated operation.
- **Success:** 2xx → `{"data": <object|array>}`; lists also have `"meta": {"page", "limit", "total"}`.
- **Error:** `{"error": {"code", "message", "request_id", "details"}}` — `code` is a stable string (Section 9), `message` is user-safe (you can show it directly in toasts).
- Pagination params: `page` (1-based), `limit` (default 20, max 100). Timestamps ISO-8601 UTC; dates `YYYY-MM-DD`; IDs are UUIDs.

### 3.1 Endpoint reference

**Auth**

| Method | Path | Body → Returns |
|---|---|---|
| POST | `/auth/signup` | `{full_name, email, password}` → `{data: {user: UserProfile, session: {access_token, expires_at, user_id}}}` and sets the rotating refresh token as an HttpOnly cookie — always creates role `employee` |
| POST | `/auth/login` | `{email, password}` → same shape and sets/rotates the HttpOnly refresh cookie |
| POST | `/auth/refresh` | No body → `{data: {session: {access_token, expires_at, user_id}}}` and rotates the HttpOnly refresh cookie |
| POST | `/auth/logout` | No body; idempotently revokes the server session and clears the refresh cookie |
| POST | `/auth/forgot-password` | `{email}` → always 200 |
| POST | `/auth/reset-password` | `{recovery_token, new_password}`; immediately remove the one-time token from the browser URL after reading it |
| GET | `/auth/me` | → `{data: UserProfile}` |

`UserProfile = {id, full_name, email, role, capabilities: string[], organization_name, department_id, department_name, status, avatar_url, created_at}`. Capabilities cover assignment-scoped access such as `audits.view`; role guards remain UX only and the backend stays authoritative.

**Employees** (directory)

| Method | Path | Notes |
|---|---|---|
| GET | `/employees?search=&department_id=&role=&status=&page=&limit=` | admin/asset_manager/department_head. Rows = UserProfile + `active_allocations` |
| GET | `/employees/{id}` | |
| PATCH | `/employees/{id}` | **admin only** — `{role?, department_id?, status?, full_name?}` — the ONLY place roles change. 409 `CANNOT_MODIFY_SELF` if admin edits own role/status |

**Departments**

| Method | Path | Notes |
|---|---|---|
| GET | `/departments?status=&search=` | any role. Rows include `head {id, full_name}`, `parent_department_id`, `employee_count`, `asset_count`, `status` |
| POST | `/departments` | admin — `{name, description?, head_id?, parent_department_id?}` |
| PATCH | `/departments/{id}` | admin — any field; deactivate via `{status: "inactive"}` |

**Categories**

| Method | Path | Notes |
|---|---|---|
| GET | `/categories?status=` | any role |
| POST | `/categories` | admin — `{name, description?, custom_fields: [{key, label, type: "text"\|"number"\|"date"\|"boolean", required}]}` |
| PATCH | `/categories/{id}` | admin |

**Assets**

| Method | Path | Notes |
|---|---|---|
| GET | `/assets?search=&category_id=&status=&department_id=&location=&is_bookable=&page=&limit=&sort=&order=` | `search` matches name/tag/serial |
| POST | `/assets` | admin/asset_manager — `{name, category_id, serial_number?, acquisition_date?, acquisition_cost?, condition, location?, department_id?, is_bookable, image_url?, custom_field_values?}` → returns row with generated `asset_tag` (e.g. `AF-0114`) |
| GET | `/assets/{id}` | → asset + `category {id,name}`, `department`, `current_allocation` (`null` or `{id, employee, department, allocated_at, expected_return_date, is_overdue}`), `open_maintenance_count` |
| PATCH | `/assets/{id}` | metadata only — status changes go through `/status` |
| POST | `/assets/{id}/status` | `{status, notes?}` — manual transitions only: `available↔reserved`, `available→lost`, `lost→available`, `available→retired`, `retired→disposed`, `available→disposed`. Else 409 `INVALID_STATUS_TRANSITION` with `details.allowed` |
| GET | `/assets/{id}/history` | → `{data: {allocations: [...], maintenance: [...], audits: [...]}}` |

**Allocations & Returns**

| Method | Path | Notes |
|---|---|---|
| GET | `/allocations?status=active\|returned\|overdue&employee_id=&department_id=&asset_id=&mine=true&page=&limit=` | employees automatically see only their own; rows include `asset {id, asset_tag, name}`, holder, `is_overdue`, `return_requested` |
| POST | `/allocations` | admin/asset_manager — `{asset_id, employee_id XOR department_id, expected_return_date?, notes?}` — **409 `ASSET_ALREADY_ALLOCATED`** is the key flow, see Section 6.5 |
| POST | `/allocations/{id}/return-request` | holder — flags return intent, notifies asset managers |
| POST | `/allocations/{id}/return` | admin/asset_manager — `{condition, notes?}` — asset flips back to `available` |

**Transfers**

| Method | Path | Notes |
|---|---|---|
| GET | `/transfers?status=&asset_id=&mine=true&page=&limit=` | |
| POST | `/transfers` | any role — `{asset_id, to_employee_id XOR to_department_id, reason?}`. 409 `ASSET_NOT_ALLOCATED` / `DUPLICATE_RESOURCE` (pending one exists) |
| POST | `/transfers/{id}/approve` | admin/asset_manager/department_head(their dept) → `{data: {transfer, new_allocation}}` |
| POST | `/transfers/{id}/reject` | `{reason?}` |

**Bookings**

| Method | Path | Notes |
|---|---|---|
| GET | `/bookings?asset_id=&from=&to=&status=&mine=true&page=&limit=` | `from`/`to` = ISO datetimes, returns bookings overlapping the window (calendar feed). Every row has server-computed `display_status`: `upcoming\|ongoing\|completed\|cancelled` |
| POST | `/bookings` | any role — `{asset_id, start_time, end_time, purpose?, department_id?}` — **409 `BOOKING_OVERLAP`** with `details.conflicting_booking {id, start_time, end_time, booked_by {full_name}}`. Back-to-back slots are fine (10:00 end + 10:00 start OK) |
| PATCH | `/bookings/{id}` | `{start_time, end_time}` — reschedule, revalidates overlap |
| POST | `/bookings/{id}/cancel` | `{reason?}` — owner or admin/asset_manager |

Bookable resources = `GET /assets?is_bookable=true`.

**Maintenance**

| Method | Path | Notes |
|---|---|---|
| GET | `/maintenance?status=&asset_id=&priority=&mine=true&page=&limit=` | |
| GET | `/maintenance/{id}` | |
| POST | `/maintenance` | any role — `{asset_id, title, description?, priority, photo_url?}` |
| POST | `/maintenance/{id}/approve` | admin/asset_manager — asset flips `under_maintenance` |
| POST | `/maintenance/{id}/reject` | `{reason}` |
| POST | `/maintenance/{id}/assign` | `{technician_name}` |
| POST | `/maintenance/{id}/start` | → `in_progress` |
| POST | `/maintenance/{id}/resolve` | `{resolution_notes?, cost?}` — asset flips back to `allocated` or `available` |

Status machine (buttons to show per status): `pending → approve/reject` · `approved → assign` · `assigned → start` · `in_progress → resolve`.

**Audits**

| Method | Path | Notes |
|---|---|---|
| GET | `/audits?status=&page=&limit=` | |
| POST | `/audits` | admin — `{name, department_id?, location?, start_date, end_date, auditor_ids: []}` — backend snapshots all in-scope assets as `pending` records |
| GET | `/audits/{id}` | → cycle + `progress {total, verified, missing, damaged, pending}` + `records[]` (asset summary + result + notes + audited_by/at) |
| POST | `/audits/{id}/records` | assigned auditors — `{asset_id, result: "verified"\|"missing"\|"damaged", notes?}` (upsert). 409 `AUDIT_CYCLE_CLOSED`, 403 if not an assigned auditor |
| GET | `/audits/{id}/discrepancies` | records with `missing`/`damaged` — the auto report |
| POST | `/audits/{id}/close` | admin/asset_manager → `{data: {summary}}`; missing assets become `lost` |

**Dashboard**

| Method | Path | Returns |
|---|---|---|
| GET | `/dashboard/kpis` | `{data: {assets_available, assets_allocated, maintenance_active, active_bookings_today, pending_transfers, upcoming_returns, overdue_returns}}` |
| GET | `/dashboard/returns?type=overdue\|upcoming` | allocation rows with `days_overdue` |

**Reports** (admin/asset_manager; department_head sees own dept)

| Method | Path |
|---|---|
| GET | `/reports/utilization?from=&to=` — rows: `{asset, allocated_days, utilization_pct}` |
| GET | `/reports/maintenance-frequency?group_by=asset\|category` — `{key, name, request_count, resolved_count, total_cost}` |
| GET | `/reports/attention` — assets flagged for maintenance-frequency / poor condition / age |
| GET | `/reports/department-allocation` — `{department, allocated_count, total_acquisition_cost}` |
| GET | `/reports/booking-heatmap?asset_id=&from=&to=` — `{cells: [{weekday: 0-6, hour: 0-23, count}]}` |
| GET | `/reports/export?report=<name>&format=csv` — triggers file download (use `window.open` or blob) |

**Notifications**

| Method | Path |
|---|---|
| GET | `/notifications?unread_only=true&page=&limit=` — rows `{id, type, title, message, entity_type, entity_id, is_read, created_at}` |
| GET | `/notifications/unread-count` — `{data: {count}}` — poll every 60s (`refetchInterval`) |
| POST | `/notifications/{id}/read` |
| POST | `/notifications/read-all` |

**Activity Logs** (admin only)

| Method | Path |
|---|---|
| GET | `/activity-logs?actor_id=&entity_type=&action=&from=&to=&page=&limit=` — rows `{id, actor {id, full_name}, action, entity_type, entity_id, details, created_at}` |

**Uploads**

| Method | Path |
|---|---|
| POST | `/uploads` — `multipart/form-data` with `file` + `folder` (`assets`\|`maintenance`\|`avatars`) → `{data: {url, path}}`. Max 5 MB; jpeg/png/webp/pdf. Upload first, then put `url` into `image_url`/`photo_url` |

---

## 4. API Client & Auth Plumbing

### 4.1 `api/client.js`

Implementation requirements:

- Keep the access token in module memory only. Never store access or refresh tokens in `localStorage`, `sessionStorage`, IndexedDB, or a readable cookie.
- FastAPI owns the rotating refresh token in an `HttpOnly`, `Secure` cookie scoped to auth endpoints with an explicit SameSite/CSRF policy.
- Use a credentialed `authApi` instance for login, signup, refresh, and logout. Use a separate protected `api` instance for Bearer-authenticated product requests and file uploads.
- Serialize refresh, login, signup, and logout with one cross-tab Web Lock so competing `Set-Cookie` responses cannot silently change identity order.
- Refresh is single-flight inside a tab. A protected request gets at most one refresh-and-retry attempt; a second 401 terminates the session.
- Normalize failures into an `ApiError extends Error` carrying `code`, `message`, `details`, `status`, and `requestId`. Distinguish cancellation, timeout, network, client, and server errors.
- Do not set a global JSON content type; Axios must be allowed to generate multipart boundaries for `FormData` uploads.
- Session expiry notifies `AuthProvider`; the API module never performs navigation itself.
- Fail visibly when `VITE_API_BASE_URL` is absent rather than sending requests to the current origin accidentally.

The implementation source is `Frontend/src/api/client.js`; keep this section synchronized whenever its external contract changes.

Domain modules are thin: `export const listAssets = (params) => api.get("/assets", { params }).then(r => r.data);`

### 4.2 `context/auth-context.jsx`

- State: `{user, loading, authError}`. On mount: perform one cookie-backed refresh, then `GET /auth/me`; the complete restore flow is single-flight under React Strict Mode.
- `login(email, password)` / `signup(payload)` → cancel queries, clear the previous identity cache, start the memory-only access-token session, set the authoritative user, then broadcast identity rehydration to other tabs.
- `logout()` → invalidate local operations immediately, clear user/query state, wait for any pending refresh, then call the idempotent backend logout so the final cookie response revokes the latest session.
- Version hydration and profile requests so a stale response cannot restore a previous user after logout or account switching.
- Clear the entire TanStack Query cache on login, logout, cross-tab identity changes, inactive accounts, and terminal refresh failures.
- Helpers used everywhere for UI gating:
  ```js
  const hasRole = (...roles) => roles.includes(user?.role);
  const isManager = hasRole("admin", "asset_manager");
  ```

### 4.3 React-query conventions

- Query keys: `["assets", params]`, `["asset", id]`, `["asset-history", id]`, `["allocations", params]`, `["bookings", params]`, `["maintenance", params]`, `["audits"]`, `["audit", id]`, `["kpis"]`, `["notifications"]`, `["unread-count"]`, `["employees", params]`, `["departments"]`, `["categories"]`.
- Mutations invalidate: e.g. allocate → invalidate `["assets"]`, `["asset", id]`, `["allocations"]`, `["kpis"]`. Cheap and correct beats surgical.
- Defaults: `staleTime: 30_000`, `retry: 1`, `refetchOnWindowFocus: false`. `["unread-count"]` uses `refetchInterval: 60_000`.

---

## 5. Routing Map & Role Guards

```
PUBLIC
  /login                  LoginPage
  /signup                 SignupPage            (creates Employee only — NO role field, ever)
  /forgot-password        ForgotPasswordPage
  /reset-password         ResetPasswordPage     (consumes a one-time recovery token, then removes it from the URL)

PROTECTED (RequireAuth → AppShell with sidebar/topbar)
  /                       DashboardPage             all roles
  /organization           OrganizationPage          RequireRole: admin        (3 tabs)
  /assets                 AssetListPage             all roles (register button gated to admin/asset_manager)
  /assets/:id             AssetDetailPage           all roles
  /allocations            AllocationListPage        all roles (employees: own items view)
  /bookings               BookingPage               all roles
  /maintenance            MaintenancePage           all roles (approval actions gated)
  /audits                 AuditListPage             admin, asset_manager, + assigned auditors
  /audits/:id             AuditDetailPage           same
  /reports                ReportsPage               RequireRole: admin, asset_manager, department_head
  /notifications          NotificationsPage         all roles
  /activity               ActivityLogsPage          RequireRole: admin
  *                       NotFound / Forbidden
```

- `RequireAuth`: while `loading` show full-page skeleton; no user → `<Navigate to="/login" state={{from}} />`.
- `RequireRole roles={[...]}`: not allowed → render `<Forbidden />` (don't redirect silently — judges should see RBAC working).
- Sidebar items are filtered by the same role arrays (single config array `NAV_ITEMS = [{to, label, icon, roles}]` in `constants.js`) so nav and guards can't drift.

---

## 6. Screen-by-Screen Specs

### 6.1 Login / Signup (PDF screen 1)

- Centered card (reuse existing landing layout). Login: email + password, zod-validated, submit → `login()` → navigate to `location.state.from ?? "/"`. Error: 401 `INVALID_CREDENTIALS` → inline alert "Invalid email or password"; 403 `ACCOUNT_INACTIVE` → "Your account is deactivated — contact your admin."
- Signup: full name, email, password (min 8), confirm password. **No role selector — this is a judged requirement.** Under the form: "You'll join as an Employee. Admins assign roles from the directory." 409 `EMAIL_ALREADY_REGISTERED` → inline on email field.
- Forgot password: email → always success toast ("If that email exists, a reset link is on the way").
- Reset password: read and validate the one-time recovery token, immediately remove it from the URL with `history.replaceState`, submit the new password twice, then toast and navigate to `/login`.

### 6.2 Dashboard (PDF screen 2)

- **KPI row** — 7 `KpiCard`s from `GET /dashboard/kpis`: Assets Available, Assets Allocated, Maintenance Active, Bookings Today, Pending Transfers, Upcoming Returns, **Overdue Returns** (red accent + AlertTriangle icon). Each card links to the filtered list page (e.g. Overdue → `/allocations?status=overdue`).
- **Returns section** — two stacked lists from `/dashboard/returns`: "Overdue" (red rows, `days_overdue` badge) and "Due in 7 days". Empty state: "Nothing overdue 🎉".
- **Quick actions** — buttons gated by role: Register Asset (admin/asset_manager → opens asset form dialog), Book Resource (all → `/bookings`), Raise Maintenance Request (all → dialog).
- Employee experience: same KPIs plus "My assets" (`/allocations?mine=true&status=active`) and "My bookings" (`/bookings?mine=true`) mini-lists.

### 6.3 Organization Setup — admin only, 3 tabs (PDF screen 3)

shadcn `Tabs`: Departments / Categories / Employees. URL-sync tab via `?tab=` so refresh keeps place.

**Tab A — Departments:** DataTable (Name, Head, Parent, Employees, Assets, Status badge, actions). Create/Edit dialog: name*, description, Head (searchable select over `GET /employees`), Parent department (select, exclude self), Deactivate via row action → confirm dialog → `PATCH {status: "inactive"}`. 409 `DUPLICATE_RESOURCE` → inline name error.

**Tab B — Categories:** DataTable (Name, Description, #custom fields, Status). Dialog: name*, description, and a **custom-fields repeater** (rows: key, label, type select [text/number/date/boolean], required switch; add/remove row). These definitions drive dynamic inputs on the asset form.

**Tab C — Employee Directory:** DataTable (Name+avatar, Email, Department, Role badge, Status, actions) with search + role/department/status filters. Row action "Manage" → dialog with Role select (**admin / asset_manager / department_head / employee**), Department select, Status switch → `PATCH /employees/{id}`. This is **the only place in the app** where roles change. 409 `CANNOT_MODIFY_SELF` → toast "You can't change your own role."

### 6.4 Asset Registry (PDF screen 4)

**List `/assets`:** toolbar = search input (debounced 300ms, hits `?search=`), filters (category, status, department, bookable), "Register Asset" button (admin/asset_manager). Table: Photo thumb, Asset Tag (mono font), Name, Category, Status `StatusBadge`, Condition, Location, Holder (from list join if provided, else "—"), row → `/assets/:id`. Server pagination via `meta.total`.

**Register/Edit dialog:** name*, category* (select — on change, render that category's `custom_fields` as dynamic inputs), serial number, acquisition date (date picker), acquisition cost (₹ number), condition select, location, department (optional), **"Shared / bookable resource" switch**, photo `FileUpload` (POST `/uploads` first → set `image_url`). On create success: toast shows the generated tag — "Asset AF-0121 registered."

**Detail `/assets/:id`:** header (photo, name, tag, big StatusBadge) + action buttons by role/status:
- Allocate (admin/asset_manager, status `available`) → allocate dialog
- Change Status (admin/asset_manager) → dialog listing **only** the legal manual transitions for current status (mirror backend matrix in `constants.js`; on 409 `INVALID_STATUS_TRANSITION` re-render options from `details.allowed`)
- Raise Maintenance (any)
- Book (if `is_bookable`) → booking dialog pre-filled
- Current holder card when allocated: avatar, name, since, expected return (+ red "Overdue" badge if `is_overdue`), Request Transfer button.
- Tabs: **Allocation History** / **Maintenance History** / **Audit History** — all from `GET /assets/{id}/history`, rendered as timeline lists.

### 6.5 Allocations & Transfers (PDF screen 5) — ⭐ demo-critical

**Page tabs:** Active / Overdue / Returned / Transfer Requests. (Employees see "My assets" + "My transfer requests".)

**Allocate dialog** (from asset detail or list): asset (pre-filled or async-search select of available assets), target radio: Employee | Department → corresponding searchable select, expected return date (optional), notes → `POST /allocations`.

**THE conflict flow (rehearse this):** on 409 `ASSET_ALREADY_ALLOCATED`, do NOT show a generic toast. Swap the dialog body to a warning panel:
> ⚠️ **Currently held by {details.current_holder.name}** since {allocated_at}, expected return {expected_return_date}.
> Buttons: **[Request Transfer Instead]** (opens transfer dialog pre-filled with this asset + target) · [Cancel]

**Transfer dialog:** asset (locked), transfer to employee/department, reason → `POST /transfers`. 409 `DUPLICATE_RESOURCE` → "A transfer request for this asset is already pending."

**Transfer Requests tab** (admin/asset_manager/department_head): cards/rows — asset, from-holder → to-target, requester, reason, time. Approve → confirm → `POST /transfers/{id}/approve` → success toast "Reallocated to {name}" + invalidate assets/allocations. Reject → dialog with reason.

**Returns:** active-allocation rows have (for holder) "Request Return" → `POST /allocations/{id}/return-request` → badge "Return requested"; (for admin/asset_manager) "Check In" → dialog: condition select + notes → `POST /allocations/{id}/return` → toast "Asset back in pool."

**Overdue tab:** rows tinted `bg-red-50`, days-overdue badge — same data as dashboard list.

### 6.6 Resource Booking (PDF screen 6) — ⭐ demo-critical

Layout: **left panel** = resource picker (list from `GET /assets?is_bookable=true`, search, category icons room/vehicle/equipment); **right panel** = calendar for the selected resource.

**Calendar** (build it — don't fight a library): week view, columns Mon–Sun of `date-fns` `startOfWeek`, rows = hours 07:00–21:00. Fetch `GET /bookings?asset_id=…&from=<weekStart>&to=<weekEnd>&status=confirmed`, absolutely-position booking blocks by start/end (`top = (startHour - 7) * rowH`, `height = durationHrs * rowH`). Color by `display_status`: upcoming = blue, ongoing = green + "Now" pulse, completed = gray, own bookings = accent border. Prev/Next week buttons + "Today". Click empty slot → booking dialog pre-filled with that hour; click own upcoming block → popover with Cancel / Reschedule.

**Booking dialog:** resource (locked), date, start time, end time (15-min steps), purpose. Client pre-check: warn if the chosen range visually overlaps loaded bookings (nice UX) — but **the server is the referee**.
On 409 `BOOKING_OVERLAP` render inside the dialog:
> ❌ **Clashes with an existing booking** — {conflicting_booking.booked_by.full_name} has {start–end}.
> "Pick a slot starting at {conflicting_booking.end_time} or later."

(For the judges: book 9:30–10:30 against a 9:00–10:00 booking → rejected; 10:00–11:00 → succeeds.)

**My bookings list** under the calendar: `?mine=true`, rows with `display_status` badge, Cancel (confirm dialog) and Reschedule (PATCH, same overlap handling).

### 6.7 Maintenance (PDF screen 7)

- Table with status filter chips (`pending / approved / assigned / in_progress / resolved / rejected`) + priority filter. Columns: Asset (tag+name), Title, Priority badge (low gray, medium blue, high orange, critical red), Status badge, Raised by, Age (relative). Employees: `?mine=true` toggle default on.
- **Raise Request dialog** (from anywhere): asset async-select, title*, description, priority select, photo upload → `POST /maintenance`.
- Row click → **detail drawer** (`Sheet`): full info + photo + a **workflow stepper** (Pending → Approved → Assigned → In Progress → Resolved; Rejected shown as terminal branch). Action button area renders exactly one next action per status for admin/asset_manager: Approve/Reject (pending), Assign technician (approved — input for name), Start (assigned), Resolve (in_progress — notes + cost inputs).
- After Approve, toast: "Approved — {asset_tag} is now Under Maintenance". After Resolve: "Resolved — asset returned to {allocated|available}". (Copy mirrors the real side effects; invalidate `["assets"]` too.)

### 6.8 Asset Audit (PDF screen 8)

**List:** cycles as cards — name, scope (department/location or "Organization-wide"), date range, status badge (open/closed), progress bar (`verified+missing+damaged / total`), auditor avatars. Admin: "New Audit Cycle" button.

**Create dialog** (admin): name*, scope: department select (optional) + location text (optional), date range picker, auditors multi-select (searchable, from `/employees`) → `POST /audits`. Explain in helper text: "All assets in scope will be snapshotted for verification."

**Detail `/audits/:id`:** header with progress stats (4 mini-counters: Verified green / Missing red / Damaged orange / Pending gray). Records table: Asset tag, Name, Location, Result — for **assigned auditors while cycle is open**, result is an inline segmented control (Verified / Missing / Damaged) + notes popover, saving via `POST /audits/{id}/records` (optimistic update, rollback on error).
- **Discrepancy report** tab: `GET /audits/{id}/discrepancies` table + "Export CSV" (via reports export or client-side CSV of the rows).
- **Close Cycle** button (admin/asset_manager, open only) → AlertDialog: "This locks the cycle and marks {missing_count} missing assets as **Lost**." → `POST /audits/{id}/close` → summary toast. Closed cycles render read-only (this is the "audit history retained" story).
- 409 `AUDIT_CYCLE_CLOSED` on any record write → toast + refetch.

### 6.9 Reports & Analytics (PDF screen 9)

Tabs or stacked sections, each with an Export CSV button hitting `/reports/export?report=…`:
1. **Utilization** — horizontal bar chart (recharts) top 10 by `utilization_pct` + "Idle assets" table (0% in range). Date-range picker (default: last 90 days).
2. **Maintenance frequency** — bar chart, `group_by` toggle asset|category.
3. **Needs attention** — plain table from `/reports/attention` with reason chips.
4. **Department allocation** — table + pie chart of `allocated_count`.
5. **Booking heatmap** — 7×15 CSS grid (weekday × hour 07–21), cell opacity scaled by `count / max` (green scale), tooltip "{count} bookings". Optional resource filter select.

Department heads see the same page; the API already scopes their rows.

### 6.10 Notifications & Activity Logs (PDF screen 10)

- **Topbar bell** — badge from `["unread-count"]` (60s poll). Popover: latest 10, unread dot, "Mark all read", "View all".
- **`/notifications` page** — grouped by day, icon per `type` (map in `constants.js`: e.g. `asset_assigned` → Package, `booking_reminder` → Clock, `overdue_return` → AlertTriangle, `audit_discrepancy` → SearchX). Click → mark read + navigate by `entity_type`/`entity_id` (asset → `/assets/:id`, booking → `/bookings`, maintenance → `/maintenance`, transfer/allocation → `/allocations`, audit → `/audits/:id`).
- **`/activity` (admin)** — filterable table: time, actor, action (mono chip like `transfer.approved`), entity link, expandable `details` JSON. Filters: actor, entity type, date range.

---

## 7. Shared Components Inventory

| Component | Notes |
|---|---|
| `DataTable` | thin wrapper: columns config, loading skeleton rows, empty state slot, server pagination (`page`, `meta.total`, `onPageChange`) |
| `StatusBadge` | ONE component for all enums: `<StatusBadge kind="asset" value="under_maintenance"/>` — colors/labels from `constants.js` |
| `KpiCard` | icon, label, value, accent, `to` link, loading skeleton |
| `PageHeader` | title, description, actions slot |
| `ConfirmDialog` | AlertDialog wrapper: title, description, destructive flag, onConfirm (used for cancel/deactivate/close-cycle/reject) |
| `EmptyState` | icon + message + optional CTA |
| `SearchSelect` | Command+Popover async search (employees, assets, departments) — used in 6 dialogs, build it once, early |
| `FileUpload` | drag/click → POST `/uploads` → preview → returns url; 5MB + type validation client-side |
| `DateRangePicker` | Popover + Calendar (range mode) |
| `UserChip` | avatar + name inline |
| `RelativeTime` | `date-fns` `formatDistanceToNow`, tooltip = absolute |

---

## 8. Enums, Labels & Badge Colors

> Values MUST match the shared backend contract exactly. Put ALL of this in `src/lib/constants.js` — the only place enum strings appear.

```js
export const ROLES = { admin: "Admin", asset_manager: "Asset Manager",
  department_head: "Department Head", employee: "Employee" };

export const ASSET_STATUS = {
  available:        { label: "Available",         color: "green"  },
  allocated:        { label: "Allocated",         color: "blue"   },
  reserved:         { label: "Reserved",          color: "purple" },
  under_maintenance:{ label: "Under Maintenance", color: "orange" },
  lost:             { label: "Lost",              color: "red"    },
  retired:          { label: "Retired",           color: "gray"   },
  disposed:         { label: "Disposed",          color: "zinc"   },
};

export const CONDITION = ["new", "good", "fair", "poor", "damaged"];
export const ALLOCATION_STATUS = ["active", "returned"];            // + computed is_overdue
export const TRANSFER_STATUS = ["pending", "approved", "rejected"];
export const BOOKING_DISPLAY_STATUS = {
  upcoming: "blue", ongoing: "green", completed: "gray", cancelled: "red" };
export const MAINTENANCE_STATUS =
  ["pending", "approved", "rejected", "assigned", "in_progress", "resolved"];
export const MAINTENANCE_PRIORITY = {
  low: "gray", medium: "blue", high: "orange", critical: "red" };
export const AUDIT_RESULT = {
  pending: "gray", verified: "green", missing: "red", damaged: "orange" };

// Manual transitions the Change Status dialog may offer (mirror of backend matrix)
export const MANUAL_TRANSITIONS = {
  available: ["reserved", "lost", "retired", "disposed"],
  reserved:  ["available"],
  lost:      ["available"],
  retired:   ["disposed"],
};
```

Badge styling: Tailwind classes per color token (`bg-green-100 text-green-800` pattern); keep a `BADGE_CLASSES[color]` map next to these.

---

## 9. Error Handling UX

The normalized error from `client.js` is `{code, message, details, status}`. `message` is always user-safe → default behavior for any unhandled mutation error: `toast.error(err.message)`.

Special-cased codes (exact strings — shared contract):

| code | UX |
|---|---|
| `ASSET_ALREADY_ALLOCATED` | Allocate dialog swaps to "held by {details.current_holder.name}" panel + Request Transfer button (§6.5) |
| `BOOKING_OVERLAP` | Booking dialog inline conflict panel with `details.conflicting_booking` (§6.6) |
| `INVALID_STATUS_TRANSITION` | Toast + rebuild options from `details.allowed` |
| `ALREADY_PROCESSED` | Toast "Someone beat you to it" + invalidate the list |
| `AUDIT_CYCLE_CLOSED` | Toast + refetch cycle (turns read-only) |
| `VALIDATION_ERROR` | Map `details[]` (`{field, message}`) onto react-hook-form via `setError(field.split(".").pop(), …)` |
| `CANNOT_MODIFY_SELF`, `DUPLICATE_RESOURCE`, `EMAIL_ALREADY_REGISTERED` | Inline on the relevant field/dialog |
| `FORBIDDEN` | Toast "You don't have permission for that" (buttons should already be hidden by role gating) |
| `NETWORK_ERROR` (status 0) | Toast "Can't reach the server" |

401 handling is fully inside the interceptor (refresh → retry → logout); pages never handle it.

---

## 10. Dates, Times & Formatting

- API speaks **UTC ISO-8601**; display in browser-local time. `new Date(iso)` + `date-fns format` everywhere; helpers in `lib/format.js`: `fmtDate` (`12 Jul 2026`), `fmtDateTime` (`12 Jul 2026, 3:00 PM`), `fmtTime`, `fmtRelative`.
- Sending: booking dialog composes local date+time → `date.toISOString()`. Expected return dates are plain `YYYY-MM-DD` strings (no TZ math).
- Overdue display rule = backend rule: `expected_return_date < today` (compare date strings, not Date objects, to avoid TZ off-by-one).
- Currency: `Intl.NumberFormat("en-IN", {style: "currency", currency: "INR", maximumFractionDigits: 0})`.

---

## 11. Vercel Deployment

- Separate Vercel project `assetflow-web`, **Root Directory = `Frontend`**, framework preset Vite (build `npm run build`, output `dist`).
- SPA fallback — `Frontend/vercel.json`:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- Env var on Vercel: `VITE_API_BASE_URL=https://api.<your-same-site-domain>/api/v1`.
- Use same-site app/API domains where possible. FastAPI must allow credentials only from exact trusted origins and set the refresh cookie with `HttpOnly`, `Secure`, a narrow auth path, and the agreed SameSite/CSRF policy.

---

## 12. Build Milestones

Backend ships in phases B0–B9 (see backend plan §14) and deploys each phase to prod. Integrate against the deployed API, not localhost promises. Until an endpoint exists, build the UI with a small local fixture and swap the fetcher — keep fixtures in `src/api/__fixtures__/` so deleting them later is trivial.

| # | Phase | Contents | Needs backend | Est. |
|---|---|---|---|---|
| F0 | Plumbing | deps, shadcn adds, `client.js`, auth context, `constants.js`, AppShell + sidebar + guards, route skeletons | B1 (auth) | 3h |
| F1 | Auth screens | login/signup/forgot/reset, session persistence, role-aware sidebar | B1 | 2h |
| F2 | Organization | 3 tabs + dialogs + role promotion flow | B2 | 3h |
| F3 | Assets | list + filters + register dialog (incl. dynamic category fields, upload) + detail + history tabs | B3 | 3–4h |
| F4 | Allocations & transfers | allocate dialog + **409 conflict flow** + transfers + returns + overdue tab | B4 | 3–4h |
| F5 | Bookings | resource picker + week calendar + **overlap rejection UX** + my bookings | B5 | 3–4h |
| F6 | Maintenance | list + drawer + stepper actions | B6 | 2h |
| F7 | Audits | cycles list/create/detail + auditor marking + close flow | B7 | 3h |
| F8 | Dashboard + notifications | KPI cards, returns lists, quick actions, bell + pages | B8 | 2h |
| F9 | Reports + polish | charts, heatmap, CSV export, empty/loading states everywhere, responsive pass (sidebar → Sheet on mobile), demo rehearsal | B9 | 3h |

**Definition of done per phase:** happy path works against deployed API · error cases from §9 handled · loading skeletons + empty states present · actions hidden for roles that lack them · role coverage verified using staging-only accounts provisioned through a secret manager or one-time setup process. Never commit shared demo passwords.

**Sync rule:** if anything in §3/§8/§9 doesn't match what the API returns, that's a contract bug — fix the plans + code together, don't work around it silently.
