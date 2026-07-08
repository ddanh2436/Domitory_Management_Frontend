# AGENTS.md

Guidance for AI coding agents working in this repository.

This is the frontend half of the Dormitory Management System (Next.js App Router). It has its own git remote (`Domitory_Management_Frontend`), separate from the sibling `backend` repo and the docs umbrella repo one level up — commit/push here independently of changes made in `../backend`.

## Commands

```bash
npm run dev     # next dev
npm run build   # next build
npm run lint    # eslint
```

No test runner is configured.

## Architecture

- Route groups under `app/`: `(auth)` for login/forgot-password, `admin/*` for staff-facing pages, `student/*` for student-facing pages. Each area has its own layout (`admin/layout.tsx`, `student/layout.tsx`) wrapping children in `RoleGuard`.
- `app/components/RoleGuard.tsx` decodes the JWT from `localStorage` (via `app/utils/auth.ts`) client-side and redirects if the role doesn't match `allowedRoles`. This is **UX-only route gating, not a security boundary** — there's no server-side check on these pages, so any real authorization must be enforced by the NestJS backend.
- `app/utils/apiClient.ts` is the shared client for the real backend, auto-appending `/api` to `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api`) and attaching the bearer token. Prefer it over ad-hoc `fetch` calls — `admin/layout.tsx` currently hardcodes `http://localhost:3001/api/...` directly instead of using `apiClient`, which is an inconsistency rather than a pattern to copy.
- `app/context/SocketContext.tsx` and the inline socket setup in `student/layout.tsx` both connect to the backend's Socket.IO gateway for the `newNotification` event. Note the API base URL fallback differs between files (`apiClient.ts` defaults to port `3001`, `SocketContext.tsx` defaults to `3000`) — when `NEXT_PUBLIC_API_URL` is unset in `.env.local` these can point at different ports; always set `NEXT_PUBLIC_API_URL` explicitly to avoid that mismatch.
- `app/api/**` (e.g. `app/api/rooms`, `app/api/security`) are Next.js Route Handlers backed by **in-memory mock data** (`app/api/rooms/data.ts`), with their own lightweight JWT decoding (`_auth.ts`) and access logging (`_audit.ts`). This is a self-contained mock/demo layer — it is not wired to MongoDB or the real backend, so don't assume writes here persist anywhere real, and don't port its authorization logic back to the real backend or vice versa.

## Conventions

- UI copy, some service/error strings, and code comments are frequently in Vietnamese — intentional, matches the userbase, not something to "fix" to English.
