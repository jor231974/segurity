import { ALL_PERMISSIONS, PERMISSIONS } from './permissions';
import { ROLE_PERMISSIONS, ROLES } from './roles';

describe('PERMISSIONS', () => {
  it('define permisos con formato modulo.accion y sin duplicados', () => {
    const values = Object.values(PERMISSIONS);
    expect(new Set(values).size).toBe(values.length);
    for (const v of values) {
      expect(v).toMatch(/^[a-z]+(\.[a-z]+)+$/);
    }
  });

  it('incluye todos los permisos de video requeridos', () => {
    expect(Object.values(PERMISSIONS)).toEqual(
      expect.arrayContaining([
        'video.live.view',
        'video.live.start',
        'video.recording.view',
        'video.recording.download',
        'video.recording.delete',
      ]),
    );
  });

  it('ALL_PERMISSIONS coincide con el total definido', () => {
    expect(ALL_PERMISSIONS.length).toBe(Object.values(PERMISSIONS).length);
    expect(ALL_PERMISSIONS.length).toBeGreaterThan(90);
  });
});

describe('ROLE_PERMISSIONS', () => {
  it('tiene una entrada por cada rol definido', () => {
    const roles = Object.values(ROLES);
    expect(roles.length).toBe(10);
    for (const role of roles) {
      expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
    }
  });

  it('SUPER_ADMIN tiene todos los permisos', () => {
    expect(ROLE_PERMISSIONS.SUPER_ADMIN).toEqual(ALL_PERMISSIONS);
  });

  it('los permisos referenciados existen en PERMISSIONS', () => {
    const valid: Set<string> = new Set(Object.values(PERMISSIONS));
    for (const role of Object.values(ROLES)) {
      for (const perm of ROLE_PERMISSIONS[role]) {
        expect(valid.has(perm)).toBe(true);
      }
    }
  });

  it('GUARD crea asistencia/SOS/rondín y no factura ni ve portales', () => {
    const guard = ROLE_PERMISSIONS.GUARD;
    expect(guard).toContain(PERMISSIONS.ATTENDANCE_CREATE);
    expect(guard).toContain(PERMISSIONS.SOS_CREATE);
    expect(guard).toContain(PERMISSIONS.PATROLS_CREATE);
    expect(guard).toContain(PERMISSIONS.LOGBOOK_CREATE);
    expect(guard).not.toContain(PERMISSIONS.BILLING_CREATE);
    expect(guard).not.toContain(PERMISSIONS.BILLING_VIEW);
    expect(guard).not.toContain(PERMISSIONS.CLIENT_PORTAL_ACCESS);
  });

  it('CLIENT accede al portal y a sus solicitudes', () => {
    const client = ROLE_PERMISSIONS.CLIENT;
    expect(client).toContain(PERMISSIONS.CLIENT_PORTAL_ACCESS);
    expect(client).toContain(PERMISSIONS.CLIENT_REQUEST_CREATE);
    expect(client).toContain(PERMISSIONS.CLIENT_REQUEST_VIEW);
    expect(client).not.toContain(PERMISSIONS.CLIENT_REQUEST_HANDLE);
  });
});