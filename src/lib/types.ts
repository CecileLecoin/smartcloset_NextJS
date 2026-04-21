export interface GarmentAnalysis {
  type: string;
  category: string;
  colors: string[];
  primary_color: string;
  style: string;
  fabric_texture: string;
  pattern: string;
  fit: string;
  details: string[];
  season: string;
  style_description: string;
  confidence: number;
}

export interface WardrobeItem {
  id: string;
  file_path: string;
  img_hash: string;
  analysis: GarmentAnalysis;
  added_at: string;
  renders: { key: string; render_url: string }[];
  meshes: Record<string, string>;
}

export interface OutfitItem {
  id: string;
  analysis: GarmentAnalysis;
  file_path: string;
}

export interface TryOnResult {
  url: string;
  label: string;
  fullLabel: string;
  items: OutfitItem[];
  ts: number;
  hasAffiliate?: boolean;
}

export interface AffiliateItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  image_url: string;
  buy_url: string;
  category: string;
  colors: string[];
}
