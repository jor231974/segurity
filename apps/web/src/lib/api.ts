export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  lastName: string;
  phone?: string | null;
  companyId?: string | null;
  roleCodes: string[];
  permissions: string[];
  guardId?: string | null;
  clientId?: string | null;
}

let accessToken: string | null = null;
let cachedMe: AuthUser | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  cachedMe = null;
}

export function getAccessToken() {
  if (typeof window !== 'undefined') return window.__AUTH_TOKEN__ ?? null;
  return accessToken;
}

declare global {
  interface Window {
    __AUTH_TOKEN__?: string;
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers, cache: 'no-store' });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.__AUTH_TOKEN__ = undefined;
      window.location.href = '/login';
    }
    throw new ApiError('Sesión expirada', 401);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((json as any)?.message || 'Error en la solicitud', res.status);
  }
  return (json as any)?.data ?? (json as T);
}

export async function login(email: string, password: string): Promise<{ accessToken: string; user: AuthUser }> {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (typeof window !== 'undefined') window.__AUTH_TOKEN__ = data.accessToken;
  accessToken = data.accessToken;
  cachedMe = data.user || null;
  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  if (cachedMe) return cachedMe;
  const me = await apiFetch<AuthUser>('/auth/me');
  cachedMe = me;
  return me;
}

export function getCachedUser(): AuthUser | null {
  return cachedMe;
}