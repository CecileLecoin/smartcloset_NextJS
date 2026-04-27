import { supabase } from './supabase';

const API = process.env.NEXT_PUBLIC_API_URL || '';

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return { Authorization: `Bearer ${data.session.access_token}`, caches: 'no-cache' };
    }
  } catch {}
  return {};
}

export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const authHeaders = await getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...authHeaders,
        ...options?.headers,
      },
      cache: 'no-cache',
    });
  } catch (e) {
    console.warn(`[API] Backend unreachable for ${path}`);
    throw new Error('Backend indisponible — lance le serveur Python sur le port 8000');
  }
  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try { detail = JSON.parse(text).detail || text; } catch {}
    throw new Error(detail);
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
  });
}
