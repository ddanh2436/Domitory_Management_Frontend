# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- Route protection has two layers: `proxy.ts` at the repo root (Next 16's replacement for `middleware.ts`) reads the JWT from the `token` **cookie** server-side, redirects unauthenticated users to `/login`, and keeps roles in their own area (`/admin` vs `/student`). `app/components/RoleGuard.tsx` remains as a client-side UX fallback reading `localStorage`. The proxy decodes but does not verify the JWT signature (the secret lives in the NestJS backend), so real authorization is still enforced by the backend on every API call.
- Login must persist the token via `persistToken()` in `app/utils/auth.ts` (writes both `localStorage` for `apiClient`/sockets and the cookie for `proxy.ts`); logout/expiry must go through `clearToken()`. If only `localStorage` is set, the proxy will bounce the user to `/login`.
- `app/utils/apiClient.ts` is the shared client for the real backend, auto-appending `/api` to `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api`) and attaching the bearer token. All pages use it — do not reintroduce ad-hoc `fetch("http://localhost:3001/...")` calls.
- Socket.IO clients (`NotificationBell`, `student/layout.tsx`, `app/context/SocketContext.tsx`) all default to port `3001` and strip a trailing `/api` from `NEXT_PUBLIC_API_URL` before connecting.

## Conventions

- UI copy, some service/error strings, and code comments are frequently in Vietnamese — intentional, matches the userbase, not something to "fix" to English.
