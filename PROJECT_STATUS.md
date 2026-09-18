# PROJECT_STATUS.md â€” Control de avance

Sistema Integral Web para Empresas de Seguridad Privada â€” Grupo Servicom

Ãšltima actualizaciÃ³n: 2026-09-18 (Fase A — cartera demo de presentaciÃ³n + playbook. E2E 40/40 local y contra producciÃ³n.)

---

## Estado general

| Bloque | DescripciÃ³n | Estado |
|--------|-------------|--------|
| BLOQUE 1 | Infraestructura y arquitectura | TERMINADO (backend) |
| BLOQUE 2 | Base de datos y multiempresa | TERMINADO (backend) |
| BLOQUE 3 | AutenticaciÃ³n, usuarios y permisos | TERMINADO (backend) |
| BLOQUE 4 | Clientes, contratos y servicios | TERMINADO (revisado 2026-09-18) |
| BLOQUE 5 | Instalaciones, puestos y consignas | TERMINADO (revisado 2026-09-18) |
| BLOQUE 6 | Guardias y expedientes | TERMINADO (backend) |
| BLOQUE 7 | Turnos y programaciÃ³n | TERMINADO (backend) |
| BLOQUE 8 | Asistencia, GPS y geocercas | TERMINADO (backend) |
| BLOQUE 9 | Rondines | TERMINADO (backend) |
| BLOQUE 10 | BitÃ¡cora | TERMINADO (backend) |
| BLOQUE 11 | Incidencias | TERMINADO (backend) |
| BLOQUE 12 | SOS | TERMINADO (backend) |
| BLOQUE 13 | SupervisiÃ³n | TERMINADO (backend) |
| BLOQUE 14 | Video en tiempo real | TERMINADO (backend) |
| BLOQUE 15 | Visitantes, vehÃ­culos y equipo | TERMINADO (backend) |
| BLOQUE 16 | Pre-nÃ³mina | TERMINADO (backend) |
| BLOQUE 17 | FacturaciÃ³n y cobranza | TERMINADO (backend) |
| BLOQUE 18 | Portal del cliente | TERMINADO (backend) |
| BLOQUE 19 | Reportes | TERMINADO (backend) |
| BLOQUE 20 | AuditorÃ­a y seguridad avanzada | TERMINADO (backend) |
| BLOQUE 21 | OptimizaciÃ³n | TERMINADO (UX comercial completa) |
| BLOQUE 22 | Pruebas integrales | TERMINADO (E2E automatizadas 40/40) |
| BLOQUE 23 | PreparaciÃ³n para producciÃ³n | TERMINADO (builds prod, .env, health, scripts, deploy verificado) |
| BLOQUE 24 | DocumentaciÃ³n y entrega | TERMINADO (README, DEPLOYMENT actualizado, estado del proyecto) |

NOTA: "TERMINADO (backend)" = API REST implementada, compilada y verificada (login, /auth/me, Swagger, dashboard, clients, guards, sites, shifts, incidents, patrols, posts, consigns, training, vehicles, inventory, notifications, audit â€” todos 200). El aislamiento multiempresa quedÃ³ probado (Empresa B no ve datos de A). Frontend web (Next.js) creado y enlazado a las APIs reales (login, auth guard, dashboard, ~25 pÃ¡ginas de mÃ³dulos con tablas + formularios reales de creaciÃ³n). PWA mÃ³vil (guardia/supervisor) y portal del cliente terminados (Bloque 21). Pruebas de integraciÃ³n E2E automatizadas 17/17 (Bloque 22). Los bloques 3-20 comparten toda la infraestructura (auth, permisos, validaciÃ³n, auditorÃ­a), por lo que su avance se refleja aquÃ­ en conjunto.

NOTA: La columna "backend" indica que la API REST estÃ¡ implementada y funcional. El frontend web (Next.js) ya estÃ¡ creado y conectado a las APIs reales. Los 24 bloques del Documento Maestro estÃ¡n completados; solo queda el material de demo/presentaciÃ³n y el mediaserver de streaming en vivo.

## Avance detallado

### TERMINADO
- Monorepo npm workspaces: `apps/api`, `apps/web`, `packages/shared`.
- `packages/shared`: permisos (~93), roles, constantes, schemas Zod, build + types.
- Backend NestJS completo con 30 mÃ³dulos: auth, users, roles, companies, clients, contracts, sites, posts, consigns, guards, training, shifts, attendance, gps, patrols, logbook, incidents, sos, supervision, video, visitors, vehicles, inventory, prepayroll, billing, client-requests, notifications, reports, audit, dashboard.
- Schema Prisma v5.22 completo: 50 modelos, multiempresa (companyId), soft delete, auditorÃ­a, video con expiraciÃ³n 48h.
- MigraciÃ³n `20260916164653_init` aplicada a PostgreSQL local (`seguridad_db`).
- Seed de desarrollo ejecutado correctamente (Empresas A/B, 10 roles, 93 permisos, 4 usuarios demo, cliente, contrato, sitio, puestos, guardia, consigna, ruta de rondÃ­n, turno, tipos de incidencia, config).
- GeneraciÃ³n de Prisma Client: OK (schema validado, 0 errores).
- CompilaciÃ³n TypeScript: OK (`tsc --noEmit`, 0 errores) tras corregir ~60 errores de tipos y relaciones.
- API verificada en `http://localhost:3001/api`: login 201, `/auth/me` 200, `/docs` (Swagger) 200.
- Endpoints verificados 200: dashboard, guards, sites, shifts, incidents, clients, patrols/routes, posts, consigns, training, vehicles, inventory, notifications, audit.
- Aislamiento multiempresa VERIFICADO: Empresa A ve su cliente "ABC Corp"; Empresa B (admin@prototal.com) NO ve datos de A.
- Correcciones de schema Prisma: relaciones reversas faltantes (31 errores P1012) resueltas; `Guard.userId @unique` (1:1); `ClientUser.userId @unique` (1:1); nombres de relaciÃ³n (`Supervisor`, `SosHandler`, `SupervisionSupervisor`, `InvoiceClient`, `ClientRequestRequester/Assignee`).
- Correcciones de cÃ³digo: includes invÃ¡lidos (`vehicleResponsible`â†’`vehicles`, `responsible`â†’`responsibleGuard`, `shift` sos eliminado, `checkpoint`/`contract`/`client` con include correcto); `parseInt` con `string | undefined`; arrays `never[]` tipados; Prisma `select`+`include` conflictivo en users; import faltante `Body` en reports.controller; import de seed corregido a `@servicom/shared`.
- Frontend `apps/web` creado: Next.js 14 (App Router) + Tailwind CSS 3.4, TypeScript estricto.
- Frontend: cliente de API (`src/lib/api.ts`) con token JWT, login real (`POST /api/auth/login`), contexto de autenticaciÃ³n, guard de rutas `RequireAuth`, topbar con usuario/rol y cierre de sesiÃ³n, sidebar con navegaciÃ³n por secciones (General, Comercial, OperaciÃ³n, Finanzas, SupervisiÃ³n, AdministraciÃ³n).
- Frontend: 28 rutas compiladas y servidas en `http://localhost:3000`: login, dashboard (kpis + turnos activos del API real), clients, contracts, sites, posts, guards, shifts, consigns, incidents, patrols, attendance, gps, visitors, vehicles, inventory, prepayroll, billing, supervision, video (streams + grabaciones), sos, logbook, notifications, audit, users, reports, client-requests, pending-approvals.
- Frontend: componentes reutilizables `DataTable` (listado + paginaciÃ³n real cuando el endpoint la soporta, badges de estatus) y `EntityModal` (formulario de creaciÃ³n real POST): clientes, contratos, sitios, puestos, guardias, turnos, consignas, visitantes, vehÃ­culos, inventario, usuarios.
- Build de producciÃ³n frontend OK (`next build`): 28 rutas estÃ¡ticas generadas sin errores de tipos.
- CORS verificado del navegador (localhost:3000) hacia la API (localhost:3001): preflight 204, mÃ©todos GET/HEAD/PUT/PATCH/POST/DELETE.
- Flujo end-to-end frontendâ†’API verificado con token real: `/auth/me` (usuario), `/dashboard` (kpis), `/clients`, `/guards`, `/sites`, `/shifts` â€” todos responden datos de la Empresa A.
- PWA mÃ³vil (guardia) creada bajo rutas `/m*`: layout mÃ³vil con bottom-nav (Inicio, Consignas, Mi ubicaciÃ³n, SOS), viewport de dispositivo, manifest.json, service worker (`/sw.js` con cachÃ© de app shell), iconos generados (192/512).
- PWA mÃ³vil â€” acciones reales del guardia conectadas al API: `POST /attendance` (entrada/salida con geolocalizaciÃ³n + validaciÃ³n de geocerca), `POST /gps/ping` (reportar ubicaciÃ³n), `POST /sos` (alerta SOS), `GET /consigns/mine` (mis consignas), `GET /attendance/my-today` (mi turno y asistencias).
- Como parte de la PWA se habilitÃ³ soporte offline: cola de sincronizaciÃ³n en `src/lib/offline.ts` (localStorage + reintentos + sincronizaciÃ³n automÃ¡tica al reconectar por evento `online`/`offline`).
- CorrecciÃ³n backend: `consigns/getMyConsigns` ahora toma turnos con status `activo` o `programado` (antes el guardia no veÃ­a consignas si su turno estaba "programado"). Verificado: `/consigns/mine` del guardia demo devuelve su consigna.
- Rutas mÃ³viles verificadas 200 en dev: `/m`, `/m/consignas`, `/m/gps`, `/m/sos`.
- PWA guardia probada de punta a punta contra la API real: entrada registrada (`POST /attendance`) con geocerca evaluada (`geofenceResult: dentro`), turno del dÃ­a y consignas cargadas desde `guard-hub` y `/consigns/mine`.
- PWA supervisor creada: layout mÃ³vil propio (`/ms`), tarjetas de guardias con Ãºltima ubicaciÃ³n (`/guards/map`), posiciones reales (`/gps/positions`), alertas SOS (`/sos` con atender/cerrar), registro de visita de supervisiÃ³n (`POST /supervision` con checklist y geoposiciÃ³n). Rutas `/ms`, `/ms/guardias`, `/ms/posiciones`, `/ms/sos` verificadas 200.
- Flujo SOS validado de punta a punta: guardia activa (status=activa) â†’ supervisor atiende (ack â†’ atendida) â†’ cierra (â†’ cerrada).
- PWA mÃ³vil del guardia ampliada con RondÃ­n, BitÃ¡cora e Incidencias: pÃ¡ginas `/m/rondin`, `/m/bitacora`, `/m/incidentes` verificadas 200. Backend ampliado con endpoints scoped al guardia: `GET /patrols/routes/mine` (rutas del sitio del turno actual + `lastCheckIn` por checkpoint), `GET /logbook/mine`, `GET /incidents/mine`.
- CorrecciÃ³n backend: `incidents.service.create` lanzaba 500 cuando el guardia creaba incidencia sin `typeId` (`findUnique({ where: { id: undefined } })` â†’ `PrismaClientValidationError`). Corregido haciendo la consulta condicional. Verificado: guardia crea incidencia (type=otra, status=abierta) y check-in de rondÃ­n (result=ok, reflejado en `routes/mine`).
- Portal del cliente terminado (backend + frontend): rol CLIENT con permisos `client.portal.access`/`client.request.create`/`client.request.view`, usuario demo `cliente@abccorp.com / Cliente123!` vinculado a ABC Corp (seed + script `add-client-user`), endpoint `GET /clients/mine` (contratos, instalaciones, contactos, `_count`), pÃ¡ginas `/portal`, `/portal/solicitudes`, `/portal/sitios` (verificadas 200). Flujo validado: cliente crea solicitud â†’ admin responde (`en_proceso`) â†’ cliente ve respuesta y asignado. `RequireAuth` ahora soporta restricciÃ³n por rol.

### OPTIMIZACIÃ“N UX COMERCIAL (Bloque 21, 2026-09-16/17) â€” REDISEÃ‘O COMPLETO DEL FRONTEND
- **Base visual (`tailwind.config.ts` + `globals.css`):** paleta `primary` azul acero (600 `#3558c9`, escala 50-900), sombras `card/pop/lift/drawer`, animaciones `fadeIn/slideIn/toastIn/shimmer/pulseSoft`; clases utilitarias `.btn` (primary/secondary/outline/danger/ghost/sm/lg/icon), `.input`, `.input-icon`, `.label`, `.card`, `.card-hover`, `.table`, `.badge`, `.chip`, `.skeleton`, `.nav-link`, `.scrollbar` refinado, sidebar/topbar/mÃ³viles con estilos propios.
- **Sistema de iconos** `src/components/icons.tsx`: 45+ iconos SVG inline (dashboard, users, building, shield, camera, map-pin, gps, alert, sos, video, calendar, wallet, bell, search, download, logout, chevron, sos, clock, document, etc.) + componente `Icon` con tipo `IconName` y registro `ICONS`.
- **Capa de feedback profesional:** `ToastProvider`/`useToast` (success/error/info auto-dismiss) y `ConfirmProvider`/`useConfirm` (confirmaciones con variante danger) montados en `app/layout.tsx`; mensajes de error amigables en espaÃ±ol (`friendlyError`) en EntityModal y login (401/403/409/400/404/network).
- **Componentes nuevos:** `KpiCard` (tonos + iconos), `EmptyState`, `Donut` (anillo SVG de progreso), `PageHeader` (con icono y acciones), `StatusBadge` (mÃ¡s estados, punto + ring), `DataTable` reescrito (bÃºsqueda cliente-side, botÃ³n refresh con spinner, skeleton rows, EmptyState con descripciÃ³n, paginaciÃ³n pulida, prop `hideHeader`), `EntityModal` pulido (toast al guardar, `description`/`successMessage`, errores amigables).
- **Layout administraciÃ³n** `app/(dashboard)/layout.tsx`: sidebar con secciones e iconos, drawer mÃ³vil, topbar con hamburguesa/bell/chip de usuario/cierre de sesiÃ³n, `main` centrado `max-w-[1440px]`.
- **Dashboard `/`:** saludo dinÃ¡mico + reloj, KPIs reales (Guardias/Cobertura/Incidencias/SOS con ping), alertas de administraciÃ³n (documentos por vencer, facturas vencidas con saldo), donut de cobertura, turnos activos, accesos rÃ¡pidos y resumen clientes/servicios â€” todo desde `/dashboard`.
- **Login `/login`:** split-screen con panel de marca e iconos, mostrar/ocultar contraseÃ±a, cuentas demo con credenciales reales, errores en espaÃ±ol.
- **PWA guardia `/m*`:** bottom-nav de 5 tabs con iconos; home app-like con hero "Mi turno", entrada/salida con GPS, grid de acciones (RondÃ­n, BitÃ¡cora, Incidencias, Video, Consignas, SOS), lista de registros del dÃ­a, tarjeta de ubicaciÃ³n y cola offline visible.
- **PWA supervisor `/ms*`:** radar operativo (guardias en turno, conexiÃ³n, puestos descubiertos, incidencias, SOS), links rÃ¡pidos, visita de supervisiÃ³n con checklist; SOS con confirmaciÃ³n (danger + toast) y botones Atender/Cerrar por alerta.
- **Portal cliente `/portal*`:** tarjeta de empresa, tiles de acceso, CTA de nueva solicitud, servicios, instalaciones y contacto principal â€” datos reales de `/clients/mine`.
- **PÃ¡ginas de mÃ³dulos con encabezado de icono:** guards, clients, incidents, sos, video, prepayroll con `PageHeader`; video admin con toasts de descarga y Estado "En vivo" pulsante; prepayroll con manejo de duplicado (mensaje amigable en vez de `alert()`).
- **PULIDO COMPLETO DE TODAS LAS PÃGINAS CRUD/RESTO (2026-09-17):** 20 pÃ¡ginas mÃ¡s con `PageHeader` con icono + `hideHeader` en DataTable + `emptyDescription`: contracts, shifts, sites, users (con nuevo botÃ³n), billing, consigns, visitors, vehicles, inventory, gps, attendance, audit, posts, patrols, logbook, notifications (marcar leÃ­dos con toast), reports (secciones en tarjetas), supervision, client-requests, pending-approvals. **Mejoras funcionales:** `attendance` ahora tiene selector de fecha real (antes fecha hardcodeada) sin tocar el backend; `StatusBadge` ampliado con mapeos `pagado/completo/cumple/no_cumple/sin_datos/expirada/paid`; botones `.btn-sm` con icono en video.
- **VERIFICADO (2026-09-17):** `next build` OK 46/46 rutas, `npm run lint` 0 problemas (web+api), `npm test` 34/34 OK, TODAS las rutas web 200 (`/`, `/login`, `/m`, `/ms`, `/portal` + 20 de administraciÃ³n), `/api/health` OK (envelope `{success,data}`) y login real OK (envelope `{success,data}` con `roleCodes` + `permissions`). Corregido: import `./icons` â†’ `../icons` en componentes `ui/*`; cache obsoleta del dev server reiniciada (el enclave `shadow-card` sÃ­ existe en la config; el 500 era cachÃ© vieja de Tailwind). **HALLAZGO:** `next build` y `next dev` NO pueden correr simultÃ¡neamente (comparten `.next` â†’ `PageNotFoundError` falso "Cannot find module for page: /billing"); detener dev antes de build.

### PRUEBAS DE INTEGRACIÃ“N E2E AUTOMATIZADAS (Bloque 22, 2026-09-17)
- **Suite Jest HTTP contra la API REAL** (`npm run test:e2e --workspace @servicom/api`): 17/17 verdes en ~20 s. Requiere la API levantada en `:3001` con BD con seed.
  - `apps/api/test/jest-e2e.json`: config (node, ts-jest, `maxWorkers: 1`, `testTimeout` alto, delays ~90 ms por request para no tocar el rate limit de 100 req/min).
  - `apps/api/test/helpers.ts`: wrapper `Api` (token, `get/post/put/del/req raw`), `login`, `suffix()`, `rfc()`, `isoDate()`, `dataOf`, `cleanup` best-effort de datos E2E (marcados `E2E-<timestamp>`; video vÃ­a `PUT /video/recordings/:id/delete`).
  - `apps/api/test/flow.e2e-spec.ts` (10 tests) â€” **FLUJO INTEGRAL AUTOMATIZADO completo:** autenticaciÃ³n de los 4 perfiles â†’ cliente/contrato/instalaciÃ³n (geocerca)/puesto â†’ guardia con usuario propio + duplicado 400 â†’ ruta de rondÃ­n, turno, entrada `dentro` de geocerca, GPS, check-in, bitÃ¡cora, incidencia, `/guards/me` â†’ video real (stream â†’ chunk 4096 B â†’ end `sizeBytes=4096` â†’ listar â†’ eliminar) â†’ SOS (activaâ†’ackâ†’cerrada) â†’ supervisiÃ³n con checklist â†’ pre-nÃ³mina `generate` + reportes â†’ portal cliente (mine, solicitud, responder, mine) â†’ aislamiento Empresa B (no ve E2E; acceso directo â†’ 403).
  - `apps/api/test/security.e2e-spec.ts` (7 tests): 401 sin token, 400 para UUID invÃ¡lido, RBAC CLIENT 403 en mÃ³dulos admin, RBAC GUARD 403 (solo `/guards/me` 200), aislamiento B vs ABC Corp (403 directo), scoped del portal, payloads invÃ¡lidos â†’ 4xx (nunca 500).
- **ER-CORREGIDOS por la suite E2E (backend real, no simulaciÃ³n):**
  - `clients.service.create`: sin `legalName`/`commercialName` devolvÃ­a **500** (Prisma). Ahora 400 con mensaje claro.
  - `sites.service.create`: sin `clientId`/`name` rompÃ­a el `findFirst` con `id: undefined` â†’ **500**. Ahora 400 explÃ­cito.
  - `GET /guards/me` devolvÃ­a **403** con un guardia creado (rol GUARD no tiene `guards.view`, pero el endpoint es el expediente propio del guardia). Se siguiÃ³ el patrÃ³n self de `/gps/ping`: se retirÃ³ `@Permissions` del route y se conserva el chequeo `user.guardId` del service (404 si no aplica). Sin fuga de datos (scoped por token, no expone a otros guardias).
  - Pre-nÃ³mina: la generaciÃ³n es `POST /prepayroll/generate` (no `POST /prepayroll`), detalle hasta ahora no usado; la suite documenta la ruta real.
  - `reports/attendance` y `reports/shifts` devuelven objeto `{total, records,...}` (no array): asserts adaptados.
- **BUILD DE API ESTABILIZADO:** `nest build` con `incremental:true` + `deleteOutDir:true` dejaba `dist` VACÃO (tsbuildinfo stale saltaba la emisiÃ³n, exit 0 sin salida). SoluciÃ³n permanente en `apps/api/tsconfig.build.json`: `"incremental": false` + `tsBuildInfoFile` fuera del dist. Verificado: `dist/main.js` presente tras `npm run build:api`, API levantada y health OK.
- **Siguen 34 unit tests intactos** (7 api + 27 shared) + suite E2E 17/17; `npm run lint` Web+API 0 problemas.

### PREPARACIÃ“N PARA PRODUCCIÃ“N Y ENTREGA (Bloques 23-24, 2026-09-17)
- **VerificaciÃ³n en modo producciÃ³n:** API compilada (`npm run build:api` â†’ `dist/main.js`) levantada con `npm run start:prod:api` â†’ `/api/health` OK, login real OK, `/auth/me` OK, `/dashboard` OK (guards/coverage/incidents/sos/alerts/activeShifts). Web PRECOMPILADA (`npm run build:web`, 46 rutas) servida con `next start`: **43/44 rutas 200** en servidor de producciÃ³n (el Ãºnico 404 es `/dashboard`, que no existe: el dashboard es `/`), incluidas `/m*`, `/ms*` y `/portal*`.
- **`.env.example` al dÃ­a** (api: DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, API_PORT, CORS_ORIGINS, STORAGE_PATH, VIDEO_STORAGE_PATH, MAX_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_MINUTES, VIDEO_EXPIRATION_HOURS, NODE_ENV; web: NEXT_PUBLIC_API_URL). Consumo real verificado vÃ­a `ConfigService` (CORS_ORIGINS, API_PORT, JWT_*, NODE_ENV, VIDEO_*).
- **Seed confiable en producciÃ³n:** `prisma/seed.ts` ahora carga `.env` automÃ¡ticamente (`import 'dotenv/config'`) â€” antes fallaba si `DATABASE_URL` no estaba en el shell del proceso.
- **PENDIENTE PRODUCTO detectado por la puerta final (resuelto):** asistencia/dashboard calculaban "hoy" con fecha **UTC** (`toISOString`) mientras los turnos se agendan en hora **local** â†’ en la frontera del dÃ­a (UTC pasa a maÃ±ana) el guardia no podÃ­a registrar entrada ("No tiene turno programado para hoy"). Corregido con helper `localDateStr` (fecha local YYYY-MM-DD) en `attendance.service.ts` (myToday + create) y `dashboard.service.ts` (getOverview + guard-hub). La suite E2E ahora es DETERMINISTA a cualquier hora.
- **Puerta final (todo verde):** E2E 17/17 (2 corridas consecutivas tras el fix), unitarios 27 (shared) + 7 (api), `npm run lint` 0 problemas api+web, builds de producciÃ³n api+web OK.
- **DocumentaciÃ³n de entrega (Bloque 24):**
  - `README.md` raÃ­z creado: descripciÃ³n, mÃ³dulos, stack, estructura, puesta en marcha, cuentas demo, pruebas y enlaces a docs.
  - `DEPLOYMENT.md` actualizado: envelope real de `/api/health`, Swagger en `/docs`, respaldo de `VIDEO_STORAGE_PATH`, suite `test:e2e`, nota del streaming en vivo pendiente.
  - `PROJECT_STATUS.md` al dÃ­a (este archivo).

### DESPLIEGUE GRATUITO DE DEMOSTRACIÃ“N PREPARADO (2026-09-17)
- **Web ahora es exportaciÃ³n estÃ¡tica:** `apps/web/next.config.mjs` â†’ `output: 'export'`. La app es 100% SPA (`use client`, sin `next/image`, sin `useSearchParams`, sin middleware) â†’ 46 rutas prerenderizadas en `apps/web/out/` con PWA completa (`sw.js`, `manifest.json`, iconos). Permite hostear la web en un static site gratis (Render), sin servidor.
- **`render.yaml` creado** (blueprint Render): `servicom-api` (web service free, NestJS con `prisma migrate deploy` en el arranque), `servicom-web` (static site free, publica `apps/web/out`), `servicom-db` (PostgreSQL free). Variables sensibles con `sync: false` (DATABASE_URL, JWT_SECRET, CORS_ORIGINS, NEXT_PUBLIC_API_URL).
- **`DEPLOYMENT.md` secciÃ³n 8b:** pasos exactos del despliegue gratuito sin dominio (blueprint â†’ variables â†’ seed vÃ­a Shell del dashboard â†’ verificaciÃ³n `/api/health`) y limitaciones del plan free (spin-down 15 min, disco efÃ­mero para videos, BD 1 GB expira a los 30 dÃ­as).
- **Build estÃ¡tico verificado localmente:** `next build` con `output: 'export'` genera `apps/web/out` sin errores (todas las rutas `â—‹` estÃ¡ticas).
- **Pendiente de cuentas del propietario (bloqueador Ãºnico):** crear repo GitHub + cuenta Render para ejecutar el deploy (ver Next Move).

### PRUEBAS DE INTEGRACIÃ“N REALIZADAS (2026-09-16)
- **FLUJO INTEGRAL COMPLETO validado (2026-09-16):** Empresa A (admin@gruposervicom) â†’ nuevo cliente (Transportes Aguilera, con contacto `position`) â†’ nuevo sitio/instalaciÃ³n (Planta Aguilera) â†’ nuevo contrato CTR-2026-046 con servicio (guardCount/tariff/startDate) â†’ nuevo puesto (Caseta Principal) â†’ nuevo guardia (Carlos Ramirez GU-010, login real con credenciales creadas) â†’ nuevo turno programado â†’ entrada con GPS dentro de geocerca (`geofenceResult: dentro`, `status: fuera_de_horario` porque 18:33 > fin turno 18:00 â€” correcto) â†’ GPS ping (`geofenceStatus: dentro`) â†’ rondÃ­n checkin en ruta de otro sitio (`result: fuera_de_ruta` â€” validaciÃ³n correcta) â†’ bitÃ¡cora (title+description) â†’ incidencia (`status: abierta`) â†’ supervisiÃ³n por supervisor demo (visita con checklist) â†’ pre-nÃ³mina (periodo mes actual: primero 400 "ya existe" por duplicado, comportamiento correcto) â†’ reportes (attendance/patrols/logbook OK) â†’ portal cliente (cliente@abccorp contratos=1 sitios=1).
- **Aislamiento multiempresa RE-VERIFICADO (2026-09-16):** Empresa B (admin@prototal.com) ve 0 en clients/sites/contracts/shifts; acceso directo por ID de cliente o sitio de Empresa A â†’ 403 "Acceso denegado".
- **Video â€” ALMACENAMIENTO REAL DE OBJETOS implementado (Bloque 14, 2026-09-16).** Antes el flujo era solo metadatos (`sizeBytes: 0`, `filePath` sin archivo, TODO pendiente de borrado fÃ­sico). Ahora:
  - `video-storage.service.ts`: capa de almacenamiento de objetos desacoplada (local fs bajo `VIDEO_STORAGE_PATH`, estructura `uploads/`+`recordings/`, lÃ­mite de 25 MB por chunk, `safeResolve` anti path-traversal). Sustituible por S3 sin tocar el service.
  - `POST /video/streams/:id/chunk` (raw body `application/octet-stream`, body parser raw con lÃ­mite 30 MB en `main.ts`): el guardia sube chunks reales de la cÃ¡mara (MediaRecorder) mientras transmite; se acumulan en disco y se devuelve `totalBytes` real.
  - `endStream` ahora finaliza el archivo fÃ­sico (mover `uploads/*.part` â†’ `recordings/<streamId>.webm`), persiste `sizeBytes` REAL (BigInt del `stat`) y usa `VIDEO_EXPIRATION_HOURS` desde config.
  - `GET /video/recordings/:id/file` (nuevo): streaming controlado del archivo con auth + permiso `video.recording.download`, valida 404/expiraciÃ³n/tenant, `Content-Length` real, `Content-Disposition`, y registra `VideoDownloadLog` (auditorÃ­a por descarga).
  - `deleteRecording` y cron de expiraciÃ³n ahora eliminan TAMBIÃ‰N el archivo fÃ­sico.
  - **Validado de punta a punta:** guardia login â†’ `POST /streams` (transmitiendo) â†’ sube 2 chunks (60004 y ~30000 bytes) â†’ almacena/`totalBytes` â†’ `PUT end` (sizeBytes REAL = 274181, exp +48h) â†’ archivo fÃ­sico existe en `storage/videos/recordings/*.webm` â†’ admin listar (1) â†’ descarga `[id]/file` = 274181 bytes descargados â†’ guardia intenta descargar = 403 (permiso correcto) â†’ inexistente = 404 â†’ `delete` borra registro + archivo fÃ­sico (verificado `Test-Path` = False). Datos de prueba limpiados.
  - Frontend: pÃ¡gina mÃ³vil `/m/video` del guardia con cÃ¡mara REAL (`getUserMedia` + `MediaRecorder` webm, chunk cada 5s subido al backend, reset de temporizador, botÃ³n detener â†’ `end`). PÃ¡gina admin `/video` mejorada: columnas correctas (guardia, instalaciÃ³n, duraciÃ³n s, tamaÃ±o KB/MB, expiraciÃ³n en horas, contador de descargas) y botÃ³n "Descargar" que baja el archivo real con token y recarga la tabla (`refreshKey` agregado a `DataTable`).
- **PRUEBAS UNITARIAS IMPLEMENTADAS (Bloque 22, 2026-09-16):** `npm test` ahora funciona en todo el monorepo (antes fallaba: api "No tests found", shared "No tests yet").
  - API (7 tests): `geo.spec.ts` â€” haversine (0 distancia, CDMXâ€“GDL ~460 km real, simetrÃ­a), isInsideGeofence (dentro, borde exacto, fuera, sin geocerca). Config: `apps/api/jest.config.js` (ts-jest, solo `src/**/*.spec.ts`, excluye dist).
  - Shared (27 tests): `schemas.test.ts` (login/email/password/createUser/contract UUID/guard CURP+RFC/attendance/incident/vehicle) y `permissions.test.ts` (permisos Ãºnicos con formato `modulo.accion`[+partes], video.permissions completos, 10 roles, SUPER_ADMIN=ALL, sin permisos huÃ©rfanos, GUARD sin billing, CLIENT sin handle).
  - Fixed: ts-jest type error en `permissions.test.ts` (`Set` tipado como `Set<string>`); imports de tests corregidos a `./`; `tsconfig.build.json` de shared excluye `**/*.test.ts` para que no entren al dist.
- **ESLint ARREGLADO en todo el monorepo (2026-09-16):** `npm run lint` funcionaba a medias (script heredado referenciaba `eslint` no instalado; el anterior `@nestjs/eslint-plugin` no existe en el registry â†’ 404). Instalado `eslint@8` + `@typescript-eslint/*@7` en api (config `.eslintrc.js` estÃ¡ndar NestJS) y `eslint@8` + `eslint-config-next@14.2.5` en web (`.eslintrc.json` con `next/core-web-vitals`). Corregidos 0 errores + 17 warnings: `require()` dinÃ¡micos de `common/utils/geo` â†’ imports estÃ¡ticos (gps, patrols, attendance), imports de decoradores/`@nest` no usados (app.module, auth.service, main.ts, billing, companies, consigns, notifications, prepayroll, roles, sos, video), `txn`/`companyId`/`body`/`resolution` sin usar (param `resolution` retirado del cierre de SOS â€” no hay columna en schema). Resultado: `npm run lint` â†’ 0 problemas en api y web.
- **Build de producciÃ³n API CORREGIDO (2026-09-16):** `npm run build:api` emitÃ­a en `dist/src/main.js` (no `dist/main.js`) porque `tsconfig.json` incluÃ­a `prisma/**/*` â†’ rootDir pasaba a repo root. El script `start:prod` (`node dist/main`) y `start:prod:api` fallarÃ­an en producciÃ³n. SoluciÃ³n: `tsconfig.build.json` con `rootDir: ./src` + include solo `src`. Verificado: `dist/main.js` existe tras `nest build`.
- **DEPLOYMENT.md creado (Bloque 24, 2026-09-16):** guÃ­a completa de instalaciÃ³n en servidor nuevo (requisitos, PostgreSQL, install, `.env`, migraciones+seed, build, ejecuciÃ³n npm/systemd, Nginx+WebSocket para WebRTC, verificaciÃ³n con `/api/health`, desarrollo local, tabla de scripts root). `.env.example` de api/web ya cubrÃ­an todas las variables de producciÃ³n.
- **PreparaciÃ³n para producciÃ³n (Bloque 23, 2026-09-16):** endpoint `GET /api/health` creado (verifica conexiÃ³n BD con `SELECT 1`, devuelve status/version/environment/database/timestamp) â†’ `{"status":"ok","database":"ok"}`. Build de producciÃ³n verificado: `npm run build:api` (nest build, OK) y `npm run build:web` (next build, todas las rutas OK). Scripts root agregados: `start:prod:api`, `start:prod:web`, `db:deploy` (prisma migrate deploy).
- **Seguridad (Bloque 20):** rate limiting activado (`ThrottlerGuard` global, 100 req/min, verificado 429 en rÃ¡faga). Bloqueo por intentos fallidos: 5 fallos en cuenta real â†’ 401 "Cuenta bloqueada 30 min"; login correcto tambiÃ©n bloqueado durante el candado. Emails inexistentes NO bloquean (evita enumeraciÃ³n de usuarios, comportamiento correcto). Helmet activo.
- **Video (Bloque 14):** `GET /video/streams`, `/video/recordings` â†’ 200 vacÃ­os; grabaciÃ³n inexistente â†’ 404; download-url inexistente â†’ 404; assign-incident inexistente â†’ 404; guardia sin permiso listar â†’ 403. ExpiraciÃ³n 48h con cron `EVERY_HOUR` y soft-delete. **AMPLIADO A ESCRITURA (2026-09-16):** `POST /video/streams` (guardia inicia transmisiÃ³n, requiere `video.live.start`, vincula turno actual), `PUT /video/streams/:id/end` (finaliza y crea grabaciÃ³n con expiraciÃ³n 48h, duraciÃ³n, resoluciÃ³n, latitud/longitud). Flujo validado completo: iniciar (transmitiendo) â†’ finalizar (grabaciÃ³n 2s, exp 48h) â†’ listar (admin) â†’ detalle (size/exp) â†’ asignar a incidencia â†’ URL de descarga temporal (60 min, registra log) â†’ eliminaciÃ³n lÃ³gica â†’ ramificar listado. Grabaciones limpiadas despuÃ©s de pruebas.
- **Visitantes/vehÃ­culos/inventario (Bloque 15):** visitantes GET/inside/404; POST con `fullName`+`siteId` real â†’ 201; salida (`exit`) â†’ OK; salida duplicada â†’ 400. VehÃ­culos GET/expiring/404; POST â†’ 201; PUT actualiza. Inventario POST radia â†’ 201; serial duplicado â†’ 400. Campos correctos: visitante `identification` (no `documentNumber`), vehicle `plates` (no `plate`), inventario `type` (no `category`).
- **Turnos/asistencia (Bloque 7-8):** `GET /shifts` â†’ 1; `GET /shifts/coverage?date=` OK (2 puestos). `GET /attendance` â†’ 1; `attendance/my-today` como guardia â†’ registros+turnos del dÃ­a; como admin â†’ 403 (permiso correcto); `attendance/summary` guardia â†’ 403.
- **SOS (Bloque 12):** POST sin GPS â†’ 400 (validaciÃ³n correcta); con GPS â†’ 201 `activa`; ack admin â†’ `atendida`; close â†’ `cerrada`. Flujo completo OK.
- **SupervisiÃ³n (Bloque 13):** GET â†’ 1; POST con admin â†’ 403 (permiso `supervision.create` es de rol SUPERVISOR, correcto).
- **Contratos/sitios/consignas (Bloque 4-5):** contratos GET/detail/services/profitability OK; sitios GET/map OK (1); posts GET OK (2); consignas GET/mine guardia OK, ack â†’ `acked=true`.
- **Guardias/entrenamiento (Bloque 6):** `GET /guards` paginado `{total,page,limit,items}` (1 guardia); guard detail OK; training POST con `courseName`/`instructor`/`trainingDate`/`durationHours` â†’ 201; campos faltantes o fecha invÃ¡lida â†’ 400.

### BUGS ENCONTRADOS Y CORREGIDOS EN ESTAS PRUEBAS
- `shifts/events` sin `from/to` o `coverage` sin `date` â†’ 500 (`new Date(undefined)` â†’ Invalid Date). Ahora 400 con mensaje claro; rango invertido â†’ 400. (shifts.service.ts)
- `training.create` lanzaba 500 si faltaba `instructor`/`durationHours`/`trainingDate` (Prisma requerÃ­a los campos y el body no se validaba). Ahora 400 explÃ­cito con listado de campos requeridos; fecha invÃ¡lida â†’ 400. (training.service.ts)
- **HALLAZGO (resuelto):** `vehicles.service.create` e `inventory.service.create` hacÃ­an `...body` completo: un campo arbitrario no existente en el modelo causaba 500. Corregido con spread selectivo de campos del modelo; los campos extra ahora se ignoran (whitelist) y no rompen la peticiÃ³n.

### PENDIENTE
- Servidor de medios WebRTC con fan-out en vivo (la captura real vÃ­a MediaRecorder + chunks ya funciona; falta el streaming multicÃ¡mara en vivo estilo "monitor" servido a supervisores â€” alternativa: integrar un mediaserver como mediasoup/Janus cuando haya infraestructura).
- Ejecutar el despliegue gratuito de demostraciÃ³n (Render): requiere cuenta de propietario en GitHub y Render (los archivos `render.yaml`, export estÃ¡tico y documentaciÃ³n ya estÃ¡n listos).
- Demo/presentaciÃ³n final ante el cliente (material de demostraciÃ³n).

## Decisiones tÃ©cnicas

| DecisiÃ³n | Valor | JustificaciÃ³n |
|----------|-------|---------------|
| Monorepo | npm workspaces | Un solo repositorio, dependencias compartidas |
| Backend | NestJS + TypeScript | Estructura modular profesional, inyecciÃ³n de dependencias |
| ORM | Prisma | Tipado, migraciones, seguridad por defecto |
| Base de datos | PostgreSQL 17 (local) / Docker (prod) | Documento Maestro Â§48 |
| Frontend web | Next.js 14 (App Router) + Tailwind CSS | SSR, SEO, rendimiento |
| MÃ³vil | PWA sobre Next.js (guardia/supervisor) | Documento Maestro Â§48 â€” decisiÃ³n tÃ©cnicamente justificada: un solo cÃ³digo base, WebRTC funciona en navegador mÃ³vil, offline con Service Worker + IndexedDB |
| ValidaciÃ³n | Zod | Schema-first, compartido backend/frontend |
| API | REST + Swagger OpenAPI | Interoperabilidad, documentaciÃ³n automÃ¡tica |
| Video | WebRTC + archivos chunked + almacenamiento local de objetos + FFmpeg (si disponible) | Sin dependencia de infraestructura externa en desarrollo |
| Mapas | Capa desacoplada (`MapProvider` interface) con implementaciÃ³n Leaflet/OSM gratuita | Sustituible por Google Maps/Mapbox sin reescribir |

## Errores/correcciones

- (resueltos) 31 errores de relaciones Prisma (P1012): relaciones reversas faltantes, 1:1 sin @unique, nombres de relaciÃ³n de doble FK.
- (resueltos) ~60 errores TypeScript: tipos `string | null` en where(companyId), includes inexistentes, arrays `never[]`, `select`+`include` (Prisma), import `Body` faltante, caracteres corruptos en seed.
- (resueltos) incidents.service 500 al crear incidencia sin typeId: `findUnique({where:{id:undefined}})` â†’ condicional.
- (resueltos) shifts/events y coverage 500 sin fechas: validaciÃ³n `from/to`/`date` requeridos + fecha invÃ¡lida + rango invertido â†’ 400.
- (resueltos) training.create 500 con campos requeridos ausentes: validaciÃ³n explÃ­cita `guardId/courseName/instructor/durationHours/trainingDate` â†’ 400.
- (resueltos) `...body` sin filtrar en create de vehicles/inventory: campo arbitrario causaba 500. Ahora se hace spread selectivo de campos del modelo; los campos extra se ignoran (whitelist implÃ­cito) y no rompen la peticiÃ³n.
- (resueltos) clients.create con contacto usando campo `role` (inexistente en ClientContact, el correcto es `position`) â†’ 500. Ahora documentado: los contactos usan `name/position/phone/email`.
- (resueltos) patrols.checkIn sin `checkpointId` â†’ 500 (`findUnique({where:{id:undefined}})`). Ahora 400 "checkpointId requerido".
- (resueltos) `VideoRecording.sizeBytes` es BigInt: cualquier endpoint que devolviera una grabaciÃ³n (listar, detalle, asignar incidencia, eliminar) fallaba con 500 por serializaciÃ³n JSON. Normalizado con helper `bigIntToNumber` en el service (todos los retornos de `VideoRecording`). Verificado: listar/detalle/assign/delete OK.
- (resueltos) lint roto: `eslint` no estaba instalado en ningÃºn workspace; ademÃ¡s se intentÃ³ instalar un paquete inexistente (`@nestjs/eslint-plugin`, 404 en registry). Instalado el stack real (typescript-eslint / eslint-config-next) y configurados ambos workspaces.
- (resueltos) `require()` dinÃ¡micos en gps/patrols/attendance service (cargaban `utils/geo` en runtime): convertidos a imports estÃ¡ticos.
- (resueltos) build de producciÃ³n API emitÃ­a en `dist/src/main`: `rootDir` del compilador se movÃ­a al repo root por incluir `prisma/**/*`. Aislado en `tsconfig.build.json` (`rootDir: ./src`, include solo `src`) â†’ `dist/main.js` correcto.
- (resueltos) tsbuildinfo stale: tras crear `tsconfig.build.json`, el cache incremental (`apps/api/tsconfig.build.tsbuildinfo`) apuntaba a rutas antiguas y el build emitÃ­a solo 1 archivo. Borrar el tsbuildinfo + dist al cambiar config de compilaciÃ³n.
- (resueltos) `saveChunk` 400 "Chunk vacÃ­o" con `application/octet-stream`: NestJS `rawBody` NO se captura para content-types sin body-parser; hay que registrar `app.useBodyParser('raw', { type: 'application/octet-stream' })` en `main.ts` y leer `req.body` (Buffer).
- (resueltos) descarga devolvÃ­a 404: `safeResolve` unÃ­a `filePath` (ya contiene `recordings/`) a `recordingsDir` (duplicaba `recordings/recordings/`). Ahora resuelve contra `root` con protecciÃ³n de path traversal.
- (resueltos, 2026-09-17, E2E Bloque 22) `clients.create` y `sites.create` devolvÃ­an 500 con campos requeridos ausentes (`legalName/commercialName`, `clientId/name`): validaciÃ³n explÃ­cita â†’ 400.
- (resueltos, 2026-09-17, E2E Bloque 22) `GET /guards/me` daba 403 al guardia creado (rol GUARD sin `guards.view`): route sin `@Permissions` siguiendo el patrÃ³n self de `/gps/ping`, con chequeo `user.guardId` en el service.
- (resueltos, 2026-09-17) `nest build` podÃ­a emitir `dist` vacÃ­o con exit 0 (`incremental:true` + `deleteOutDir:true` con tsbuildinfo stale): `"incremental": false` + `tsBuildInfoFile` fuera de dist en `tsconfig.build.json`.
- (resueltos, 2026-09-17, puerta final Bloque 23) "hoy" en UTC vs turnos agendados en local: asistencia/dashboard usaban `toISOString().slice(0,10)`. Corregido con helper de fecha local (`localDateStr`) en `attendance.service.ts` y `dashboard.service.ts`; la antigua frontera horaria rompÃ­a el registro de entrada del guardia por la noche.
- (resueltos, 2026-09-17) `prisma/seed.ts` no cargaba `.env` (el cliente Prisma no lo carga solo): `import 'dotenv/config'` â€” permite `npm run db:seed` en un servidor nuevo sin exportar `DATABASE_URL`.

## Pendientes / notas

- `npm run lint` FUNCIONA (resuelto 2026-09-16): eslint instalado y configurado en api (`.eslintrc.js` typescript-eslint) y web (`.eslintrc.json` `next/core-web-vitals`); 0 problemas en ambos. Ver detalles en "PRUEBAS DE INTEGRACIÃ“N REALIZADAS".
- `npm run start:prod` FUNCIONA (resuelto 2026-09-16): `tsconfig.build.json` creado con `rootDir: ./src` para que `nest build` emita en `dist/main.js` (antes emitÃ­a `dist/src/main.js`). **2026-09-17:** aÃ±adido `"incremental": false` + `tsBuildInfoFile` fuera de dist para evitar que el cache stale dejara el dist vacÃ­o con exit 0.
- `npm run test:e2e --workspace @servicom/api` FUNCIONA (Bloque 22, 2026-09-17): 17/17 contra API en `:3001`; requiere BD con seed y la API levantada (el suite no levanta el servidor).
- PostgreSQL 17 instalado localmente (C:\Program Files\PostgreSQL\17), servicio `postgresql-x64-17` activo.
- Credenciales BD prisma: `postgresql://postgres:postgres@localhost:5432/seguridad_db?schema=public`.
- Seed requiere `DATABASE_URL` en entorno (el `.env` de apps/api no lo carga automÃ¡ticamente en el script `db:seed`); ver nota en Next Move.

## Stack del entorno de desarrollo

- Node.js v24.19.0
- npm 11.17.0
- PostgreSQL 17
- Git 2.55.0
- Prisma CLI 5.22.0

## Siguientes pasos inmediatos (Next Move)

1. **DEMO EN PRODUCCIÃ“N ACTIVA (2026-09-18):** API https://servicom-api.onrender.com y Web https://servicom-web.onrender.com en vivo en Render. Health `/api/health` OK, Swagger `/docs` (136 rutas), login verificado con las 5 cuentas demo del seed. E2E automatizado 25/25 contra producciÃ³n (`E2E_API_URL=https://servicom-api.onrender.com/api`). MÃ³dulo GUARDIA ajustado para operaciÃ³n real (validaciones de asistencia, turnos nocturnos, redirecciÃ³n por rol, menÃº por permisos, UX PWA simplificada).
2. RevisiÃ³n funcional pendiente mÃ³dulo por mÃ³dulo (siguiente tras GUARDIA: Empresa â†' Cliente â†' Contrato â†' Servicio â†' InstalaciÃ³n â†' Puesto â†' ...). Espera confirmaciÃ³n del propietario antes de continuar.
3. Demo/presentaciÃ³n final con los 4 perfiles (admin, supervisor, guardia, cliente) usando las cuentas demo del seed.
3. Video operativo desplegado (grabación con expiración 48h, live viewer MSE, evidencia, URL firmada, auditoría). Pendiente optativo: mediaserver dedicado (mediasoup/Janus) para multicast eficiente cuando haya infraestructura.
4. Mantenimiento: revisar dependencias (npm audit) y respaldos de BD + `VIDEO_STORAGE_PATH` en producciÃ³n.

### Bloque comercial revisado (2026-09-18)

- **Gap crÃ­tico de aislamiento cerrado:** `POST /contracts` (con `services`) y `POST /contracts/:id/services` ahora validan que el `siteId` del servicio pertenezca a la empresa del contrato **y al mismo cliente** (403 si es otra empresa, 400 si es otro cliente). Prueba E2E: la empresa A no puede ligar instalaciones de B ni viceversa.
- **Validaciones backend (400 controlado, no 500):** clientes (RFC duplicado en update, enum de status), contratos (fechas vÃ¡lidas y en orden, nÃºmero Ãºnico en update, enums de status y de billingFrequency, tarifa/guardCount vÃ¡lidos en servicios), instalaciones (rangos de latitud/longitud y radio de geocerca 10–5000 m, coerciÃ³n numÃ©rica), puestos (nombre obligatorio, horarios HH:mm en create y update, coerciÃ³n booleana de `active`).
- **Consistencia:** `clients.findAll` ya respeta SUPER_ADMIN (`?? undefined`); `getContracts`/`getSites`/`addContact`/`remove` ignoran clientes soft-deleted; `getPosts` filtra puestos activos; `getServices`/`getProfitability` filtran servicios inactivos y contratos no eliminados.
- **Frontend corregido:** dropdown de clientes con `limit=100` (antes `pageSize` ignorado = solo 20); enum de estatus de contrato alineado (`activo`/`suspendido`/`cerrado`); cliente con estatus "Suspendido"; instalaciones con campo `schedule` y hints de rangos.
- **Pruebas:** nuevo `apps/api/test/commercial.e2e-spec.ts` (7 tests: aislamiento ContractService, aislamiento por cliente, flujo vÃ¡lido con servicio, validaciones 400). Suite E2E total **40/40** local.

### AsignaciÃ³n exclusiva de guardia a cliente (2026-09-18)

- **Regla de negocio (confirmada por el propietario):** cada guardia queda ligado EXCLUSIVAMENTE a un cliente de tu empresa de seguridad, con reasignaciÃ³n controlada a otro cliente.
- **Schema:** `Guard.assignedClientId` (FK a Client, opcional, indexado) + nuevo modelo `GuardAssignment` (historial de asignaciones: de-client, a-client, motivo, usuario, fecha, empresa).
- **Backend (`guards.service.ts`):**
  - `POST /guards` acepta `assignedClientId` + `assignmentReason` (valida que el cliente sea de tu empresa) y registra la asignaciÃ³n inicial.
  - `POST /guards/:id/reassign` (permiso `guards.edit`): transacciÃ³n que actualiza el cliente, registra el historial y **cancela los turnos futuros** (`status=programado`, fecha >= hoy) del cliente anterior.
  - `GET /guards/:id/assignments`: historial completo (clientes origen/destino + responsable).
  - `findAll`/`findOne` devuelven ahora el cliente asignado (`assignedClient`).
- **Backend (`shifts.service.ts`):** al crear o actualizar un turno valida la regla de exclusividad — si el guardia estÃ¡ asignado a un cliente, SOLO puede cubrir puestos de ese cliente (`400` con mensaje claro si intenta otro).
- **Frontend (`/guards`):** columna "Cliente asignado" en la tabla, selector de cliente en el alta (con aviso de exclusividad), botÃ³n "Reasignar" por fila con modal (cliente destino + motivo + aviso de cancelaciÃ³n de turnos futuros).
- **Pruebas:** nuevo `apps/api/test/guard-assignment.e2e-spec.ts` (8 tests: exclusividad bloqueada, turno vÃ¡lido en su cliente, reasignaciÃ³n cancela futuros, turno vÃ¡lido tras reasignar, historial registrado). Suite E2E total **33/33** local.
- **`packages/shared/schemas.ts`:** `guardSchema` + `guardAssignSchema` actualizados.

### MÃ³dulo GUARDIA ajustado para operaciÃ³n real (2026-09-18)

- **Estado:** REVISADO Y DESPLEGADO. Enfoque: guardia con poca experiencia tecnolÃ³gica â†' operaciÃ³n simple, confiable y con mensajes claros. E2E 25/25 local y contra producciÃ³n.
- **Validaciones de asistencia (backend, `attendance.service.ts`):**
  - Doble entrada del dÃ­a rechazada ("Ya registraste tu entrada hoy").
  - Salida sin entrada previa rechazada ("Primero debes registrar tu entrada").
  - Doble salida del dÃ­a rechazada ("Ya registraste tu salida hoy").
  - Guardia con status `baja`/`suspendido` no puede marcar asistencia.
  - Sin turno asignado para hoy no puede marcar asistencia.
  - Al registrar entrada el turno pasa a `activo`; al registrar salida pasa a `completado` (transacciÃ³n `$transaction`).
- **Soporte de turnos nocturnos que cruzan medianoche:** nuevo helper compartido `apps/api/src/common/utils/shift.ts` (`findCurrentShift`) — si el turno de hoy no existe, busca el turno nocturno del dÃ­a anterior (endTime â‰¤ startTime) aÃºn en curso. Usado en `attendance`, `gps` (ping) y `dashboard` (guard-hub).
- **UX simplificada para el guardia:**
  - Login redirige por rol: GUARD â†' `/m`, CLIENT â†' `/portal`, resto â†' `/`. El dashboard escribe `/` redirige a `/m` para el guardia (ya no ve paneles de administraciÃ³n).
  - MenÃº lateral filtrado por permisos reales: NAV_ITEMS mapean a `PERMISSIONS` de `@servicom/shared` y solo se muestran si el usuario los tiene (SUPER_ADMIN bypass). El guardia ya no ve el menÃº amplio.
  - PWA `/m`: el enlace "Escritorio" solo aparece con permiso `DASHBOARD_VIEW`; botones de entrada/salida deshabilitados segÃºn estado del dÃ­a; mensajes claros en espaÃ±ol ("Tu entrada quedÃ³ registrada. Â¡Buen turno!", "EstÃ¡s dentro de la zona de tu puesto. Todo en orden.", "No tienes un turno asignado para hoy. Pregunta a tu supervisor."); avisos por fuera de horario, salida anticipada o fuera de geocerca.
- **Pruebas:** nuevo `apps/api/test/attendance.e2e-spec.ts` (8 casos: entrada vÃ¡lida + turno activo, doble entrada, salida + turno completado, doble salida, salida sin entrada, suspendido, sin turno). Suite E2E completa: **25/25** (flow 10 + security 7 + attendance 8) verificada localmente y contra la API de producciÃ³n.
- **Desplegado en Render:** commit `5e6803c`, deploys API y Web en vivo, `/api/health` OK, `/m` 200.
- **Decisiones tomadas:** la polÃ­tica de geocerca sigue "permite con aviso" (no bloquea la marcaciÃ³n); NO se aÃ±adiÃ³ flujo de cambio de contraseÃ±a (la UI no forzaba `mustChangePassword` y no existe pÃ¡gina de cambio; el backend ya devuelve el indicador). El campo `address` sigue siendo obligatorio en `POST /guards`.

### MÃ³dulo de VIDEO OPERATIVO (2026-09-18)

- **Estado:** DESPLEGADO EN PRODUCCIÓN. Backend + web + PWA + pruebas E2E 17/17.
- **Backend reescrito** (`apps/api/src/modules/video/`): config del dispositivo, streams,
  fragmentos idempotentes por `seq`, manifest para live viewer, `end` → concatenación
  a WebM + grabación con expiración 48h, conserver como evidencia, URL firmada
  (descarga pública con firma HMAC, TTL 60 min), auditoría (`VideoAuditLog`,
  `VideoDownloadLog`), cron cada hora de expiración automática. Almacenamiento de
  objetos: driver local operativo, driver S3 documentado para producción.
- **Schema**: modelos `VideoFragment` (unique streamId+seq), `VideoAuditLog`; campos
  de contexto (service/post/site/client), config y evidencia en `VideoStream` y
  `VideoRecording`. Migración `20260918153104_video_operativo` aplicada local.
- **Permisos**: `VIDEO_EVIDENCE_PRESERVE` añadido (DIRECTOR, ADMIN, OPS, SUPERVISOR);
  permiso de descarga y delete para admin. Seed actualizado (94 permisos).
- **Frontend**: PWA `/m/video` con `getUserMedia` + MediaRecorder `timeslice`,
  cola offline IndexedDB (`lib/idb-video.ts`), GPS, upload de fragmentos numerados;
  `/video` (admin) con live viewer (MediaSource + LivePlayer), grabaciones con
  ver/descargar/evidencia/auditoría/eliminar. Web compilada y desplegada.
- **`render.yaml`**: envs de video (resolución, fps, bitrate, audio, fragmento,
  duración, MIME, TTL de firmas, expiración 48h).
- Documentación completa: `VIDEO_MODULE.md` (arquitectura, API, permisos, costos,
  almacenamiento, procedimiento de prueba Android).

## Despliegue en producción (Render, 2026-09-18)

- **API:** https://servicom-api.onrender.com — salud `/api/health`, Swagger `/docs` (OpenAPI 3.0, 136 endpoints), CORS habilitado para la Web.
- **Web:** https://servicom-web.onrender.com — Next.js exportado estÃ¡tico + `serve`, PWA (`/manifest.json`), login en `/login`, dashboard en `/`.
- **BD:** PostgreSQL gestionado en Render (`servicom-db`), migraciones aplicadas, seed idempotente en el arranque (`npm run prisma:seed --workspace @servicom/api`).
- **Decisiones tÃ©cnicas del despliegue:**
  - Build en Render con `npm ci --include=dev --no-audit --no-fund` (el lockfile debe incluir devDependencies).
  - `package.json` raÃ­z fija `engines.node = "22.x"` evitando TS 6 / `moduleResolution` removido.
  - El seed corre como parte del `startCommand` (los one-off jobs no estÃ¡n en el plan free).
  - `ts-node --transpile-only` para el seed (type-checking completo tardaba >60s en el free tier).
  - Almacenamiento de archivos en `/opt/render/project/src/data/{storage,videos}` (paths `/var/data` no escribibles en Render free).
  - Demo multiempresa: Empresa A (Grupo Servicom) y Empresa B (ProTotal Norte) aisladas por `companyId` (prueba de aislamiento pendiente de ejecutar contra producciÃ³n).
- **Cuentas y credenciales de infra:** la API key de Render y el token de GitHub usados para desplegar deben **revocarse/rotarse** al terminar la presentaciÃ³n; el repositorio puede volverse privado (Render conserva acceso a los repos pÃºblicos por URL).

### Fase A - Datos de presentaciÃ³n (2026-09-18)

- **Script nuevo** `apps/api/prisma/demo-data.ts` (npm `prisma:demo` / root `db:demo`): carga idempotente (upsert por clave Ãºnica; no borra ni modifica nada; fechas fijas 2025 para no desplazar a ABC Corp ni a los datos E2E de la primera pÃ¡gina). Ejecutado contra la BD local de la Empresa A.
- **Cartera demo (4 clientes en 4 estados):** Almacenes del Norte (Monterrey, NL), Plaza VÃ­a Dorada (Zapopan, JAL), Hospital San Rafael (CDMX) y Metal MecÃ¡nica BajÃ­o (QuerÃ©taro) — cada uno con contacto, contrato activo, servicio con tarifa/costo, instalaciÃ³n con geocerca y 2 puestos.
- **Guardias demo (9):** GU-101..GU-402 creados como "asignado" con `assignedClientId` exclusivo por cliente + historial `GuardAssignment` (asignaciÃ³n inicial). Turnos de hoy (9) programados **solo en puestos del cliente asignado** (regla de exclusividad respetada por el script).
- **Inventario demo:** 6 artÃ­culos (radios, chalecos, lÃ¡mparas, cÃ¡mara, uniforme, celular) + 5 asignaciones activas a guardias.
- **VerificaciÃ³n:** E2E local **40/40** tras la carga (la suite crea + aÃ±ade sus propios datos, la exclusividad y el aislamiento comercial se mantienen). Consulta por API: los 9 guardias demo aparecen con su cliente asignado; los turnos de hoy apuntan a los puestos demo.
- **Playbook de presentaciÃ³n** creado: `PLAYBOOK.md` (30-40 min, carteras demo por estado para escenario "una sola empresa con mÃºltiples clientes").

### Estado pendiente (Fase B/C recomendada)
- MÃ³dulo formal de vacaciones/permisos (solo `Guard.status="vacaciones"` + faltas en pre-nÃ³mina).
- Notificaciones reales: push mÃ³vil (WebPush/FCM) + correo SMTP.
- CatÃ¡logo Estados de MÃ©xico (hoy los sitios usan estados como texto libre).
- CFDI 4.0 ante SAT + nÃ³mina timbrada (Facturapi/SUMA).
- Pantalla web de "Empresas" (omitiÃ©ndose: se opera una sola empresa de seguridad; se documentÃ³ la decisiÃ³n).
- Backups automÃ¡ticos de la BD, streaming en vivo multicÃ¡mara, versiÃ³n final del video con geocerca en portal cliente.