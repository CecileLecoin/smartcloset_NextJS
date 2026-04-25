'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Heart, Download, RotateCcw } from 'lucide-react';
import { apiPost } from '@/lib/api';
import type { OutfitItem, TryOnResult, WeatherInfo } from '@/lib/types';
import { useAuth } from '@/lib/auth';


interface Props {
  outfit: OutfitItem[];
  onRemove: (id: string) => void;
  onResult: (r: TryOnResult) => void;
  onAddMore: () => void;
  gender: string;
  autoTry?: boolean;
  weather: WeatherInfo | null; // ✅ AJOUT
}

export default function TryOnScreen({ outfit, onRemove, onResult, onAddMore, gender, autoTry, weather }: Props) {
  const [loading, setLoading] = useState(false);
  const hasAutoTriggered = useRef(false);
  const [suggestion, setSuggestion] = useState<{ message: string; count: number } | null>(null);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const { isGuest } = useAuth();
  const fullLabel = "";

  // Auto-trigger try-on when coming from floating bar
  useEffect(() => {
    if (outfit.length === 0) return;
    if (!weather) return;

    console.log("TryOnScreen useEffect triggered with outfit and weather", { outfit, weather });
    async function fetchSuggestion() {
      const res = await apiPost('/api/suggestions', {
        outfit: outfit.map(o => ({
          category: o.analysis?.category,
          analysis: o.analysis,
        })),
        weather: weather?.tag,
        season: weather?.season,
      });
      console.log("✅ suggestion received", res);

      setSuggestion(res);
    }

    fetchSuggestion();
  }, [outfit, weather]);
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
      setResultUrl(`${data.render_url}?t=${Date.now()}`);
      setSaved(false);

      const label = outfit.map(o => o.analysis?.type || 'vêtement').join(' + ');
      // onResult({
      //   url: data.render_url,
      //   label: outfit.length === 1 ? (outfit[0].analysis?.type || 'Tenue') : `${outfit.length} pièces`,
      //   fullLabel: label,
      //   items: outfit,
      //   ts: Date.now(),
      // });
    } catch (e: any) {
      alert('Erreur: ' + e.message);
    } finally {
      clearInterval(tick);
      setLoading(false);
    }
  }

  async function handleSaveResult() {
    if (isGuest) return; // 🔒 sécurité
    if (!resultUrl || saved) return;

    const label = outfit.map(o => o.analysis?.type || 'vêtement').join(' + ');

    onResult({
      url: resultUrl,
      label:
        outfit.length === 1
          ? (outfit[0].analysis?.type || 'Tenue')
          : `${outfit.length} pièces`,
      fullLabel: label,
      items: outfit,
      ts: Date.now(),
    });

    const fd = new FormData();
    fd.append('render_url', resultUrl);
    fd.append('garment_ids', JSON.stringify(outfit.map(o => o.id)));
    const data = await apiPost<{ success: boolean; render_url: string; garment_ids: string}>('/api/save_tryon', fd);
    if (!data.success) throw new Error('Erreur enregistrement');
    
    // ✅ 1. Remplacer l'image par l'URL finale (bucket)
    setResultUrl(data.render_url);

    setSaved(true);

  }

  // Propose sharing the result (mobile Web Share API or fallback)
  function proposeShare(file: File) {
    const message =
      "Tu en penses quoi de cette tenue ? 🤍👗\nDonne-moi ton avis !";

    // ✅ Web Share API (mobile)
    // @ts-ignore
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      // @ts-ignore
      navigator.share({
        title: 'Mon essayage FitLab',
        text: message,
        files: [file],
      });
      return;
    }

    // ❌ Fallback desktop
    setShowSharePrompt(true);
  }


  async function handleDownload() {
    if (!resultUrl) return;
    
    const res = await fetch(resultUrl);
    const blob = await res.blob();
    const file = new File([blob], `fitlab_${Date.now()}.png`, { type: 'image/png' });

    // ✅ Télécharger
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitlab_${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);

      
      // ✅ Proposer le partage juste après
      proposeShare(file);

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
      {suggestion && suggestion.count > 0 && (
      <div className="mx-5 mb-4 p-3 rounded-xl flex items-center gap-3 transition-all"
          style={{ background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.15)' }}>
        <span className="text-lg">✦</span>
        <div>
          <p className="text-[11px] font-semibold text-secondary">
            {suggestion.message}
          </p>
          <p className="text-[10px] text-dim">
            {suggestion.count} pièce{suggestion.count > 1 ? 's' : ''} compatible{suggestion.count > 1 ? 's' : ''} dans ta garde-robe
          </p>
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
        
        {isGuest && (
          <p className="text-[10px] text-dim mt-2 text-center">
            💾 Crée un compte pour sauvegarder tes essayages et les retrouver plus tard
          </p>
        )}

        <button
          className={`
            btn-ghost flex-1 transition-all
            ${isGuest
              ? 'opacity-40 cursor-not-allowed'
              : ''
            }
          `}
          onClick={handleSaveResult}
          disabled={isGuest}
          title={isGuest ? 'Crée un compte pour sauvegarder tes essayages' : undefined}
        >
          <Heart
            size={16}
            fill={!isGuest && saved ? '#FF6B8A' : 'none'}
            className={!isGuest && saved ? 'text-primary' : ''}
          />
          {isGuest ? 'Sauvegarde désactivée' : saved ? 'Sauvé' : 'Sauver'}
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

      {showSharePrompt && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-card rounded-2xl p-5 w-[280px] text-center shadow-elevated">
          <p className="text-sm font-bold mb-2">👀 Demander un avis ?</p>
          <p className="text-xs text-dim mb-4">
            Partage cette tenue avec tes amis pour avoir leur opinion
          </p>

          <div className="flex gap-2">
            <button
              className="btn-primary flex-1 text-xs"
              onClick={() => {
                navigator.clipboard.writeText(
                  "Tu en penses quoi de cette tenue ? 👗🤍"
                );
                setShowSharePrompt(false);
                alert("Message copié 👍");
              }}
            >
              Copier le message
            </button>
            <button
              className="btn-ghost flex-1 text-xs"
              onClick={() => setShowSharePrompt(false)}
            >
              Plus tard
            </button>
          </div>
        </div>
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
