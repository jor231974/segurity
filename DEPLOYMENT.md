# Guía de Instalación / Despliegue

Instalación del Sistema Integral de Seguridad Privada (Grupo Servicom) en un servidor nuevo, sin depender de la máquina de desarrollo.

## Requisitos del servidor

- Node.js ≥ 20 (LTS recomendado)
- npm ≥ 10
- PostgreSQL ≥ 14
- Nginx (recomendado como proxy inverso en producción)
- Git (para clonar el repositorio)
- Conocimientos básicos de Linux/windows server y systemd

## 1. Preparar la base de datos

Crear la base de datos y un usuario con permisos sobre ella:

```sql
CREATE USER servicom WITH PASSWORD 'un-password-fuerte';
CREATE DATABASE seguridad_db OWNER servicom;
GRANT ALL PRIVILEGES ON DATABASE seguridad_db TO servicom;
```

## 2. Clonar e instalar dependencias

```bash
git clone <url-del-repositorio> system-seguridad
cd system-seguridad
npm install
```

## 3. Configurar variables de entorno

Copiar los archivos de ejemplo y ajustar los valores:

```bash
cp apps/api/.env.example  apps/api/.env
cp apps/web/.env.example  apps/web/.env
```

`apps/api/.env`:

```
DATABASE_URL="postgresql://servicom:TU_PASSWORD@localhost:5432/seguridad_db?schema=public"
JWT_SECRET="genera-un-secreto-largo-y-seguro"   # en producción usar openssl rand -hex 32
JWT_EXPIRES_IN="24h"
API_PORT=3001
CORS_ORIGINS="https://tu-dominio.com"           # separar con comas si hay varios
STORAGE_PATH="./storage"
VIDEO_STORAGE_PATH="./storage/videos"
MAX_LOGIN_ATTEMPTS=5
LOGIN_LOCKOUT_MINUTES=30
VIDEO_EXPIRATION_HOURS=48
NODE_ENV=production
```

`apps/web/.env`:

```
NEXT_PUBLIC_API_URL=https://api.tu-dominio.com/api
```

## 4. Aplicar migraciones y sembrar datos iniciales

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
```

El seed crea las empresas de desarrollo, roles, permisos, usuarios demo y datos de ejemplo. El script carga `apps/api/.env` automáticamente (`import 'dotenv/config'`), por lo que solo requiere la variable `DATABASE_URL` correcta en ese archivo.

## 5. Compilar para producción

```bash
npm run build
```

Compila `@servicom/shared`, la API (NestJS) y el frontend web (Next.js). La web se compila como **exportación estática** (`output: 'export'` → carpeta `apps/web/out`), apta para cualquier hosting estático/IPFS/CDN.

## 6. Ejecutar en producción

### Opción A — con npm (simple)

```bash
npm run start:prod:api   # API en puerto 3001
npm run start:prod:web   # Sirve apps/web/out (estático) en puerto 3000
```

### Opción B — con systemd (recomendado, Linux)

Crear `/etc/systemd/system/servicom-api.service`:

```
[Unit]
Description=Servicom API
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/system-seguridad
ExecStart=/usr/bin/node apps/api/dist/main.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Crear `/etc/systemd/system/servicom-web.service`:

```
[Unit]
Description=Servicom Web
After=network.target

[Service]
WorkingDirectory=/opt/system-seguridad
ExecStart=/usr/bin/npm run start:prod:web
Restart=always
RestartSec=3
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Activar:

```bash
systemctl daemon-reload
systemctl enable --now servicom-api servicom-web
```

## 7. Nginx como proxy inverso

`/etc/nginx/sites-available/servicom`:

```
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;      # necesario para WebRTC/video
        proxy_set_header Connection "upgrade";
    }
}
```

Agregar TLS con certbot (Let's Encrypt) para HTTPS obligatorio en producción.

## 8. Verificar el despliegue

```bash
curl https://tu-dominio.com/api/health
# -> {"success":true,"data":{"status":"ok","database":"ok",...},"timestamp":"..."}
```

API docs (Swagger/OpenAPI): `https://tu-dominio.com/docs`. Las grabaciones de video se almacenan en `apps/api/storage/videos` (configurable con `VIDEO_STORAGE_PATH`) — respaldar ese directorio y considerar un volumen persistente en producción.

Iniciar sesión con un usuario demo en https://tu-dominio.com. Correr la suite de integración E2E (17 tests contra la API levantada) con:

```bash
npm run test:e2e --workspace @servicom/api
```

## 8b. Despliegue gratuito de demostración (Render, sin dominio)

Forma más rápida de mostrar el sistema a un cliente por internet **sin pagar ni comprar dominio**. Todo el stack en una sola cuenta de Render con URLs gratuitas `*.onrender.com`.

### Arquitectura

| Recurso (Render) | Qué aloja | Costo |
|---|---|---|
| Web Service `servicom-api` | API NestJS (`node apps/api/dist/main.js`) | Free (750 h/mes) |
| Static Site `servicom-web` | Web Next.js exportada a `out/` (SPA estática + PWA) | Free |
| PostgreSQL `servicom-db` | Base de datos (1 GB, expira a los 30 días) | Free |

### Pasos

1. **Subir el repositorio a GitHub** (este proyecto incluye `render.yaml` y `.gitignore` listos).
2. **Crear cuenta en render.com** (plan gratuito, no pide tarjeta).
3. En Render: **New → Blueprint** y elige este repositorio. Render detecta `render.yaml` y crea los tres recursos.
   - Si Render no permite aprovisionar la base free desde el blueprint: crea **New → PostgreSQL** (free) manualmente y copia su *Internal Database URL*.
4. **Configurar variables** (los valores con `sync: false` en el blueprint):
   - `servicom-api`:
     - `DATABASE_URL` = Internal Database URL de `servicom-db` (con `?sslmode=require` si hace falta).
     - `JWT_SECRET` = secreto largo: `openssl rand -hex 32` (o una frase larga).
     - `CORS_ORIGINS` = `https://servicom-web.onrender.com` (o la URL real del static site).
   - `servicom-web`:
     - `NEXT_PUBLIC_API_URL` = `https://servicom-api.onrender.com/api` (URL pública del API).
   - Tras cambiar variables, **Manual Deploy → Deploy latest commit**.
5. **Aplicar base y sembrar datos** (una sola vez). En el dashboard del Web Service `servicom-api` abre **Shell** y ejecuta:
   ```bash
   npm run prisma:seed --workspace @servicom/api
   ```
   Las migraciones se aplican automáticamente en cada arranque (`prisma migrate deploy` en `startCommand`).
6. **Verificar**:
   ```bash
   curl https://servicom-api.onrender.com/api/health
   # -> {"success":true,"data":{"status":"ok","database":"ok",...},...}
   ```
   Abrir `https://servicom-web.onrender.com`, iniciar sesión con un usuario demo (`admin@gruposervicom.com / Admin123!`) y revisar `/docs` en el API.

### Limitaciones del plan gratuito (a tener en cuenta)

- El **web service se duerme a los 15 min** sin tráfico y tarda ~1 min en despertar (recargar la página antes de la demo).
- El disco del web service es **efímero**: los videos grabados durante la sesión se almacenan en `VIDEO_STORAGE_PATH` y se pierden si el servicio reinicia. Suficiente para una demo en vivo.
- La base free **expira a los 30 días** (14 días de gracia para migrar a pago). Para demos prolongadas usar neon.tech o Aiven free y apuntar `DATABASE_URL` ahí (0.5–1 GB, sin expiración).

## 9. Windows (desarrollo local)

```bash
cd system-seguridad
npm run dev:api     # API con watch en puerto 3001
npm run dev:web     # Frontend en 3000
```

Verificar API: `http://localhost:3001/docs` (Swagger). Aplicar migraciones con `npm run db:migrate` (solo en desarrollo).

## Scripts disponibles (root)

| Script | Descripción |
|--------|-------------|
| `npm run dev:api` / `dev:web` | Desarrollo con recarga automática |
| `npm run build` | Compilar shared + api + web |
| `npm run build:api` / `build:web` | Compilar un workspace |
| `npm run start:prod:api` / `start:prod:web` | Producción |
| `npm run db:deploy` | Aplicar migraciones en producción |
| `npm run db:migrate` | Crear migración (desarrollo) |
| `npm run db:seed` | Sembrar datos iniciales |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | ESLint api + web |
| `npm run test` / `test:api` | Pruebas unitarias |
| `npm run test:e2e` (@servicom/api) | Pruebas de integración HTTP contra la API en vivo (17 tests) |

> Nota: las configuraciones `systemd`/`nginx` asumen directorio `/opt/system-seguridad`; ajustar según el servidor. El streaming en vivo multicámara (WebRTC fan-out para supervisión) queda pendiente de infraestructura de medios dedicada (ver PROJECT_STATUS.md).