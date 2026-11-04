# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Margot Frontend** is the staff/operator dashboard for the Margot restaurant system. This directory is the Next.js app. See the parent `margot/CLAUDE.md` for the full monorepo overview (backend models, API endpoints, mobile app).

```
margot-frontend/
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # Shared components (Navbar, Sidebar, NotificationBell, ui/)
│   ├── context/       # AuthContext.tsx — single auth state provider
│   └── lib/           # api.ts, types.ts, permissions.ts, config.ts, seo-pages.ts
├── next.config.ts
└── package.json
```

## Development

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build      # Production build
npm run lint
```

**API base URL**: configured in `src/lib/config.ts`. On localhost/127.0.0.1, the axios client auto-hits `http://localhost:8005/api/v1` directly.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **UI**: Tailwind CSS 4, Lucide icons
- **HTTP**: Axios via `src/lib/api.ts` — `withCredentials: true`, cookie-based JWT auth
- **Utilities**: date-fns, Recharts, react-hot-toast

## Pages (App Router)

- `/` — Landing page  
- `/menu` — Public menu  
- `/login`, `/register`  
- `/[slug]` — SEO landing pages (generated from `src/lib/seo-pages.ts`, ISR revalidate 3600s)
- `/dashboard` — Root; guarded by `canAccessRoute()` per role:
  - `/dashboard/menu`, `/dashboard/mesas`, `/dashboard/cocina`, `/dashboard/barra`
  - `/dashboard/pedidos`, `/dashboard/pedidos/nuevo`, `/dashboard/pedidos/[id]`
  - `/dashboard/inventario`, `/dashboard/costeo`, `/dashboard/estadisticas`, `/dashboard/promociones`
  - `/dashboard/caja`, `/dashboard/caja/historial`, `/dashboard/caja/historial/[id]`
  - `/dashboard/limpieza`, `/dashboard/asistencia`

## Key Files in `src/lib/`

- **`api.ts`** — Axios instance. Three interceptors: (1) auto-appends trailing slash for Django's `APPEND_SLASH`; (2) injects `X-CSRFToken` from the `csrftoken` cookie on mutating requests; (3) silent 401 recovery — calls `/auth/jwt/refresh/` once and retries, queuing concurrent requests during refresh.
- **`types.ts`** — TypeScript interfaces for all API entities.
- **`permissions.ts`** — RBAC helpers: `ROLE_ROUTES` (allowed dashboard paths per role), `canAccessRoute()`, `canManage()`, `isInternal()`. `comercio` and `is_staff` always have full access — never check `tipo_usuario` inline.
- **`config.ts`** — `{ API_URL, PUBLIC_URL }` constants. Change `API_URL` here for local dev.
- **`seo-pages.ts`** — `SEO_PAGES` record defining metadata and content for each `/[slug]` landing page. Add entries here to create new SEO pages.

## Auth State (`src/context/AuthContext.tsx`)

`AuthProvider` exposes `{ user, loading, sidebarSections, login, logout }`.  
On mount, fetches `/auth/users/me/` and `/permisos-sidebar/mis_secciones/` in parallel.  
`sidebarSections` come from `PermisoMenuSidebar` DB records (admin-configurable per role), not hardcoded.

## `next.config.ts`

- Rewrites `/api/*` to the backend.
- Applies security headers (CSP, X-Frame-Options, X-Content-Type-Options) to all responses.

## Key Design Patterns

1. **RBAC**: Always use `canAccessRoute()` / `canManage()` from `src/lib/permissions.ts` — never check `user.tipo_usuario` inline.
2. **Axios interceptor order matters**: The trailing-slash interceptor runs before CSRF injection, which runs before auth retry. Don't reorder them.
3. **Sidebar sections are DB-driven**: Don't hardcode sidebar links — they come from `AuthContext.sidebarSections`. Seed with `python manage.py init_sidebar_permisos` on the backend.
4. **Cookies, not tokens**: Web clients use httpOnly cookies — never read or store `access`/`refresh` tokens from login response body.

## Localization

Language: `es-ec`, Timezone: `America/Guayaquil` (UTC-5, no DST)
