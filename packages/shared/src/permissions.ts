export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',

  COMPANIES_VIEW: 'companies.view',
  COMPANIES_EDIT: 'companies.edit',
  COMPANIES_SETTINGS: 'companies.settings',

  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  ROLES_MANAGE: 'roles.manage',

  CLIENTS_VIEW: 'clients.view',
  CLIENTS_CREATE: 'clients.create',
  CLIENTS_EDIT: 'clients.edit',
  CLIENTS_DELETE: 'clients.delete',

  CONTRACTS_VIEW: 'contracts.view',
  CONTRACTS_CREATE: 'contracts.create',
  CONTRACTS_EDIT: 'contracts.edit',
  CONTRACTS_DELETE: 'contracts.delete',

  SITES_VIEW: 'sites.view',
  SITES_CREATE: 'sites.create',
  SITES_EDIT: 'sites.edit',
  SITES_DELETE: 'sites.delete',

  POSTS_VIEW: 'posts.view',
  POSTS_CREATE: 'posts.create',
  POSTS_EDIT: 'posts.edit',
  POSTS_DELETE: 'posts.delete',

  CONSIGNS_VIEW: 'consigns.view',
  CONSIGNS_CREATE: 'consigns.create',
  CONSIGNS_EDIT: 'consigns.edit',
  CONSIGNS_APPROVE: 'consigns.approve',

  GUARDS_VIEW: 'guards.view',
  GUARDS_CREATE: 'guards.create',
  GUARDS_EDIT: 'guards.edit',
  GUARDS_DELETE: 'guards.delete',
  GUARDS_DOCUMENTS: 'guards.documents',
  GUARDS_TRAINING: 'guards.training',

  SHIFTS_VIEW: 'shifts.view',
  SHIFTS_CREATE: 'shifts.create',
  SHIFTS_EDIT: 'shifts.edit',
  SHIFTS_DELETE: 'shifts.delete',
  SHIFTS_ASSIGN: 'shifts.assign',

  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_EDIT: 'attendance.edit',
  ATTENDANCE_CREATE: 'attendance.create',

  GPS_VIEW: 'gps.view',

  PATROLS_VIEW: 'patrols.view',
  PATROLS_CREATE: 'patrols.create',
  PATROLS_EDIT: 'patrols.edit',
  PATROLS_DELETE: 'patrols.delete',

  LOGBOOK_VIEW: 'logbook.view',
  LOGBOOK_CREATE: 'logbook.create',
  LOGBOOK_EDIT: 'logbook.edit',

  INCIDENTS_VIEW: 'incidents.view',
  INCIDENTS_CREATE: 'incidents.create',
  INCIDENTS_EDIT: 'incidents.edit',
  INCIDENTS_CLOSE: 'incidents.close',

  SOS_VIEW: 'sos.view',
  SOS_CREATE: 'sos.create',
  SOS_HANDLE: 'sos.handle',

  SUPERVISION_VIEW: 'supervision.view',
  SUPERVISION_CREATE: 'supervision.create',
  SUPERVISION_EDIT: 'supervision.edit',

  VIDEO_LIVE_VIEW: 'video.live.view',
  VIDEO_LIVE_START: 'video.live.start',
  VIDEO_RECORDING_VIEW: 'video.recording.view',
  VIDEO_RECORDING_DOWNLOAD: 'video.recording.download',
  VIDEO_RECORDING_DELETE: 'video.recording.delete',
  VIDEO_EVIDENCE_PRESERVE: 'video.evidence.preserve',

  VISITORS_VIEW: 'visitors.view',
  VISITORS_CREATE: 'visitors.create',
  VISITORS_EDIT: 'visitors.edit',
  VISITORS_DELETE: 'visitors.delete',

  VEHICLES_VIEW: 'vehicles.view',
  VEHICLES_CREATE: 'vehicles.create',
  VEHICLES_EDIT: 'vehicles.edit',
  VEHICLES_DELETE: 'vehicles.delete',

  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_EDIT: 'inventory.edit',
  INVENTORY_ASSIGN: 'inventory.assign',

  PREPAYROLL_VIEW: 'prepayroll.view',
  PREPAYROLL_GENERATE: 'prepayroll.generate',
  PREPAYROLL_EXPORT: 'prepayroll.export',

  BILLING_VIEW: 'billing.view',
  BILLING_CREATE: 'billing.create',
  BILLING_EDIT: 'billing.edit',
  BILLING_PAYMENT: 'billing.payment',
  BILLING_EXPORT: 'billing.export',

  REPORT_VIEW: 'report.view',
  REPORT_EXPORT: 'report.export',

  AUDIT_VIEW: 'audit.view',

  CLIENT_PORTAL_ACCESS: 'client.portal.access',
  CLIENT_REQUEST_CREATE: 'client.request.create',
  CLIENT_REQUEST_VIEW: 'client.request.view',
  CLIENT_REQUEST_HANDLE: 'client.request.handle',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: string[] = Object.values(PERMISSIONS);