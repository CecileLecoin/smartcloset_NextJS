'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { WardrobeItem, GarmentAnalysis } from '@/lib/types';

interface Props {
  item: WardrobeItem;
  onClose: () => void;
  onUpdated: () => void;
}

const CATEGORIES = [
  { value: 'haut', label: '👕 Haut' },
  { value: 'bas', label: '👖 Bas' },
  { value: 'robe', label: '👗 Robe / Combinaison' },
  { value: 'veste', label: '🧥 Veste / Blazer' },
  { value: 'manteau', label: '🧥 Manteau' },
  { value: 'accessoire', label: '🧣 Accessoire' },
];

const SEASONS = [
  { value: 'spring', label: '🌸 Printemps' },
  { value: 'summer', label: '☀️ Été' },
  { value: 'autumn', label: '🍂 Automne' },
  { value: 'winter', label: '❄️ Hiver' },
];

const WEATHER_OPTIONS = [
  { value: 'hot', label: '🔥 Chaud' },
  { value: 'warm', label: '🌤 Tempéré' },
  { value: 'cold', label: '❄️ Froid' },
  { value: 'rain', label: '🌧 Pluie' },
  { value: 'wind', label: '💨 Vent' },
  { value: 'snow', label: '🌨 Neige' },
];

type Season = 'spring' | 'summer' | 'autumn' | 'winter';
type SeasonFilter = Season | 'all';

export default function GarmentDetail({ item, onClose, onUpdated }: Props) {
  const a = (item.analysis || {}) as GarmentAnalysis;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // États pour l’édition manuelle de l’analyse
  // Saison & météo
  const [season, setSeason] = useState<SeasonFilter>('all');
  const [weatherTags, setWeatherTags] = useState<string[]>(
    Array.isArray(a.weather_tags) ? a.weather_tags : (typeof a.weather_tags === 'string' ? a.weather_tags.split(',').map(t => t.trim()).filter(Boolean) : [])
  );

  //favoris
  const [favorite, setFavorite] = useState<boolean>(
    Boolean(item.favorite)
  );

  const [type, setType] = useState(a.type || '');
  const [category, setCategory] = useState(a.category || '');
  const [style, setStyle] = useState(a.style || '');
  const [fit, setFit] = useState(a.fit || '');
  const [pattern, setPattern] = useState(a.pattern || '');
  const [fabric, setFabric] = useState(a.fabric_texture || '');
  const [primaryColor, setPrimaryColor] = useState(a.primary_color || '');
  const [colors, setColors] = useState((a.colors || []).join(', '));

  async function handleSave() {
    setSaving(true);
    try {
      const fd = new FormData();
      if (season) fd.append('season', season);
      if (weatherTags.length > 0)
        fd.append('weather_tags', JSON.stringify(weatherTags));
      await apiFetch(`/api/wardrobe/${item.id}`, { method: 'PATCH', body: fd });
      onUpdated();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer définitivement ce vêtement ?')) return;
    await apiFetch(`/api/wardrobe/${item.id}`, { method: 'DELETE' });
    onUpdated();
    onClose();
  }

  //favorite toggle
  async function toggleFavorite() {
    const next = !favorite;
    setFavorite(next); // ✅ optimistique (UX fluide)

    try {
      const fd = new FormData();
      fd.append('favorite', String(next));

      await apiFetch(`/api/wardrobe/${item.id}`, {
        method: 'PATCH',
        body: fd,
      });

      onUpdated(); // refresh liste si besoin
    } catch (e) {
      // rollback si erreur
      setFavorite(!next);
      alert("Impossible de modifier le favori");
    }
  }


  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card rounded-t-2xl z-[101] max-h-[85vh] overflow-y-auto">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Bouton Favori à gauche */}
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-full transition ${
                favorite
                  ? 'text-yellow-500 bg-yellow-500/10'
                  : 'text-dim hover:bg-bg'
              }`}
              title={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              {favorite ? '⭐' : '☆'}
            </button>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pb-3">
          <img
            src={item.file_path}
            alt=""
            className="w-16 h-20 rounded-xl object-cover flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold truncate">
              {a.type || 'Vêtement'}
            </h3>
            <p className="text-xs text-dim mt-0.5">
              {a.style} · {a.fit} · {a.pattern}
            </p>

            <div className="flex gap-1 mt-2 flex-wrap">
              {(a.colors || []).map((c, i) => (
                <span
                  key={i}
                  className="text-[9px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-semibold"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-5 pb-3">

            {/* Bouton Fermer à droite */}
            <button onClick={onClose} className="p-1 text-dim">
              <X size={20} />
            </button>
          </div>

        </div>

        {/* ACTIONS */}
        <div className="px-5 pb-6 mt-4 space-y-3">

          {/* Mode lecture */}
          {!editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="w-full py-3 rounded-xl bg-secondary text-white text-sm font-semibold"
              >
                ✏️ Corriger l’analyse
              </button>

              <button
                onClick={handleDelete}
                className="w-full py-3 rounded-xl bg-red-600/10 text-red-600 text-sm font-semibold"
              >
                🗑 Supprimer le vêtement
              </button>
            </>
          )}

          {/* Mode édition */}
          {editing && (
            <div className="space-y-3 text-xs">
              {/* Type */}
              <div>
                <label className="block mb-1 font-semibold text-dim">Type</label>
                <input
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg outline-none focus:border-secondary"
                  placeholder="ex: t-shirt, pantalon, robe…"
                />
              </div>

              {/* Catégorie */}
              <div>
                <label className="block mb-1 font-semibold text-dim">Catégorie</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg outline-none focus:border-secondary"
                >
                  <option value="">— Choisir —</option>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style */}
              <div>
                <label className="block mb-1 font-semibold text-dim">Style</label>
                <input
                  value={style}
                  onChange={e => setStyle(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg outline-none focus:border-secondary"
                  placeholder="ex: casual, chic, sport…"
                />
              </div>

              {/* Coupe */}
              <div>
                <label className="block mb-1 font-semibold text-dim">Coupe</label>
                <input
                  value={fit}
                  onChange={e => setFit(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg outline-none focus:border-secondary"
                  placeholder="ex: ajustée, ample…"
                />
              </div>

              {/* Motif */}
              <div>
                <label className="block mb-1 font-semibold text-dim">Motif</label>
                <input
                  value={pattern}
                  onChange={e => setPattern(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg outline-none focus:border-secondary"
                  placeholder="ex: uni, rayé, fleuri…"
                />
              </div>

              {/* Couleur principale */}
              <div>
                <label className="block mb-1 font-semibold text-dim">
                  Couleur principale (anglais)
                </label>
                <input
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg outline-none focus:border-secondary"
                  placeholder="ex: navy blue"
                />
              </div>

              {/* Couleurs secondaires */}
              <div>
                <label className="block mb-1 font-semibold text-dim">
                  Couleurs (séparées par des virgules)
                </label>
                <input
                  value={colors}
                  onChange={e => setColors(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg outline-none focus:border-secondary"
                  placeholder="ex: noir, blanc, rouge"
                />
              </div>
            
            {/* Saison */}
            <div>
              <label className="block mb-1 font-semibold text-dim">
                Saison principale
              </label>
              
              <select
                value={season}
                onChange={e =>
                  setSeason(e.target.value as SeasonFilter)
                }
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg"
              >
                <option value="all">Toutes les saisons</option>
                <option value="spring">Printemps</option>
                <option value="summer">Été</option>
                <option value="autumn">Automne</option>
                <option value="winter">Hiver</option>
              </select>

            </div>

            {/* Météo */}
            <div>
              <label className="block mb-2 font-semibold text-dim">
                Conditions météo adaptées
              </label>

              <div className="flex flex-wrap gap-2">
                {WEATHER_OPTIONS.map(w => {
                  const checked = weatherTags.includes(w.value);

                  return (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() =>
                        setWeatherTags(prev =>
                          checked
                            ? prev.filter(x => x !== w.value)
                            : [...prev, w.value]
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
                        ${
                          checked
                            ? 'bg-secondary text-white border-secondary'
                            : 'bg-bg border-border text-dim'
                        }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          )}
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-3 rounded-xl border text-sm"
              >
                Annuler
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-secondary text-white text-sm disabled:opacity-50"
              >
                {saving ? 'Enregistrement…' : '✅ Enregistrer'}
              </button>
            </div>
          
        </div>
      </div>
    </>
  );
}
