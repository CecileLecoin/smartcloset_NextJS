import { supabase } from './supabase';

const API = process.env.NEXT_PUBLIC_API_URL || '';

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

  const res = await fetch(url, {
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
  return apiFetch<T>(path, {
    method: 'POST',
    body: isFormData ? body : JSON.stringify(body),
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    cache: 'no-cache',
  });
}
