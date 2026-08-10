import { supabase } from './supabase';

const API = process.env.NEXT_PUBLIC_API_URL;
const API_BASE = API.replace(/\/+$/, '');

function resolveApiUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (!API_BASE) return url;
  return url.startsWith('/') ? `${API_BASE}${url}` : `${API_BASE}/${url}`;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return { Authorization: `Bearer ${data.session.access_token}`, cache: 'no-cache' };
    }
  } catch {}
  return {};
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

  const headers = new Headers(options.headers || {});

  // ✅ Ajout du token UNIQUEMENT s’il existe
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(resolveApiUrl(url), {
    ...options,
    headers,
    credentials: 'include', // ✅ utile si cookies / auth serveur
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }

  return res.json();
}



export async function apiPost<T = any>(
  path: string,
  body: FormData | Record<string, any>
): Promise<T> {
  const isFormData = body instanceof FormData;

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers: Record<string, string> = {};

  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return apiFetch<T>(path, {
    method: 'POST',
    body: isFormData ? body : JSON.stringify(body),
    headers,
    cache: 'no-cache',
  });
}


export async function apiGet<T>(url: string): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(resolveApiUrl(url), {
    method: 'GET',
    credentials: 'include',
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {},
    cache: 'no-cache',
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json() as Promise<T>;
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(resolveApiUrl(url), {
    method: 'DELETE',
    credentials: 'include',
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {},
    cache: 'no-cache',
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  // Certains DELETE renvoient rien
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}