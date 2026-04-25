'use client';

import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import AcceptCGU from '@/components/CGU' // ajuste le chemin si besoin

export default function OnboardingScreen() {
  const { signInWithGoogle, signInAsGuest, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const [cguAccepted, setCguAccepted] = useState(false)
  const [mode, setMode] = useState<'none' | 'signup' | 'signin'>('none');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <div
      className="h-full flex flex-col items-center justify-center px-8 text-center"
      style={{ background: 'linear-gradient(160deg, #FFF5F7 0%, #F5F0FF 50%, #EDFFF9 100%)' }}
    >
      <div className="text-7xl mb-6 drop-shadow-lg">👗</div>

      <h1 className="text-4xl font-extrabold tracking-tight mb-1">
        <span className="text-primary">Fit</span>
        <span className="text-secondary">Lab</span>
      </h1>
      <p className="text-sm text-dim mb-10 leading-relaxed">
        Essaye ta garde-robe sur toi.<br />
        Découvre de nouveaux looks.
      </p>

      <div className="flex flex-col gap-3 w-full mb-10">
        {[
          { n: '1', color: 'bg-primary', text: 'Prends en photo tes vêtements' },
          { n: '2', color: 'bg-secondary', text: "Compose une tenue, l'IA l'analyse" },
          { n: '3', color: 'bg-accent', text: 'Vois le résultat sur toi en photo' },
        ].map((step) => (
          <div
            key={step.n}
            className="flex items-center gap-3 text-left bg-white/70 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/90"
          >
            <div
              className={`w-7 h-7 rounded-full ${step.color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}
            >
              {step.n}
            </div>
            <p className="text-[13px] font-medium text-dark">{step.text}</p>
          </div>
        ))}
      </div>
        <AcceptCGU
          accepted={cguAccepted}
          onChange={setCguAccepted}
        />
      <button
        onClick={signInWithGoogle}
        disabled={!cguAccepted || loading}
        className="w-full py-4 bg-card border-[1.5px] border-border rounded-2xl font-bold text-sm text-dark flex items-center justify-center gap-2 shadow-card mb-2.5 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {loading ? 'Connexion…' : 'Continuer avec Google'}
      </button>


      {/*signup/in avec email*/}
      <button
        onClick={() => setMode('signup')}
        disabled={!cguAccepted || loading}
        className="w-full py-4 bg-card border-[1.5px] border-border rounded-2xl
                  font-bold text-sm text-dark flex items-center justify-center gap-2
                  shadow-card mb-2 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {/* Icone email */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M4 6h16v12H4z" stroke="#7C5CFC" strokeWidth="1.5" />
          <path d="M4 6l8 6 8-6" stroke="#7C5CFC" strokeWidth="1.5" />
        </svg>

        Créer un compte avec email
      </button>

      
      <button
        onClick={() => setMode('signin')}
        disabled={!cguAccepted || loading}
        className="w-full py-4 bg-card border-[1.5px] border-border rounded-2xl
                  font-bold text-sm text-dark flex items-center justify-center gap-2
                  shadow-card mb-4 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {/* Icône cadenas */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="10" width="14" height="9" rx="2" stroke="#7C5CFC" strokeWidth="1.5" />
          <path d="M8 10V7a4 4 0 118 0v3" stroke="#7C5CFC" strokeWidth="1.5" />
        </svg>

        Se connecter avec email
      </button>


      {mode !== 'none' && (
        <div className="w-full mt-4 flex flex-col gap-3">
          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border text-sm"
          />

          <input
            type="password"
            placeholder="Mot de passe (min. 6 caractères)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border text-sm"
          />

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <button
            disabled={!cguAccepted || loading}
            onClick={async () => {
              setError(null);
              try {
                if (mode === 'signup') {
                  await signUpWithEmail(email, password);
                } else {
                  await signInWithEmail(email, password);
                }
              } catch (e: any) {
                setError(e.message);
              }
            }}
            className="w-full py-3 rounded-xl font-semibold bg-primary text-white"
          >
            {mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
          </button>

          <button
            onClick={() => setMode('none')}
            className="text-xs text-dim underline"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Bouton de connexion en tant qu'invité */}
      <button
        onClick={signInAsGuest}
        disabled={!cguAccepted || loading}
        className={`
          w-full py-3 rounded-xl font-semibold transition-all
          ${(!cguAccepted || loading)
            ? 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'
            : 'bg-white text-dark border border-border hover:bg-border active:scale-[0.98]'
          }
        `}
      >
        👀 Continuer en tant qu’invité
      </button>


      <p className="text-[10px] text-dim mt-4 leading-relaxed">
        En continuant, vous acceptez nos conditions d'utilisation
      </p>
    </div>
  );
}
