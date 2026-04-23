'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, SlidersHorizontal, Check, CloudSun, ShoppingBag } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import GarmentDetail from '@/components/GarmentDetail';
import ImportProduct from '@/components/ImportProduct';
import type { WardrobeItem, OutfitItem, GarmentAnalysis } from '@/lib/types';
import WeatherBar from './WeatherBar';
import GarmentCard from './GarmentCard';

type Season = 'spring' | 'summer' | 'autumn' | 'winter';
type SeasonFilter = Season | 'all';

type GarmentCategory = 'haut' | 'bas' | 'veste' | 'robe' | 'accessoire';

const CATEGORY_CHIPS = [
  { key: 'all', label: 'Tous', emoji: '' },
  { key: 'haut', label: 'Hauts', emoji: '👕' },
  { key: 'bas', label: 'Bas', emoji: '👖' },
  { key: 'robe', label: 'Robes', emoji: '👗' },
  { key: 'veste', label: 'Vestes', emoji: '🧥' },
  { key: 'accessoire', label: 'Acc.', emoji: '🧣' },
];


const SEASON_CHIPS: {
  key: SeasonFilter;
  label: string;
  emoji: string;
}[] = [
  { key: 'all', label: 'Toutes', emoji: '🧥' },
  { key: 'spring', label: 'Printemps', emoji: '🌸' },
  { key: 'summer', label: 'Été', emoji: '☀️' },
  { key: 'autumn', label: 'Automne', emoji: '🍂' },
  { key: 'winter', label: 'Hiver', emoji: '❄️' },
];


const WEATHER_CHIPS = [
  { key: 'all', label: 'Tout', emoji: '🌡️' },
  { key: 'rain', label: 'Pluie', emoji: '🌧️' },
  { key: 'snow', label: 'Neige', emoji: '❄️' },
  { key: 'wind', label: 'Vent', emoji: '💨' },
  { key: 'cold', label: 'Froid', emoji: '🥶' },
  { key: 'hot', label: 'Chaud', emoji: '🔥' },
  { key: 'warm', label: 'Tempéré', emoji: '😌' },
];

interface Props {
  outfit: OutfitItem[];
  onToggleOutfit: (item: OutfitItem) => void;
  onGoTryOn: () => void;
}

function getCat(item: WardrobeItem):  GarmentCategory {
  const s = ((item.analysis?.category || '') + ' ' + (item.analysis?.type || '')).toLowerCase();
  if (/bas|jean|pant|short|jupe|skirt|legging/.test(s)) return 'bas';
  if (/robe|dress|combi|jumpsuit/.test(s)) return 'robe';
  if (/veste|jacket|blazer|cardigan|gilet/.test(s)) return 'veste';
  if (/manteau|coat|trench|parka/.test(s)) return 'veste';
  if (/écharpe|echarpe|scarf|foulard|ceinture|chapeau|lunette|accessoire/.test(s)) return 'accessoire';
  return 'haut';
}

function getSeasons(item: WardrobeItem): Array<GarmentAnalysis['season']> {
  const raw = (item.analysis?.season || '').toLowerCase();
  const seasons = new Set<GarmentAnalysis['season']>();

  if (/toutes|all/.test(raw)) {
    return ['spring', 'summer', 'autumn', 'winter'];
  }

  if (/printemps|spring/.test(raw)) seasons.add('spring');
  if (/été|ete|summer/.test(raw)) seasons.add('summer');
  if (/automne|autumn|fall/.test(raw)) seasons.add('autumn');
  if (/hiver|winter/.test(raw)) seasons.add('winter');

  // fallback (si rien trouvé)
  if (seasons.size === 0) {
    // heuristique simple
    if (/manteau|parka|laine|wool|veste/.test(raw)) seasons.add('winter');
    if (/short|lin|linen|debardeur|tank/.test(raw)) seasons.add('summer');
  }

  return Array.from(seasons);
}

function getWeatherTags(item: WardrobeItem): string[] {
  const tags = new Set<string>();

  // 1️⃣ Weather tags explicites (BDD)
  const rawWeather = item.analysis?.weather_tags;

  // ✅ Cas 1 : tableau correct
  if (Array.isArray(rawWeather)) {
    rawWeather.forEach(t => tags.add(t));
  }

  // ✅ Cas 2 : string "rain,cold"
  else if (typeof rawWeather === 'string') {
    rawWeather
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .forEach(t => tags.add(t));
  }

  // 2️⃣ Analyse textuelle fallback
  const s = (
    (item.analysis?.style || '') +
    ' ' +
    (item.analysis?.fabric_texture || '') +
    ' ' +
    (item.analysis?.details || []).join(' ')
  ).toLowerCase();

  if (/pluie|rain|imperméable|waterproof/.test(s)) tags.add('rain');
  if (/neige|snow|combinaison|sweater|doudoune|parka/.test(s)) tags.add('snow');
  if (/vent|wind|coupe-vent/.test(s)) tags.add('wind');
  if (/froid|cold|laine|wool|doudoune|sweater/.test(s)) tags.add('cold');
  if (/chaud|hot|été|summer|tank|debardeur|maillot/.test(s)) tags.add('hot');
  if (/tempéré|mild/.test(s)) tags.add('warm');

  return Array.from(tags);
}

export default function WardrobeScreen({ outfit, onToggleOutfit, onGoTryOn }: Props) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [season, setSeason] = useState('all');
  const [selectedSeason, setSelectedSeason] = useState<GarmentAnalysis['season'] | null>(null);
  const [selectedWeather, setSelectedWeather] = useState('all');
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
  // 1️⃣ Catégorie
  if (filter !== 'all' && getCat(item) !== filter) return false;

  // 2️⃣ Saison ✅ NEW
  if (selectedSeason && selectedSeason !== 'all') {
    const seasons = getSeasons(item);
    console.log('Filtering item', item.id, 'seasons:', seasons);
    if (!seasons.includes(selectedSeason)) return false;
  }

  // 3️⃣ Météo (si déjà en place)
  if (selectedWeather && selectedWeather !== 'all') {
    const weather = getWeatherTags(item);
    if (!weather.includes(selectedWeather)) return false;
  }

  // 4️⃣ Recherche texte
  if (search) {
    const hay = [
      getCat(item),
      ...getSeasons(item),
      ...(getWeatherTags(item)),
      item.analysis?.type,
      item.analysis?.style,
      item.analysis?.pattern,
      ...(item.analysis?.colors || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (!hay.includes(search.toLowerCase())) return false;
  }

  return true;
});

// Outifit of the day suggestion (simplified heuristic)
//La tenue du jour (score en fct de la météo + des facvoris)
function getCurrentSeason(): Season {
  const month = new Date().getMonth(); // 0 = janvier

  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}
const seasonForOutfit = getCurrentSeason();
const [outfitOfTheDay, setOutfitOfTheDay] = useState<WardrobeItem[]>([]);
const [weatherTag, setWeatherTag] = useState<
  'hot' | 'warm' | 'cold' | 'rain' | 'snow' | null
>(null);
//const [thisSeason, setThisSeason] = useState<Season | null>(null);

useEffect(() => {
  // Sécurité : on attend que tout soit prêt
  console.log('useEffect for outfitOfTheDay', { items, weatherTag, seasonForOutfit });
  if (!items || items.length === 0) return;
  if (!weatherTag) return;
  if (!seasonForOutfit) return;

  console.log('🔥 Calling bestOutfitOfTheDay');

  const todayOutfit = bestOutfitToday(
    items,
    weatherTag,
    seasonForOutfit
  );

  console.log('✅ Outfit computed:', todayOutfit);

  setOutfitOfTheDay(todayOutfit);
}, [items, weatherTag, seasonForOutfit]);

function scoreGarment(
  item: WardrobeItem,
  weatherTag: 'hot' | 'warm' | 'cold' | 'rain' | 'snow',
  currentSeason: 'spring' | 'summer' | 'autumn' | 'winter'
): number {
  let score = 0;

  // ⭐ Favori
  if (item.favorite) score += 30;

  // 🌦 Météo
  const weatherTags = getWeatherTags(item);
  if (weatherTags.includes(weatherTag)) score += 25;

  // 🍂 Saison
  if (getSeasons(item).includes(currentSeason)) score += 20;

  // 🧵 Matière (fallback intelligent)
  const fabric = (item.analysis?.fabric_texture || '').toLowerCase();
  if (
    weatherTag === 'cold' &&
    /laine|wool|doudoune|pull/.test(fabric)
  ) score += 10;

  if (
    weatherTag === 'hot' &&
    /lin|coton|cotton|light/.test(fabric)
  ) score += 10;

  return score;
}
function bestOutfitToday(
  items: WardrobeItem[],
  weatherTag: 'hot' | 'warm' | 'cold' | 'rain' | 'snow',
  season: Season
): WardrobeItem[] {
  console.log('🔥 bestOutfitToday CALLED');

  const byCat: Record<
    GarmentCategory,
    { item: WardrobeItem; score: number }[]
  > = {
    haut: [],
    bas: [],
    robe: [],
    veste: [],
    accessoire: [],
  };

  items.forEach(item => {
    const cat = getCat(item);
    const score = scoreGarment(item, weatherTag, season);
    byCat[cat].push({ item, score });
  });

  Object.values(byCat).forEach(arr =>
    arr.sort((a, b) => b.score - a.score)
  );

  // Priorité robe
  if (byCat.robe[0]) {
    return [byCat.robe[0].item];
  }

  const outfit: WardrobeItem[] = [];

  if (byCat.haut[0]) outfitOfTheDay.push(byCat.haut[0].item);
  if (byCat.bas[0]) outfitOfTheDay.push(byCat.bas[0].item);

  if (
    ['cold', 'rain', 'snow'].includes(weatherTag) &&
    byCat.veste[0]
  ) {
    outfitOfTheDay.push(byCat.veste[0].item);
  }

  console.log('✅ Outfit of the day candidates:', outfitOfTheDay);
  return outfitOfTheDay;
}


    /*if (search) {
      const hay = [
        item.analysis?.type, item.analysis?.style, item.analysis?.fit,
        item.analysis?.pattern, ...(item.analysis?.colors || []),
        item.analysis?.primary_color,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });*/

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
      <WeatherBar onFilterByWeather={setSelectedWeather} onWeatherChange={setWeatherTag}/>

      {/* Tenue du jour */}
      {outfitOfTheDay.length > 0 && (
        <section className="mx-5 mb-6 p-4 rounded-2xl bg-secondary/5 border border-secondary/15">
          <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
            👗 Tenue idéale aujourd’hui
          </h3>

          <p className="text-xs text-dim mb-3">
            Basée sur la météo et tes favoris
          </p>

          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {outfitOfTheDay.map(item => (
              <div key={item.id} className="shrink-0 w-[110px]">
                <GarmentCard item={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Season chips */}
        <p className="text-[9px] font-bold uppercase tracking-widest text-dim px-5 mb-1.5">
          Filtrer par saison
        </p>

        <div className="flex gap-1.5 px-5 overflow-x-auto no-scrollbar mb-4">
          {SEASON_CHIPS.map(c => (
            <button
              key={c.key}
              onClick={() => setSelectedSeason(c.key)}
              className={`season-chip ${
                selectedSeason === c.key ? 'active' : ''
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Weather chips */}
          <p className="text-[9px] font-bold uppercase tracking-widest text-dim px-5 mb-1.5">
            Filtrer par météo
          </p>

          <div className="flex gap-1.5 px-5 overflow-x-auto no-scrollbar mb-4">
            {WEATHER_CHIPS.map(c => (
              <button
                key={c.key}
                onClick={() => setSelectedWeather(c.key)}
                className={`weather-chip ${
                  selectedWeather === c.key ? 'active' : ''
                }`}
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
