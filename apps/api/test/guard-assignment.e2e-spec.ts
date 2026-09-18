/**
 * PRUEBA E2E — Asignación exclusiva de guardia a cliente y reasignación.
 *
 * Valida:
 *  1. Un guardia asignado a un cliente NO puede cubrir turnos de otro cliente.
 *  2. Programar un turno en un puesto de SU cliente es correcto.
 *  3. Reasignar a otro cliente cancela los turnos futuros del cliente anterior.
 *  4. El historial de asignaciones queda registrado (auditoría).
 */
import { Api, CREDS, login, suffix, isoDate, dataOf, cleanup } from './helpers';

const ADMIN = CREDS.admin;

describe('GUARDIA — Asignación exclusiva a cliente (E2E)', () => {
  const uniq = suffix();
  let adminApi = new Api('');

  const ids: Record<string, string | undefined> = {
    clientAId: undefined,
    clientBId: undefined,
    siteAId: undefined,
    siteBId: undefined,
    postAId: undefined,
    postBId: undefined,
    guardId: undefined,
    shiftAId: undefined,
    shiftBId: undefined,
  };
  const names = {
    clientA: `E2E-GC-CLIA-${uniq}`,
    clientB: `E2E-GC-CLIB-${uniq}`,
    siteA: `E2E-GC-SITEA-${uniq}`,
    siteB: `E2E-GC-SITEB-${uniq}`,
    postA: `E2E-GC-POSTA-${uniq}`,
    postB: `E2E-GC-POSTB-${uniq}`,
    guardNumber: `E2E-GC-${uniq}`,
    guardEmail: `e2e.gc.${uniq}@gruposervicom.test`,
  };
  const GEO = { latitude: 19.4326, longitude: -99.1332 };

  beforeAll(async () => {
    const admin = await login(ADMIN.email, ADMIN.password);
    adminApi = new Api(admin.accessToken);
  });

  afterAll(async () => {
    await cleanup(adminApi, {
      guardId: ids.guardId,
      postId: ids.postBId,
      siteId: ids.siteBId,
      clientId: ids.clientBId,
    });
    await cleanup(adminApi, {
      guardId: ids.guardId,
      postId: ids.postAId,
      siteId: ids.siteAId,
      clientId: ids.clientAId,
    });
  }, 30000);

  async function makeClient(name: string, email: string, rfcValue: string) {
    const client = await adminApi.post('/clients', {
      legalName: `${name} LEGAL`,
      commercialName: name,
      rfc: rfcValue,
      email,
      phone: '5551102233',
      address: 'Av. E2E 1000',
      status: 'activo',
    });
    expect([200, 201]).toContain(client.status);
    return dataOf(client)?.id as string;
  }

  async function makeSite(clientId: string, name: string) {
    const site = await adminApi.post('/sites', {
      clientId,
      name,
      address: 'Camino E2E 5',
      latitude: GEO.latitude,
      longitude: GEO.longitude,
      geofenceRadiusMeters: 500,
    });
    expect([200, 201]).toContain(site.status);
    return dataOf(site)?.id as string;
  }

  async function makePost(siteId: string, name: string) {
    const post = await adminApi.post('/posts', {
      siteId,
      name,
      shiftStart: '09:00',
      shiftEnd: '18:00',
      active: true,
    });
    expect([200, 201]).toContain(post.status);
    return dataOf(post)?.id as string;
  }

  test('Prepara dos clientes con sus instalaciones y puesto cada uno', async () => {
    const rfcBase = `Q2E${String(Date.now()).slice(-6)}`;
    ids.clientAId = await makeClient(names.clientA, `e2e.gc.${uniq}@clia.test`, `${rfcBase}A`);
    ids.clientBId = await makeClient(names.clientB, `e2e.gc.${uniq}@clib.test`, `${rfcBase}B`);
    expect(ids.clientAId).not.toBe(ids.clientBId);
    ids.siteAId = await makeSite(ids.clientAId, names.siteA);
    ids.siteBId = await makeSite(ids.clientBId, names.siteB);
    ids.postAId = await makePost(ids.siteAId, names.postA);
    ids.postBId = await makePost(ids.siteBId, names.postB);
    expect(ids.postAId && ids.postBId).toBeTruthy();
  });

  test('Crea guardia asignado exclusivamente al cliente A', async () => {
    const guard = await adminApi.post('/guards', {
      employeeNumber: names.guardNumber,
      firstName: 'E2E',
      lastName: 'Exclusivo',
      email: names.guardEmail,
      phone: '5559876543',
      address: 'Calle E2E 88',
      hireDate: '2026-01-15',
      status: 'disponible',
      assignedClientId: ids.clientAId,
    });
    expect([200, 201]).toContain(guard.status);
    ids.guardId = dataOf(guard)?.id;
    expect(ids.guardId).toBeTruthy();
    expect(dataOf(guard)?.assignedClient?.id).toBe(ids.clientAId);

    const list = await adminApi.get('/guards');
    const guardRow = (dataOf(list)?.items ?? []).find((g: any) => g.id === ids.guardId);
    expect(guardRow?.assignedClient?.id).toBe(ids.clientAId);
  });

  test('El guardia NO puede programar turno en el cliente B (exclusividad)', async () => {
    const shiftB = await adminApi.post('/shifts', {
      guardId: ids.guardId,
      postId: ids.postBId,
      date: isoDate(),
      startTime: '09:00',
      endTime: '18:00',
    });
    expect(shiftB.status).toBe(400);
    expect(String(shiftB.json?.message || '')).toMatch(/asignado exclusivamente/i);
  });

  test('El guardia SÍ puede programar turno en su cliente A', async () => {
    const shiftA = await adminApi.post('/shifts', {
      guardId: ids.guardId,
      postId: ids.postAId,
      date: isoDate(),
      startTime: '09:00',
      endTime: '18:00',
    });
    expect([200, 201]).toContain(shiftA.status);
    ids.shiftAId = dataOf(shiftA)?.id;
    expect(ids.shiftAId).toBeTruthy();
  });

  test('Un segundo turno futuro en cliente A también se bloquea para otro cliente', async () => {
    const future = isoDate(new Date(Date.now() + 2 * 24 * 3600 * 1000));
    const shiftB2 = await adminApi.post('/shifts', {
      guardId: ids.guardId,
      postId: ids.postBId,
      date: future,
      startTime: '09:00',
      endTime: '18:00',
    });
    expect(shiftB2.status).toBe(400);
  });

  test('Reasigna el guardia al cliente B: cancela turnos futuros de A y registra historial', async () => {
    const future = isoDate(new Date(Date.now() + 1 * 24 * 3600 * 1000));
    const futureShiftA = await adminApi.post('/shifts', {
      guardId: ids.guardId,
      postId: ids.postAId,
      date: future,
      startTime: '09:00',
      endTime: '18:00',
    });
    expect([200, 201]).toContain(futureShiftA.status);
    ids.shiftAId = dataOf(futureShiftA)?.id;

    const res = await adminApi.post(`/guards/${ids.guardId}/reassign`, {
      clientId: ids.clientBId,
      reason: 'El cliente A terminó el contrato',
    });
    expect([200, 201]).toContain(res.status);
    expect(dataOf(res)?.assignedClient?.id).toBe(ids.clientBId);
    expect(dataOf(res)?.cancelledShifts).toBeGreaterThanOrEqual(1);

    const cancelled = await adminApi.get(`/shifts/${ids.shiftAId}`);
    expect(dataOf(cancelled)?.status).toBe('cancelado');
  });

  test('Tras reasignar, el guardia ahora SÍ puede programar turno en cliente B', async () => {
    const future = isoDate(new Date(Date.now() + 3 * 24 * 3600 * 1000));
    const shiftB = await adminApi.post('/shifts', {
      guardId: ids.guardId,
      postId: ids.postBId,
      date: future,
      startTime: '09:00',
      endTime: '18:00',
    });
    expect([200, 201]).toContain(shiftB.status);
    ids.shiftBId = dataOf(shiftB)?.id;
    expect(ids.shiftBId).toBeTruthy();
  });

  test('El historial de asignaciones queda registrado (asignación inicial + reasignación)', async () => {
    const history = await adminApi.get(`/guards/${ids.guardId}/assignments`);
    expect(history.status).toBe(200);
    const items = dataOf(history) ?? [];
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0]?.toClient?.id).toBe(ids.clientBId);
  });
});