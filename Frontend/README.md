# AssetFlow Frontend

Production-oriented React frontend built with JavaScript, JSX, Vite, Tailwind CSS v4, React Router, TanStack Query, and shadcn/ui.

## Local configuration

Copy the committed example before starting the frontend:

```bash
cp .env.example .env
```

`VITE_API_BASE_URL` must point to the FastAPI `/api/v1` base URL. Do not place Supabase keys, refresh tokens, or any other secret in a `VITE_` variable.

Product APIs can be exercised against explicit in-browser fixtures while the
FastAPI product endpoints are being implemented:

```bash
VITE_USE_FIXTURES=true
```

Fixture mode is available only in Vite development mode and is disabled by
default. It never bypasses authentication, never activates in production, and
never silently replaces a failed API request. Keep it `false` when validating
the real backend contract. Fixture ownership and actor attribution follow the
authenticated profile; authentication itself always remains a real FastAPI
boundary.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

Add another shadcn/ui component with:

```bash
npx shadcn@latest add <component>
```

## Frontend boundaries

- `src/api/`: the only HTTP boundary. Product components do not call Axios directly.
- `src/context/`: application-wide session state.
- `src/hooks/`: stable hooks consumed by features and pages.
- `src/features/`: domain-owned forms, tables, calendars, workflow boards, charts, and validation schemas.
- `src/components/ui/`: generated shadcn primitives; compose them instead of applying feature-specific edits.
- `src/components/shared/`: reusable product-level tables, status badges, date controls, empty/error states, and confirmation flows.
- `src/components/layout/`: responsive application shell and role-aware navigation.
- `src/components/guards/`: authentication and authorization UX boundaries.
- `src/features/auth/`: reusable auth forms, validation, error mapping, safe redirects, and one-time recovery-token handling.
- `src/pages/`: lazy-loaded route components.

React Router uses declarative browser routing with explicit 403 and 404 experiences. TanStack Query owns server state; the query cache is cleared when identities change.

## Product modules

The authenticated workspace implements the complete frontend scope from F2 to
F9:

- Organization administration for departments, categories, category-specific fields, employees, roles, and account status.
- Asset registry and asset passports with lifecycle transitions and allocation, maintenance, and audit history.
- Allocation, return, and transfer workflows with double-allocation conflict handling.
- Responsive resource booking calendar and personal booking management.
- Maintenance approval board from request through technician assignment and resolution.
- Audit-cycle creation, verification progress, discrepancy review, and immutable closure.
- Operational dashboard, overdue/upcoming return queues, notifications, and the administrator activity ledger.
- Utilization, maintenance, attention, department allocation, and booking heatmap reports with authenticated export requests.

All server state enters through `src/api/` and TanStack Query hooks. Every
mutation invalidates the affected operational views so counters, status badges,
history, and reports converge on the backend response. Backend phases B2-B9
must implement the endpoint and error-envelope contract documented in
`FRONTEND_IMPLEMENTATION_PLAN.md` before production integration is complete.
The backend contract includes an authenticated minimal
`GET /employees/picker` endpoint so Employee users can select transfer targets
without gaining access to the administrative employee directory.

## SPA deployment

`vercel.json` rewrites every application route to `index.html`, so refreshing a
React Router deep link does not return a platform 404. Configure the Vercel
project root as `Frontend`, publish `dist`, and set `VITE_API_BASE_URL` to the
same-site production FastAPI `/api/v1` origin. The rewrite also applies baseline
content-type, referrer, framing, and browser-permission headers.

## Authentication contract

The browser communicates only with FastAPI. It does not initialize a Supabase client.

- FastAPI returns a short-lived access token, which remains in JavaScript memory.
- FastAPI stores and rotates the refresh token in an `HttpOnly`, `Secure`, `SameSite` cookie.
- Refresh responses identify the authenticated `user_id`, and `/auth/me` returns capability strings for assignment-scoped access such as `audits.view`.
- Axios sends cookie credentials to login, refresh, and logout endpoints.
- A protected request receives at most one refresh-and-retry attempt.
- Logout and session expiry clear the complete query cache to prevent cross-user data exposure.

### Authentication screens

- `/login` validates email and password, reports stable FastAPI error codes inline, and returns the user to the originally requested internal route.
- `/signup` collects only full name, email, password, and password confirmation. The API payload never contains a role; every new account starts as `employee`.
- `/forgot-password` always presents the same confirmation after a successful request so the screen cannot reveal whether an account exists.
- `/reset-password` accepts a one-time `recovery_token` only in the URL fragment (`#recovery_token=...`) so the credential is not sent in the document request. The token is read into component memory and removed immediately with `history.replaceState` before the password form is shown; query-string copies are stripped and rejected.

All four screens use React Hook Form and Zod. Login and signup continue through the shared serialized session operation; the access token remains in memory and the refresh token remains in the backend-managed HttpOnly cookie. Password reset clears the current in-memory identity and performs idempotent locked logout cleanup after a successful API response.

Real sign-in and recovery depend on Backend Phase B1 implementing the documented FastAPI endpoints and error envelope. The reset endpoint must revoke active refresh sessions and clear its HttpOnly cookie before returning success; frontend JavaScript cannot clear that cookie itself. There is intentionally no frontend mock-authentication bypass.

The backend must allow credentialed requests from the exact frontend origin. Production should use same-site app and API domains so browser cookie policy is predictable.

shadcn/ui uses the Nova/Radix preset, semantic Tailwind CSS variables, and JavaScript output through `"tsx": false` in `components.json`. No TypeScript, Next.js, Redux, Zustand, or browser Supabase dependency is used.
