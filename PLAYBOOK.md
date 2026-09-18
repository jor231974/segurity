# PLAYBOOK — Presentación del sistema (30–40 min)

Guion listo para mostrar el Sistema Integral de Seguridad Privada **Grupo Servicom**
a un prospecto o a la dirección de la empresa, usando la **cartera de presentación**
cargada con `npm run db:demo` (script `apps/api/prisma/demo-data.ts`, idempotente,
solo crea lo que no exista — no toca nada existente).

> Requisito previo: seed cargado y `npm run db:demo` ejecutado para la Empresa A.

---

## Datos de presentación (qué se verá en pantalla)

| Cliente | Estado | Instalación | Servicio | Tarifa MXN/mes | Guardias | Turnos de hoy |
|---------|--------|-------------|----------|----------------|----------|---------------|
| Almacenes del Norte | NL | CD Logístico Apodaca | Vigilancia 24/7 | 24,500 | GU-101, GU-102, GU-103 | 3 |
| Plaza Vía Dorada | JAL | Plaza Comercial Vía Dorada | Vigilancia comercial | 18,500 | GU-201, GU-202 | 2 |
| Hospital San Rafael | CDMX | Hospital San Rafael | Vigilancia 24/7 institucional | 22,400 | GU-301, GU-302 | 2 |
| Metal Mecánica Bajío | QRO | Planta Querétaro | Vigilancia industrial | 19,800 | GU-401, GU-402 | 2 |

### Turnos de HOY (fecha local)
- GU-101 Acceso Principal 06:00–18:00 (Almacenes del Norte)
- GU-102 / GU-103 Rondín Nocturno 18:00–06:00 (Almacenes del Norte)
- GU-201 Acceso Plaza 08:00–16:00 (Plaza Vía Dorada)
- GU-202 Estacionamiento 16:00–24:00 (Plaza Vía Dorada)
- GU-301 Acceso Principal 07:00–19:00 (Hospital San Rafael)
- GU-302 Rondín / CCTV 19:00–07:00 (Hospital San Rafael)
- GU-401 Acceso Principal 06:00–18:00 (Metal Mecánica Bajío)
- GU-402 Caseta #2 18:00–06:00 (Metal Mecánica Bajío)

### Asignación exclusiva de guardia → cliente (regla clave de la demo)
Cada guardia está ligado **exclusivamente** a un cliente de la empresa. Al consultar
el turno de GU-201 (Plaza Vía Dorada) se confirma que **no** puede cubrir puestos de
otro cliente (valida el backend, 400/403). Historial de asignaciones en
`GET /guards/:id/assignments`.

---

## Cuentas de presentación (login real — Empresa A)

| Perfil | Correo | Contraseña | Rol | Demuestra |
|--------|--------|------------|-----|-----------|
| Administrador | `admin@gruposervicom.com` | `Admin123!` | Admin (Empresa A) | Dashboard, cartera completa, supervisión, video |
| Supervisor | `supervisor@gruposervicom.com` | `Supervisor123!` | Supervisor | Radar, guardias en campo, visitas de supervisión |
| Guardia (PWA móvil) | `guardia@gruposervicom.com` | `Guardia123!` | Guardia | Entrada/salida GPS, geocerca, SOS, consignas |
| Guardia demo 2 | `guardia2@gruposervicom.com` | `Guardia123!` | Guardia (demo) | Puesto demo con turno que acaba de salir |

> Nota: `guardia2@` es un usuario creado por la carga demo (empleado `GU-201`), útil
> para mostrar un segundo guardia en el mapa.

---

## Guion de presentación

### 1) Apertura — problema que resuelve (2 min)
Solo lo esencial: "un solo sistema para administrar toda tu fuerza de seguridad:
_clientes, contratos, instalaciones, guardias, turnos, asistencia GPS, rondines,
incidentes, video, supervisión y pre-nómina_ — todo aislado por empresa y conectado
a una BD única". Mostrar el dashboard con las tarjetas de KPIs.

### 2) Comercial — cartera (8 min)
- **Clientes** (`/clients`): la lista de 4 clientes con sus estados (NL, JAL, CDMX, QRO).
  Abrir **Almacenes del Norte** → ficha con contactos, RFC y condiciones.
- **Contrato** (`/contracts`): CTR-2026-014 de Almacenes del Norte → servicios con
  tarifa y costo, períodos, facturación mensual, auto renovable.
- **Instalación / geocerca** (`/sites`): el mapa con la geocerca del CD Logístico
  (150 m), dirección, horario Lun-Dom 24 h. Resaltar que la geocerca se usa luego
  para validar la asistencia.
- **Puesto** (`/posts`): Acceso Principal (06:00–18:00) y Rondín Nocturno — puestos
  reales ligados a la instalación.

### 3) Guardias y turnos (6 min)
- **Guardias** (`/guards`): lista con asignación exclusiva por cliente (columna
  "Cliente asignado"). Crear un guardia nuevo con cliente asignado → queda en su
  expediente y en el dashboard.
- **Turnos de hoy** (`/shifts`): los 9 turnos programados con su puesto y guardia.

### 4) Operación en campo — PWA del guardia (6 min)
Con el teléfono (o emulando en dev con `guardia2@`):
- Abrir la PWA → login como guardia → ver su turno de hoy y su consigna.
- Marcar **entrada**: valida GPS contra la geocerca (dentro → OK; fuera de rango →
  aviso).
- Marcar **salida** → queda registrada.
- **SOS**: botón rojo → alerta visible en el panel del supervisor en tiempo real.
- **Rondín**: registrar el recorrido con los puntos de control.

### 5) Video operativo (4 min)
- En `/video` (admin): ver la grabación de demostración vigente (48 h), descargar
  con URL firmada (expira en 60 min) y eliminar con auditoría si el tiempo alcanza.
- Explicar: los videos **no** se guardan en la BD (objetos S3/local), tienen
  expiración de 48 h auditada.

### 6) Supervisión en tiempo real (4 min)
- `/supervision` (radar): la posición GPS de los guardias en campo, geocercas y
  alertas activas (SOS). Registrar una visita de supervisión con checklist.

### 7) Incidencias y bitácora (3 min)
- **Bitácora** (`/logbook`): mostrar los eventos del turno de hoy.
- **Incidencias** (`/incidents`): crear una incidencia y ver cómo escala al
  supervisor. **Consignas** para los turnos.

### 8) Pre-nómina y reportes (2 min)
- `/prepayroll`: el período con las asistencias reales, pre-si­ntesis (sin CFDI —
  documentado como pendiente ante el SAT).
- `/reports/rentabilidad`: indicadores por cliente/contrato.

### 9) Seguridad y aislamiento (1 min, en caso de preguntas)
Cada empresa es un tenant aislado (`companyId`), los permisos son por rol (RBAC) y
hay auditoría. La demo es la **Empresa A**; la **Empresa B** (ProTotal Norte) existe
y no ve ni toca los datos de A — probado en E2E (`security.e2e-spec.ts`).

---

## Consejos de la presentación
- Usa **pantalla completa del navegador** y zoom al mapa para impresionar con la
  geocerca.
- Antes de la demo: `npm run db:demo` (idempotente) para asegurar turnos de HOY y
  cartera completa.
- Si el prospecto pregunta por "permisos de vacaciones/permisos de personal": ya
  existe el turno con `status: vacaciones` y faltas en pre-nómina; el módulo formal
  de vacaciones/permisos está **documentado como pendiente** (Fase B) en el
  documento maestro — enmarcar como parte del roadmap de crecimiento.
- No mostrar credenciales reales ni navegar a la empresa B.
