# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Margot** is a comprehensive restaurant management system built with:
- **Backend**: Django 5.2 REST API with PostgreSQL
- **Frontend**: Next.js 16 with React 19 and TypeScript
- **Deployment**: Docker Compose orchestration (development & production)

The system manages complete restaurant operations: order management, kitchen preparation workflows, inventory, customer accounts, delivery logistics, and in-store table service.

## Repository Structure

```
margot/
├── margot-backend/      # Django REST API (port 8004)
│   ├── margot/          # Django project settings, URLs, middleware
│   ├── apps/
│   │   ├── core/        # All Django models + fixtures + management commands
│   │   └── api/         # ViewSets, serializers, auth views, custom auth class
│   ├── Dockerfile
│   ├── entrypoint.sh    # Container startup: migrations, collectstatic, seeds initial data
│   ├── docker-compose.yaml (dev)
│   └── docker-compose.prod.yaml
│
├── margot-frontend/     # Next.js staff/operator dashboard (port 3000)
│   └── src/
│       ├── app/         # Next.js App Router pages
│       ├── components/  # React components (Navbar, Sidebar, NotificationBell, ui/)
│       ├── context/     # AuthContext.tsx — single auth state provider
│       └── lib/         # api.ts (axios client), types.ts, permissions.ts
│
└── margot-app/          # React Native customer app (Expo) — own git repo
    ├── app/             # Expo Router screens (file-based routing)
    ├── components/      # Shared RN components
    └── lib/             # api.ts, store.ts (Zustand), types.ts, config.ts
```

## Tech Stack Details

### Backend
- **Framework**: Django 5.2 + Django REST Framework 3.15
- **Database**: PostgreSQL 17
- **Auth**: Custom `CookieJWTAuthentication` class (httpOnly cookies, falls back to Authorization header)
- **Key packages**: `django-currentuser` (audit fields), `djoser` (user registration/profile endpoints), `django-filter`, `simple-jwt` with token blacklist

### Frontend (margot-frontend)
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4, Lucide icons
- **HTTP**: Axios via `src/lib/api.ts`
- **Utilities**: date-fns, Recharts, react-hot-toast

### Mobile App (margot-app)
- **Framework**: Expo ~56.0.12 with React Native 0.85, Expo Router
- **State**: Zustand — `useAuthStore` (user session) + `useCartStore` (cart items, promos, mesa context, delivery address)
- **HTTP**: Axios via `lib/api.ts` — Bearer token auth; tokens stored in `expo-secure-store`
- **Notifications**: `expo-notifications` with Expo push token registration
- **Other**: `expo-camera` (QR scanning), `expo-secure-store`, `react-native-toast-message`
- **API base**: `https://api.margot.rest/api/v1` (configured in `lib/config.ts`)

## Core Models (Backend)

All models in `apps/core/models.py` inherit from `BaseModel`, which adds `is_active`, `is_enable`, `created_at`, `updated_at`, and `created_by`/`updated_by` via `django-currentuser`'s `CurrentUserField` (automatically set from the request user — no manual assignment needed).

**User hierarchy**:
- `Usuario` (extends `AbstractUser`) — `tipo_usuario`: `comercio | mesero | cocinero | barman | cajero | cliente | repartidor`
- `Cliente`, `Comercio`, `Repartidor` — one-to-one profiles extending `Usuario`

**Domain models**: Menu (State → Section → Category → MenuItem with variants, ingredients, dietary tags, schedules), Pedidos/PedidoDetalle/Pago, Delivery, Atención/Mesa/ComandaCocina, FichaPreparacion/PasoPreparacion, Inventario/RecetaItem, Promocion/PromocionItem, CierreCaja/GastoDiario/InversionSocio/Socio, Resena, CodigoDescuento, Extra/PedidoExtraSuelto (stand-alone extras on orders), TipoEmpaque/PedidoEmpaque, PermisoMenuSidebar (DB-driven sidebar access per role), Notificacion, Asistencia, ProtocoloLimpieza/PasoProtocolo, TiempoEntregaConfig.

**Mobile/loyalty models** (added in migrations 0047–0049):
- `Reserva` — table/event reservation (pendiente/confirmada/cancelada/completada); optional FK to Usuario
- `PushToken` — Expo push tokens per user; platform choices: ios/android
- `Mesa.qr_token` — QR code field on Mesa used by the mobile app to link a scan to a table
- `Usuario.puntos` — loyalty points balance (integer)
- `HistorialPuntos` — points ledger; `tipo` choices: compra, bono_bienvenida, referido_otorgado, referido_recibido, canje, vencimiento, ajuste; positive = earned, negative = spent
- `CodigoReferido` — one-to-one per user; `obtener_o_crear()` class method auto-generates the code
- `Referido` — records who referred whom; `puntos_otorgados` flips true once qualifying order exists
- `TipoMembresia` — VIP plan template (precio_mensual, precio_anual, descuento_porcentaje, puntos_multiplicador, beneficios JSONField)
- `MembresiaCliente` — active subscription FK'd to TipoMembresia + Usuario; plan: mensual/anual
- `TarjetaRegalo` — gift card with saldo_actual, fecha_vencimiento, beneficiario_email
- `MovimientoTarjeta` — uso/recarga ledger for TarjetaRegalo

**Key models not obvious from names**:
- `Section` — restaurant physical sections (cocina, barra, etc.) used to route `ComandaCocina` to the right station
- `RecetaItem` — ingredient quantities per `MenuItem`; used by signals to deduct inventory stock when orders enter `en_preparacion`
- `TiempoEntregaConfig` — per-category delivery time matrix (`tipo_entrega` × `momento` × `categoria`); drives `Pedido.calcular_tiempo_estimado()`
- `CodigoDescuento` — employee/partner discount codes, FK'd from `Pedido`
- `Socio` — business partner/investor model for `InversionSocio` cash accounting

**PedidoDetalle fields**:
- `salsas_seleccionadas` (JSONField) — list of sauce choices
- `extras_seleccionados` (JSONField) — list of `{extra_id, nombre, precio}` dicts

## Pedido State Machine

The `Pedido.estado` field drives the core order lifecycle. Transitions are enforced by dedicated custom actions (not PATCH):

```
pendiente → confirmado → en_preparacion → listo
                                            ↓ (dine-in)   ↓ (delivery)
                                          servido       en_camino → entregado
cancelado ← (any state)
```

Stock deduction happens when entering `en_preparacion` (via `descontar_stock_al_confirmar` signal). Notifications fire on every mapped transition (see Signals section).

**Atencion state machine** (`Atencion.estado` choices):
`sentado → tomando_orden → orden_enviada → en_servicio → cuenta_pedida → pagado → cerrada` (or `cancelada` from any)

Timestamps on `Atencion` (`hora_sentado`, `hora_orden_tomada`, etc.) are auto-set only once by signal — never overwrite manually.

## API Architecture

**Base URL**: `/api/v1/`

All endpoints are Django REST Framework `ViewSets` registered in `apps/api/urls.py`. The router auto-generates CRUD routes.

**Auth endpoints** (in `margot/urls.py`, not the router):
- `POST /api/v1/auth/jwt/create/` — Login; returns `{"detail": "Login exitoso", "access": "...", "refresh": "..."}` **and** sets httpOnly cookies. Web ignores body tokens; mobile stores them in SecureStore.
- `POST /api/v1/auth/jwt/refresh/` — Cookie takes priority (web); falls back to `{ "refresh": "..." }` body (mobile). Returns `{ "access": "..." }` in body and rotates cookies.
- `POST /api/v1/auth/jwt/logout/` — Blacklists refresh token cookie, clears cookies
- `GET /api/v1/auth/users/me/` — Djoser current user endpoint

**Public endpoints** (no auth required): `/api/v1/public/resenas/`, `/api/v1/public/menu/`, `/api/v1/public/info/`

**Serializer pattern**: complex models have separate serializers — `*ListSerializer` (minimal fields), `*DetailSerializer` (full nested read), `*WriteSerializer` (create/update). ViewSets switch serializer class based on action.

**Pagination**: `StandardPagination` — default page size 20, max 200, controlled via `?page_size=N`.

**Rate limiting**: auth endpoints 5/minute (custom `AuthRateThrottle`), anonymous 100/hour, authenticated 1000/hour.

### Key Custom ViewSet Actions

Beyond standard CRUD, these non-obvious actions exist:

**PedidoViewSet** (`/pedidos/`):
- `POST /{id}/confirmar/`, `/{id}/preparar/`, `/{id}/listo/`, `/{id}/en_camino/`, `/{id}/entregar/`, `/{id}/cancelar/` — state transitions
- `GET /cocina/` — orders filtered for kitchen display
- `GET /{id}/calcular_tiempo/` — estimated prep time using `TiempoEntregaConfig`
- `PUT /{id}/editar_detalles/`, `POST /{id}/agregar_items/` — order editing

**NotificacionViewSet** (`/notificaciones/`):
- `GET /no_leidas/` — unread count + list
- `POST /marcar_todas_leidas/`, `POST /{id}/marcar_leida/`

**CierreCajaViewSet** (`/cierres-caja/`):
- `POST /{id}/cerrar/`, `POST /{id}/ajuste_transferencia/`
- `GET /resumen_dia/?fecha=YYYY-MM-DD`, `GET /{id}/detalle_completo/`, `GET /historial/?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`

**InventarioItemViewSet** (`/inventario/`):
- `GET /bajo_stock/` — items below minimum stock threshold
- `GET /{id}/verificar_stock/?cantidad=N` — returns `porciones_posibles` and insufficient ingredients

**AsistenciaViewSet** (`/asistencia/`) — read-only standard CRUD plus:
- `POST /registrar_entrada/`, `POST /registrar_salida/` (geo-verified)
- `GET /mi_estado/`, `GET /mis_registros/`, `GET /resumen_mensual/`, `GET /resumen_equipo/`

**AtencionViewSet** (`/atenciones/`):
- `POST /{id}/cambiar_estado/` — state transitions (triggers `gestionar_estado_atencion` signal)

**ComandaCocinaViewSet** (`/comandas/`):
- `POST /{id}/iniciar_preparacion/`

**PermisoMenuSidebarViewSet** (`/permisos-sidebar/`):
- `GET /mis_secciones/` — sidebar sections for the current user's role

**PublicMenuViewSet** (`/public/menu/`):
- `GET /landing/` — landing page menu subset
- `GET /completo/` — full public menu

**PublicMesaViewSet** (`/public/mesas/`):
- `GET /?qr_token=<token>` — resolves QR code to mesa details (used by mobile QR scanner)

**ReservaViewSet** (`/reservas/`):
- Standard CRUD; clients POST (auth optional), staff GET/manage
- `PATCH /{id}/confirmar/`, `PATCH /{id}/cancelar/`
- Filter by `?fecha=YYYY-MM-DD&estado=pendiente`

**PushTokenViewSet** (`/push-tokens/`):
- `POST /registrar/` — upsert an Expo push token for the current user

**TipoMembresiaViewSet** (`/tipos-membresia/`):
- Read-only, public (`AllowAny`)

**MembresiaClienteViewSet** (`/membresia/`):
- `GET /mi_membresia/` — returns `{ membresia, puntos }` for current user
- `POST /suscribir/` — creates subscription; grants 100 bono_bienvenida points
- `POST /{id}/cancelar/`

**HistorialPuntosViewSet** (`/puntos/`):
- `GET /mi_historial/` — returns `{ puntos, historial[] }` for current user

**TarjetaRegaloViewSet** (`/tarjetas-regalo/`):
- Standard CRUD + `POST /{id}/usar/`

**CodigoReferidoViewSet** (`/referidos/`):
- `GET /mi_codigo/` — auto-creates and returns the user's referral code
- `POST /usar/` (`AllowAny`) — applies a referral code; grants 25 points to new user

## Frontend Architecture

### Pages (Next.js App Router)
- `/` — Landing page
- `/menu` — Public menu page
- `/login`, `/register`
- `/dashboard` — Root dashboard; sub-routes per role:
  - `/dashboard/menu`, `/dashboard/mesas`, `/dashboard/cocina`, `/dashboard/barra`
  - `/dashboard/pedidos` — order list; `/dashboard/pedidos/nuevo` — new order; `/dashboard/pedidos/[id]` — order detail
  - `/dashboard/inventario`, `/dashboard/costeo`, `/dashboard/estadisticas`, `/dashboard/promociones`
  - `/dashboard/caja` — daily cashier; `/dashboard/caja/historial` — history list; `/dashboard/caja/historial/[id]` — detail
  - `/dashboard/limpieza`, `/dashboard/asistencia`

### Key Files in `src/lib/`
- **`api.ts`**: Axios instance with `withCredentials: true`. Interceptors: (1) auto-appends trailing slash (Django `APPEND_SLASH`), (2) injects `X-CSRFToken` from the `csrftoken` cookie on mutating requests, (3) silent 401 recovery — calls `/auth/jwt/refresh/` once and retries the original request; queues concurrent requests during refresh.
- **`types.ts`**: TypeScript interfaces for all API entities (`User`, `MenuItem`, `Pedido`, etc.)
- **`permissions.ts`**: RBAC helpers — `ROLE_ROUTES` (allowed dashboard paths per role), `canAccessRoute()`, `canManage()`, `isInternal()`. `comercio` and `is_staff` users always have full access.

### Auth State (`src/context/AuthContext.tsx`)
`AuthProvider` exposes `{ user, loading, sidebarSections, login, logout }`. On mount it fetches `/auth/users/me/` and `/permisos-sidebar/mis_secciones/` in parallel. `sidebarSections` are loaded from `PermisoMenuSidebar` DB records (admin-configurable per role), not hardcoded.

## Mobile App Architecture (margot-app)

`margot-app` is a **customer-facing** Expo app (separate git repo inside `margot-app/`). It has no overlap with the staff dashboard (`margot-frontend`).

### Screens (Expo Router file-based)
- `(auth)/welcome`, `(auth)/login`, `(auth)/register`
- `(tabs)/index` — home, `(tabs)/menu` — browse menu, `(tabs)/pedidos` — order history, `(tabs)/perfil` — profile
- `producto/[id]` — menu item detail (add to cart)
- `carrito` — cart modal
- `checkout` — place order
- `pedido/[id]` — order tracking
- `escanear` — QR scanner → resolves `Mesa.qr_token` via `/public/mesas/?qr_token=`
- `puntos` — loyalty points & history
- `membresia` — VIP membership plans
- `reservar` — make a reservation
- `notificaciones` — push notification history

### State Management
- **`useAuthStore`** — `user`, `loading`, `setUser`, `logout` (deletes SecureStore tokens)
- **`useCartStore`** — `items` (CartItem[]), `promos` (CartPromoItem[]), `mesa` context, `direccionEntrega`; `total()` and `itemCount()` are derived selectors

### Auth Flow (mobile)
On app mount, `_layout.tsx` reads `access_token` from SecureStore; if present calls `/auth/users/me/`, otherwise redirects to `/(auth)/welcome`. On login, tokens are read from the response body and saved to SecureStore. On 401, the interceptor reads `refresh_token` from SecureStore, posts it to `/auth/jwt/refresh/` as `{ refresh }`, saves the new `access` token, and retries.

### Push Notifications
`lib/notifications.ts` registers the device and calls `POST /push-tokens/registrar/` to store the Expo push token on the backend. The root layout wires notification tap handlers to navigate to `pedido/[id]` when `data.pedido_id` is present.

## Development Setup

### Backend

```bash
cd margot-backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
cp .env.example .env        # Set POSTGRES_HOST=localhost for local dev
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8004
```

### Frontend

```bash
cd margot-frontend
npm ci
npm run dev                 # http://localhost:3000
```

### Mobile App

```bash
cd margot-app
npm install
npx expo start           # Metro bundler; scan QR with Expo Go
npx expo start --android # Android emulator
npx expo start --ios     # iOS simulator (macOS only)
```

API base URL is hardcoded in `lib/config.ts` (`https://api.margot.rest/api/v1`). Change it there for local dev.

### Docker Development

```bash
cd margot-backend
docker compose up -d
# Services: margot-web (nginx on 8005), margot-app (Django on 8000), margot-db (PostgreSQL)
# entrypoint.sh runs migrations then seeds: init_margot, import_menu, import_promociones, check_caducidades
# Note: entrypoint.sh calls `import_menu` (not `import_menu_margot`) — both commands exist separately
```

## Common Commands

### Backend

| Task | Command |
|------|---------|
| Run migrations | `python manage.py migrate` |
| Create migration | `python manage.py makemigrations` |
| Run tests | `python manage.py test` |
| Run single test | `python manage.py test apps.api.tests.MyTestCase` |
| Django shell | `python manage.py shell` |
| Collect static files | `python manage.py collectstatic --noinput` |
| Initialize sidebar perms | `python manage.py init_sidebar_permisos` |
| Initialize mesas + sections | `python manage.py init_margot` |
| Import menu data (Docker) | `python manage.py import_menu` |
| Import menu data (full) | `python manage.py import_menu_margot` |
| Import inventory data | `python manage.py import_inventario` |
| Import cleaning protocols | `python manage.py import_limpieza` |
| Import promotions | `python manage.py import_promociones` |
| Import preparation sheets | `python manage.py import_preparaciones` |
| Import recipes | `python manage.py import_recetas` |
| Import delivery times | `python manage.py import_tiempos` |
| Initialize menu sections | `python manage.py init_sections` |
| Assign menu sections | `python manage.py assign_sections` |
| Check ingredient expiries | `python manage.py check_caducidades` |
| Fix cocktail promotions data | `python manage.py fix_promo_cocteles` |

### Frontend (margot-frontend)

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Lint | `npm run lint` |

### Mobile App (margot-app)

| Task | Command |
|------|---------|
| Start Metro bundler | `npx expo start` |
| Android emulator | `npx expo start --android` |
| iOS simulator | `npx expo start --ios` |
| EAS build (prod) | `eas build --platform android` |

> **Note**: `apps/api/tests.py` and `apps/core/tests.py` exist but are empty stubs — there is currently no test suite.

## Configuration & Environment

### Backend (.env.example)
- `DJANGO_SECRET_KEY`, `DJANGO_DEBUG` (0/1), `DJANGO_ALLOWED_HOSTS` (comma-separated)
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`
- `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` (comma-separated)
- `COOKIE_DOMAIN` — cookie domain for cross-subdomain auth (leave unset for localhost)
- `SECURE_SSL_REDIRECT` (0/1)

### Frontend
- `NEXT_PUBLIC_API_URL` — backend API base URL (set via Docker build arg). On localhost/127.0.0.1 the axios client bypasses this and hits `http://localhost:8005/api/v1` directly.
- `next.config.ts` rewrites `/api/*` to the backend and sets security headers (CSP, X-Frame-Options, X-Content-Type-Options) on all responses.

## Deployment

### Production Deployment Script

```bash
cd margot-backend
bash deploy.sh              # Backend only
bash deploy.sh --frontend   # Frontend only
bash deploy.sh --all        # Both
```

Pulls `main`, rebuilds Docker images, restarts containers, runs migrations, collects static files, then health-checks `/api/v1/` and `/`.

**Requirements**: `proxy_network` Docker network, server dirs at `/var/www/apps/margot-backend` & `/var/www/apps/margot-frontend`.

### Production Settings
- `docker-compose.prod.yaml` reads from `.env.production`
- Backend: Gunicorn (3 workers, 120s timeout)
- Frontend: standalone Next.js server
- JWT: access token 30 min, refresh token 1 day, rotation + blacklist enabled

## Key Design Patterns

1. **Dual-client JWT**: Login returns `{"detail": "Login exitoso", "access": "...", "refresh": "..."}` **and** sets httpOnly cookies. Web clients use the cookies (ignore body tokens); mobile clients store tokens from the body in `expo-secure-store` and send them via `Authorization: Bearer`. `CookieJWTAuthentication` (`apps/api/authentication.py`) reads the `access_token` cookie first, falls back to `Authorization` header — this transparently serves both clients. Refresh endpoint likewise reads cookie first, falls back to `{ "refresh": "..." }` in body. `refresh_token` cookie is scoped to `path="/api/v1/auth/"`. `csrftoken` is deliberately **not** httpOnly so JS can read it; mobile never sends CSRF.
2. **Audit trail via django-currentuser**: `BaseModel.created_by`/`updated_by` use `CurrentUserField`, which automatically captures the logged-in user from the current request thread — never set manually.
3. **ViewSet serializer switching**: views switch serializer class by action (`list` → List, `retrieve` → Detail, create/update → Write).
4. **DB-driven sidebar permissions**: `PermisoMenuSidebar` records control which sections each role sees. Frontend reads `/permisos-sidebar/mis_secciones/` at login. Seed with `init_sidebar_permisos` management command.
5. **TrailingSlashMiddleware**: Custom middleware (`margot.middleware`) handles trailing slashes before CSRF middleware runs — prevents 301 redirects that would strip auth headers.
6. **Frontend RBAC**: `src/lib/permissions.ts` defines `ROLE_ROUTES` and helpers. Always use `canAccessRoute()` / `canManage()` rather than checking `tipo_usuario` inline.
7. **Backend permission classes** (`apps/api/views.py`): Custom DRF permission classes extend `HasTipoUsuario` (which always passes `is_staff`/`is_superuser`). Pick the right one when writing new ViewSets:
   - `IsComercioOrStaff` — admin-only write/manage
   - `CanManagePedidos` — comercio + mesero + cajero + cocinero + barman
   - `CanManageMesas` — comercio + mesero + cajero
   - `CanManageCocina` — comercio + cocinero + barman
   - `CanManageCaja` — comercio + cajero
   - `IsInternalReadOrComercioWrite` — internal staff can read, only comercio/staff can write (used for Menu, Categories)
   - `IsInternalStaff` — any internal role (comercio/mesero/cocinero/cajero)

## Django Signals (`apps/core/signals.py`)

Two critical `pre_save` signals encode core business rules:

**`descontar_stock_al_confirmar` (Pedido)**:
- When a `Pedido` transitions to `estado = 'en_preparacion'`, automatically deducts inventory stock for all `PedidoDetalle` items and `PedidoPromocion` items using their `RecetaItem` recipes. Uses `transaction.atomic()`. Logs warnings if stock is insufficient but does not block the transition.
- Also fires `Notificacion` records via `transaction.on_commit` for any state change that maps to `_NOTIF_MAP` (e.g., `confirmado` → notifies `cocinero`; `listo` → notifies `mesero` + `cajero`).

**`gestionar_estado_atencion` (Atencion)**:
- Auto-sets timestamps (`hora_sentado`, `hora_orden_tomada`, etc.) on state transitions, but only if not already set — never set these fields manually.
- Updates `Mesa.estado` automatically: `sentado` → `'ocupada'`, `cerrada` → `'en_limpieza'`, `cancelada` → `'disponible'`.
- Creates a `HistorialAtencion` record for every state change.

## Localization

- **Language**: Spanish (`es-ec`), **Timezone**: `America/Guayaquil` (UTC-5, no DST)
