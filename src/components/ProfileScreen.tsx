'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, ChevronRight, Palette, Upload, LogOut, AlertCircle, Moon, Sun, Trash2 } from 'lucide-react';
import { apiDelete, apiFetch, apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Props {
  gender: string;
  onGenderChange: (g: string) => void;
}
/*----------------------------------------------------------------*
  On garde les noms (gender) mais dans l'idée on change pour photo : 
  -de face
  -de dos
  -de profil
  (pour éviter les stéréotypes et mieux coller à la réalité de chacun)
-----------------------------------------------------------------*/

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
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [photoConsentGiven, setPhotoConsentGiven] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('fitlab_photo_consent') === '1'
  );
  const [showDeletePicturesModal, setShowDeletePicturesModal] = useState(false);
  const [deletingPictures, setDeletingPictures] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function requestUpload() {
    if (photoConsentGiven) {
      fileRef.current?.click();
    } else {
      setConsentChecked(false);
      setShowConsentModal(true);
    }
  }

  function confirmConsent() {
    localStorage.setItem('fitlab_photo_consent', '1');
    setPhotoConsentGiven(true);
    setShowConsentModal(false);
    fileRef.current?.click();
  }

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

      const data = await apiGet<{ url: string | null }>(
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
      try {
        await apiPost('/api/upload-base-model', fd);
      } catch (err: any) {
        const msg = String(err?.message || '');
        // Some backends return 200 with an empty body, which can trigger a JSON parse error client-side.
        const looksLikeEmptyJsonResponse =
          msg.includes('Unexpected end of JSON input') ||
          msg.toLowerCase().includes('json');
        if (!looksLikeEmptyJsonResponse) throw err;
      }

      // The backend may finalize processing a few seconds after the request returns.
      let synced = false;
      for (let i = 0; i < 8; i++) {
        const data = await apiGet<{ url: string | null }>(
          `/api/base-model?morphology=X&gender=${gender}`
        );
        if (data?.url) {
          setBasePhoto(`${data.url}?t=${Date.now()}`);
          synced = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1200));
      }

      if (!synced) {
        // Fallback to the regular loader; no hard error because processing can still complete shortly after.
        await loadBasePhoto();
      }
    } catch (e: any) { alert('Erreur: ' + e.message); }
    finally { setUploading(false); }
  }

  async function handleExport() {
    try {
      const data = await apiGet<{ items: any[] }>('/api/wardrobe');
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

  async function handleDeleteAllPictures() {
    setDeletingPictures(true);
    try {
      await apiDelete('/api/wardrobe/pictures');
      alert('Toutes les photos de votre garde-robe ont été supprimées.');
      setShowDeletePicturesModal(false);
      window.location.reload();
    } catch (e: any) {
      alert('Erreur suppression: ' + e.message);
    } finally {
      setDeletingPictures(false);
    }
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    try {
      await apiDelete('/api/account');
      setShowDeleteAccountModal(false);
      alert('Votre compte a été supprimé.');
      await signOut();
      window.location.reload();
    } catch (e: any) {
      alert('Erreur suppression du compte: ' + e.message);
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto pb-4">
      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4">
            <h2 className="text-base font-extrabold text-dark">Utilisation de ta photo</h2>
            <p className="text-sm text-dim leading-relaxed">
              Ta photo sera traitée pour générer un essayage virtuel. Elle ne sera utilisée que pour cet usage et tu pourras la supprimer à tout moment.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={e => setConsentChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
              />
              <span className="text-xs text-dark leading-relaxed">
                J'accepte que ma photo soit utilisée pour générer un essayage virtuel, conformément à la politique de confidentialité.
              </span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConsentModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-dim"
              >
                Annuler
              </button>
              <button
                onClick={confirmConsent}
                disabled={!consentChecked}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeletePicturesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={18} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-dark">Supprimer toutes les photos ?</h2>
                <p className="text-sm text-dim leading-relaxed mt-1">
                  Cette action est irréversible. Toutes les photos de votre garde-robe seront définitivement supprimées.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeletePicturesModal(false)}
                disabled={deletingPictures}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-dim disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAllPictures}
                disabled={deletingPictures}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-40"
              >
                {deletingPictures ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={18} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-dark">Supprimer le compte ?</h2>
                <p className="text-sm text-dim leading-relaxed mt-1">
                  Cette action est irréversible. Votre compte, vos photos et vos données liées seront définitivement supprimés.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                disabled={deletingAccount}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-dim disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 py-2.5 rounded-xl bg-red-700 text-white text-sm font-semibold disabled:opacity-40"
              >
                {deletingAccount ? 'Suppression…' : 'Supprimer le compte'}
              </button>
            </div>
          </div>
        </div>
      )}
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
            { key: 'female', label: 'de face' },
            { key: 'male', label: 'de profil' },
            { key: 'neutral', label: 'de dos' },
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
                <button onClick={requestUpload}
                  className="flex-1 py-2 bg-white/90 backdrop-blur rounded-lg text-xs font-semibold text-dark active:scale-95 transition-all">
                  📸 Changer
                </button>
              </div>
            </div>
          ) : (
            <button onClick={requestUpload}
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

        <button onClick={() => setShowDeletePicturesModal(true)}
          className="w-full card flex items-center gap-3 p-3.5 mb-1.5 active:bg-red-50 transition-colors">
          <Trash2 size={18} className="text-red-600" />
          <span className="flex-1 text-[13px] font-medium text-left text-red-600">Supprimer toutes mes photos</span>
          <ChevronRight size={16} className="text-red-400" />
        </button>

        <button onClick={handleLogout}
          className="w-full card flex items-center gap-3 p-3.5 mb-1.5 active:bg-border/30 transition-colors">
          <LogOut size={18} className="text-primary" />
          <span className="flex-1 text-[13px] font-medium text-left text-primary">Se déconnecter</span>
        </button>

        <button onClick={() => setShowDeleteAccountModal(true)}
          className="w-full card flex items-center gap-3 p-3.5 active:bg-red-50 transition-colors">
          <Trash2 size={18} className="text-red-700" />
          <span className="flex-1 text-[13px] font-medium text-left text-red-700">Supprimer mon compte</span>
          <ChevronRight size={16} className="text-red-400" />
        </button>
      </div>
    </div>
  );
}
