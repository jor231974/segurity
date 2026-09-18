/**
 * Helpers para las pruebas de integración HTTP (Bloque 22).
 * Corren contra una API real: E2E_API_URL o http://localhost:3001/api.
 * Requiere la API levantada (npm run start:prod:api) y la BD con seed.
 */

export const BASE = process.env.E2E_API_URL || 'http://localhost:3001/api';

export const CREDS = {
  admin: { email: 'admin@gruposervicom.com', password: 'Admin123!' },
  supervisor: { email: 'supervisor@gruposervicom.com', password: 'Supervisor123!' },
  guard: { email: 'guardia@gruposervicom.com', password: 'Guardia123!' },
  client: { email: 'cliente@abccorp.com', password: 'Cliente123!' },
  companyB: { email: 'admin@prototal.com', password: 'Admin123!' },
};

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function suffix() {
  return Date.now().toString(36).toUpperCase();
}

export function isoDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** RFC persona moral de 12 caracteres */
export function rfc() {
  const n = String(Math.floor(Date.now() / 1000)).slice(-8);
  return `Q2E${n}`;
}

export interface ApiResult {
  status: number;
  json: any;
}

export class Api {
  token: string | null;

  constructor(token: string | null = null) {
    this.token = token;
  }

  async req(method: string, path: string, body?: unknown, raw = false): Promise<ApiResult> {
    await sleep(90);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const opts: RequestInit = { method, headers };
    if (body !== undefined) {
      if (raw) {
        headers['Content-Type'] = 'application/octet-stream';
        opts.body = body as BodyInit;
      } else {
        headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
    }
    const res = await fetch(`${BASE}${path}`, opts);
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { status: res.status, json };
  }

  get(path: string) {
    return this.req('GET', path);
  }

  post(path: string, body?: unknown) {
    return this.req('POST', path, body);
  }

  put(path: string, body?: unknown) {
    return this.req('PUT', path, body);
  }

  del(path: string) {
    return this.req('DELETE', path);
  }
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok || !json?.data) {
    throw new Error(`Login fallido (${res.status}) para ${email}: ${JSON.stringify(json)}`);
  }
  return json.data as {
    accessToken: string;
    user: {
      id: string;
      email: string;
      companyId: string;
      roleCodes: string[];
      permissions: string[];
      guardId?: string | null;
      clientId?: string | null;
    };
  };
}

/** data de una respuesta con éxito ({success,data,...}) */
export function dataOf(res: ApiResult): any {
  return res.json?.data;
}

/** Util para pobrar un endpoint y devolver su `data` (delega en helpers si aplica) */
export function pick<T extends Record<string, any>>(obj: T, key: string): any {
  return obj?.[key];
}

/** Limpieza best-effort de datos E2E creados durante la ejecución */
export async function cleanup(api: Api, ids: Record<string, string | undefined>) {
  const targets: [string, string | undefined][] = [
    ['/video/recordings/', ids.recordingId],
    ['/patrols/routes/', ids.routeId],
    ['/guards/', ids.guardId],
    ['/posts/', ids.postId],
    ['/sites/', ids.siteId],
    ['/contracts/', ids.contractId],
    ['/clients/', ids.clientId],
  ];
  for (const [prefix, id] of targets) {
    if (!id) continue;
    try {
      // Las grabaciones de video se eliminan con PUT .../delete
      const res =
        prefix === '/video/recordings/'
          ? await api.put(`${prefix}${id}/delete`, {})
          : await api.del(`${prefix}${id}`);
      if (res.status !== 200 && res.status !== 201 && res.status !== 204) {
        console.info(`[cleanup] omitido ${prefix}${id} (${res.status})`);
      }
    } catch (e) {
      console.info(`[cleanup] error ${prefix}${id}: ${(e as Error).message}`);
    }
  }
}