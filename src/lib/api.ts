const API = process.env.NEXT_PUBLIC_API_URL || '';

export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...options?.headers,
      },
    });
  } catch (e) {
    // Network error — backend probably not running
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
