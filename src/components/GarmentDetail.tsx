'use client';

import { useState } from 'react';
import { X, Save, Eye } from 'lucide-react';
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

export default function GarmentDetail({ item, onClose, onUpdated }: Props) {
  const a = item.analysis || {} as GarmentAnalysis;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit fields
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
      if (type) fd.append('type', type);
      if (category) fd.append('category', category);
      if (style) fd.append('style', style);
      if (fit) fd.append('fit', fit);
      if (pattern) fd.append('pattern', pattern);
      if (fabric) fd.append('fabric_texture', fabric);
      if (primaryColor) fd.append('primary_color', primaryColor);
      if (colors) fd.append('colors', JSON.stringify(colors.split(',').map(c => c.trim()).filter(Boolean)));

      await apiFetch(`/api/wardrobe/${item.id}`, { method: 'PATCH', body: fd });
      onUpdated();
      setEditing(false);
    } catch (e: any) {
      alert('Erreur: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card rounded-t-2xl z-[101] max-h-[85vh] overflow-y-auto animate-[slideUp_0.3s_ease]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pb-3">
          <img src={item.file_path} alt="" className="w-16 h-20 rounded-xl object-cover object-top flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold capitalize truncate">{a.type || 'Vêtement'}</h3>
            <p className="text-xs text-dim mt-0.5">{a.style} · {a.fit} · {a.pattern}</p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {(a.colors || []).map((c, i) => (
                <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-semibold">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-dim hover:text-dark">
            <X size={20} />
          </button>
        </div>

        {/* Analysis details (read-only) */}
        {!editing && (
          <div className="px-5 pb-4">
            <div className="bg-bg rounded-xl p-3 mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-dim mb-2">Analyse Claude Vision</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Type', a.type],
                  ['Catégorie', a.category],
                  ['Style', a.style],
                  ['Coupe', a.fit],
                  ['Motif', a.pattern],
                  ['Tissu', a.fabric_texture],
                  ['Saison', a.season],
                  ['Couleur', a.primary_color],
                ].map(([label, val], i) => (
                  <div key={i}>
                    <p className="text-[8px] font-bold uppercase tracking-wide text-dim">{label}</p>
                    <p className="text-[11px] font-medium capitalize">{val || '—'}</p>
                  </div>
                ))}
              </div>
              {a.details?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-[8px] font-bold uppercase tracking-wide text-dim mb-1">Détails</p>
                  <p className="text-[10px] text-dim">{a.details.join(' · ')}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setEditing(true)}
              className="w-full py-2.5 rounded-xl bg-secondary/10 text-secondary text-xs font-semibold active:scale-95 transition-all"
            >
              ✎ Corriger l'analyse
            </button>
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <div className="px-5 pb-6">
            <p className="text-[9px] font-bold uppercase tracking-widest text-dim mb-3">✎ Modifier l'analyse</p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wide text-dim block mb-1">Type</label>
                <input value={type} onChange={e => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-xs outline-none focus:border-secondary" />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wide text-dim block mb-1">Catégorie</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-xs outline-none focus:border-secondary">
                  <option value="">— Choisir —</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wide text-dim block mb-1">Style</label>
                <input value={style} onChange={e => setStyle(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-xs outline-none focus:border-secondary" />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wide text-dim block mb-1">Coupe</label>
                <input value={fit} onChange={e => setFit(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-xs outline-none focus:border-secondary" />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wide text-dim block mb-1">Motif</label>
                <input value={pattern} onChange={e => setPattern(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-xs outline-none focus:border-secondary" />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wide text-dim block mb-1">Tissu</label>
                <input value={fabric} onChange={e => setFabric(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-xs outline-none focus:border-secondary" />
              </div>
            </div>

            <div className="mb-3">
              <label className="text-[9px] font-bold uppercase tracking-wide text-dim block mb-1">Couleur principale (anglais)</label>
              <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                placeholder="ex: deep navy blue"
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-xs outline-none focus:border-secondary" />
            </div>

            <div className="mb-4">
              <label className="text-[9px] font-bold uppercase tracking-wide text-dim block mb-1">Couleurs (virgules)</label>
              <input value={colors} onChange={e => setColors(e.target.value)}
                placeholder="noir, blanc, rouge"
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-xs outline-none focus:border-secondary" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-xl bg-bg border border-border text-xs font-semibold text-dim active:scale-95 transition-all">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold active:scale-95 transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #00D4AA, #7C5CFC)' }}>
                {saving ? 'Enregistrement…' : '✓ Enregistrer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
