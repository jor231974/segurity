export const ZONES = {
  NORTH: 'norte',
  SOUTH: 'sur',
  EAST: 'este',
  WEST: 'oeste',
  CENTER: 'centro',
} as const;

export const EMPLOYMENT_STATUS = {
  ACTIVE: 'activo',
  SUSPENDED: 'suspendido',
  VACATION: 'vacaciones',
  TERMINATED: 'baja',
  DISABILITY: 'incapacidad',
  AVAILABLE: 'disponible',
  ASSIGNED: 'asignado',
} as const;

export const SHIFT_STATUS = {
  SCHEDULED: 'programado',
  ACTIVE: 'activo',
  COMPLETED: 'completado',
  CANCELLED: 'cancelado',
} as const;

export const ATTENDANCE_TYPE = {
  CHECK_IN: 'entrada',
  CHECK_OUT: 'salida',
} as const;

export const GEOPOINT_STATUS = {
  INSIDE: 'dentro',
  OUTSIDE: 'fuera',
} as const;

export const PATROL_STATUS = {
  PENDING: 'pendiente',
  COMPLETED: 'completado',
  INCOMPLETE: 'incompleto',
  DELAYED: 'retrasado',
  SKIPPED: 'omitido',
} as const;

export const INCIDENT_STATUS = {
  OPEN: 'abierta',
  ATTENDED: 'atendida',
  INVESTIGATING: 'en_investigacion',
  CLOSED: 'cerrada',
} as const;

export const INCIDENT_SEVERITY = {
  LOW: 'baja',
  MEDIUM: 'media',
  HIGH: 'alta',
  CRITICAL: 'critica',
} as const;

export const INVOICE_STATUS = {
  PENDING: 'pendiente',
  PARTIAL: 'parcialmente_pagada',
  PAID: 'pagada',
  OVERDUE: 'vencida',
} as const;

export const VIDEO_EXPIRATION_HOURS = 48;

export const HTTP_MESSAGES = {
  UNAUTHORIZED: 'No autorizado',
  FORBIDDEN: 'Permiso denegado',
  NOT_FOUND: 'No encontrado',
  VALIDATION_FAILED: 'Error de validación',
  DUPLICATE: 'Registro duplicado',
  CONFLICT: 'Conflicto con datos existentes',
} as const;