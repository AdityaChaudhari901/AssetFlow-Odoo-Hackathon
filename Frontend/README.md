# AssetFlow Frontend

Production-oriented React frontend built with JavaScript, JSX, Vite, Tailwind CSS v4, React Router, TanStack Query, and shadcn/ui.

## Local configuration

Copy the committed example before starting the frontend:

```bash
cp .env.example .env
```

`VITE_API_BASE_URL` must point to the FastAPI `/api/v1` base URL. Do not place Supabase keys, refresh tokens, or any other secret in a `VITE_` variable.

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
- `src/components/ui/`: generated shadcn primitives; compose them instead of applying feature-specific edits.
- `src/components/layout/`: responsive application shell and role-aware navigation.
- `src/components/guards/`: authentication and authorization UX boundaries.
- `src/features/auth/`: reusable auth forms, validation, error mapping, safe redirects, and one-time recovery-token handling.
- `src/pages/`: lazy-loaded route components.

React Router uses declarative browser routing with explicit 403 and 404 experiences. TanStack Query owns server state; the query cache is cleared when identities change.

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
