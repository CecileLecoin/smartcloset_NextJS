'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, ChevronRight, Palette, Upload, LogOut, AlertCircle, Moon, Sun } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Props {
  gender: string;
  onGenderChange: (g: string) => void;
}

export default function ProfileScreen({ gender: genderProp, onGenderChange }: Props) {
  const { user, signOut } = useAuth();
  const [basePhoto, setBasePhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [gender, setGenderLocal] = useState(genderProp);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('fitlab_dark') === '1';
  });
  const [suggestions, setSuggestions] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  function setGender(g: string) {
    setGenderLocal(g);
    onGenderChange(g);
  }

  useEffect(() => { loadBasePhoto(); }, [gender]);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('fitlab_dark', darkMode ? '1' : '0');
  }, [darkMode]);

  async function loadBasePhoto() {
    try {
      const data = await apiFetch<{ url: string | null }>(
        `/api/base-model?morphology=X&gender=${gender}`
      );

      if (data?.url) {
        // ✅ Cache-buster pour forcer le reload de l’image
        setBasePhoto(`${data.url}?t=${Date.now()}`);
      } else {
        // ✅ Cas où aucune photo n’est encore définie
        setBasePhoto(null);
      }
    } catch (err) {
      console.error("Failed to load base photo", err);
      setBasePhoto(null);
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', files[0]);
      fd.append('morphology', 'X');
      fd.append('gender', gender);
      await apiFetch('/api/upload-base-model', { method: 'POST', body: fd });
      await loadBasePhoto();
    } catch (e: any) { alert('Erreur: ' + e.message); }
    finally { setUploading(false); }
  }

  async function handleExport() {
    try {
      const data = await apiFetch<{ items: any[] }>('/api/wardrobe');
      const json = JSON.stringify(data.items, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitlab-garderobe-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { alert('Erreur export: ' + e.message); }
  }

  async function handleLogout() {
    if (!confirm('Se déconnecter ?')) return;
    try { await signOut(); } catch {}
  }

  return (
    <div className="h-full overflow-y-auto pb-4">
      <div className="pt-14 pb-4 text-center">
        <div className="w-[72px] h-[72px] rounded-full mx-auto mb-2.5 flex items-center justify-center text-3xl text-white shadow-lg"
             style={{ background: 'linear-gradient(135deg, #FF6B8A, #7C5CFC)' }}>
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : '👤'}
        </div>
        <h1 className="text-base font-bold">{user?.user_metadata?.full_name || 'Mon profil'}</h1>
        <p className="text-xs text-dim mt-0.5">{user?.email || ''}</p>
      </div>

      {/* Base photo */}
      <div className="px-5 mb-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-dim mb-2.5">📸 Ma photo de base</p>

        {!basePhoto && (
          <div className="card p-4 mb-3 border-2 border-dashed border-primary/30 bg-primary/5">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold mb-1">Photo requise pour essayer</p>
                <p className="text-[10px] text-dim leading-relaxed">
                  Prenez une photo de vous en <strong>plein pied</strong>, fond neutre, tenue simple.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Gender */}
        <div className="flex gap-1.5 mb-3">
          {[
            { key: 'female', label: '👩 Femme' },
            { key: 'male', label: '👨 Homme' },
            { key: 'neutral', label: '🧑 Neutre' },
          ].map(g => (
            <button key={g.key} onClick={() => setGender(g.key)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                gender === g.key ? 'bg-primary text-white' : 'bg-card border border-border text-dim'
              }`}>{g.label}</button>
          ))}
        </div>

        {/* Photo */}
        <div className="card overflow-hidden">
          {basePhoto ? (
            <div className="relative">
              <img src={basePhoto} alt="" className="w-full aspect-[2/3] object-cover object-top" />
              <div className="absolute bottom-0 inset-x-0 p-3 flex"
                   style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
                <button onClick={() => fileRef.current?.click()}
                  className="flex-1 py-2 bg-white/90 backdrop-blur rounded-lg text-xs font-semibold text-dark active:scale-95 transition-all">
                  📸 Changer
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full aspect-[2/3] flex flex-col items-center justify-center gap-3 bg-border/30 active:bg-border/50 transition-all">
              {uploading ? (
                <><div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /><p className="text-xs text-dim">Upload…</p></>
              ) : (
                <><Camera size={32} className="text-dim/40" /><p className="text-xs text-dim text-center px-8">Uploadez une photo de vous</p>
                  <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">+ Ajouter</span></>
              )}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e.target.files)} />
      </div>

      {/* Préférences */}
      <div className="px-5 mb-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-dim mb-2.5">Préférences</p>

        <button onClick={() => setSuggestions(!suggestions)}
          className="w-full card flex items-center gap-3 p-3.5 mb-1.5">
          <span className="text-lg">✦</span>
          <span className="flex-1 text-[13px] font-medium text-left">Suggestions de marques</span>
          <div className={`w-11 h-6 rounded-full relative transition-colors ${suggestions ? 'bg-accent' : 'bg-border'}`}>
            <div className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all ${suggestions ? 'right-[3px]' : 'left-[3px]'}`} />
          </div>
        </button>

        <button onClick={() => setDarkMode(!darkMode)}
          className="w-full card flex items-center gap-3 p-3.5">
          {darkMode ? <Moon size={18} className="text-secondary" /> : <Sun size={18} className="text-dim" />}
          <span className="flex-1 text-[13px] font-medium text-left">Thème sombre</span>
          <div className={`w-11 h-6 rounded-full relative transition-colors ${darkMode ? 'bg-secondary' : 'bg-border'}`}>
            <div className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all ${darkMode ? 'right-[3px]' : 'left-[3px]'}`} />
          </div>
        </button>
      </div>

      {/* Compte */}
      <div className="px-5 mb-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-dim mb-2.5">Compte</p>

        <button onClick={handleExport}
          className="w-full card flex items-center gap-3 p-3.5 mb-1.5 active:bg-border/30 transition-colors">
          <Upload size={18} className="text-dim" />
          <span className="flex-1 text-[13px] font-medium text-left">Exporter ma garde-robe</span>
          <ChevronRight size={16} className="text-dim" />
        </button>

        <button onClick={handleLogout}
          className="w-full card flex items-center gap-3 p-3.5 active:bg-border/30 transition-colors">
          <LogOut size={18} className="text-primary" />
          <span className="flex-1 text-[13px] font-medium text-left text-primary">Se déconnecter</span>
        </button>
      </div>
    </div>
  );
}
