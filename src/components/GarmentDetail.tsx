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

export default function GarmentDetail({ item, onClose, onUpdated }: Props) {
  const a = (item.analysis || {}) as GarmentAnalysis;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const fd = new FormData();
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

          <button onClick={onClose} className="p-1 text-dim">
            <X size={20} />
          </button>
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
          )}
        </div>
      </div>
    </>
  );
}
