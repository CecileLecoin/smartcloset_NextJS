'use client';

import { useState } from 'react';
import { Link, Loader2, ShoppingBag, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Props {
  onImported: () => void;
  onClose: () => void;
}

export default function ImportProduct({ onImported, onClose }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function handleImport() {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const fd = new FormData();
      fd.append('url', url.trim());
      const data = await apiFetch<any>('/api/import-product', { method: 'POST', body: fd });

      if (!data.success) throw new Error('Import échoué');
      setResult(data);
      onImported();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'import');
    } finally {
      setLoading(false);
    }
  }

  const brands: Record<string, string> = {
    shein: '🧡 SHEIN',
    zara: '⬛ ZARA',
    hm: '🔴 H&M',
    uniqlo: '🔵 UNIQLO',
    asos: '🟣 ASOS',
    amazon: '📦 Amazon',
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card rounded-t-2xl z-[101] overflow-hidden animate-[slideUp_0.3s_ease]">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold">Importer un produit</h3>
              <p className="text-[10px] text-dim mt-0.5">Collez un lien Shein, Zara, H&M, Uniqlo…</p>
            </div>
            <button onClick={onClose} className="p-1 text-dim"><X size={20} /></button>
          </div>

          {/* URL input */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Link size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleImport(); }}
                placeholder="https://fr.shein.com/produit..."
                className="w-full pl-9 pr-3 py-3 bg-bg border border-border rounded-xl text-sm outline-none focus:border-secondary transition-colors"
              />
            </div>
            <button
              onClick={handleImport}
              disabled={loading || !url.trim()}
              className="px-4 rounded-xl text-white text-sm font-bold disabled:opacity-40 active:scale-95 transition-all flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #FF6B8A, #7C5CFC)' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
              {loading ? '' : 'Importer'}
            </button>
          </div>

          {/* Supported brands */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['shein', 'zara', 'hm', 'uniqlo', 'asos', 'amazon'].map(b => (
              <span key={b} className="text-[9px] px-2 py-1 rounded-full bg-bg border border-border text-dim font-medium">
                {brands[b]}
              </span>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary mb-3">
              {error}
            </div>
          )}

          {/* Success result */}
          {result && (
            <div className="card p-4">
              <div className="flex gap-3">
                {result.product?.image_url && (
                  <img
                    src={result.file_path || result.product.image_url}
                    alt=""
                    className="w-16 h-20 rounded-lg object-cover object-top flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-dim">
                    {brands[result.product?.brand] || result.product?.brand}
                  </p>
                  <p className="text-sm font-semibold truncate mt-0.5">
                    {result.product?.name || 'Produit importé'}
                  </p>
                  {result.product?.price > 0 && (
                    <p className="text-base font-extrabold text-primary mt-1">
                      {result.product.price.toFixed(2)} {result.product.currency === 'EUR' ? '€' : result.product.currency}
                    </p>
                  )}
                  <div className="flex gap-1 mt-2">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-affiliate/20 text-[#B8960A] font-semibold">
                      ✦ Affilié
                    </span>
                    {result.cached && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
                        ⚡ Déjà importé
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-accent font-semibold mt-3 text-center">
                ✓ Ajouté à la garde-robe — sélectionnez-le pour l'essayer !
              </p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="text-center py-6">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-dim">Analyse du produit en cours…</p>
              <p className="text-[10px] text-dim mt-1">Scraping + Claude Vision</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
