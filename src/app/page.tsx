'use client';

import { useState, useEffect } from 'react';
import { Shirt, Sparkles, Clock, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import OnboardingScreen from '@/components/OnboardingScreen';
import WardrobeScreen from '@/components/WardrobeScreen';
import TryOnScreen from '@/components/TryOnScreen';
import HistoryScreen from '@/components/HistoryScreen';
import ProfileScreen from '@/components/ProfileScreen';
import ToastContainer from '@/components/Toast';
import type { OutfitItem, TryOnResult, WeatherInfo } from '@/lib/types';
import WeatherBar from '@/components/WeatherBar';
import Refresh from '@/lib/Refresh';

type Tab = 'wardrobe' | 'tryon' | 'history' | 'profile';
// Source - https://stackoverflow.com/a/77945068
// Posted by Kelvin, modified by community. See post 'Timeline' for change history
// Retrieved 2026-04-27, License - CC BY-SA 4.0

export const fetchCache = 'force-no-store';


const TABS: { id: Tab; icon: typeof Shirt; label: string }[] = [
  { id: 'wardrobe', icon: Shirt, label: 'Garde-robe' },
  { id: 'tryon', icon: Sparkles, label: 'Essayer' },
  { id: 'history', icon: Clock, label: 'Historique' },
  { id: 'profile', icon: User, label: 'Profil' },
];

export default function Home() {
  const { user, loading: authLoading, isGuest } = useAuth();
  const [tab, setTab] = useState<Tab>('wardrobe');
  const [outfit, setOutfit] = useState<OutfitItem[]>([]);
  const [history, setHistory] = useState<TryOnResult[]>([]);
  const [gender, setGender] = useState('female');
  const [autoTry, setAutoTry] = useState(false);
  const [showPhotoBubble, setShowPhotoBubble] = useState(false);
  const { signOut } = useAuth()

  
  const canAddGarment   = !isGuest;
  const canEditProfile = !isGuest;
  //const canEditHistory = !isGuest;

  console.log('API URL =', process.env.NEXT_PUBLIC_API_URL)


  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('fitlab_history') || '[]');
      setHistory(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (user && !localStorage.getItem('fitlab_photo_hint')) {
      setShowPhotoBubble(true);
    }
  }, [user]);

  const [currentWeather, setCurrentWeather] = useState<WeatherInfo | null>(null);

  function dismissPhotoBubble() {
    setShowPhotoBubble(false);
    localStorage.setItem('fitlab_photo_hint', '1');
  }

  function addToOutfit(item: OutfitItem) {
    setOutfit(prev => {
      if (prev.find(o => o.id === item.id)) return prev.filter(o => o.id !== item.id);
      if (prev.length >= 4) return prev;
      return [...prev, item];
    });
  }

  function removeFromOutfit(id: string) {
    setOutfit(prev => prev.filter(o => o.id !== id));
  }

  function addToHistory(result: TryOnResult) {
    setHistory(prev => {
      const next = [result, ...prev].slice(0, 30);
      try { localStorage.setItem('fitlab_history', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function deleteFromHistory(idx: number) {
    setHistory(prev => {
      const next = [...prev];
      next.splice(idx, 1);
      try { localStorage.setItem('fitlab_history', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function goToTryOn() { setAutoTry(true); setTab('tryon'); }

  function hardRefresh() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  }

  // Loading state
   if (authLoading) {
    return (
      <div className="max-w-lg mx-auto h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-dim">Chargement…</p>
          <p>If the page doesn't load after 5 seconds, please press this button :</p>
          <button
            onClick={() => hardRefresh()}
            className="mt-4 px-5 py-2 rounded-lg text-sm font-semibold
              bg-card border border-border text-primary
              hover:bg-border transition"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  } 

  // Not logged in → onboarding
  if (!user) {
    return (
      <div className="max-w-lg mx-auto h-screen bg-bg overflow-hidden">
        <OnboardingScreen />
        <a href={`${process.env.NEXT_PUBLIC_API_URL}/cgu`} target="_blank" >
          Conditions Générales d’Utilisation
        </a>
      </div>
      
    );
  }

  return (
    <div className="max-w-lg mx-auto h-screen flex flex-col bg-bg relative overflow-hidden">
      <div  hidden>
        {/* ✅ TOUJOURS monté mais caché*/}
        <WeatherBar onWeatherChange={setCurrentWeather} />
      </div>

      <main className="flex-1 overflow-hidden">
        {tab === 'wardrobe' && (
          <WardrobeScreen outfit={outfit} onToggleOutfit={addToOutfit} onGoTryOn={goToTryOn} />
        )}
        {tab === 'tryon' && (
          <TryOnScreen outfit={outfit} onRemove={removeFromOutfit} onResult={addToHistory} onAddMore={() => setTab('wardrobe')} gender={gender} autoTry={autoTry} weather={currentWeather} />
        )}
        {tab === 'history' && <HistoryScreen history={history} onDelete={deleteFromHistory} />}
        {tab === 'profile' && (
          canEditProfile ? (
            <ProfileScreen
              gender={gender}
              onGenderChange={setGender}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center text-dim gap-4">
              <div className="text-2xl">🔒</div>

              <p className="text-sm font-semibold">
                Profil verrouillé en mode démo
              </p>

              <p className="text-xs max-w-xs">
                Crée un compte pour personnaliser ton profil et sauvegarder tes essais.
              </p>

              {/* ✅ Bouton Déconnexion */}
              <button
                onClick={signOut}
                className="mt-4 px-5 py-2 rounded-lg text-sm font-semibold
                          bg-card border border-border text-primary
                          hover:bg-border transition"
              >
                Se déconnecter
              </button>
            </div>
          )
        )}
      </main>

      {/* Photo bubble */}
      {showPhotoBubble && canAddGarment && (
        <div className="absolute bottom-24 right-4 z-50 max-w-[160px] animate-bounce-soft"
          onClick={() => { dismissPhotoBubble(); setTab('profile'); }}>
          <div className="bg-primary text-white text-[11px] font-semibold leading-snug px-3 py-2 rounded-2xl rounded-br-none shadow-elevated cursor-pointer">
            📸 Ajoute ta photo ici pour essayer des tenues !
          </div>
          <div className="w-3 h-3 bg-primary ml-auto mr-3 rotate-45 -mt-1.5 rounded-sm" />
        </div>
      )}

      {/* Bottom nav */}
      <nav className="flex-shrink-0 bg-card border-t border-border px-2 pb-6 pt-2 flex">
        {TABS.map(t => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'profile') dismissPhotoBubble(); }}
              className="flex-1 flex flex-col items-center gap-0.5 py-1 transition-all active:scale-90"
              onClickCapture={() => { if (t.id !== 'tryon') setAutoTry(false); }}>
              <Icon size={22}
                className={`transition-all duration-200 ${active ? 'text-primary scale-110' : 'text-dim'}`}
                fill={active ? 'rgba(255,107,138,0.15)' : 'none'} />
              <span className={`text-[10px] font-semibold ${active ? 'text-primary' : 'text-dim'}`}>{t.label}</span>
              <div className={`w-1 h-1 rounded-full bg-primary ${active ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          );
        })}
      </nav>

      {/* FAB */}
      {tab === 'wardrobe' && canAddGarment && (
        <button className="fab" onClick={() => document.getElementById('file-upload')?.click()} aria-label="Ajouter un vêtement">+</button>
      )}

      {/* Outfit floating bar */}
      {outfit.length > 0 && tab !== 'tryon' && (
        <button onClick={goToTryOn}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-dark text-white rounded-full px-5 py-3 shadow-elevated flex items-center gap-3 z-40 active:scale-95 transition-all">
          <div className="flex -space-x-2">
            {outfit.slice(0, 3).map((o, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-primary/30 border-2 border-dark flex items-center justify-center text-[10px] font-bold">
                {o.analysis?.type?.charAt(0)?.toUpperCase() || '?'}
              </div>
            ))}
          </div>
          <span className="text-xs font-bold">{outfit.length} pièce{outfit.length > 1 ? 's' : ''} → Essayer ✨</span>
        </button>
      )}

      <ToastContainer />
    </div>
  );
}
