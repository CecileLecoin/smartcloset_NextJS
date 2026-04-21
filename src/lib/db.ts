import { supabase, getUserId, uploadFile, getStorageUrl } from './supabase';
import type { WardrobeItem, GarmentAnalysis } from './types';

// ═══════════════════════════════════════════════════════════════
// GARMENTS
// ═══════════════════════════════════════════════════════════════

export async function fetchGarments(): Promise<WardrobeItem[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('garments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) { console.error('fetchGarments:', error); return []; }

  return (data || []).map(row => ({
    id: row.id,
    file_path: row.file_path,
    img_hash: row.img_hash,
    analysis: row.analysis as GarmentAnalysis,
    added_at: row.created_at,
    renders: [],
    meshes: {},
  }));
}

export async function addGarment(
  file: File,
  analysis: GarmentAnalysis,
  imgHash: string,
): Promise<WardrobeItem | null> {
  const userId = await getUserId();
  if (!userId) throw new Error('Non connecté');

  // Upload image to Supabase Storage
  const ext = file.name.split('.').pop() || 'jpg';
  const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;
  const publicUrl = await uploadFile('garments', storagePath, file);

  // Insert into DB
  const { data, error } = await supabase
    .from('garments')
    .insert({
      user_id: userId,
      file_path: publicUrl,
      img_hash: imgHash,
      analysis,
      season: analysis.season || null,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    file_path: data.file_path,
    img_hash: data.img_hash,
    analysis: data.analysis as GarmentAnalysis,
    added_at: data.created_at,
    renders: [],
    meshes: {},
  };
}

export async function updateGarmentAnalysis(
  garmentId: string,
  updates: Partial<GarmentAnalysis>,
): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error('Non connecté');

  // Fetch current analysis
  const { data: current } = await supabase
    .from('garments')
    .select('analysis')
    .eq('id', garmentId)
    .eq('user_id', userId)
    .single();

  if (!current) throw new Error('Vêtement non trouvé');

  const merged = { ...current.analysis, ...updates };

  const { error } = await supabase
    .from('garments')
    .update({ analysis: merged, updated_at: new Date().toISOString() })
    .eq('id', garmentId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteGarment(garmentId: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error('Non connecté');

  const { error } = await supabase
    .from('garments')
    .delete()
    .eq('id', garmentId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function checkDuplicateHash(hash: string): Promise<WardrobeItem | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data } = await supabase
    .from('garments')
    .select('*')
    .eq('user_id', userId)
    .eq('img_hash', hash)
    .limit(1);

  if (!data?.length) return null;
  const row = data[0];
  return {
    id: row.id,
    file_path: row.file_path,
    img_hash: row.img_hash,
    analysis: row.analysis as GarmentAnalysis,
    added_at: row.created_at,
    renders: [],
    meshes: {},
  };
}

// ═══════════════════════════════════════════════════════════════
// TRYON RESULTS (HISTORY)
// ═══════════════════════════════════════════════════════════════

export async function saveTryonResult(
  renderUrl: string,
  garmentIds: string[],
  cacheKey: string,
  gender: string,
  hasAffiliate: boolean = false,
): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  await supabase.from('tryon_results').insert({
    user_id: userId,
    render_url: renderUrl,
    garment_ids: garmentIds,
    cache_key: cacheKey,
    gender,
    has_affiliate: hasAffiliate,
  });
}

export async function fetchTryonHistory() {
  const userId = await getUserId();
  if (!userId) return [];

  const { data } = await supabase
    .from('tryon_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);

  return data || [];
}

// ═══════════════════════════════════════════════════════════════
// PROFILE / BASE MODEL
// ═══════════════════════════════════════════════════════════════

export async function getProfile() {
  const userId = await getUserId();
  if (!userId) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return data;
}

export async function updateProfile(updates: {
  gender?: string;
  display_name?: string;
  base_photo_url?: string;
  show_suggestions?: boolean;
}) {
  const userId = await getUserId();
  if (!userId) throw new Error('Non connecté');

  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}

export async function uploadBasePhoto(file: File): Promise<string> {
  const userId = await getUserId();
  if (!userId) throw new Error('Non connecté');

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/base-photo.${ext}`;
  const url = await uploadFile('base-models', path, file);

  await updateProfile({ base_photo_url: url });
  return url;
}
