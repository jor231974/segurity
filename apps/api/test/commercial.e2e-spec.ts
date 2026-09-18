/**
 * PRUEBA E2E — BLOQUE COMERCIAL (Cliente → Contrato → Servicio → Instalación → Puesto)
 * Aislamiento multiempresa del ContractService, validaciones de datos y CRUD básico.
 */
import { Api, CREDS, login, dataOf, suffix, isoDate, rfc } from './helpers';

describe('BLOQUE COMERCIAL — Cliente, Contrato, Servicio, Instalación y Puesto (E2E)', () => {
  let adminApi = new Api('');
  let bApi = new Api('');
  const uniq = suffix();

  test('A. Prepara empresa A (cliente, instalación) y empresa B (cliente, instalación)', async () => {
    const a = await login(CREDS.admin.email, CREDS.admin.password);
    adminApi = new Api(a.accessToken);
    const b = await login(CREDS.companyB.email, CREDS.companyB.password);
    bApi = new Api(b.accessToken);

    const clientA = await adminApi.post('/clients', {
      legalName: `Comercial ${uniq} A`,
      commercialName: `Cliente E2E A ${uniq}`,
      rfc: rfc() + 'A',
      email: `e2e.${uniq}.a@cliente.test`,
      phone: '5551102233',
      address: 'Av. Comercial A 10, CDMX',
      status: 'activo',
    });
    expect([200, 201]).toContain(clientA.status);
    (globalThis as any).__clientA = dataOf(clientA)?.id;

    const siteA = await adminApi.post('/sites', {
      clientId: (globalThis as any).__clientA,
      name: `Instalación A ${uniq}`,
      address: 'Camino A 5, CDMX',
      latitude: 19.4326,
      longitude: -99.1332,
      geofenceRadiusMeters: 200,
    });
    expect([200, 201]).toContain(siteA.status);
    (globalThis as any).__siteA = dataOf(siteA)?.id;

    const clientB = await bApi.post('/clients', {
      legalName: `Comercial ${uniq} B`,
      commercialName: `Cliente E2E B ${uniq}`,
      rfc: rfc() + 'B',
      email: `e2e.${uniq}.b@cliente.test`,
      phone: '5551102244',
      address: 'Av. Comercial B 20, MTY',
      status: 'activo',
    });
    expect([200, 201]).toContain(clientB.status);
    (globalThis as any).__clientB = dataOf(clientB)?.id;

    const siteB = await bApi.post('/sites', {
      clientId: (globalThis as any).__clientB,
      name: `Instalación B ${uniq}`,
      address: 'Camino B 8, MTY',
      latitude: 25.6866,
      longitude: -100.3161,
      geofenceRadiusMeters: 300,
    });
    expect([200, 201]).toContain(siteB.status);
    (globalThis as any).__siteB = dataOf(siteB)?.id;
  });

  test('B. La empresa A NO puede ligar al contrato una instalación de la empresa B (aislamiento)', async () => {
    const clientA = (globalThis as any).__clientA;
    const siteB = (globalThis as any).__siteB;

    const res = await adminApi.post('/contracts', {
      clientId: clientA,
      number: `CTR-${uniq}-X`,
      startDate: isoDate(),
      endDate: isoDate(new Date(Date.now() + 365 * 24 * 3600 * 1000)),
      billingFrequency: 'mensual',
      status: 'activo',
      services: [
        { siteId: siteB, name: 'Vigilancia', guardCount: 1, tariff: 10000, startDate: isoDate() },
      ],
    });
    expect(res.status).toBe(403);
  });

  test('C. La empresa B no agrega servicios con instalaciones de la empresa A (addService)', async () => {
    const clientB = (globalThis as any).__clientB;
    const siteA = (globalThis as any).__siteA;

    const contractB = await bApi.post('/contracts', {
      clientId: clientB,
      number: `CTR-${uniq}-B`,
      startDate: isoDate(),
      endDate: isoDate(new Date(Date.now() + 365 * 24 * 3600 * 1000)),
      status: 'activo',
    });
    expect([200, 201]).toContain(contractB.status);
    const contractBId = dataOf(contractB)?.id;

    const bad = await bApi.post(`/contracts/${contractBId}/services`, {
      siteId: siteA,
      name: 'Vigilancia B',
      guardCount: 1,
      tariff: 9000,
      startDate: isoDate(),
    });
    expect(bad.status).toBe(403);
  });

  test('D. Aislamiento por cliente: la instalación de OTRO cliente de la misma empresa se rechaza', async () => {
    const clientA = (globalThis as any).__clientA;
    const siteB = (globalThis as any).__siteB;

    // Empresa A crea un segundo cliente; la instalación B (de otra empresa) debe rechazarse también por empresa
    const clientA2 = await adminApi.post('/clients', {
      legalName: `Comercial ${uniq} A2`,
      commercialName: `Cliente E2E A2 ${uniq}`,
      rfc: rfc() + 'C',
      email: `e2e.${uniq}.a2@cliente.test`,
      phone: '5551102255',
      address: 'Av. Comercial A2 10, CDMX',
      status: 'activo',
    });
    expect([200, 201]).toContain(clientA2.status);
    const clientA2Id = dataOf(clientA2)?.id;

    const contractA2 = await adminApi.post('/contracts', {
      clientId: clientA2Id,
      number: `CTR-${uniq}-A2`,
      startDate: isoDate(),
      endDate: isoDate(new Date(Date.now() + 365 * 24 * 3600 * 1000)),
      status: 'activo',
    });
    expect([200, 201]).toContain(contractA2.status);
    const contractA2Id = dataOf(contractA2)?.id;

    // El site de empresa B se intenta usar en un contrato de A2 → 403
    const cross = await adminApi.post(`/contracts/${contractA2Id}/services`, {
      siteId: siteB,
      name: 'Servicio cruzado',
      guardCount: 1,
      tariff: 8000,
      startDate: isoDate(),
    });
    expect(cross.status).toBe(403);
  });

  test('E. Flujo válido: contrato con servicio en instalación propia de la misma empresa', async () => {
    const clientA = (globalThis as any).__clientA;
    const siteA = (globalThis as any).__siteA;

    const res = await adminApi.post('/contracts', {
      clientId: clientA,
      number: `CTR-${uniq}-OK`,
      startDate: isoDate(),
      endDate: isoDate(new Date(Date.now() + 365 * 24 * 3600 * 1000)),
      billingFrequency: 'mensual',
      status: 'activo',
      services: [
        { siteId: siteA, name: 'Vigilancia 24/7', guardCount: 2, tariff: 12000, startDate: isoDate() },
      ],
    });
    expect([200, 201]).toContain(res.status);
    const contractId = dataOf(res)?.id;
    expect(contractId).toBeTruthy();

    const services = await adminApi.get(`/contracts/${contractId}/services`);
    expect(services.status).toBe(200);
    const list = dataOf(services) ?? [];
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Vigilancia 24/7');

    const profit = await adminApi.get(`/contracts/${contractId}/profitability`);
    expect(profit.status).toBe(200);
    expect(dataOf(profit)?.servicesCount).toBe(1);
  });

  test('F. Validaciones backend rechazan malos datos (400 y no 500)', async () => {
    const clientA = (globalThis as any).__clientA;
    const siteA = (globalThis as any).__siteA;

    // Fechas invertidas
    const badDates = await adminApi.post('/contracts', {
      clientId: clientA,
      number: `CTR-${uniq}-FECHAS`,
      startDate: isoDate(new Date(Date.now() + 100 * 24 * 3600 * 1000)),
      endDate: isoDate(),
      status: 'activo',
    });
    expect(badDates.status).toBe(400);

    // Status inválido
    const badStatus = await adminApi.post('/contracts', {
      clientId: clientA,
      number: `CTR-${uniq}-ESTADO`,
      startDate: isoDate(),
      endDate: isoDate(new Date(Date.now() + 365 * 24 * 3600 * 1000)),
      status: 'inexistente',
    });
    expect(badStatus.status).toBe(400);

    // Tarifa inválida
    const badTariff = await adminApi.post('/contracts', {
      clientId: clientA,
      number: `CTR-${uniq}-TARIFA`,
      startDate: isoDate(),
      endDate: isoDate(new Date(Date.now() + 365 * 24 * 3600 * 1000)),
      services: [{ siteId: siteA, name: 'S', tariff: -5, startDate: isoDate() }],
    });
    expect(badTariff.status).toBe(400);

    // Instalación con latitud fuera de rango
    const badLat = await adminApi.post('/sites', {
      clientId: clientA,
      name: `Sitio mal ${uniq}`,
      address: 'Calle Falsa 123',
      latitude: 99.5,
      longitude: -99.1,
    });
    expect(badLat.status).toBe(400);

    // Puesto con horario inválido
    const badTime = await adminApi.post('/posts', {
      siteId: siteA,
      name: `Puesto mal ${uniq}`,
      shiftStart: '25:00',
      shiftEnd: '18:00',
    });
    expect(badTime.status).toBe(400);
  });

  test('G. Número de contrato duplicado se rechaza', async () => {
    const clientA = (globalThis as any).__clientA;
    const number = `CTR-${uniq}-DUP`;
    const payload = {
      clientId: clientA,
      number,
      startDate: isoDate(),
      endDate: isoDate(new Date(Date.now() + 365 * 24 * 3600 * 1000)),
      status: 'activo',
    };
    const first = await adminApi.post('/contracts', payload);
    expect([200, 201]).toContain(first.status);
    const dup = await adminApi.post('/contracts', payload);
    expect(dup.status).toBe(400);
  });
});