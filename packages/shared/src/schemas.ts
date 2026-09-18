import { z } from 'zod';

const email = z.string().email('Correo electrónico inválido');
const phone = z.string().min(7, 'Teléfono inválido').max(20, 'Teléfono inválido');
const rfc = z.string().regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, 'RFC inválido').or(z.literal(''));

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
  .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
  .regex(/\d/, 'Debe incluir al menos un número');

export const loginSchema = z.object({
  email: email,
  password: z.string().min(1, 'Contraseña requerida'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: email,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: passwordSchema,
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  lastName: z.string().min(2, 'Apellido requerido'),
  email: email,
  phone: phone.optional().or(z.literal('')),
  password: passwordSchema,
  roleCode: z.string().min(1, 'Rol requerido'),
  active: z.boolean().default(true),
});

export const updateUserSchema = createUserSchema.partial().extend({
  password: passwordSchema.optional(),
}).omit({ password: true });

export const companySchema = z.object({
  legalName: z.string().min(3, 'Razón social requerida'),
  commercialName: z.string().min(2, 'Nombre comercial requerido'),
  rfc: rfc,
  address: z.string().min(5, 'Domicilio requerido'),
  phone: phone,
  email: email,
  timezone: z.string().default('America/Mexico_City'),
  currency: z.string().default('MXN'),
  logoUrl: z.string().optional(),
  operationalParams: z.record(z.any()).optional(),
});

export const branchSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  address: z.string().min(5, 'Domicilio requerido'),
  phone: phone.optional().or(z.literal('')),
  contactName: z.string().optional(),
});

export const clientSchema = z.object({
  legalName: z.string().min(3, 'Razón social requerida'),
  commercialName: z.string().min(2, 'Nombre comercial requerido'),
  rfc: rfc,
  email: email.optional().or(z.literal('')),
  phone: phone.optional().or(z.literal('')),
  address: z.string().min(5, 'Domicilio requerido'),
  taxData: z.record(z.any()).optional(),
  commercialTerms: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['activo', 'inactivo', 'suspendido']).default('activo'),
});

export const contractSchema = z.object({
  clientId: z.string().uuid('Cliente inválido'),
  number: z.string().min(1, 'Número de contrato requerido'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  autoRenew: z.boolean().default(true),
  terms: z.string().optional(),
  billingFrequency: z.enum(['semanal', 'quincenal', 'mensual']).default('mensual'),
  status: z.enum(['activo', 'suspendido', 'cerrado']).default('activo'),
});

export const contractServiceSchema = z.object({
  contractId: z.string().uuid(),
  siteId: z.string().uuid(),
  name: z.string().min(2, 'Nombre del servicio requerido'),
  guardCount: z.number().int().min(1, 'Mínimo 1 guardia'),
  tariff: z.number().positive('Tarifa debe ser positiva'),
  estimatedCost: z.number().positive().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});

export const siteSchema = z.object({
  clientId: z.string().uuid('Cliente inválido'),
  name: z.string().min(2, 'Nombre de instalación requerido'),
  address: z.string().min(5, 'Domicilio requerido'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  geofenceRadiusMeters: z.number().int().min(10).max(5000).default(100),
  contactName: z.string().optional(),
  contactPhone: phone.optional().or(z.literal('')),
  schedule: z.string().optional(),
  instructions: z.string().optional(),
});

export const postSchema = z.object({
  siteId: z.string().uuid('Instalación inválida'),
  name: z.string().min(2, 'Nombre del puesto requerido'),
  shiftStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (HH:mm)'),
  shiftEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (HH:mm)'),
  active: z.boolean().default(true),
});

export const consignSchema = z.object({
  postId: z.string().uuid('Puesto inválido'),
  title: z.string().min(2, 'Título requerido'),
  content: z.string().min(5, 'Contenido requerido'),
  version: z.string().default('1.0'),
});

export const guardSchema = z.object({
  employeeNumber: z.string().min(1, 'Número de empleado requerido'),
  firstName: z.string().min(2, 'Nombre requerido'),
  middleName: z.string().optional().or(z.literal('')),
  lastName: z.string().min(2, 'Apellido paterno requerido'),
  secondLastName: z.string().optional().or(z.literal('')),
  curp: z.string().regex(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/, 'CURP inválido').or(z.literal('')),
  rfc: rfc,
  nss: z.string().optional().or(z.literal('')),
  phone: phone,
  email: email.optional().or(z.literal('')),
  address: z.string().min(5, 'Domicilio requerido'),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  hireDate: z.coerce.date(),
  status: z.enum(['activo', 'suspendido', 'vacaciones', 'baja', 'incapacidad', 'disponible', 'asignado']).default('disponible'),
  zoneId: z.string().uuid().optional(),
  supervisorId: z.string().uuid().optional(),
});

export const guardDocumentSchema = z.object({
  guardId: z.string().uuid('Guardia inválido'),
  type: z.string().min(2, 'Tipo requerido'),
  documentDate: z.coerce.date(),
  expirationDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const trainingSchema = z.object({
  guardId: z.string().uuid('Guardia inválido'),
  courseName: z.string().min(2, 'Nombre del curso requerido'),
  instructor: z.string().min(2, 'Instructor requerido'),
  trainingDate: z.coerce.date(),
  durationHours: z.number().positive('Duración inválida'),
  result: z.enum(['aprobado', 'reprobado', 'en_curso']).default('en_curso'),
  score: z.number().min(0).max(100).optional(),
  certificateUrl: z.string().optional(),
  expirationDate: z.coerce.date().optional(),
});

export const shiftSchema = z.object({
  guardId: z.string().uuid('Guardia inválido'),
  postId: z.string().uuid('Puesto inválido'),
  serviceId: z.string().uuid('Servicio inválido').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida'),
  notes: z.string().optional(),
});

export const attendanceSchema = z.object({
  type: z.enum(['entrada', 'salida']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  device: z.string().optional(),
});

export const patrolCheckpointSchema = z.object({
  name: z.string().min(2, 'Nombre del punto requerido'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  sequence: z.number().int().min(0),
});

export const patrolRouteSchema = z.object({
  postId: z.string().uuid('Puesto inválido'),
  name: z.string().min(2, 'Nombre de la ruta requerido'),
  schedule: z.string().optional(),
  checkpoints: z.array(patrolCheckpointSchema).min(1, 'Se requiere al menos un punto'),
});

export const logbookSchema = z.object({
  description: z.string().min(3, 'Descripción requerida'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  guardId: z.string().uuid().optional(),
  postId: z.string().uuid().optional(),
  shiftId: z.string().uuid().optional(),
});

export const incidentSchema = z.object({
  type: z.string().min(2, 'Tipo requerido'),
  severity: z.enum(['baja', 'media', 'alta', 'critica']),
  description: z.string().min(5, 'Descripción requerida'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  involvedPersons: z.string().optional(),
  witnesses: z.string().optional(),
  actionsTaken: z.string().optional(),
});

export const incidentTypeSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido').optional(),
});

export const sosSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  message: z.string().optional(),
});

export const supervisionVisitSchema = z.object({
  guardId: z.string().uuid('Guardia inválido'),
  postId: z.string().uuid('Puesto inválido').optional(),
  checklist: z.record(z.boolean()),
  observations: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const visitorSchema = z.object({
  siteId: z.string().uuid('Instalación inválida'),
  fullName: z.string().min(2, 'Nombre del visitante requerido'),
  identification: z.string().min(1, 'Identificación requerida').optional(),
  companyName: z.string().optional(),
  personVisited: z.string().min(2, 'Persona visitada requerida'),
  vehiclePlate: z.string().optional(),
  notes: z.string().optional(),
});

export const vehicleSchema = z.object({
  brand: z.string().min(2, 'Marca requerida'),
  model: z.string().min(1, 'Modelo requerido'),
  year: z.number().int().min(1980).max(2100).optional(),
  plates: z.string().min(1, 'Placas requeridas'),
  vin: z.string().optional(),
  insuranceExpiration: z.coerce.date().optional(),
  currentMileage: z.number().int().min(0).optional(),
  responsibleGuardId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const inventoryItemSchema = z.object({
  type: z.string().min(2, 'Tipo de equipo requerido'),
  serialNumber: z.string().min(1, 'Número de serie requerido'),
  status: z.enum(['disponible', 'asignado', 'en_mantenimiento', 'baja']).default('disponible'),
  brand: z.string().optional(),
  notes: z.string().optional(),
});

export const inventoryAssignmentSchema = z.object({
  itemId: z.string().uuid('Equipo inválido'),
  guardId: z.string().uuid('Guardia inválido').optional(),
  assignedDate: z.coerce.date(),
  returnedDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const invoiceSchema = z.object({
  contractId: z.string().uuid('Contrato inválido'),
  serviceId: z.string().uuid('Servicio inválido').optional(),
  number: z.string().min(1, 'Número de factura requerido'),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  dueDate: z.coerce.date(),
  amount: z.number().positive('Importe debe ser positivo'),
  notes: z.string().optional(),
});

export const paymentSchema = z.object({
  invoiceId: z.string().uuid('Factura inválida'),
  amount: z.number().positive('Pago debe ser positivo'),
  method: z.enum(['transferencia', 'cheque', 'efectivo', 'tarjeta', 'otro']).default('transferencia'),
  reference: z.string().optional(),
  paymentDate: z.coerce.date().default(() => new Date()),
});

export const clientRequestSchema = z.object({
  type: z.string().min(2, 'Tipo requerido'),
  priority: z.enum(['baja', 'media', 'alta', 'critica']).default('media'),
  description: z.string().min(5, 'Descripción requerida'),
});

export const clientRequestResponseSchema = z.object({
  response: z.string().min(2, 'Respuesta requerida'),
  status: z.enum(['abierta', 'en_proceso', 'resuelta', 'cerrada']),
});

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});