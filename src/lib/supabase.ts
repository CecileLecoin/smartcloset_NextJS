import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[FitLab] Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseKey || '');

// ── Helper: get current user ID ──────────────────────────────
export async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  //console.log('Access token:', accessToken);
  return accessToken || null;
}

// ── Helper: get public URL for a storage file ────────────────
export function getStorageUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ── Helper: upload file to storage ───────────────────────────
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob,
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw error;
  return getStorageUrl(bucket, path);
}
