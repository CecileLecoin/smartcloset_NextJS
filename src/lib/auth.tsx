'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
 
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;

  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isGuest: true,
  signInWithGoogle: async () => {},
  signInAsGuest: async () => {},
  signUpWithEmail: async () => {},
  signInWithEmail: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('getSession error', error);
      setLoading(false);
      return;
    }

    const session = data.session;
    setSession(session);
    setUser(session?.user ?? null);

    if (session?.user?.id) {
      await loadProfileFlags(session.user.id);
    } else {
      setIsGuest(false);
    }

    setLoading(false);
  };

  loadSession();

  const { data: { subscription } } =
    supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        await loadProfileFlags(session.user.id);
      } else {
        setIsGuest(false);
      }

      setLoading(false);
    });

  return () => subscription.unsubscribe();
}, []);


  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  async function signInAsGuest() {
    if(process.env.NEXT_PUBLIC_VITE_GUEST_PASSWORD === undefined) {
      console.error('Guest password not set in environment variables');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: 'guest2@smartcloset.cloud',
      password: process.env.NEXT_PUBLIC_VITE_GUEST_PASSWORD!
    });

    if (error) {
      console.error('Guest sign-in failed', error);
      throw error;
    }
  }

  async function signUpWithEmail(email: string, password: string) {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (error) throw error;
  }

  async function signInWithEmail(email: string, password: string) {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  /*------------- GUEST MODE -------------*/
  async function loadProfileFlags(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_guest')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to load profile flags', error);
      return;
    }

    setIsGuest(data?.is_guest === true);
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, isGuest, signInWithGoogle, signInAsGuest, signUpWithEmail, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
