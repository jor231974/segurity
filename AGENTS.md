# AGENTS.md — Reglas de trabajo para OpenCode

Estas reglas resumen el Documento Maestro y son obligatorias durante TODO el proyecto.

## 1. Desarrollo autónomo

- Trabajar de manera AUTÓNOMA. NO preguntar autorización entre módulos, bloques o fases.
- Al terminar cada módulo: verificar → probar → corregir errores → documentar → continuar con el siguiente.
- NO detenerse sin terminar la tarea pendiente.

Detenerse ÚNICAMENTE si:
1. Se necesita una credencial/clave que solo el propietario puede proporcionar.
2. Existe riesgo de pérdida o corrupción de información.
3. Existe un error crítico no resoluble tras intentarlo.
4. Existe una decisión empresarial no definida en el Documento Maestro.

## 2. Producto real, no demo

- NO crear pantallas simuladas, botones falsos, APIs simuladas, ni datos ficticios como sustituto de funcionalidad.
- Todo lo visible debe estar conectado a lógica, base de datos, API y validaciones reales.
- Cada módulo debe tener: funcionamiento, documentación, pantallas, API, modelos, permisos, validaciones, pruebas e integración con otros módulos.

## 3. Multiempresa (tenant/company)

- Toda información empresarial está aislada por `companyId`.
- Un usuario de Empresa A NO puede ver datos de Empresa B.
- Prueba obligatoria de aislamiento entre dos empresas de desarrollo.

## 4. Backend y API

- Corrección y validación SIEMPRE en backend (nunca confiar solo en frontend).
- Hash seguro de contraseñas. Sesiones seguras. Rate limiting.
- Documentar API (OpenAPI/Swagger).

## 5. Base de datos (PostgreSQL + Prisma)

- Claves primarias, foráneas, índices, restricciones, timestamps, auditoría, `companyId`.
- No permitir registros huérfanos.
- Soft delete donde corresponda. Los videos tienen política propia de expiración (48 h).

## 6. Frontend

- Interfaz profesional y responsiva (computadora, tablet, celular).
- Separar: administración, operaciones, supervisión, guardia, cliente.

## 7. Pruebas obligatorias

- Cada módulo: funcionamiento normal, datos inválidos, permisos, no autorizado, relaciones, duplicados, errores, eliminación, auditoría, seguridad.
- Pruebas de integración entre módulos.
- Flujo completo demostrado: Empresa→Cliente→Contrato→Servicio→Instalación→Puesto→Guardia→Turno→Entrada→GPS→Geocerca→Rondín→Bitácora→Incidencia→Video→Supervisión→Pre-nómina→Reporte→Portal cliente.

## 8. Módulo de video

- No es una pantalla decorativa: WebRTC con servidor de medios, grabación temporal, almacenamiento de objetos, metadatos, expiración 48 h, descarga controlada, auditoría.
- NO guardar video en PostgreSQL.
- No exponer archivos con URLs públicas permanentes.

## 9. Reglas de código

- No código muerto, funciones falsas, botones sin función, credenciales ni secretos en el código.
- Recuperación de contraseña, no credenciales incrustadas.
- Respetar el orden y los 24 bloques de construcción del Documento Maestro.

## 10. Control de avance

- Mantener `PROJECT_STATUS.md` actualizado (terminados, en desarrollo, pruebas, errores, correcciones, pendientes, decisiones técnicas).
- Proyecto documentado para instalar en servidor nuevo sin depender de la máquina del desarrollador.

## 11. Stack

- Backend: Node.js + TypeScript + NestJS + PostgreSQL + Prisma.
- Frontend: React + Next.js. Validación: Zod. API: REST + OpenAPI.
- Móvil: PWA (guardia y supervisor) con soporte offline y sincronización.
- Video: WebRTC + servidor de medios + almacenamiento de objetos + FFmpeg.
- Mapas: capa desacoplada del proveedor.

## 12. Orden de construcción

Seguir los bloques 1 a 24 en orden. Un módulo se considera terminado solo si funciona de punta a punta con API, permisos, validaciones, pruebas y documentación.