'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, SlidersHorizontal, Check, CloudSun, ShoppingBag } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import GarmentDetail from '@/components/GarmentDetail';
import ImportProduct from '@/components/ImportProduct';
import type { WardrobeItem, OutfitItem } from '@/lib/types';

const CATEGORY_CHIPS = [
  { key: 'all', label: 'Tous', emoji: '' },
  { key: 'haut', label: 'Hauts', emoji: '👕' },
  { key: 'bas', label: 'Bas', emoji: '👖' },
  { key: 'robe', label: 'Robes', emoji: '👗' },
  { key: 'veste', label: 'Vestes', emoji: '🧥' },
  { key: 'accessoire', label: 'Acc.', emoji: '🧣' },
];

const SEASON_CHIPS = [
  { key: 'all', label: 'Tout', emoji: '🌡️' },
  { key: 'hiver', label: 'Hiver', emoji: '❄️' },
  { key: 'printemps', label: 'Printemps', emoji: '🌸' },
  { key: 'ete', label: 'Été', emoji: '☀️' },
  { key: 'automne', label: 'Automne', emoji: '🍂' },
  { key: 'pluie', label: 'Pluie', emoji: '🌧️' },
  { key: 'froid', label: 'Froid <5°', emoji: '🥶' },
  { key: 'doux', label: 'Doux 10-20°', emoji: '😌' },
  { key: 'chaud', label: 'Chaud >25°', emoji: '🔥' },
];

interface Props {
  outfit: OutfitItem[];
  onToggleOutfit: (item: OutfitItem) => void;
  onGoTryOn: () => void;
}

function getCat(item: WardrobeItem): string {
  const s = ((item.analysis?.category || '') + ' ' + (item.analysis?.type || '')).toLowerCase();
  if (/bas|jean|pant|short|jupe|skirt|legging/.test(s)) return 'bas';
  if (/robe|dress|combi|jumpsuit/.test(s)) return 'robe';
  if (/veste|jacket|blazer|cardigan|gilet/.test(s)) return 'veste';
  if (/manteau|coat|trench|parka/.test(s)) return 'veste';
  if (/écharpe|echarpe|scarf|foulard|ceinture|chapeau|lunette|accessoire/.test(s)) return 'accessoire';
  return 'haut';
}

export default function WardrobeScreen({ outfit, onToggleOutfit, onGoTryOn }: Props) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [season, setSeason] = useState('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [detailItem, setDetailItem] = useState<WardrobeItem | null>(null);
  const [showImport, setShowImport] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadWardrobe = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<{ items: WardrobeItem[] }>('/api/wardrobe');
      setItems(data.items || []);
    } catch (e: any) {
      console.error('Load wardrobe error:', e);
      setError(e.message || 'Impossible de charger la garde-robe');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadWardrobe(); }, [loadWardrobe]);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        await apiFetch('/api/analyze', { method: 'POST', body: fd });
      }
      await loadWardrobe();
    } catch (e: any) {
      alert('Erreur: ' + e.message);
    } finally {
      setUploading(false);
    }
  }

  const filtered = items.filter(item => {
    if (filter !== 'all' && getCat(item) !== filter) return false;
    if (search) {
      const hay = [
        item.analysis?.type, item.analysis?.style, item.analysis?.fit,
        item.analysis?.pattern, ...(item.analysis?.colors || []),
        item.analysis?.primary_color,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const counts = { all: items.length, haut: 0, bas: 0, robe: 0, veste: 0, accessoire: 0 };
  items.forEach(i => { const c = getCat(i); if (c in counts) (counts as any)[c]++; });

  const isInOutfit = (id: string) => outfit.some(o => o.id === id);

  return (
    <div className="h-full overflow-y-auto pb-4">
      {/* Hidden file input */}
      <input
        type="file"
        id="file-upload"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleUpload(e.target.files)}
      />

      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <h1 className="text-xl font-extrabold">Ma garde-robe 👋</h1>
        <p className="text-xs text-dim mt-0.5">
          {items.length} pièce{items.length > 1 ? 's' : ''} • adapté à ta météo du jour
        </p>

        {/* Search */}
        <div className="flex gap-2 mt-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
            <input
              type="text"
              placeholder="Chercher un vêtement…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm outline-none focus:border-secondary transition-colors"
            />
          </div>
          <button className="w-11 h-11 bg-card border border-border rounded-xl flex items-center justify-center text-dim"
            onClick={() => setShowImport(true)} title="Importer un produit">
            <ShoppingBag size={16} />
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar">
          {CATEGORY_CHIPS.map(c => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`chip ${filter === c.key ? 'active' : ''}`}
            >
              {c.emoji && <span>{c.emoji}</span>} {c.label} · {(counts as any)[c.key] || 0}
            </button>
          ))}
        </div>
      </div>

      {/* Weather bar */}
      <div className="mx-5 mb-2 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all"
           style={{ background: 'linear-gradient(135deg, #E8F4FD, #F0E8FF)', border: '1px solid rgba(124,92,252,0.1)' }}>
        <CloudSun size={28} className="text-secondary" />
        <div className="flex-1">
          <p className="text-sm font-bold">16° — Paris</p>
          <p className="text-[10px] text-dim">Quelques nuages, pas de pluie</p>
        </div>
        <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-secondary/10 text-secondary">Mi-saison</span>
      </div>

      {/* Season chips */}
      <p className="text-[9px] font-bold uppercase tracking-widest text-dim px-5 mb-1.5">Filtrer par saison / météo</p>
      <div className="flex gap-1.5 px-5 overflow-x-auto no-scrollbar mb-4">
        {SEASON_CHIPS.map(c => (
          <button
            key={c.key}
            onClick={() => setSeason(c.key)}
            className={`season-chip ${season === c.key ? 'active' : ''}`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* My pieces */}
      <div className="flex items-center justify-between px-5 mb-2">
        <h2 className="text-[13px] font-bold">Mes pièces</h2>
        <span className="text-[11px] font-semibold text-primary cursor-pointer">Voir tout</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-2.5 px-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 px-8">
          <p className="text-3xl mb-3 opacity-40">📡</p>
          <p className="text-sm font-semibold text-dark mb-1">Backend indisponible</p>
          <p className="text-xs text-dim leading-relaxed mb-4">
            Lance ton serveur Python sur le port 8000 :<br />
            <code className="text-[10px] bg-border rounded px-2 py-1 mt-2 inline-block font-mono">
              cd backend && uvicorn main:app --port 8000
            </code>
          </p>
          <button
            onClick={() => { setLoading(true); loadWardrobe(); }}
            className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold active:scale-95 transition-all"
          >
            🔄 Réessayer
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-dim text-sm">
          <p className="text-3xl mb-2 opacity-40">🪣</p>
          {items.length === 0 ? (
            <p>Ajoutez vos premiers vêtements<br />avec le bouton <span className="text-primary font-bold">+</span></p>
          ) : (
            <p>Aucun résultat<br /><span className="text-xs opacity-60">Modifiez la recherche ou le filtre</span></p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 px-5 mb-6">
          {filtered.map(item => {
            const selected = isInOutfit(item.id);
            return (
              <button
                key={item.id}
                onClick={() => onToggleOutfit({
                  id: item.id,
                  analysis: item.analysis,
                  file_path: item.file_path,
                })}
                onContextMenu={(e) => { e.preventDefault(); setDetailItem(item); }}
                onTouchStart={() => {
                  longPressTimer.current = setTimeout(() => setDetailItem(item), 500);
                }}
                onTouchEnd={() => {
                  if (longPressTimer.current) clearTimeout(longPressTimer.current);
                }}
                onTouchMove={() => {
                  if (longPressTimer.current) clearTimeout(longPressTimer.current);
                }}
                className={`card aspect-[2/3] relative transition-all active:scale-95 overflow-hidden ${
                  selected ? 'ring-2 ring-primary ring-offset-1' : ''
                }`}
              >
                <img
                  src={item.file_path}
                  alt={item.analysis?.type || ''}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
                <div className="absolute bottom-0 inset-x-0 px-2 py-1.5"
                     style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.5))' }}>
                  <p className="text-white text-[10px] font-semibold capitalize truncate">
                    {item.analysis?.type || 'Vêtement'}
                  </p>
                </div>
                {selected && (
                  <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                )}
                {(item as any).affiliate?.is_affiliate && (
                  <div className="badge-affiliate">✦</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Suggested for you (affiliate placeholder) */}
      <div className="flex items-center justify-between px-5 mb-2 mt-2">
        <h2 className="text-[13px] font-bold">✦ Suggéré pour toi</h2>
        <span className="text-[11px] font-semibold text-secondary cursor-pointer">Voir tout</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5 px-5 mb-8">
        {[
          { emoji: '👜', name: 'Sac lilas', bg: '#F0E5FF' },
          { emoji: '👟', name: 'Sneakers', bg: '#FFF5E5' },
          { emoji: '🧥', name: 'Veste jean', bg: '#E5FFF5' },
        ].map((item, i) => (
          <div key={i} className="card aspect-[2/3] relative cursor-pointer active:scale-95 transition-all overflow-hidden">
            <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-dim"
                 style={{ background: `linear-gradient(135deg, ${item.bg}, ${item.bg}dd)` }}>
              <span className="text-2xl mb-1">{item.emoji}</span>
              {item.name}
            </div>
            <div className="absolute bottom-0 inset-x-0 px-2 py-1.5"
                 style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.5))' }}>
              <p className="text-white text-[10px] font-semibold">{item.name}</p>
            </div>
            <div className="badge-affiliate">✦</div>
          </div>
        ))}
      </div>

      {/* Outfit floating bar */}
      {outfit.length > 0 && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-dark text-white rounded-full px-5 py-3 shadow-elevated flex items-center gap-3 z-40 cursor-pointer active:scale-95 transition-all"
          onClick={onGoTryOn}
        >
          <div className="flex -space-x-2">
            {outfit.slice(0, 3).map((o, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-primary/30 border-2 border-dark flex items-center justify-center text-[10px]">
                {o.analysis?.type?.charAt(0)?.toUpperCase() || '?'}
              </div>
            ))}
          </div>
          <span className="text-xs font-bold">
            {outfit.length} pièce{outfit.length > 1 ? 's' : ''} → Essayer ✨
          </span>
        </div>
      )}

      {/* Upload overlay */}
      {uploading && (
        <div className="fixed inset-0 bg-dark/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card rounded-2xl p-6 text-center shadow-elevated">
            <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold">Analyse en cours…</p>
            <p className="text-xs text-dim mt-1">Claude Vision analyse vos vêtements</p>
          </div>
        </div>
      )}

      {/* Hint */}
      <p className="text-center text-[9px] text-dim/50 pb-4 px-8">
        Tap = sélectionner · Appui long = voir les détails
      </p>

      {/* Garment detail sheet */}
      {detailItem && (
        <GarmentDetail
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onUpdated={() => { setDetailItem(null); loadWardrobe(); }}
        />
      )}

      {/* Import product modal */}
      {showImport && (
        <ImportProduct
          onImported={() => { loadWardrobe(); }}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
