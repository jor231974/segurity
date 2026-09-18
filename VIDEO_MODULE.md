# Módulo de Video — Documento operativo (BLOQUE 15)

Este documento describe el módulo de video operativo (transmisión en vivo y
grabación por turno) del Sistema Servicom: arquitectura real, flujo, modelos,
API, configuración, almacenamiento, costos, operación y el procedimiento de
prueba con un teléfono Android.

> Regla del proyecto: **no es una pantalla decorativa**. Todo lo descrito aquí
> está conectado a lógica real, base de datos, almacenamiento de objetos,
> permisos, validaciones y auditoría. No se declara "terminado" un flujo hasta
> que se probó de punta a punta.

---

## 1. Objetivo

Permitir que un **guardia** (PWA en su teléfono o navegador) capture y transmita
video en vivo desde su puesto, que un **supervisor/admin/monitor** lo vea en
tiempo real desde la plataforma, y que toda la transmisión quede **grabada en
fragmentos** con retención temporal (48 h por defecto) o **conservada como
evidencia** (sin expiración) cuando corresponde.

Cada acceso, descarga, conservación o eliminación queda registrado con
usuario, fecha, IP y dispositivo en un historial de auditoría del video.

---

## 2. Arquitectura

```
 teléfono del guardia (PWA /m/video)                 PC del supervisor (Web /video)
 ┌────────────────────────────────────┐              ┌──────────────────────────────┐
 │ getUserMedia (WebRTC capture)      │              │ LivePlayer (MSE: MediaSource)│
 │ MediaRecorder + timeslice =(frag)  │              │ encuesta manifest cada ~2.5s │
 │ → POST /video/streams/:id/fragments│═══ HTTPS ═══▶│ → GET  .../manifest          │
 │ cola offline IndexedDB si no hay   │              │ → GET  .../fragments/:seq    │
 │      conexión (sync al reconectar)  │              │ appends en SourceBuffer      │
 └────────────────────────────────────┘              └──────────────────────────────┘
           │                                              │
           ▼                                              ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  API (NestJS)                                                │
  │  VideoController · VideoService · VideoStorageService        │
  │  Permisos `video.*` · auditoría VideoAuditLog                │
  │  Cron cada hora: expiración de temporales + abandonadas    │
  └──────────────┬───────────────────────────────────────────────┘
                 ▼
        ┌───────────────────┐      ┌──────────────────────────────┐
        │ PostgreSQL        │      │ Almacenamiento de OBJETOS    │
        │ solo METADATOS    │      │ live/{stream}/{seq}.webm      │
        │ y referencias     │      │ recordings/{id}.webm          │
        │ (objectKey)       │      │ driver local (Render free)    │
        └───────────────────┘      │ driver S3/doc. en §7          │
                                    └──────────────────────────────┘
```

### 2.1 Captura (WebRTC + MediaRecorder)

- `navigator.mediaDevices.getUserMedia()` (front facing) captura cámara y audio
  reales (WebRTC).
- `MediaRecorder` con `timeslice = VideoFragmentSec` produce **fragmentos WebM
  encadenados** (mismo codec y línea de tiempo). El primer fragmento lleva el
  encabezado.
- Cada fragmento se sube **numerado (seq)** a `POST /video/streams/:id/fragments?seq=N`.
- **Idempotencia**: si el servidor ya tiene ese `seq` con el mismo tamaño,
  responde `{duplicate:true}` sin duplicar. Esto permite reintentos seguros.

### 2.2 En vivo (reproductor MSE del supervisor)

- El `LivePlayer` usa `MediaSource` + `SourceBuffer('video/webm;codecs=vp8,opus')`.
- Encuesta `GET /video/streams/:id/manifest` cada ~2.5 s y anexa los fragmentos
  nuevos en orden a partir del último `seq` reproducido.
- Latencia aproximada: 1 intervalo de fragmento + margen de encuesta (~3–8 s),
  sin servidor de medios dedicado. Suficiente para supervisión operativa.
- Cuando el guardia detiene, `end` concatena y la transmisión deja de estar viva.

### 2.3 Grabación (concatenación)

- Al `end`, el servidor concatena bytes de todos los fragmentos en orden →
  `recordings/{streamId}.webm` (un único archivo WebM válido porque los
  fragmentos MediaRecorder son contiguos).
- Se crea `VideoRecording` con contexto (empresa, guardia, turno, servicio,
  instalación, puesto, cliente, GPS) y `expiresAt = now + VideoExpirationHours`.
- El directorio `live/{streamId}/` se elimina al concatenar.

### 2.4 Conservar evidencia

- Con permiso `video.evidence.preserve` + motivo obligatorio:
  `retentionPolicy = 'evidencia'`, `expiresAt = null`, se registra quién y cuándo.
- El cron de expiración **ignora** las grabaciones con `retentionPolicy != 'temporal'`.

### 2.5 URLs de descarga (no permanentes)

- `GET /video/recordings/:id/download-url` devuelve una **URL temporal firmada**
  (HMAC-SHA256 con `VIDEO_SIGN_SECRET`/`JWT_SECRET`, expira en
  `VIDEO_SIGNED_URL_TTL_MINUTES`, 60 por defecto).
- `GET /video/download/:token` es pública por diseño: valida firma y vigencia,
  y registra la descarga con IP y dispositivo en auditoría. No hay URLs públicas
  permanentes de archivos.

---

## 3. Modelos de datos (Prisma → PostgreSQL)

Solo metadatos y referencias; el binario vive en el almacenamiento de objetos.

| Modelo | Propósito | Notas |
|---|---|---|
| `VideoStream` | Transmisión en curso | config (resolución, fps, bitrate, audio, plataforma, deviceId, maxDurationSec), estado, `fragmentCount`, `currentBytes`, `lastFragmentAt`, contexto (service/post/site/client), GPS |
| `VideoFragment` | Fragmento subido | `unique(streamId, seq)`, `sizeBytes`, `objectKey` |
| `VideoRecording` | Grabación final | contexto completo + incidencia + retención 'temporal'/'evidencia' + evidencia (quién/cuándo/motivo) + `objectKey`, `fragmentCount` |
| `VideoDownloadLog` | Registro de descargas | compat: descarga manual / streaming |
| `VideoAuditLog` | Auditoría fina de video | acción, usuario, IP, dispositivo, detalle JSON, `companyId + createdAt` |

Acciones auditadas en `VideoAuditLog`:
`stream.start`, `stream.end` (con `aborted`), `live.view`, `recording.view`,
`recording.download_url`, `recording.download`, `evidence.preserve`,
`recording.incident`, `recording.delete`, `automatic.expire`.

---

## 4. API (Swagger en `/docs`)

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/video/config` | `video.live.start` | config de captura del dispositivo |
| GET | `/video/streams` | `video.live.view` | transmisiones activas |
| POST | `/video/streams` | `video.live.start` | iniciar transmisión |
| POST | `/video/streams/:id/fragments?seq=N` | `video.live.start` | subir fragmento (octet-stream, idempotente) |
| POST | `/video/streams/:id/chunk` | `video.live.start` | chunk retrocompatible |
| GET | `/video/streams/:id/manifest` | `video.live.view` | manifest para el reproductor en vivo |
| GET | `/video/streams/:id/fragments/:seq` | `video.live.view` | recuperar un fragmento |
| PUT | `/video/streams/:id/end` | `video.live.start` | finalizar → crear grabación |
| GET | `/video/recordings` | `video.recording.view` | listar (filtros guard/incidencia/instalación/cliente/fecha/retención) |
| GET | `/video/recordings/:id` | `video.recording.view` | detalle con contexto, descargas y auditoría |
| GET | `/video/recordings/:id/audit` | `video.recording.view` | historial de auditoría |
| GET | `/video/recordings/:id/file` | `video.recording.download` | reproducir/descargar (controlado) |
| GET | `/video/recordings/:id/download-url` | `video.recording.download` | URL temporal firmada |
| GET | `/video/download/:token` | público (firma) | descarga con URL firmada, audita IP/dispositivo |
| PUT | `/video/recordings/:id/preserve` | `video.evidence.preserve` | conservar como evidencia (motivo obligatorio) |
| PUT | `/video/recordings/:id/assign-incident` | `video.recording.view` | asociar a incidencia |
| PUT | `/video/recordings/:id/delete` | `video.recording.delete` | eliminar (soft delete + archivo) |

---

## 5. Permisos por rol (`packages/shared/src/roles.ts`)

| Permiso | SUPER_ADMIN | DIRECTOR | ADMIN | OPS | SUPERVISOR | MONITOR | GUARD |
|---|---|---|---|---|---|---|---|
| `video.live.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `video.live.start` | ✓ | — | — | — | ✓ | — | ✓ |
| `video.recording.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `video.recording.download` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| `video.recording.delete` | ✓ | — | ✓ | — | — | — | — |
| `video.evidence.preserve` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |

Los permisos en runtime salen de `ROLE_PERMISSIONS`; la BD se siembra con los
mismos códigos (`ALL_PERMISSIONS`) para coherencia.

---

## 6. Configuración (variables de entorno)

| Variable | Defecto | Descripción |
|---|---|---|
| `VIDEO_EXPIRATION_HOURS` | `48` | retención de temporales |
| `VIDEO_DEFAULT_RESOLUTION` | `1280x720` | resolución de captura |
| `VIDEO_DEFAULT_FPS` | `15` | cuadros por segundo |
| `VIDEO_DEFAULT_BITRATE` | `1200` | kbps de video |
| `VIDEO_DEFAULT_AUDIO` | `true` | capturar audio |
| `VIDEO_FRAGMENT_SEC` | `5` | duración de cada fragmento |
| `VIDEO_MAX_DURATION_SEC` | `0` | 0 = sin límite (se detiene con el botón) |
| `VIDEO_MIME_TYPE` | `video/webm;codecs=vp8,opus` | contenedor/códec MediaRecorder |
| `VIDEO_SIGNED_URL_TTL_MINUTES` | `60` | vigencia de URLs firmadas |
| `VIDEO_SIGN_SECRET` | (JWT_SECRET) | clave HMAC para firmas |
| `VIDEO_STORAGE_PATH` | `./storage/videos` | root del almacenamiento local |
| `OBJECT_STORAGE_DRIVER` | `local` | driver de objetos (documentado en §7) |
| `VIDEO_MAX_DURATION_SILENT_MS` | (no) | (futuro) corte por silencio |

La PWA solicita `GET /video/config` antes de capturar y aplica estos valores.
Los timestamps se graban en UTC con la zona en el cliente para visualización.

---

## 7. Almacenamiento de objetos (objetos, no Postgres)

El módulo no guarda binarios en PostgreSQL: usa una capa de objetos
(`VideoStorageService`) con operaciones atómicas por objeto:

- `live/{streamId}/{seq}.webm` — fragmentos de la transmisión en curso
- `recordings/{streamId}.webm` — grabación final concatenada

### Driver local (operativo en Render free)

- Root: `VIDEO_STORAGE_PATH` → en Render `/opt/render/project/src/data/videos`.
- Validación de rutas (`safeResolve`) contra path traversal; límites por
  fragmento (25 MB) y por transmisión (2 GB).

### Driver S3-compatible (producción escalable)

La interfaz está desacoplada: para adoptar Amazon S3 / Cloudflare R2 / MinIO se
implementan las mismas primitivas (`putFragment`, `getFragmentStream`,
`listFragments`, `concatToRecording`, `deleteObject`, `existsObject`) contra el
bucket y se selecciona con `OBJECT_STORAGE_DRIVER=s3`. Esto no modifica el
resto del módulo ni la base de datos.

---

## 8. Costos y límites (nivel demostración, Render free)

| Concepto | Valor |
|---|---|
| Almacenamiento por hora de 720p@15fps@1200kbps | ≈ 540 MB/h (~9 MB/min) |
| Retención por defecto | 48 h (cron horario elimina temporales) |
| Evidencia | sin expiración (requiere capacidad planificada) |
| Fragmento | 5 s; hasta 25 MB; máx 2 GB por transmisión |
| Ruteo del plan free | disco /opt/render (efímero tras sleeps/redeploys) |

> **Importante**: en Render free el disco se pierde al dormir el servicio (15 min
> de inactividad) o al redeployar. Para producción se recomienda el driver S3
> (R2 gratis 10 GB preserva los objetos ante sleeps) y una base de pago. Los
> costos de S3/R2 dependen del volumen (objetos que no expiraron o conservados
> como evidencia).

---

## 9. Operación y auditoría

- **Iniciar**: guardia abre `/m/video` y pulsa "Iniciar transmisión y grabación".
- **Ver en vivo**: `/video` → fila del stream → "Ver en vivo" (MSE, ~3 s de latencia).
- **Grabaciones**: `/video` → columna "Grabaciones" con Ver (reproductor),
  Descargar (URL firmada), Conservar como evidencia (motivo), Auditoría,
  Eliminar. `_count.downloads` y el historial de auditoría son visibles.
- **Expiración automática**: cron `EVERY_HOUR` elimina temporales con
  `expiresAt <= now` y revierte transmisiones abandonadas a `fallida`.
- **Multiempresa**: todo está aislado por `companyId`; una Empresa A jamás ve
  streams/grabaciones de la Empresa B (probado E2E).

---

## 10. Procedimiento de prueba con teléfono Android (obligatorio)

> No se marca el módulo "terminado" hasta ejecutar esta prueba contra el
> despliegue real. Este entorno no dispone de un teléfono físico; el backend y
> los flujos automatizados ya están verificados (E2E 17/17 en 2026-09-18).

1. En el teléfono (Chrome/Edge reciente), abrir
   `https://servicom-web.onrender.com/m/video` e iniciar sesión con
   `guardia@gruposervicom.com / Guardia123!`.
2. Permitir cámara 🙏, **GPS** y notificaciones. Confirmar que aparece la ficha
   de configuración (720p/15fps/1200kbps/48h) y "En línea".
3. Apretar **"Iniciar transmisión y grabación"**. El indicador pasa a EN VIVO y
   el contador avanza; el video se ve en pantalla.
4. En la PC, abrir `https://servicom-web.onrender.com/video` con
   `supervisor@gruposervicom.com / Supervisor123!`. En la tabla "Video en vivo"
   debe aparecer el guardia; pulsar **"Ver en vivo"**: la transmisión se
   reproduce en ~3 s de latencia.
5. En el teléfono, esperar >30 s (varios fragmentos) y pulsar **"Detener
   transmisión"** → confirmar "Grabación guardada (Ns)".
6. En la PC, en "Grabaciones": **Ver** (reproducir el WebM), **Descargar**
   (URL firmada), **Conservar como evidencia** con motivo y verificar que ya no
   muestra "Expira en..." sino "Evidencia (no expira)".
7. Pulsar **Auditoría**: deben existir `live.view`, `stream.end`,
   `recording.view`, `recording.download_url` y `evidence.preserve`.
8. **Prueba offline** (opcional): activar modo avión durante la grabación,
   ver "Sin conexión · cola local", desactivar modo avión y confirmar que los
   fragmentos se sincronizan.
9. Con `admin@prototal.com / Admin123!` (Empresa B) confirmar que **no**
   aparecen las grabaciones de la Empresa A.
10. Regresar resultados (capturas, duración, bytes, latencia) a
    `PROJECT_STATUS.md`.

---
## 11. Cobertura de pruebas

- E2E automatizados (`apps/api/test/flow.e2e-spec.ts`, test E):
  config → start stream → 3 fragmentos (incluida idempotencia) → manifest →
  end (size = 3×fragmento, fragmentCount=3) → list → download-url firmada →
  audit → preserve (retention=evidencia, expiresAt=null) → delete.
- E2E RBAC/aislamiento (`security.e2e-spec.ts`): sin token 401, CLIENT sin
  acceso, GUARD scope, aislamiento entre empresas.
- Estado 2026-09-18: **17/17 pruebas pasan** contra la API local con BD local.