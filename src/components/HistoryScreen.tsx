'use client';

import { Trash2 } from 'lucide-react';
import type { TryOnResult } from '@/lib/types';

interface Props {
  history: TryOnResult[];
  onDelete: (idx: number) => void;
}

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
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function HistoryScreen({ history, onDelete }: Props) {
  return (
    <div className="h-full overflow-y-auto pb-4">
      <div className="px-5 pt-14 pb-2">
        <h1 className="text-xl font-extrabold">Mes essayages 🕐</h1>
        <p className="text-xs text-dim mt-0.5">
          {history.length} look{history.length > 1 ? 's' : ''} sauvegardé{history.length > 1 ? 's' : ''}
        </p>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 text-dim text-sm">
          <p className="text-4xl mb-3 opacity-30">🕐</p>
          <p>Aucun essayage encore<br />
            <span className="text-xs opacity-60">Composez une tenue et cliquez "Essayer"</span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5">
          {history.map((entry, idx) => (
            <div key={idx} className="card cursor-pointer active:scale-95 transition-all overflow-hidden relative group">
              <div
                className="w-full flex items-center justify-center text-3xl overflow-hidden"
                style={{
                  aspectRatio: '9/14',
                  background: 'linear-gradient(135deg, rgba(255,107,138,0.1), rgba(124,92,252,0.08))',
                }}
              >
                {entry.url ? (
                  <img src={entry.url} alt="" className="w-full h-full object-cover object-top" />
                ) : (
                  <span className="opacity-40">👗</span>
                )}
              </div>

              {/* Delete button — visible on hover/touch */}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(idx); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
              >
                <Trash2 size={12} className="text-white" />
              </button>

              <div className="p-3">
                <p className="text-[11px] font-semibold truncate">{entry.fullLabel || entry.label}</p>
                <p className="text-[10px] text-dim mt-0.5">{timeAgo(entry.ts)}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {entry.items?.slice(0, 2).map((item, i) => (
                    <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold capitalize">
                      {item.analysis?.style || item.analysis?.type || ''}
                    </span>
                  ))}
                  {entry.hasAffiliate && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: 'rgba(255,229,102,0.2)', color: '#B8960A' }}>
                      ✦ Affilié
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
