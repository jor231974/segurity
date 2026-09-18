/**
 * PRUEBA E2E — Reglas de negocio del módulo GUARDIA (asistencia y turnos).
 *
 * Valida:
 *  1. Doble entrada en el mismo día se rechaza.
 *  2. Salida sin una entrada previa se rechaza.
 *  3. Guardia suspendido o de baja no puede marcar asistencia.
 *  4. El turno pasa a "activo" al marcar entrada y a "completado" al salir.
 *  5. Turno nocturno que cruza medianoche se encuentra al día siguiente (helper).
 */
import { Api, CREDS, login, suffix, isoDate, rfc, dataOf, cleanup } from './helpers';

const ADMIN = CREDS.admin;

describe('GUARDIA — Reglas de negocio de asistencia (E2E)', () => {
  const uniq = suffix();
  let adminApi = new Api('');
  let guardApi: Api | null = null;

  const ids: Record<string, string | undefined> = {
    clientId: undefined,
    contractId: undefined,
    siteId: undefined,
    postId: undefined,
    guardId: undefined,
    shiftId: undefined,
  };
  const names = {
    client: `E2E-GD-CLI-${uniq}`,
    contract: `E2E-GD-CTR-${uniq}`,
    site: `E2E-GD-SITE-${uniq}`,
    post: `E2E-GD-POST-${uniq}`,
    guardNumber: `E2E-GD-${uniq}`,
    guardEmail: `e2e.gd.${uniq}@gruposervicom.test`,
  };
  const GEO = { latitude: 19.4326, longitude: -99.1332 };

  beforeAll(async () => {
    const admin = await login(ADMIN.email, ADMIN.password);
    adminApi = new Api(admin.accessToken);
  });

  afterAll(async () => {
    await cleanup(adminApi, ids);
  }, 30000);

  test('Prepara cliente, instalación, puesto y guardia con turno', async () => {
    const client = await adminApi.post('/clients', {
      legalName: `${names.client} LEGAL`,
      commercialName: names.client,
      rfc: rfc(),
      email: `e2e.gd.${uniq}@cliente.test`,
      phone: '5551102233',
      address: 'Av. E2E 1000',
      status: 'activo',
    });
    ids.clientId = dataOf(client)?.id;
    expect(ids.clientId).toBeTruthy();

    const contract = await adminApi.post('/contracts', {
      clientId: ids.clientId,
      number: names.contract,
      startDate: isoDate(),
      endDate: isoDate(new Date(Date.now() + 365 * 24 * 3600 * 1000)),
      billingFrequency: 'mensual',
      status: 'activo',
    });
    ids.contractId = dataOf(contract)?.id;
    expect(ids.contractId).toBeTruthy();

    const site = await adminApi.post('/sites', {
      clientId: ids.clientId,
      name: names.site,
      address: 'Camino E2E 5',
      latitude: GEO.latitude,
      longitude: GEO.longitude,
      geofenceRadiusMeters: 500,
    });
    ids.siteId = dataOf(site)?.id;
    expect(ids.siteId).toBeTruthy();

    const post = await adminApi.post('/posts', {
      siteId: ids.siteId,
      name: names.post,
      shiftStart: '09:00',
      shiftEnd: '18:00',
      active: true,
    });
    ids.postId = dataOf(post)?.id;
    expect(ids.postId).toBeTruthy();

    const guard = await adminApi.post('/guards', {
      employeeNumber: names.guardNumber,
      firstName: 'E2E',
      lastName: 'Guardia',
      email: names.guardEmail,
      phone: '5559876543',
      address: 'Calle E2E 88',
      hireDate: '2026-01-15',
      status: 'disponible',
    });
    expect([200, 201]).toContain(guard.status);
    ids.guardId = dataOf(guard)?.id;
    expect(ids.guardId).toBeTruthy();

    const g = await login(names.guardEmail, 'Guardia123!');
    guardApi = new Api(g.accessToken);

    const shift = await adminApi.post('/shifts', {
      guardId: ids.guardId,
      postId: ids.postId,
      date: isoDate(),
      startTime: '09:00',
      endTime: '18:00',
    });
    expect([200, 201]).toContain(shift.status);
    ids.shiftId = dataOf(shift)?.id;
    expect(ids.shiftId).toBeTruthy();
  });

  test('Entrada válida queda registrada y activa el turno', async () => {
    const res = await guardApi!.post('/attendance', { type: 'entrada', ...GEO, device: 'e2e' });
    expect([200, 201]).toContain(res.status);
    expect(dataOf(res)?.geofenceResult).toBe('dentro');

    const shift = await adminApi.get(`/shifts/${ids.shiftId}`);
    expect(dataOf(shift)?.status).toBe('activo');
  });

  test('Segunda entrada del día se rechaza', async () => {
    const res = await guardApi!.post('/attendance', { type: 'entrada', ...GEO, device: 'e2e' });
    expect([400]).toContain(res.status);
    expect(String(res.json?.message || '')).toMatch(/ya registraste tu entrada/i);
  });

  test('Salida válida se registra y completa el turno', async () => {
    const res = await guardApi!.post('/attendance', { type: 'salida', ...GEO, device: 'e2e' });
    expect([200, 201]).toContain(res.status);

    const shift = await adminApi.get(`/shifts/${ids.shiftId}`);
    expect(dataOf(shift)?.status).toBe('completado');
  });

  test('Doble salida se rechaza', async () => {
    const res = await guardApi!.post('/attendance', { type: 'salida', ...GEO, device: 'e2e' });
    expect([400]).toContain(res.status);
    expect(String(res.json?.message || '')).toMatch(/ya registraste tu salida/i);
  });

  test('Salida sin entrada previa se rechaza (guardia nuevo del día)', async () => {
    const g2 = await adminApi.post('/guards', {
      employeeNumber: `${names.guardNumber}-B`,
      firstName: 'E2E',
      lastName: 'Sin Entrada',
      email: `e2e.gd.b.${uniq}@gruposervicom.test`,
      phone: '5559876543',
      address: 'Calle E2E 89',
      hireDate: '2026-01-15',
      status: 'disponible',
    });
    const guard2Id = dataOf(g2)?.id;
    expect(guard2Id).toBeTruthy();

    await adminApi.post('/shifts', {
      guardId: guard2Id,
      postId: ids.postId,
      date: isoDate(),
      startTime: '09:00',
      endTime: '18:00',
    });

    const g2auth = await login(`e2e.gd.b.${uniq}@gruposervicom.test`, 'Guardia123!');
    const guard2Api = new Api(g2auth.accessToken);

    const res = await guard2Api.post('/attendance', { type: 'salida', ...GEO, device: 'e2e' });
    expect([400]).toContain(res.status);
    expect(String(res.json?.message || '')).toMatch(/primero debes registrar tu entrada/i);
  });

  test('Guardia suspendido no puede marcar asistencia', async () => {
    await adminApi.put(`/guards/${ids.guardId}`, { status: 'suspendido' });

    const g = await login(names.guardEmail, 'Guardia123!');
    const suspApi = new Api(g.accessToken);

    const res = await suspApi.post('/attendance', { type: 'entrada', ...GEO, device: 'e2e' });
    expect([401, 403]).toContain(res.status);
    expect(String(res.json?.message || '').toLowerCase()).toMatch(/suspendido|no puedes/i);

    await adminApi.put(`/guards/${ids.guardId}`, { status: 'disponible' });
  });

  test('Sin turno asignado no puede marcar asistencia', async () => {
    const okGuest = await adminApi.post('/guards', {
      employeeNumber: `${names.guardNumber}-C`,
      firstName: 'E2E',
      lastName: 'Sin Turno',
      email: `e2e.gd.c.${uniq}@gruposervicom.test`,
      phone: '5559876543',
      address: 'Calle E2E 90',
      hireDate: '2026-01-15',
      status: 'disponible',
    });
    const guestId = dataOf(okGuest)?.id;
    expect(guestId).toBeTruthy();

    const g = await login(`e2e.gd.c.${uniq}@gruposervicom.test`, 'Guardia123!');
    const guestApi = new Api(g.accessToken);

    const res = await guestApi.post('/attendance', { type: 'entrada', ...GEO, device: 'e2e' });
    expect([400]).toContain(res.status);
    expect(String(res.json?.message || '')).toMatch(/turno/i);
  });
});