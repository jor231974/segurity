# PROJECT_STATUS.md — Control de avance

Sistema Integral Web para Empresas de Seguridad Privada — Grupo Servicom

Última actualización: 2026-09-17 (Bloques 21-24: UX comercial completa, pruebas E2E automatizadas, preparación para producción y entrega/documentación)

---

## Estado general

| Bloque | Descripción | Estado |
|--------|-------------|--------|
| BLOQUE 1 | Infraestructura y arquitectura | TERMINADO (backend) |
| BLOQUE 2 | Base de datos y multiempresa | TERMINADO (backend) |
| BLOQUE 3 | Autenticación, usuarios y permisos | TERMINADO (backend) |
| BLOQUE 4 | Clientes, contratos y servicios | TERMINADO (backend) |
| BLOQUE 5 | Instalaciones, puestos y consignas | TERMINADO (backend) |
| BLOQUE 6 | Guardias y expedientes | TERMINADO (backend) |
| BLOQUE 7 | Turnos y programación | TERMINADO (backend) |
| BLOQUE 8 | Asistencia, GPS y geocercas | TERMINADO (backend) |
| BLOQUE 9 | Rondines | TERMINADO (backend) |
| BLOQUE 10 | Bitácora | TERMINADO (backend) |
| BLOQUE 11 | Incidencias | TERMINADO (backend) |
| BLOQUE 12 | SOS | TERMINADO (backend) |
| BLOQUE 13 | Supervisión | TERMINADO (backend) |
| BLOQUE 14 | Video en tiempo real | TERMINADO (backend) |
| BLOQUE 15 | Visitantes, vehículos y equipo | TERMINADO (backend) |
| BLOQUE 16 | Pre-nómina | TERMINADO (backend) |
| BLOQUE 17 | Facturación y cobranza | TERMINADO (backend) |
| BLOQUE 18 | Portal del cliente | TERMINADO (backend) |
| BLOQUE 19 | Reportes | TERMINADO (backend) |
| BLOQUE 20 | Auditoría y seguridad avanzada | TERMINADO (backend) |
| BLOQUE 21 | Optimización | TERMINADO (UX comercial completa) |
| BLOQUE 22 | Pruebas integrales | TERMINADO (E2E automatizadas 17/17) |
| BLOQUE 23 | Preparación para producción | TERMINADO (builds prod, .env, health, scripts, deploy verificado) |
| BLOQUE 24 | Documentación y entrega | TERMINADO (README, DEPLOYMENT actualizado, estado del proyecto) |

NOTA: "TERMINADO (backend)" = API REST implementada, compilada y verificada (login, /auth/me, Swagger, dashboard, clients, guards, sites, shifts, incidents, patrols, posts, consigns, training, vehicles, inventory, notifications, audit — todos 200). El aislamiento multiempresa quedó probado (Empresa B no ve datos de A). Frontend web (Next.js) creado y enlazado a las APIs reales (login, auth guard, dashboard, ~25 páginas de módulos con tablas + formularios reales de creación). PWA móvil (guardia/supervisor) y portal del cliente terminados (Bloque 21). Pruebas de integración E2E automatizadas 17/17 (Bloque 22). Los bloques 3-20 comparten toda la infraestructura (auth, permisos, validación, auditoría), por lo que su avance se refleja aquí en conjunto.

NOTA: La columna "backend" indica que la API REST está implementada y funcional. El frontend web (Next.js) ya está creado y conectado a las APIs reales. Los 24 bloques del Documento Maestro están completados; solo queda el material de demo/presentación y el mediaserver de streaming en vivo.

## Avance detallado

### TERMINADO
- Monorepo npm workspaces: `apps/api`, `apps/web`, `packages/shared`.
- `packages/shared`: permisos (~93), roles, constantes, schemas Zod, build + types.
- Backend NestJS completo con 30 módulos: auth, users, roles, companies, clients, contracts, sites, posts, consigns, guards, training, shifts, attendance, gps, patrols, logbook, incidents, sos, supervision, video, visitors, vehicles, inventory, prepayroll, billing, client-requests, notifications, reports, audit, dashboard.
- Schema Prisma v5.22 completo: 50 modelos, multiempresa (companyId), soft delete, auditoría, video con expiración 48h.
- Migración `20260916164653_init` aplicada a PostgreSQL local (`seguridad_db`).
- Seed de desarrollo ejecutado correctamente (Empresas A/B, 10 roles, 93 permisos, 4 usuarios demo, cliente, contrato, sitio, puestos, guardia, consigna, ruta de rondín, turno, tipos de incidencia, config).
- Generación de Prisma Client: OK (schema validado, 0 errores).
- Compilación TypeScript: OK (`tsc --noEmit`, 0 errores) tras corregir ~60 errores de tipos y relaciones.
- API verificada en `http://localhost:3001/api`: login 201, `/auth/me` 200, `/docs` (Swagger) 200.
- Endpoints verificados 200: dashboard, guards, sites, shifts, incidents, clients, patrols/routes, posts, consigns, training, vehicles, inventory, notifications, audit.
- Aislamiento multiempresa VERIFICADO: Empresa A ve su cliente "ABC Corp"; Empresa B (admin@prototal.com) NO ve datos de A.
- Correcciones de schema Prisma: relaciones reversas faltantes (31 errores P1012) resueltas; `Guard.userId @unique` (1:1); `ClientUser.userId @unique` (1:1); nombres de relación (`Supervisor`, `SosHandler`, `SupervisionSupervisor`, `InvoiceClient`, `ClientRequestRequester/Assignee`).
- Correcciones de código: includes inválidos (`vehicleResponsible`→`vehicles`, `responsible`→`responsibleGuard`, `shift` sos eliminado, `checkpoint`/`contract`/`client` con include correcto); `parseInt` con `string | undefined`; arrays `never[]` tipados; Prisma `select`+`include` conflictivo en users; import faltante `Body` en reports.controller; import de seed corregido a `@servicom/shared`.
- Frontend `apps/web` creado: Next.js 14 (App Router) + Tailwind CSS 3.4, TypeScript estricto.
- Frontend: cliente de API (`src/lib/api.ts`) con token JWT, login real (`POST /api/auth/login`), contexto de autenticación, guard de rutas `RequireAuth`, topbar con usuario/rol y cierre de sesión, sidebar con navegación por secciones (General, Comercial, Operación, Finanzas, Supervisión, Administración).
- Frontend: 28 rutas compiladas y servidas en `http://localhost:3000`: login, dashboard (kpis + turnos activos del API real), clients, contracts, sites, posts, guards, shifts, consigns, incidents, patrols, attendance, gps, visitors, vehicles, inventory, prepayroll, billing, supervision, video (streams + grabaciones), sos, logbook, notifications, audit, users, reports, client-requests, pending-approvals.
- Frontend: componentes reutilizables `DataTable` (listado + paginación real cuando el endpoint la soporta, badges de estatus) y `EntityModal` (formulario de creación real POST): clientes, contratos, sitios, puestos, guardias, turnos, consignas, visitantes, vehículos, inventario, usuarios.
- Build de producción frontend OK (`next build`): 28 rutas estáticas generadas sin errores de tipos.
- CORS verificado del navegador (localhost:3000) hacia la API (localhost:3001): preflight 204, métodos GET/HEAD/PUT/PATCH/POST/DELETE.
- Flujo end-to-end frontend→API verificado con token real: `/auth/me` (usuario), `/dashboard` (kpis), `/clients`, `/guards`, `/sites`, `/shifts` — todos responden datos de la Empresa A.
- PWA móvil (guardia) creada bajo rutas `/m*`: layout móvil con bottom-nav (Inicio, Consignas, Mi ubicación, SOS), viewport de dispositivo, manifest.json, service worker (`/sw.js` con caché de app shell), iconos generados (192/512).
- PWA móvil — acciones reales del guardia conectadas al API: `POST /attendance` (entrada/salida con geolocalización + validación de geocerca), `POST /gps/ping` (reportar ubicación), `POST /sos` (alerta SOS), `GET /consigns/mine` (mis consignas), `GET /attendance/my-today` (mi turno y asistencias).
- Como parte de la PWA se habilitó soporte offline: cola de sincronización en `src/lib/offline.ts` (localStorage + reintentos + sincronización automática al reconectar por evento `online`/`offline`).
- Corrección backend: `consigns/getMyConsigns` ahora toma turnos con status `activo` o `programado` (antes el guardia no veía consignas si su turno estaba "programado"). Verificado: `/consigns/mine` del guardia demo devuelve su consigna.
- Rutas móviles verificadas 200 en dev: `/m`, `/m/consignas`, `/m/gps`, `/m/sos`.
- PWA guardia probada de punta a punta contra la API real: entrada registrada (`POST /attendance`) con geocerca evaluada (`geofenceResult: dentro`), turno del día y consignas cargadas desde `guard-hub` y `/consigns/mine`.
- PWA supervisor creada: layout móvil propio (`/ms`), tarjetas de guardias con última ubicación (`/guards/map`), posiciones reales (`/gps/positions`), alertas SOS (`/sos` con atender/cerrar), registro de visita de supervisión (`POST /supervision` con checklist y geoposición). Rutas `/ms`, `/ms/guardias`, `/ms/posiciones`, `/ms/sos` verificadas 200.
- Flujo SOS validado de punta a punta: guardia activa (status=activa) → supervisor atiende (ack → atendida) → cierra (→ cerrada).
- PWA móvil del guardia ampliada con Rondín, Bitácora e Incidencias: páginas `/m/rondin`, `/m/bitacora`, `/m/incidentes` verificadas 200. Backend ampliado con endpoints scoped al guardia: `GET /patrols/routes/mine` (rutas del sitio del turno actual + `lastCheckIn` por checkpoint), `GET /logbook/mine`, `GET /incidents/mine`.
- Corrección backend: `incidents.service.create` lanzaba 500 cuando el guardia creaba incidencia sin `typeId` (`findUnique({ where: { id: undefined } })` → `PrismaClientValidationError`). Corregido haciendo la consulta condicional. Verificado: guardia crea incidencia (type=otra, status=abierta) y check-in de rondín (result=ok, reflejado en `routes/mine`).
- Portal del cliente terminado (backend + frontend): rol CLIENT con permisos `client.portal.access`/`client.request.create`/`client.request.view`, usuario demo `cliente@abccorp.com / Cliente123!` vinculado a ABC Corp (seed + script `add-client-user`), endpoint `GET /clients/mine` (contratos, instalaciones, contactos, `_count`), páginas `/portal`, `/portal/solicitudes`, `/portal/sitios` (verificadas 200). Flujo validado: cliente crea solicitud → admin responde (`en_proceso`) → cliente ve respuesta y asignado. `RequireAuth` ahora soporta restricción por rol.

### OPTIMIZACIÓN UX COMERCIAL (Bloque 21, 2026-09-16/17) — REDISEÑO COMPLETO DEL FRONTEND
- **Base visual (`tailwind.config.ts` + `globals.css`):** paleta `primary` azul acero (600 `#3558c9`, escala 50-900), sombras `card/pop/lift/drawer`, animaciones `fadeIn/slideIn/toastIn/shimmer/pulseSoft`; clases utilitarias `.btn` (primary/secondary/outline/danger/ghost/sm/lg/icon), `.input`, `.input-icon`, `.label`, `.card`, `.card-hover`, `.table`, `.badge`, `.chip`, `.skeleton`, `.nav-link`, `.scrollbar` refinado, sidebar/topbar/móviles con estilos propios.
- **Sistema de iconos** `src/components/icons.tsx`: 45+ iconos SVG inline (dashboard, users, building, shield, camera, map-pin, gps, alert, sos, video, calendar, wallet, bell, search, download, logout, chevron, sos, clock, document, etc.) + componente `Icon` con tipo `IconName` y registro `ICONS`.
- **Capa de feedback profesional:** `ToastProvider`/`useToast` (success/error/info auto-dismiss) y `ConfirmProvider`/`useConfirm` (confirmaciones con variante danger) montados en `app/layout.tsx`; mensajes de error amigables en español (`friendlyError`) en EntityModal y login (401/403/409/400/404/network).
- **Componentes nuevos:** `KpiCard` (tonos + iconos), `EmptyState`, `Donut` (anillo SVG de progreso), `PageHeader` (con icono y acciones), `StatusBadge` (más estados, punto + ring), `DataTable` reescrito (búsqueda cliente-side, botón refresh con spinner, skeleton rows, EmptyState con descripción, paginación pulida, prop `hideHeader`), `EntityModal` pulido (toast al guardar, `description`/`successMessage`, errores amigables).
- **Layout administración** `app/(dashboard)/layout.tsx`: sidebar con secciones e iconos, drawer móvil, topbar con hamburguesa/bell/chip de usuario/cierre de sesión, `main` centrado `max-w-[1440px]`.
- **Dashboard `/`:** saludo dinámico + reloj, KPIs reales (Guardias/Cobertura/Incidencias/SOS con ping), alertas de administración (documentos por vencer, facturas vencidas con saldo), donut de cobertura, turnos activos, accesos rápidos y resumen clientes/servicios — todo desde `/dashboard`.
- **Login `/login`:** split-screen con panel de marca e iconos, mostrar/ocultar contraseña, cuentas demo con credenciales reales, errores en español.
- **PWA guardia `/m*`:** bottom-nav de 5 tabs con iconos; home app-like con hero "Mi turno", entrada/salida con GPS, grid de acciones (Rondín, Bitácora, Incidencias, Video, Consignas, SOS), lista de registros del día, tarjeta de ubicación y cola offline visible.
- **PWA supervisor `/ms*`:** radar operativo (guardias en turno, conexión, puestos descubiertos, incidencias, SOS), links rápidos, visita de supervisión con checklist; SOS con confirmación (danger + toast) y botones Atender/Cerrar por alerta.
- **Portal cliente `/portal*`:** tarjeta de empresa, tiles de acceso, CTA de nueva solicitud, servicios, instalaciones y contacto principal — datos reales de `/clients/mine`.
- **Páginas de módulos con encabezado de icono:** guards, clients, incidents, sos, video, prepayroll con `PageHeader`; video admin con toasts de descarga y Estado "En vivo" pulsante; prepayroll con manejo de duplicado (mensaje amigable en vez de `alert()`).
- **PULIDO COMPLETO DE TODAS LAS PÁGINAS CRUD/RESTO (2026-09-17):** 20 páginas más con `PageHeader` con icono + `hideHeader` en DataTable + `emptyDescription`: contracts, shifts, sites, users (con nuevo botón), billing, consigns, visitors, vehicles, inventory, gps, attendance, audit, posts, patrols, logbook, notifications (marcar leídos con toast), reports (secciones en tarjetas), supervision, client-requests, pending-approvals. **Mejoras funcionales:** `attendance` ahora tiene selector de fecha real (antes fecha hardcodeada) sin tocar el backend; `StatusBadge` ampliado con mapeos `pagado/completo/cumple/no_cumple/sin_datos/expirada/paid`; botones `.btn-sm` con icono en video.
- **VERIFICADO (2026-09-17):** `next build` OK 46/46 rutas, `npm run lint` 0 problemas (web+api), `npm test` 34/34 OK, TODAS las rutas web 200 (`/`, `/login`, `/m`, `/ms`, `/portal` + 20 de administración), `/api/health` OK (envelope `{success,data}`) y login real OK (envelope `{success,data}` con `roleCodes` + `permissions`). Corregido: import `./icons` → `../icons` en componentes `ui/*`; cache obsoleta del dev server reiniciada (el enclave `shadow-card` sí existe en la config; el 500 era caché vieja de Tailwind). **HALLAZGO:** `next build` y `next dev` NO pueden correr simultáneamente (comparten `.next` → `PageNotFoundError` falso "Cannot find module for page: /billing"); detener dev antes de build.

### PRUEBAS DE INTEGRACIÓN E2E AUTOMATIZADAS (Bloque 22, 2026-09-17)
- **Suite Jest HTTP contra la API REAL** (`npm run test:e2e --workspace @servicom/api`): 17/17 verdes en ~20 s. Requiere la API levantada en `:3001` con BD con seed.
  - `apps/api/test/jest-e2e.json`: config (node, ts-jest, `maxWorkers: 1`, `testTimeout` alto, delays ~90 ms por request para no tocar el rate limit de 100 req/min).
  - `apps/api/test/helpers.ts`: wrapper `Api` (token, `get/post/put/del/req raw`), `login`, `suffix()`, `rfc()`, `isoDate()`, `dataOf`, `cleanup` best-effort de datos E2E (marcados `E2E-<timestamp>`; video vía `PUT /video/recordings/:id/delete`).
  - `apps/api/test/flow.e2e-spec.ts` (10 tests) — **FLUJO INTEGRAL AUTOMATIZADO completo:** autenticación de los 4 perfiles → cliente/contrato/instalación (geocerca)/puesto → guardia con usuario propio + duplicado 400 → ruta de rondín, turno, entrada `dentro` de geocerca, GPS, check-in, bitácora, incidencia, `/guards/me` → video real (stream → chunk 4096 B → end `sizeBytes=4096` → listar → eliminar) → SOS (activa→ack→cerrada) → supervisión con checklist → pre-nómina `generate` + reportes → portal cliente (mine, solicitud, responder, mine) → aislamiento Empresa B (no ve E2E; acceso directo → 403).
  - `apps/api/test/security.e2e-spec.ts` (7 tests): 401 sin token, 400 para UUID inválido, RBAC CLIENT 403 en módulos admin, RBAC GUARD 403 (solo `/guards/me` 200), aislamiento B vs ABC Corp (403 directo), scoped del portal, payloads inválidos → 4xx (nunca 500).
- **ER-CORREGIDOS por la suite E2E (backend real, no simulación):**
  - `clients.service.create`: sin `legalName`/`commercialName` devolvía **500** (Prisma). Ahora 400 con mensaje claro.
  - `sites.service.create`: sin `clientId`/`name` rompía el `findFirst` con `id: undefined` → **500**. Ahora 400 explícito.
  - `GET /guards/me` devolvía **403** con un guardia creado (rol GUARD no tiene `guards.view`, pero el endpoint es el expediente propio del guardia). Se siguió el patrón self de `/gps/ping`: se retiró `@Permissions` del route y se conserva el chequeo `user.guardId` del service (404 si no aplica). Sin fuga de datos (scoped por token, no expone a otros guardias).
  - Pre-nómina: la generación es `POST /prepayroll/generate` (no `POST /prepayroll`), detalle hasta ahora no usado; la suite documenta la ruta real.
  - `reports/attendance` y `reports/shifts` devuelven objeto `{total, records,...}` (no array): asserts adaptados.
- **BUILD DE API ESTABILIZADO:** `nest build` con `incremental:true` + `deleteOutDir:true` dejaba `dist` VACÍO (tsbuildinfo stale saltaba la emisión, exit 0 sin salida). Solución permanente en `apps/api/tsconfig.build.json`: `"incremental": false` + `tsBuildInfoFile` fuera del dist. Verificado: `dist/main.js` presente tras `npm run build:api`, API levantada y health OK.
- **Siguen 34 unit tests intactos** (7 api + 27 shared) + suite E2E 17/17; `npm run lint` Web+API 0 problemas.

### PREPARACIÓN PARA PRODUCCIÓN Y ENTREGA (Bloques 23-24, 2026-09-17)
- **Verificación en modo producción:** API compilada (`npm run build:api` → `dist/main.js`) levantada con `npm run start:prod:api` → `/api/health` OK, login real OK, `/auth/me` OK, `/dashboard` OK (guards/coverage/incidents/sos/alerts/activeShifts). Web PRECOMPILADA (`npm run build:web`, 46 rutas) servida con `next start`: **43/44 rutas 200** en servidor de producción (el único 404 es `/dashboard`, que no existe: el dashboard es `/`), incluidas `/m*`, `/ms*` y `/portal*`.
- **`.env.example` al día** (api: DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, API_PORT, CORS_ORIGINS, STORAGE_PATH, VIDEO_STORAGE_PATH, MAX_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_MINUTES, VIDEO_EXPIRATION_HOURS, NODE_ENV; web: NEXT_PUBLIC_API_URL). Consumo real verificado vía `ConfigService` (CORS_ORIGINS, API_PORT, JWT_*, NODE_ENV, VIDEO_*).
- **Seed confiable en producción:** `prisma/seed.ts` ahora carga `.env` automáticamente (`import 'dotenv/config'`) — antes fallaba si `DATABASE_URL` no estaba en el shell del proceso.
- **PENDIENTE PRODUCTO detectado por la puerta final (resuelto):** asistencia/dashboard calculaban "hoy" con fecha **UTC** (`toISOString`) mientras los turnos se agendan en hora **local** → en la frontera del día (UTC pasa a mañana) el guardia no podía registrar entrada ("No tiene turno programado para hoy"). Corregido con helper `localDateStr` (fecha local YYYY-MM-DD) en `attendance.service.ts` (myToday + create) y `dashboard.service.ts` (getOverview + guard-hub). La suite E2E ahora es DETERMINISTA a cualquier hora.
- **Puerta final (todo verde):** E2E 17/17 (2 corridas consecutivas tras el fix), unitarios 27 (shared) + 7 (api), `npm run lint` 0 problemas api+web, builds de producción api+web OK.
- **Documentación de entrega (Bloque 24):**
  - `README.md` raíz creado: descripción, módulos, stack, estructura, puesta en marcha, cuentas demo, pruebas y enlaces a docs.
  - `DEPLOYMENT.md` actualizado: envelope real de `/api/health`, Swagger en `/docs`, respaldo de `VIDEO_STORAGE_PATH`, suite `test:e2e`, nota del streaming en vivo pendiente.
  - `PROJECT_STATUS.md` al día (este archivo).

### DESPLIEGUE GRATUITO DE DEMOSTRACIÓN PREPARADO (2026-09-17)
- **Web ahora es exportación estática:** `apps/web/next.config.mjs` → `output: 'export'`. La app es 100% SPA (`use client`, sin `next/image`, sin `useSearchParams`, sin middleware) → 46 rutas prerenderizadas en `apps/web/out/` con PWA completa (`sw.js`, `manifest.json`, iconos). Permite hostear la web en un static site gratis (Render), sin servidor.
- **`render.yaml` creado** (blueprint Render): `servicom-api` (web service free, NestJS con `prisma migrate deploy` en el arranque), `servicom-web` (static site free, publica `apps/web/out`), `servicom-db` (PostgreSQL free). Variables sensibles con `sync: false` (DATABASE_URL, JWT_SECRET, CORS_ORIGINS, NEXT_PUBLIC_API_URL).
- **`DEPLOYMENT.md` sección 8b:** pasos exactos del despliegue gratuito sin dominio (blueprint → variables → seed vía Shell del dashboard → verificación `/api/health`) y limitaciones del plan free (spin-down 15 min, disco efímero para videos, BD 1 GB expira a los 30 días).
- **Build estático verificado localmente:** `next build` con `output: 'export'` genera `apps/web/out` sin errores (todas las rutas `○` estáticas).
- **Pendiente de cuentas del propietario (bloqueador único):** crear repo GitHub + cuenta Render para ejecutar el deploy (ver Next Move).

### PRUEBAS DE INTEGRACIÓN REALIZADAS (2026-09-16)
- **FLUJO INTEGRAL COMPLETO validado (2026-09-16):** Empresa A (admin@gruposervicom) → nuevo cliente (Transportes Aguilera, con contacto `position`) → nuevo sitio/instalación (Planta Aguilera) → nuevo contrato CTR-2026-046 con servicio (guardCount/tariff/startDate) → nuevo puesto (Caseta Principal) → nuevo guardia (Carlos Ramirez GU-010, login real con credenciales creadas) → nuevo turno programado → entrada con GPS dentro de geocerca (`geofenceResult: dentro`, `status: fuera_de_horario` porque 18:33 > fin turno 18:00 — correcto) → GPS ping (`geofenceStatus: dentro`) → rondín checkin en ruta de otro sitio (`result: fuera_de_ruta` — validación correcta) → bitácora (title+description) → incidencia (`status: abierta`) → supervisión por supervisor demo (visita con checklist) → pre-nómina (periodo mes actual: primero 400 "ya existe" por duplicado, comportamiento correcto) → reportes (attendance/patrols/logbook OK) → portal cliente (cliente@abccorp contratos=1 sitios=1).
- **Aislamiento multiempresa RE-VERIFICADO (2026-09-16):** Empresa B (admin@prototal.com) ve 0 en clients/sites/contracts/shifts; acceso directo por ID de cliente o sitio de Empresa A → 403 "Acceso denegado".
- **Video — ALMACENAMIENTO REAL DE OBJETOS implementado (Bloque 14, 2026-09-16).** Antes el flujo era solo metadatos (`sizeBytes: 0`, `filePath` sin archivo, TODO pendiente de borrado físico). Ahora:
  - `video-storage.service.ts`: capa de almacenamiento de objetos desacoplada (local fs bajo `VIDEO_STORAGE_PATH`, estructura `uploads/`+`recordings/`, límite de 25 MB por chunk, `safeResolve` anti path-traversal). Sustituible por S3 sin tocar el service.
  - `POST /video/streams/:id/chunk` (raw body `application/octet-stream`, body parser raw con límite 30 MB en `main.ts`): el guardia sube chunks reales de la cámara (MediaRecorder) mientras transmite; se acumulan en disco y se devuelve `totalBytes` real.
  - `endStream` ahora finaliza el archivo físico (mover `uploads/*.part` → `recordings/<streamId>.webm`), persiste `sizeBytes` REAL (BigInt del `stat`) y usa `VIDEO_EXPIRATION_HOURS` desde config.
  - `GET /video/recordings/:id/file` (nuevo): streaming controlado del archivo con auth + permiso `video.recording.download`, valida 404/expiración/tenant, `Content-Length` real, `Content-Disposition`, y registra `VideoDownloadLog` (auditoría por descarga).
  - `deleteRecording` y cron de expiración ahora eliminan TAMBIÉN el archivo físico.
  - **Validado de punta a punta:** guardia login → `POST /streams` (transmitiendo) → sube 2 chunks (60004 y ~30000 bytes) → almacena/`totalBytes` → `PUT end` (sizeBytes REAL = 274181, exp +48h) → archivo físico existe en `storage/videos/recordings/*.webm` → admin listar (1) → descarga `[id]/file` = 274181 bytes descargados → guardia intenta descargar = 403 (permiso correcto) → inexistente = 404 → `delete` borra registro + archivo físico (verificado `Test-Path` = False). Datos de prueba limpiados.
  - Frontend: página móvil `/m/video` del guardia con cámara REAL (`getUserMedia` + `MediaRecorder` webm, chunk cada 5s subido al backend, reset de temporizador, botón detener → `end`). Página admin `/video` mejorada: columnas correctas (guardia, instalación, duración s, tamaño KB/MB, expiración en horas, contador de descargas) y botón "Descargar" que baja el archivo real con token y recarga la tabla (`refreshKey` agregado a `DataTable`).
- **PRUEBAS UNITARIAS IMPLEMENTADAS (Bloque 22, 2026-09-16):** `npm test` ahora funciona en todo el monorepo (antes fallaba: api "No tests found", shared "No tests yet").
  - API (7 tests): `geo.spec.ts` — haversine (0 distancia, CDMX–GDL ~460 km real, simetría), isInsideGeofence (dentro, borde exacto, fuera, sin geocerca). Config: `apps/api/jest.config.js` (ts-jest, solo `src/**/*.spec.ts`, excluye dist).
  - Shared (27 tests): `schemas.test.ts` (login/email/password/createUser/contract UUID/guard CURP+RFC/attendance/incident/vehicle) y `permissions.test.ts` (permisos únicos con formato `modulo.accion`[+partes], video.permissions completos, 10 roles, SUPER_ADMIN=ALL, sin permisos huérfanos, GUARD sin billing, CLIENT sin handle).
  - Fixed: ts-jest type error en `permissions.test.ts` (`Set` tipado como `Set<string>`); imports de tests corregidos a `./`; `tsconfig.build.json` de shared excluye `**/*.test.ts` para que no entren al dist.
- **ESLint ARREGLADO en todo el monorepo (2026-09-16):** `npm run lint` funcionaba a medias (script heredado referenciaba `eslint` no instalado; el anterior `@nestjs/eslint-plugin` no existe en el registry → 404). Instalado `eslint@8` + `@typescript-eslint/*@7` en api (config `.eslintrc.js` estándar NestJS) y `eslint@8` + `eslint-config-next@14.2.5` en web (`.eslintrc.json` con `next/core-web-vitals`). Corregidos 0 errores + 17 warnings: `require()` dinámicos de `common/utils/geo` → imports estáticos (gps, patrols, attendance), imports de decoradores/`@nest` no usados (app.module, auth.service, main.ts, billing, companies, consigns, notifications, prepayroll, roles, sos, video), `txn`/`companyId`/`body`/`resolution` sin usar (param `resolution` retirado del cierre de SOS — no hay columna en schema). Resultado: `npm run lint` → 0 problemas en api y web.
- **Build de producción API CORREGIDO (2026-09-16):** `npm run build:api` emitía en `dist/src/main.js` (no `dist/main.js`) porque `tsconfig.json` incluía `prisma/**/*` → rootDir pasaba a repo root. El script `start:prod` (`node dist/main`) y `start:prod:api` fallarían en producción. Solución: `tsconfig.build.json` con `rootDir: ./src` + include solo `src`. Verificado: `dist/main.js` existe tras `nest build`.
- **DEPLOYMENT.md creado (Bloque 24, 2026-09-16):** guía completa de instalación en servidor nuevo (requisitos, PostgreSQL, install, `.env`, migraciones+seed, build, ejecución npm/systemd, Nginx+WebSocket para WebRTC, verificación con `/api/health`, desarrollo local, tabla de scripts root). `.env.example` de api/web ya cubrían todas las variables de producción.
- **Preparación para producción (Bloque 23, 2026-09-16):** endpoint `GET /api/health` creado (verifica conexión BD con `SELECT 1`, devuelve status/version/environment/database/timestamp) → `{"status":"ok","database":"ok"}`. Build de producción verificado: `npm run build:api` (nest build, OK) y `npm run build:web` (next build, todas las rutas OK). Scripts root agregados: `start:prod:api`, `start:prod:web`, `db:deploy` (prisma migrate deploy).
- **Seguridad (Bloque 20):** rate limiting activado (`ThrottlerGuard` global, 100 req/min, verificado 429 en ráfaga). Bloqueo por intentos fallidos: 5 fallos en cuenta real → 401 "Cuenta bloqueada 30 min"; login correcto también bloqueado durante el candado. Emails inexistentes NO bloquean (evita enumeración de usuarios, comportamiento correcto). Helmet activo.
- **Video (Bloque 14):** `GET /video/streams`, `/video/recordings` → 200 vacíos; grabación inexistente → 404; download-url inexistente → 404; assign-incident inexistente → 404; guardia sin permiso listar → 403. Expiración 48h con cron `EVERY_HOUR` y soft-delete. **AMPLIADO A ESCRITURA (2026-09-16):** `POST /video/streams` (guardia inicia transmisión, requiere `video.live.start`, vincula turno actual), `PUT /video/streams/:id/end` (finaliza y crea grabación con expiración 48h, duración, resolución, latitud/longitud). Flujo validado completo: iniciar (transmitiendo) → finalizar (grabación 2s, exp 48h) → listar (admin) → detalle (size/exp) → asignar a incidencia → URL de descarga temporal (60 min, registra log) → eliminación lógica → ramificar listado. Grabaciones limpiadas después de pruebas.
- **Visitantes/vehículos/inventario (Bloque 15):** visitantes GET/inside/404; POST con `fullName`+`siteId` real → 201; salida (`exit`) → OK; salida duplicada → 400. Vehículos GET/expiring/404; POST → 201; PUT actualiza. Inventario POST radia → 201; serial duplicado → 400. Campos correctos: visitante `identification` (no `documentNumber`), vehicle `plates` (no `plate`), inventario `type` (no `category`).
- **Turnos/asistencia (Bloque 7-8):** `GET /shifts` → 1; `GET /shifts/coverage?date=` OK (2 puestos). `GET /attendance` → 1; `attendance/my-today` como guardia → registros+turnos del día; como admin → 403 (permiso correcto); `attendance/summary` guardia → 403.
- **SOS (Bloque 12):** POST sin GPS → 400 (validación correcta); con GPS → 201 `activa`; ack admin → `atendida`; close → `cerrada`. Flujo completo OK.
- **Supervisión (Bloque 13):** GET → 1; POST con admin → 403 (permiso `supervision.create` es de rol SUPERVISOR, correcto).
- **Contratos/sitios/consignas (Bloque 4-5):** contratos GET/detail/services/profitability OK; sitios GET/map OK (1); posts GET OK (2); consignas GET/mine guardia OK, ack → `acked=true`.
- **Guardias/entrenamiento (Bloque 6):** `GET /guards` paginado `{total,page,limit,items}` (1 guardia); guard detail OK; training POST con `courseName`/`instructor`/`trainingDate`/`durationHours` → 201; campos faltantes o fecha inválida → 400.

### BUGS ENCONTRADOS Y CORREGIDOS EN ESTAS PRUEBAS
- `shifts/events` sin `from/to` o `coverage` sin `date` → 500 (`new Date(undefined)` → Invalid Date). Ahora 400 con mensaje claro; rango invertido → 400. (shifts.service.ts)
- `training.create` lanzaba 500 si faltaba `instructor`/`durationHours`/`trainingDate` (Prisma requería los campos y el body no se validaba). Ahora 400 explícito con listado de campos requeridos; fecha inválida → 400. (training.service.ts)
- **HALLAZGO (resuelto):** `vehicles.service.create` e `inventory.service.create` hacían `...body` completo: un campo arbitrario no existente en el modelo causaba 500. Corregido con spread selectivo de campos del modelo; los campos extra ahora se ignoran (whitelist) y no rompen la petición.

### PENDIENTE
- Servidor de medios WebRTC con fan-out en vivo (la captura real vía MediaRecorder + chunks ya funciona; falta el streaming multicámara en vivo estilo "monitor" servido a supervisores — alternativa: integrar un mediaserver como mediasoup/Janus cuando haya infraestructura).
- Ejecutar el despliegue gratuito de demostración (Render): requiere cuenta de propietario en GitHub y Render (los archivos `render.yaml`, export estático y documentación ya están listos).
- Demo/presentación final ante el cliente (material de demostración).

## Decisiones técnicas

| Decisión | Valor | Justificación |
|----------|-------|---------------|
| Monorepo | npm workspaces | Un solo repositorio, dependencias compartidas |
| Backend | NestJS + TypeScript | Estructura modular profesional, inyección de dependencias |
| ORM | Prisma | Tipado, migraciones, seguridad por defecto |
| Base de datos | PostgreSQL 17 (local) / Docker (prod) | Documento Maestro §48 |
| Frontend web | Next.js 14 (App Router) + Tailwind CSS | SSR, SEO, rendimiento |
| Móvil | PWA sobre Next.js (guardia/supervisor) | Documento Maestro §48 — decisión técnicamente justificada: un solo código base, WebRTC funciona en navegador móvil, offline con Service Worker + IndexedDB |
| Validación | Zod | Schema-first, compartido backend/frontend |
| API | REST + Swagger OpenAPI | Interoperabilidad, documentación automática |
| Video | WebRTC + archivos chunked + almacenamiento local de objetos + FFmpeg (si disponible) | Sin dependencia de infraestructura externa en desarrollo |
| Mapas | Capa desacoplada (`MapProvider` interface) con implementación Leaflet/OSM gratuita | Sustituible por Google Maps/Mapbox sin reescribir |

## Errores/correcciones

- (resueltos) 31 errores de relaciones Prisma (P1012): relaciones reversas faltantes, 1:1 sin @unique, nombres de relación de doble FK.
- (resueltos) ~60 errores TypeScript: tipos `string | null` en where(companyId), includes inexistentes, arrays `never[]`, `select`+`include` (Prisma), import `Body` faltante, caracteres corruptos en seed.
- (resueltos) incidents.service 500 al crear incidencia sin typeId: `findUnique({where:{id:undefined}})` → condicional.
- (resueltos) shifts/events y coverage 500 sin fechas: validación `from/to`/`date` requeridos + fecha inválida + rango invertido → 400.
- (resueltos) training.create 500 con campos requeridos ausentes: validación explícita `guardId/courseName/instructor/durationHours/trainingDate` → 400.
- (resueltos) `...body` sin filtrar en create de vehicles/inventory: campo arbitrario causaba 500. Ahora se hace spread selectivo de campos del modelo; los campos extra se ignoran (whitelist implícito) y no rompen la petición.
- (resueltos) clients.create con contacto usando campo `role` (inexistente en ClientContact, el correcto es `position`) → 500. Ahora documentado: los contactos usan `name/position/phone/email`.
- (resueltos) patrols.checkIn sin `checkpointId` → 500 (`findUnique({where:{id:undefined}})`). Ahora 400 "checkpointId requerido".
- (resueltos) `VideoRecording.sizeBytes` es BigInt: cualquier endpoint que devolviera una grabación (listar, detalle, asignar incidencia, eliminar) fallaba con 500 por serialización JSON. Normalizado con helper `bigIntToNumber` en el service (todos los retornos de `VideoRecording`). Verificado: listar/detalle/assign/delete OK.
- (resueltos) lint roto: `eslint` no estaba instalado en ningún workspace; además se intentó instalar un paquete inexistente (`@nestjs/eslint-plugin`, 404 en registry). Instalado el stack real (typescript-eslint / eslint-config-next) y configurados ambos workspaces.
- (resueltos) `require()` dinámicos en gps/patrols/attendance service (cargaban `utils/geo` en runtime): convertidos a imports estáticos.
- (resueltos) build de producción API emitía en `dist/src/main`: `rootDir` del compilador se movía al repo root por incluir `prisma/**/*`. Aislado en `tsconfig.build.json` (`rootDir: ./src`, include solo `src`) → `dist/main.js` correcto.
- (resueltos) tsbuildinfo stale: tras crear `tsconfig.build.json`, el cache incremental (`apps/api/tsconfig.build.tsbuildinfo`) apuntaba a rutas antiguas y el build emitía solo 1 archivo. Borrar el tsbuildinfo + dist al cambiar config de compilación.
- (resueltos) `saveChunk` 400 "Chunk vacío" con `application/octet-stream`: NestJS `rawBody` NO se captura para content-types sin body-parser; hay que registrar `app.useBodyParser('raw', { type: 'application/octet-stream' })` en `main.ts` y leer `req.body` (Buffer).
- (resueltos) descarga devolvía 404: `safeResolve` unía `filePath` (ya contiene `recordings/`) a `recordingsDir` (duplicaba `recordings/recordings/`). Ahora resuelve contra `root` con protección de path traversal.
- (resueltos, 2026-09-17, E2E Bloque 22) `clients.create` y `sites.create` devolvían 500 con campos requeridos ausentes (`legalName/commercialName`, `clientId/name`): validación explícita → 400.
- (resueltos, 2026-09-17, E2E Bloque 22) `GET /guards/me` daba 403 al guardia creado (rol GUARD sin `guards.view`): route sin `@Permissions` siguiendo el patrón self de `/gps/ping`, con chequeo `user.guardId` en el service.
- (resueltos, 2026-09-17) `nest build` podía emitir `dist` vacío con exit 0 (`incremental:true` + `deleteOutDir:true` con tsbuildinfo stale): `"incremental": false` + `tsBuildInfoFile` fuera de dist en `tsconfig.build.json`.
- (resueltos, 2026-09-17, puerta final Bloque 23) "hoy" en UTC vs turnos agendados en local: asistencia/dashboard usaban `toISOString().slice(0,10)`. Corregido con helper de fecha local (`localDateStr`) en `attendance.service.ts` y `dashboard.service.ts`; la antigua frontera horaria rompía el registro de entrada del guardia por la noche.
- (resueltos, 2026-09-17) `prisma/seed.ts` no cargaba `.env` (el cliente Prisma no lo carga solo): `import 'dotenv/config'` — permite `npm run db:seed` en un servidor nuevo sin exportar `DATABASE_URL`.

## Pendientes / notas

- `npm run lint` FUNCIONA (resuelto 2026-09-16): eslint instalado y configurado en api (`.eslintrc.js` typescript-eslint) y web (`.eslintrc.json` `next/core-web-vitals`); 0 problemas en ambos. Ver detalles en "PRUEBAS DE INTEGRACIÓN REALIZADAS".
- `npm run start:prod` FUNCIONA (resuelto 2026-09-16): `tsconfig.build.json` creado con `rootDir: ./src` para que `nest build` emita en `dist/main.js` (antes emitía `dist/src/main.js`). **2026-09-17:** añadido `"incremental": false` + `tsBuildInfoFile` fuera de dist para evitar que el cache stale dejara el dist vacío con exit 0.
- `npm run test:e2e --workspace @servicom/api` FUNCIONA (Bloque 22, 2026-09-17): 17/17 contra API en `:3001`; requiere BD con seed y la API levantada (el suite no levanta el servidor).
- PostgreSQL 17 instalado localmente (C:\Program Files\PostgreSQL\17), servicio `postgresql-x64-17` activo.
- Credenciales BD prisma: `postgresql://postgres:postgres@localhost:5432/seguridad_db?schema=public`.
- Seed requiere `DATABASE_URL` en entorno (el `.env` de apps/api no lo carga automáticamente en el script `db:seed`); ver nota en Next Move.

## Stack del entorno de desarrollo

- Node.js v24.19.0
- npm 11.17.0
- PostgreSQL 17
- Git 2.55.0
- Prisma CLI 5.22.0

## Siguientes pasos inmediatos (Next Move)

1. **Despliegue gratuito de demostración (Render, sin dominio):** el código está listo (`render.yaml`, web estática `output: 'export'`, build verificado, DEPLOYMENT.md §8b). Bloqueado solo por cuentas del propietario: (a) subir el repo a GitHub, (b) crear cuenta en render.com, (c) New → Blueprint → configurar 4 variables (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`) → deploy. Al quedar activo vestigar `/api/health` + demo con cuentas del seed.
2. Demo/presentación final con los 4 perfiles (admin, supervisor, guardia, cliente) usando las cuentas demo del seed.
3. Pendiente técnico de video: mediaserver para streaming en vivo multicámara (alternativa: mediasoup/Janus) cuando haya infraestructura.
4. Mantenimiento: revisar dependencias (npm audit) y respaldos de BD + `VIDEO_STORAGE_PATH` en producción.