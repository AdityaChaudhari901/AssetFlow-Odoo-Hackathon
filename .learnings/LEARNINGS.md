# Project Learnings

## [LRN-20260712-001] correction

**Logged**: 2026-07-12T11:06:06+05:30
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary

AssetFlow's frontend uses React with React Router, not Next.js.

### Details

The earlier architecture discussion and `Context.md` still describe Odoo or Next.js assumptions. The user explicitly replaced those assumptions with a React frontend. `create-next-app` must not be used because it generates a Next.js application; `create-react-router` is the matching React scaffold.

### Suggested Action

Generate `Frontend/` with the official React Router CLI. Keep `Backend/` framework-neutral until the user selects the backend runtime, then update the stale architecture sections in `Context.md`.

### Metadata

- Source: user_feedback
- Related Files: `Frontend/package.json`, `Context.md`
- Tags: react, react-router, nextjs, architecture

### Resolution

- **Resolved**: 2026-07-12T11:12:22+05:30
- **Commit/PR**: Not committed
- **Notes**: The React Router scaffold was created and verified, then superseded by the user's next correction and removed.

---

## [LRN-20260712-002] correction

**Logged**: 2026-07-12T11:12:22+05:30
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary

AssetFlow uses plain React without React Router.

### Details

The user removed React Router from the frontend architecture after its initial scaffold. The frontend must use React, TypeScript, Vite, and Tailwind until the user selects any future routing approach.

### Suggested Action

Keep `Frontend/` free of `react-router` and `@react-router/*` dependencies. Place application code under `src/` and wait for explicit routing requirements.

### Metadata

- Source: user_feedback
- Related Files: `Frontend/package.json`, `Frontend/src/main.tsx`, `Context.md`
- Tags: react, vite, react-router, architecture

### Resolution

- **Resolved**: 2026-07-12T11:14:13+05:30
- **Commit/PR**: Not committed
- **Notes**: All React Router packages, configuration, route modules, generated server artifacts, and framework-specific Docker files were removed. The frontend now builds as a plain React and Vite application.

---

## [LRN-20260712-003] correction

**Logged**: 2026-07-12T11:15:26+05:30
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary

AssetFlow's frontend uses JavaScript and JSX, not TypeScript.

### Details

The user explicitly removed TypeScript from the frontend architecture. Source files and build configuration must remain JavaScript-based unless the user reverses this decision.

### Suggested Action

Use `.js` and `.jsx` files under `Frontend/src/`. Do not add TypeScript, `@types/*`, `tsconfig.json`, or `.ts` and `.tsx` application files.

### Metadata

- Source: user_feedback
- Related Files: `Frontend/package.json`, `Frontend/src/main.jsx`, `Context.md`
- Tags: react, javascript, jsx, typescript, vite

### Resolution

- **Resolved**: 2026-07-12T11:16:32+05:30
- **Commit/PR**: Not committed
- **Notes**: TypeScript source, configuration, scripts, and direct dependencies were removed. The frontend now builds from JavaScript and JSX only.

---
