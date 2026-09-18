# Sistema Integral de Seguridad Privada — Grupo Servicom

Plataforma web profesional (multiempresa) para empresas de seguridad privada: comercial, operación, supervisión, guardia en campo, video, facturación y portal del cliente. Producto real de punta a punta: cada pantalla está conectada a API, base de datos, permisos, validaciones y auditoría.

## Módulos (24 bloques de construcción)

Comercial → Cliente → Contrato → Servicio → Instalación → Puesto → Consignas → Guardias (expedientes y capacitación) → Turnos → Asistencia (GPS + geocercas) → Rondines → Bitácora → Incidencias → SOS → Supervisión → Video (WebRTC, grabación temporal 48 h, descarga controlada) → Visitantes/vehículos/equipo → Pre-nómina → Facturación y cobranza → Portal del cliente → Reportes → Auditoría y seguridad → Optimización de UX → Pruebas integrales E2E.

## Stack

- **Monorepo** npm workspaces: `apps/api`, `apps/web`, `packages/shared`.
- **Backend:** Node.js + TypeScript + NestJS, REST + OpenAPI/Swagger, Prisma + PostgreSQL, JWT + RBAC con ~93 permisos, rate limiting, helmet, auditoría.
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + Zod.
- **Móvil:** PWA para guardia (`/m*`) y supervisor (`/ms*`) con soporte offline y sincronización.
- **Video:** WebRTC (MediaRecorder → chunks), almacenamiento de objetos local reemplazable por S3, expiración 48 h, descargas con token y registro.
- **Mapas:** capa desacoplada (Leaflet/OSM), sustituible por Google Maps/Mapbox.

## Estructura

```
├── apps/
│   ├── api/        # Backend NestJS (módulos por dominio, main.ts, prisma/)
│   │   ├── prisma/ # schema, migraciones, seed
│   │   └── test/   # suite E2E (flow + security)
│   └── web/        # Frontend Next.js (admin, PWA móvil, portal cliente)
├── packages/shared/  # permisos, roles, constantes y schemas Zod
├── DEPLOYMENT.md     # instalación en servidor nuevo
└── PROJECT_STATUS.md # avance por bloques, bugs y decisiones
```

## Puesta en marcha (desarrollo)

```bash
npm install
# 1) Configurar apps/api/.env y apps/web/.env (ver .env.example de cada workspace)
npm run db:generate
npm run db:migrate      # o db:deploy si la BD ya tiene migraciones
npm run db:seed
npm run dev:api         # API http://localhost:3001/api  (docs en /docs)
npm run dev:web         # Web  http://localhost:3000
```

## Cuentas demo (creadas por el seed — Empresa A)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | `admin@gruposervicom.com` | `Admin123!` |
| Supervisor | `supervisor@gruposervicom.com` | `Supervisor123!` |
| Guardia | `guardia@gruposervicom.com` | `Guardia123!` |
| Cliente | `cliente@abccorp.com` | `Cliente123!` |

Empresa B (prueba de aislamiento multiempresa): `admin@prototal.com` / `Admin123!`.

## Pruebas

```bash
npm test                 # unitarios (api + shared)
npm run test:e2e --workspace @servicom/api   # integración E2E contra la API en vivo (17 tests)
npm run lint             # ESLint api + web
```

La suite E2E cubre el flujo integral completo (autenticación de los 4 perfiles, comercial, guardia real, operación con geocerca, video, SOS, supervisión, pre-nómina, reportes, portal cliente y aislamiento entre empresas) y seguridad (401/403/RBAC/validación). Requiere la API levantada y la BD con seed.

## Producción

Ver `DEPLOYMENT.md`: requisitos, variables, migraciones, compilación (`npm run build`), ejecución (`npm run start:prod:api` y `start:prod:web`), systemd, Nginx + TLS, y verificación con `/api/health`.

## Documentación

- `PROJECT_STATUS.md` — control de avance por bloques, bugs resueltos y decisiones técnicas.
- `DEPLOYMENT.md` — guía de instalación/despliegue en servidor nuevo.
- `AGENTS.md` — reglas de trabajo del proyecto.
- Swagger/OpenAPI en `http://localhost:3001/docs`.