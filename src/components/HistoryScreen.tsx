'use client';

import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import type { TryOnResult } from '@/lib/types';
import { apiGet, apiDelete } from '@/lib/api';

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function HistoryScreen() {
  const { isGuest } = useAuth();
  const [history, setHistory] = useState<TryOnResult[]>([]);
  const [loading, setLoading] = useState(true);

  /* ----------------------------- Load history ----------------------------- */
  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await apiGet<{ items: any[] }>('/api/tryons');

        const mapped: TryOnResult[] = data.items.map(item => {
          const label =
            item.garment_ids?.length === 1
              ? item.garment_ids[0]?.analysis?.type ?? 'Tenue'
              : `${item.garment_ids.length} pièces`;

          const fullLabel = item.garment_ids
            ?.map((g: any) => g.analysis?.type || 'vêtement')
            .join(' + ');

          return {
            id: item.id,
            url: item.render_url,
            items: item.garment_ids,
            ts: new Date(item.created_at).getTime(),
            label,
            fullLabel,
          };
        });

        setHistory(mapped);
      } catch (e) {
        console.error('Erreur chargement historique', e);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  /* ------------------------------ Delete --------------------------------- */
  async function handleDelete(idx: number) {
    const entry = history[idx];
    if (!entry?.id) return;

    try {
      await apiDelete(`/api/tryons/${entry.id}`);
      setHistory(h => h.filter((_, i) => i !== idx));
    } catch (e) {
      console.error('Erreur suppression try-on', e);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="h-full overflow-y-auto pb-4">
      <div className="px-5 pt-14 pb-2">
        <h1 className="text-xl font-extrabold">Mes essayages 🕐</h1>
        <p className="text-xs text-dim mt-0.5">
          {history.length} look{history.length > 1 ? 's' : ''} sauvegardé
          {history.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* ----------------------------- Empty state ----------------------------- */}
      {!loading && history.length === 0 ? (
        <div className="text-center py-20 text-dim text-sm">
          <p className="text-4xl mb-3 opacity-30">🕐</p>
          <p>
            Aucun essayage encore
            <br />
            <span className="text-xs opacity-60">
              Compose une tenue et clique sur “Essayer”
            </span>
          </p>

          {isGuest && (
            <div className="mx-5 mt-3 p-3 rounded-xl text-center
                            bg-primary/5 border border-primary/10">
              <p className="text-[11px] font-semibold text-primary mb-0.5">
                🔒 Historique réservé aux comptes
              </p>
              <p className="text-[10px] text-dim leading-relaxed">
                Crée un compte pour sauvegarder tes essayages
                et les retrouver ici plus tard.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ----------------------------- Grid ----------------------------- */
        <div className="grid grid-cols-2 gap-3 px-5">
          {history.map((entry, idx) => (
            <div
              key={entry.id}
              className="card cursor-pointer active:scale-95 transition-all overflow-hidden relative group"
            >
              <div
                className="w-full overflow-hidden"
                style={{
                  aspectRatio: '9 / 14',
                  background:
                    'linear-gradient(135deg, rgba(255,107,138,0.1), rgba(124,92,252,0.08))',
                }}
              >
                {entry.url ? (
                  <img
                    src={entry.url}
                    alt=""
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-40">
                    👗
                  </div>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleDelete(idx);
                }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full
                           bg-black/60 backdrop-blur-sm flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} className="text-white" />
              </button>

              <div className="p-3">
                <p className="text-[11px] font-semibold truncate">
                  {entry.fullLabel || entry.label}
                </p>
                <p className="text-[10px] text-dim mt-0.5">
                  {timeAgo(entry.ts)}
                </p>

                <div className="flex gap-1 mt-2 flex-wrap">
                  {entry.items?.slice(0, 2).map((item: any, i: number) => (
                    <span
                      key={i}
                      className="text-[9px] px-2 py-0.5 rounded-full
                                 bg-primary/10 text-primary font-semibold capitalize"
                    >
                      {item.analysis?.style || item.analysis?.type || ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}