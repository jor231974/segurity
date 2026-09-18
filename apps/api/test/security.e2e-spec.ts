/**
 * PRUEBA DE INTEGRACIÓN E2E — SEGURIDAD Y PERMISOS (Bloque 22)
 * Sin token, autenticación, RBAC por rol, aislamiento multiempresa y validación.
 */
import { Api, CREDS, login, dataOf } from './helpers';

describe('BLOQUE 22 — Seguridad, permisos y aislamiento (E2E)', () => {
  let adminApi = new Api('');
  let guardApi = new Api('');
  let clientApi = new Api('');
  let bApi = new Api('');

  beforeAll(async () => {
    const a = await login(CREDS.admin.email, CREDS.admin.password);
    adminApi = new Api(a.accessToken);
    const g = await login(CREDS.guard.email, CREDS.guard.password);
    guardApi = new Api(g.accessToken);
    const c = await login(CREDS.client.email, CREDS.client.password);
    clientApi = new Api(c.accessToken);
    const b = await login(CREDS.companyB.email, CREDS.companyB.password);
    bApi = new Api(b.accessToken);
  });

  test('1. Sin token: la API responde 401', async () => {
    for (const path of ['/clients', '/guards', '/dashboard', '/audit', '/reports/attendance']) {
      const res = await new Api(null).get(path);
      expect(res.status).toBe(401);
    }
  });

  test('2. ID inválido: responde 400 (UUID) y no 500', async () => {
    const res = await adminApi.get('/clients/no-es-uuid');
    expect(res.status).toBe(400);
  });

  test('3. RBAC: el rol CLIENT no accede a módulos de administración', async () => {
    for (const path of ['/guards', '/prepayroll', '/users', '/audit', '/reports/shifts']) {
      const res = await clientApi.get(path);
      expect(res.status).toBe(403);
    }
  });

  test('4. RBAC: el rol GUARD solo ve sus propios datos y no los de administración', async () => {
    expect((await guardApi.get('/guards/me')).status).toBe(200);

    for (const path of ['/clients', '/users', '/audit', '/prepayroll', '/video/recordings']) {
      const res = await guardApi.get(path);
      expect(res.status).toBe(403);
    }
  });

  test('5. Aislamiento multiempresa: B no ve ni lee a la empresa A (cliente ABC Corp)', async () => {
    const listA = await adminApi.get('/clients');
    expect(listA.status).toBe(200);
    const itemsA = dataOf(listA)?.items ?? dataOf(listA) ?? [];
    const abc = itemsA.find((x: any) => x.commercialName === 'ABC Corp');
    expect(abc).toBeTruthy();

    const listB = await bApi.get('/clients');
    expect(listB.status).toBe(200);
    const itemsB = dataOf(listB)?.items ?? dataOf(listB) ?? [];
    expect(itemsB.some((x: any) => x.commercialName === 'ABC Corp')).toBe(false);

    const direct = await bApi.get(`/clients/${abc.id}`);
    expect(direct.status).toBe(403);

    const gpsB = await bApi.get('/gps/positions');
    expect(gpsB.status).toBe(200);
  });

  test('6. Alcance por rol: el CLIENT solo ve su propio portal (scoped)', async () => {
    const mine = await clientApi.get('/clients/mine');
    expect(mine.status).toBe(200);
    // El endpoint restringe por companyId/clientId del token
    expect(dataOf(mine)?.commercialName ?? dataOf(mine)?.legalName).toBeTruthy();
  });

  test('7. Validación backend: un payload inválido no genera 500', async () => {
    const bad = await adminApi.post('/clients', { comercialName: 'Solo nombre' });
    expect(bad.status).toBeGreaterThanOrEqual(400);
    expect(bad.status).toBeLessThan(500);

    const badSite = await adminApi.post('/sites', { name: 'sitio sin cliente' });
    expect(badSite.status).toBeGreaterThanOrEqual(400);
    expect(badSite.status).toBeLessThan(500);
  });
});