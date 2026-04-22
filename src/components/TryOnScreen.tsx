'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Heart, Download, RotateCcw } from 'lucide-react';
import { apiPost } from '@/lib/api';
import type { OutfitItem, TryOnResult } from '@/lib/types';

interface Props {
  outfit: OutfitItem[];
  onRemove: (id: string) => void;
  onResult: (r: TryOnResult) => void;
  onAddMore: () => void;
  gender: string;
  autoTry?: boolean;
}

export default function TryOnScreen({ outfit, onRemove, onResult, onAddMore, gender, autoTry }: Props) {
  const [loading, setLoading] = useState(false);
  const hasAutoTriggered = useRef(false);

  // Auto-trigger try-on when coming from floating bar
  useEffect(() => {
    if (autoTry && outfit.length > 0 && !hasAutoTriggered.current && !loading) {
      hasAutoTriggered.current = true;
      handleTryOn();
    }
  }, [autoTry]);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleTryOn() {
    if (!outfit.length) return;
    setLoading(true);
    setProgress(10);
    setResultUrl(null);

    const tick = setInterval(() => setProgress(p => Math.min(p + 3, 90)), 800);

    try {
      const fd = new FormData();
      fd.append('garment_ids', JSON.stringify(outfit.map(o => o.id)));
      fd.append('morphology', 'X');
      fd.append('gender', gender);

      const data = await apiPost<{ success: boolean; render_url: string; cached?: boolean }>('/api/tryon', fd);
      if (!data.success) throw new Error('Erreur essayage');

      clearInterval(tick);
      setProgress(100);
      setResultUrl(data.render_url);
      setSaved(false);

      const label = outfit.map(o => o.analysis?.type || 'vêtement').join(' + ');
      onResult({
        url: data.render_url,
        label: outfit.length === 1 ? (outfit[0].analysis?.type || 'Tenue') : `${outfit.length} pièces`,
        fullLabel: label,
        items: outfit,
        ts: Date.now(),
      });
    } catch (e: any) {
      alert('Erreur: ' + e.message);
    } finally {
      clearInterval(tick);
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!resultUrl) return;
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitlab_${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }

  const emptySlots = Math.max(0, 4 - outfit.length);

  return (
    <div className="h-full overflow-y-auto pb-4">
      <div className="px-5 pt-14 pb-2">
        <h1 className="text-xl font-extrabold">Compose ta tenue ✨</h1>
        <p className="text-xs text-dim mt-0.5">Ajoute 2-4 pièces puis essaye</p>
      </div>

      {/* Outfit slots */}
      <div className="flex gap-2.5 px-5 mb-4 flex-wrap">
        {outfit.map(item => (
          <div key={item.id} className="w-[72px] h-24 rounded-xl border-2 border-primary overflow-hidden relative flex-shrink-0">
            <img src={item.file_path} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => onRemove(item.id)}
              className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/50 text-white flex items-center justify-center"
            >
              <X size={10} />
            </button>
            <span className="absolute bottom-0.5 inset-x-0 text-[7px] font-bold text-center uppercase tracking-tight text-white drop-shadow">
              {item.analysis?.category || ''}
            </span>
          </div>
        ))}
        {[...Array(emptySlots)].map((_, i) => (
          <button
            key={`empty-${i}`}
            onClick={onAddMore}
            className="w-[72px] h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-dim hover:border-dim transition-colors"
          >
            <Plus size={18} />
            <span className="text-[7px] font-bold uppercase mt-0.5">Ajouter</span>
          </button>
        ))}
      </div>

      {/* Suggestion */}
      {outfit.length > 0 && outfit.length < 3 && (
        <div className="mx-5 mb-4 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all"
             style={{ background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.15)' }}>
          <span className="text-lg">✦</span>
          <div>
            <p className="text-[11px] font-semibold text-secondary">Un blazer irait bien avec cette tenue</p>
            <p className="text-[10px] text-dim">3 blazers disponibles dans ta garde-robe</p>
          </div>
        </div>
      )}

      {/* Result area */}
      <div className="mx-5 rounded-xl overflow-hidden shadow-elevated bg-card relative" style={{ aspectRatio: '9/14' }}>
        {resultUrl ? (
          <>
            <img src={resultUrl} alt="Essayage" className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur rounded-full text-[9px] font-bold text-secondary">
              ✨ FASHN v1.6
            </div>
          </>
        ) : loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-bg">
            <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-xs font-semibold text-dim">Essayage en cours…</p>
            <p className="text-[10px] text-dim">~15-30 secondes</p>
            <div className="w-48 h-1 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                   style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #FF6B8A, #7C5CFC)' }} />
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-dim">
            <span className="text-5xl mb-3 opacity-30">🪞</span>
            <p className="text-xs text-center leading-relaxed">
              Tap <strong className="text-primary">"Essayer"</strong> pour voir<br />cette tenue sur toi
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-5 mt-4">
        <button className="btn-ghost flex-1" onClick={() => { setSaved(true); }}>
          <Heart size={16} fill={saved ? '#FF6B8A' : 'none'} className={saved ? 'text-primary' : ''} />
          {saved ? 'Sauvé' : 'Sauver'}
        </button>
        <button
          className="btn-primary flex-1"
          disabled={outfit.length === 0 || loading}
          onClick={handleTryOn}
        >
          ✨ Essayer
        </button>
      </div>

      {resultUrl && (
        <div className="flex gap-2 px-5 mt-2">
          <button className="btn-ghost flex-1 text-xs" onClick={handleDownload}>
            <Download size={14} /> Télécharger
          </button>
          <button className="btn-ghost flex-1 text-xs" onClick={() => { setResultUrl(null); }}>
            <RotateCcw size={14} /> Réessayer
          </button>
        </div>
      )}

      {/* Affiliate buy banners — show for each affiliate item in outfit */}
      {outfit.filter(o => (o as any).affiliate?.is_affiliate).map(item => {
        const aff = (item as any).affiliate || {};
        const brandNames: Record<string, string> = { shein:'SHEIN', zara:'ZARA', hm:'H&M', uniqlo:'UNIQLO', asos:'ASOS', amazon:'Amazon' };
        return (
          <a
            key={item.id}
            href={aff.affiliate_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-5 mt-3 p-3 rounded-xl flex items-center gap-3 transition-all active:scale-[0.98] border border-affiliate no-underline"
            style={{ background: 'linear-gradient(135deg, #FFF9E6, #FFF5F7)' }}
          >
            <img src={item.file_path} alt="" className="w-10 h-14 rounded-lg object-cover object-top flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wide text-dim">
                {brandNames[aff.affiliate_brand] || aff.affiliate_brand || 'Marque'}
              </p>
              <p className="text-xs font-semibold truncate text-dark">
                {aff.product_name || item.analysis?.type || 'Produit'}
              </p>
            </div>
            {aff.affiliate_price > 0 && (
              <p className="text-sm font-extrabold text-primary flex-shrink-0">
                {aff.affiliate_price.toFixed(2)}€
              </p>
            )}
            <span className="px-3 py-1.5 bg-dark text-white text-[11px] font-bold rounded-full flex-shrink-0">
              Acheter →
            </span>
          </a>
        );
      })}

      <div className="h-6" />
    </div>
  );
}
