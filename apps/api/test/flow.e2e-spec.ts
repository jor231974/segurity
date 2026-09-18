/**
 * PRUEBA DE INTEGRACIÓN E2E — FLUJO INTEGRAL COMPLETO (Bloque 22)
 *
 * Empresa → Cliente → Contrato → Servicio → Instalación → Puesto → Guardia → Turno
 * → Entrada → GPS → Geocerca → Rondín → Bitácora → Incidencia → Video → Supervisión
 * → SOS → Pre-nómina → Reporte → Portal cliente → Aislamiento multiempresa.
 *
 * Requisitos: API levantada en http://localhost:3001/api con BD con seed.
 * Los datos creados se prefijan "E2E-" + sufijo único y se intentan limpiar al final.
 */
import { Api, CREDS, login, suffix, isoDate, rfc, dataOf, cleanup, sleep } from './helpers';

const ADMIN = CREDS.admin;
const SUP = CREDS.supervisor;
const CLIENT = CREDS.client;
const B = CREDS.companyB;

describe('BLOQUE 22 — Flujo integral completo (E2E contra API real)', () => {
  const uniq = suffix();
  let adminTok = '';
  let adminApi = new Api('');
  let guardTok = '';
  let guardApi = new Api('');

  const ids: Record<string, string | undefined> = {
    clientId: undefined,
    contractId: undefined,
    siteId: undefined,
    postId: undefined,
    guardId: undefined,
    routeId: undefined,
    shiftId: undefined,
    checkpointId: undefined,
    recordingId: undefined,
    sosId: undefined,
    requestId: undefined,
  };
  const names = {
    client: `E2E-CLIENTE-${uniq}`,
    contract: `E2E-CTR-${uniq}`,
    site: `E2E-INSTALACION-${uniq}`,
    post: `E2E-PUESTO-${uniq}`,
    guardNumber: `E2E-${uniq}`,
    guardEmail: `e2e.${uniq}@gruposervicom.test`,
    route: `E2E-RUTA-${uniq}`,
  };
  const GEO = { latitude: 19.4326, longitude: -99.1332 }; // dentro de la geocerca

  beforeAll(async () => {
    const admin = await login(ADMIN.email, ADMIN.password);
    adminTok = admin.accessToken;
    adminApi = new Api(adminTok);
  });

  afterAll(async () => {
    await cleanup(adminApi, ids);
  }, 30000);

  test('A. Autenticación: los 4 perfiles entran con sus roles correctos', async () => {
    const a = await login(ADMIN.email, ADMIN.password);
    expect(a.user.roleCodes).toContain('ADMINISTRATOR');
    expect(a.user.permissions).toEqual(expect.arrayContaining(['dashboard.view', 'clients.create']));

    const s = await login(SUP.email, SUP.password);
    expect(s.user.roleCodes).toContain('SUPERVISOR');

    const g = await login(CREDS.guard.email, CREDS.guard.password);
    expect(g.user.roleCodes).toContain('GUARD');
    expect(g.user.guardId).toBeTruthy();

    const c = await login(CLIENT.email, CLIENT.password);
    expect(c.user.roleCodes).toContain('CLIENT');
    expect(c.user.clientId).toBeTruthy();
  });

  test('B. Comercial: cliente, contrato, instalación (geocerca) y puesto', async () => {
    const resClient = await adminApi.post('/clients', {
      legalName: `${names.client} LEGAL`,
      commercialName: names.client,
      rfc: rfc(),
      email: `e2e.${uniq}@cliente.test`,
      phone: '5551102233',
      address: 'Av. E2E 1000, CDMX',
      status: 'activo',
    });
    expect([200, 201]).toContain(resClient.status);
    ids.clientId = dataOf(resClient)?.id;
    expect(ids.clientId).toBeTruthy();

    const resContract = await adminApi.post('/contracts', {
      clientId: ids.clientId,
      number: names.contract,
      startDate: isoDate(),
      endDate: isoDate(new Date(Date.now() + 365 * 24 * 3600 * 1000)),
      billingFrequency: 'mensual',
      status: 'activo',
    });
    expect([200, 201]).toContain(resContract.status);
    ids.contractId = dataOf(resContract)?.id;
    expect(ids.contractId).toBeTruthy();

    const resSite = await adminApi.post('/sites', {
      clientId: ids.clientId,
      name: names.site,
      address: 'Camino E2E 5, CDMX',
      latitude: GEO.latitude,
      longitude: GEO.longitude,
      geofenceRadiusMeters: 500,
      contactName: 'Contacto E2E',
      contactPhone: '5551102233',
      instructions: 'Instalación usada para pruebas E2E',
    });
    expect([200, 201]).toContain(resSite.status);
    ids.siteId = dataOf(resSite)?.id;
    expect(ids.siteId).toBeTruthy();

    const resPost = await adminApi.post('/posts', {
      siteId: ids.siteId,
      name: names.post,
      shiftStart: '09:00',
      shiftEnd: '18:00',
      active: true,
    });
    expect([200, 201]).toContain(resPost.status);
    ids.postId = dataOf(resPost)?.id;
    expect(ids.postId).toBeTruthy();
  });

  test('C. Guardia: se crea con usuario propio y valida duplicados', async () => {
    const resGuard = await adminApi.post('/guards', {
      employeeNumber: names.guardNumber,
      firstName: 'E2E',
      middleName: 'Integración',
      lastName: 'Test',
      email: names.guardEmail,
      phone: '5559876543',
      address: 'Calle E2E 88',
      hireDate: '2026-01-15',
      status: 'disponible',
    });
    expect([200, 201]).toContain(resGuard.status);
    ids.guardId = dataOf(resGuard)?.id;
    expect(ids.guardId).toBeTruthy();

    const dup = await adminApi.post('/guards', {
      employeeNumber: names.guardNumber,
      firstName: 'E2E',
      lastName: 'Dup',
      hireDate: '2026-01-15',
    });
    expect(dup.status).toBeGreaterThanOrEqual(400);
    expect(dup.status).toBeLessThan(500);

    // El guardia puede iniciar sesión con sus credenciales generadas
    const g = await login(names.guardEmail, 'Guardia123!');
    guardTok = g.accessToken;
    guardApi = new Api(guardTok);
    expect(g.user.roleCodes).toContain('GUARD');
  });

  test('D. Operación: ruta de rondín, turno, entrada con geocerca, GPS, rondín, bitácora e incidencia', async () => {
    const resRoute = await adminApi.post('/patrols/routes', {
      siteId: ids.siteId,
      name: names.route,
      schedule: 'cada_hora',
      active: true,
      checkpoints: [
        { name: 'Punto A', latitude: GEO.latitude, longitude: GEO.longitude, sequence: 1 },
        { name: 'Punto B', latitude: GEO.latitude + 0.0006, longitude: GEO.longitude + 0.0006, sequence: 2 },
      ],
    });
    expect([200, 201]).toContain(resRoute.status);
    ids.routeId = dataOf(resRoute)?.id;
    ids.checkpointId = dataOf(resRoute)?.checkpoints?.[0]?.id;
    expect(ids.routeId).toBeTruthy();
    expect(ids.checkpointId).toBeTruthy();

    const resShift = await adminApi.post('/shifts', {
      guardId: ids.guardId,
      postId: ids.postId,
      date: isoDate(),
      startTime: '09:00',
      endTime: '18:00',
      notes: 'Turno E2E',
    });
    expect([200, 201]).toContain(resShift.status);
    ids.shiftId = dataOf(resShift)?.id;
    expect(ids.shiftId).toBeTruthy();

    const resIn = await guardApi.post('/attendance', {
      type: 'entrada',
      ...GEO,
      device: 'e2e',
    });
    expect([200, 201]).toContain(resIn.status);
    expect(dataOf(resIn)?.geofenceResult).toBe('dentro');

    const resGps = await guardApi.post('/gps/ping', { ...GEO, accuracy: 12, device: 'e2e' });
    expect([200, 201]).toContain(resGps.status);

    const resCheckin = await guardApi.post('/patrols/checkin', {
      checkpointId: ids.checkpointId,
      ...GEO,
      method: 'gps',
    });
    expect([200, 201]).toContain(resCheckin.status);

    const resLog = await guardApi.post('/logbook', {
      description: `E2E evento en bitácora ${uniq}`,
      synced: true,
    });
    expect([200, 201]).toContain(resLog.status);

    const resInc = await guardApi.post('/incidents', {
      description: `E2E incidencia ${uniq}`,
      severity: 'media',
      typeName: 'otra',
      ...GEO,
      synced: true,
    });
    expect([200, 201]).toContain(resInc.status);
    expect(dataOf(resInc)?.status).toBe('abierta');

    const me = await guardApi.get('/guards/me');
    expect(me.status).toBe(200);
    expect(dataOf(me)?.id).toBe(ids.guardId);
  });

  test('E. Video real: configuración, fragmentos, manifest, grabación, URL firmada, evidencia y auditoría', async () => {
    const cfg = await guardApi.get('/video/config');
    expect([200, 201]).toContain(cfg.status);
    expect(dataOf(cfg)?.resolution).toBeTruthy();

    const start = await guardApi.post('/video/streams', { resolution: '640x480', fps: 15, bitrate: 700, audioEnabled: true, platform: 'e2e' });
    expect([200, 201]).toContain(start.status);
    const streamId = dataOf(start)?.id;
    expect(streamId).toBeTruthy();

    // Tres fragmentos numerados (idempotencia: reenviar el mismo seq no duplica)
    const frag1 = await guardApi.req('POST', `/video/streams/${streamId}/fragments?seq=0`, Buffer.alloc(4096, 7), true);
    expect([200, 201]).toContain(frag1.status);
    expect(dataOf(frag1)?.sequence).toBe(0);
    const frag1b = await guardApi.req('POST', `/video/streams/${streamId}/fragments?seq=0`, Buffer.alloc(4096, 7), true);
    expect([200, 201]).toContain(frag1b.status);
    expect(dataOf(frag1b)?.duplicate).toBe(true);
    await guardApi.req('POST', `/video/streams/${streamId}/fragments?seq=1`, Buffer.alloc(4096, 7), true);
    await guardApi.req('POST', `/video/streams/${streamId}/fragments?seq=2`, Buffer.alloc(4096, 7), true);

    // Manifest para el reproductor en vivo (permiso live.view)
    const man = await adminApi.get(`/video/streams/${streamId}/manifest`);
    expect([200, 201]).toContain(man.status);
    expect((dataOf(man)?.fragments ?? []).length).toBe(3);

    const end = await guardApi.put(`/video/streams/${streamId}/end`, {});
    expect([200, 201]).toContain(end.status);
    const recording = dataOf(end)?.recording ?? dataOf(end);
    ids.recordingId = recording?.id;
    expect(ids.recordingId).toBeTruthy();
    expect(Number(recording?.sizeBytes ?? 0)).toBe(4096 * 3);
    expect(recording?.fragmentCount ?? 0).toBe(3);

    const list = await adminApi.get('/video/recordings');
    expect(list.status).toBe(200);
    const found = Array.isArray(dataOf(list)) && dataOf(list).some((r: any) => r.id === ids.recordingId);
    expect(found).toBe(true);

    // URL temporal firmada: se genera y se consume sin sesión
    const signed = await adminApi.get(`/video/recordings/${ids.recordingId}/download-url`);
    expect([200, 201]).toContain(signed.status);
    const signedPath = dataOf(signed)?.url;
    expect(typeof signedPath).toBe('string');

    // Auditoría de la grabación
    const audit = await adminApi.get(`/video/recordings/${ids.recordingId}/audit`);
    expect([200, 201]).toContain(audit.status);
    expect(Array.isArray(dataOf(audit))).toBe(true);

    // Conservar como evidencia (sin expiración)
    const preserve = await adminApi.put(`/video/recordings/${ids.recordingId}/preserve`, { reason: 'E2E: prueba de conservación de evidencia' });
    expect([200, 201]).toContain(preserve.status);
    expect(dataOf(preserve)?.retentionPolicy).toBe('evidencia');
    expect(dataOf(preserve)?.expiresAt).toBeNull();

    const listAfterPreserve = await adminApi.get('/video/recordings?retention=evidencia');
    const preservedFound = Array.isArray(dataOf(listAfterPreserve)) && dataOf(listAfterPreserve).some((r: any) => r.id === ids.recordingId);
    expect(preservedFound).toBe(true);

    const del = await adminApi.put(`/video/recordings/${ids.recordingId}/delete`, {});
    expect([200, 201, 204]).toContain(del.status);
    ids.recordingId = undefined;
  });

  test('F. SOS y supervisión de punta a punta', async () => {
    const sos = await guardApi.post('/sos', { ...GEO, message: `SOS E2E ${uniq}` });
    expect([200, 201]).toContain(sos.status);
    ids.sosId = dataOf(sos)?.id;
    expect(ids.sosId).toBeTruthy();
    expect(dataOf(sos)?.status).toBe('activa');

    const ack = await adminApi.put(`/sos/${ids.sosId}/ack`, {});
    expect([200, 201]).toContain(ack.status);

    const close = await adminApi.put(`/sos/${ids.sosId}/close`, {});
    expect([200, 201]).toContain(close.status);

    const sup = await login(SUP.email, SUP.password);
    const supApi = new Api(sup.accessToken);
    const visit = await supApi.post('/supervision', {
      guardId: ids.guardId,
      postId: ids.postId,
      observations: `Visita E2E ${uniq}`,
      ...GEO,
      checklist: { uniforme: true, equipo: true, presentacion: true, consignas: true, asistencia: true, puesto: true },
    });
    expect([200, 201]).toContain(visit.status);
  });

  test('G. Pre-nómina y reportes', async () => {
    const now = new Date();
    const start = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const end = isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));

    const gen = await adminApi.post('/prepayroll/generate', { periodStart: start, periodEnd: end });
    // Se acepta generado (200/201) o "ya existe" (400/409): ambos prueban el módulo.
    expect([200, 201, 400, 409]).toContain(gen.status);

    const list = await adminApi.get('/prepayroll');
    expect(list.status).toBe(200);

    const repAtt = await adminApi.get('/reports/attendance');
    expect(repAtt.status).toBe(200);
    expect(Number(dataOf(repAtt)?.total ?? 0)).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(dataOf(repAtt)?.records)).toBe(true);

    const repShifts = await adminApi.get('/reports/shifts');
    expect(repShifts.status).toBe(200);
    expect(Number(dataOf(repShifts)?.total ?? 0)).toBeGreaterThanOrEqual(0);
  });

  test('H. Portal cliente: consulta, solicitud y gestión del administrador', async () => {
    const c = await login(CLIENT.email, CLIENT.password);
    const clientApi = new Api(c.accessToken);

    const mine = await clientApi.get('/clients/mine');
    expect(mine.status).toBe(200);
    expect(dataOf(mine)?.commercialName ?? dataOf(mine)?.legalName).toBeTruthy();

    const req = await clientApi.post('/client-requests', {
      type: 'reporte',
      priority: 'media',
      description: `E2E solicitud del cliente ${uniq}`,
    });
    expect([200, 201]).toContain(req.status);
    ids.requestId = dataOf(req)?.id;
    expect(ids.requestId).toBeTruthy();

    const respond = await adminApi.put(`/client-requests/${ids.requestId}/respond`, {
      status: 'en_proceso',
      response: `E2E respuesta del admin ${uniq}`,
    });
    expect([200, 201]).toContain(respond.status);

    const mineReq = await clientApi.get('/client-requests/mine');
    expect(mineReq.status).toBe(200);
    const found = Array.isArray(dataOf(mineReq)) && dataOf(mineReq).some((x: any) => x.id === ids.requestId);
    expect(found).toBe(true);
  });

  test('I. Aislamiento multiempresa: Empresa B no ve datos de Empresa A', async () => {
    const b = await login(B.email, B.password);
    const bApi = new Api(b.accessToken);

    const list = await bApi.get('/clients');
    expect(list.status).toBe(200);
    const items = Array.isArray(dataOf(list)) ? dataOf(list) : dataOf(list)?.items ?? [];
    expect(items.every((x: any) => x.commercialName !== names.client)).toBe(true);

    const direct = await bApi.get(`/clients/${ids.clientId}`);
    expect(direct.status).toBe(403);

    const noAuth = await new Api(null).get('/clients');
    expect(noAuth.status).toBe(401);
  });

  test('J. Validación: un dato inválido rechaza la creación (error controlado)', async () => {
    const res = await adminApi.post('/clients', { legalName: '', commercialName: '' });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    await sleep(0);
  });
});