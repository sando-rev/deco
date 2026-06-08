import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseAuth } from '../services/supabase';
import { Profile, Role } from '../types/database';
import i18n from '../i18n';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, role: Role) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keep a ref to session so refreshProfile always uses the latest value,
  // even when called from stale closures (e.g. mutation onSuccess callbacks).
  const sessionRef = useRef<Session | null>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const fetchProfile = async (userId: string, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[Auth] Fetching profile for: ${userId} (attempt ${attempt}/${retries})`);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.log('[Auth] Profile fetch error:', error.message, error.code);
          // PGRST116 = no rows — profile not created yet (auth trigger may be slow)
          if (error.code === 'PGRST116' && attempt < retries) {
            console.log(`[Auth] Profile not found, retrying in ${attempt * 1000}ms...`);
            await new Promise((r) => setTimeout(r, attempt * 1000));
            continue;
          }
        }

        if (data && !error) {
          console.log('[Auth] Profile loaded:', data.full_name, data.role, 'onboarded:', data.onboarding_completed);
          setProfile(data as Profile);
          // Sync language preference
          if ((data as any).language && i18n.language !== (data as any).language) {
            i18n.changeLanguage((data as any).language);
          }
          // Update last_active_at silently
          supabase
            .from('profiles')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', userId)
            .then(() => {});
          return data as Profile;
        }

        // Non-retryable error or last attempt
        if (attempt < retries) {
          console.log(`[Auth] Profile fetch failed, retrying in ${attempt * 1000}ms...`);
          await new Promise((r) => setTimeout(r, attempt * 1000));
        }
      } catch (e) {
        console.log('[Auth] Profile fetch exception:', e);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, attempt * 1000));
        }
      }
    }
    return null;
  };

  useEffect(() => {
    console.log('[Auth] Initializing...');
    let initialised = false;

    // Listen for auth changes — register BEFORE getSession so we never miss events
    const {
      data: { subscription },
    } = supabaseAuth.onAuthStateChange((_event, newSession) => {
      console.log('[Auth] Auth state changed:', _event);
      setSession(newSession);
      if (newSession?.user) {
        // Fetch profile in background — do NOT await inside this callback.
        // Awaiting here blocks the Supabase auth state machine and can prevent
        // React from re-rendering with the new session, causing the app to
        // appear stuck after sign-up/sign-in.
        fetchProfile(newSession.user.id).then(() => {
          if (!initialised) {
            initialised = true;
            console.log('[Auth] Done loading (via auth event, profile loaded)');
          }
          setIsLoading(false);
        });
      } else {
        setProfile(null);
        if (!initialised) {
          initialised = true;
          console.log('[Auth] Done loading (via auth event, no user)');
        }
        setIsLoading(false);
      }
    });

    // Get initial session (may resolve before or after the listener fires)
    supabaseAuth
      .getSession()
      .then(({ data: { session } }) => {
        if (initialised) return; // listener already handled it
        console.log('[Auth] Session:', session ? 'exists' : 'none');
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id).finally(() => {
            if (initialised) return;
            initialised = true;
            console.log('[Auth] Done loading (with session)');
            setIsLoading(false);
          });
        } else {
          initialised = true;
          console.log('[Auth] Done loading (no session)');
          setIsLoading(false);
        }
      })
      .catch((e) => {
        console.log('[Auth] getSession error:', e);
        if (!initialised) {
          initialised = true;
          setIsLoading(false);
        }
      });

    // Safety timeout — never stay stuck on splash for more than 12 seconds
    // (profile fetch retries can take up to ~6s, so 12s gives enough headroom)
    const timeout = setTimeout(() => {
      if (!initialised) {
        console.warn('[Auth] Safety timeout — forcing load complete');
        initialised = true;
        setIsLoading(false);
      }
    }, 12000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: Role) => {
    const { error } = await supabaseAuth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabaseAuth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setIsLoading(false);
    }
    // On success, onAuthStateChange will set isLoading=false after profile loads
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabaseAuth.resetPasswordForEmail(email);
    return { error };
  };

  const signOut = async () => {
    // Clear push token before signing out so this device
    // stops receiving notifications for this account
    const currentSession = sessionRef.current;
    if (currentSession?.user) {
      await supabase
        .from('profiles')
        .update({ push_token: null })
        .eq('id', currentSession.user.id);
    }
    await supabaseAuth.signOut();
    setProfile(null);
  };

  // Use useCallback + sessionRef so this function is stable and never
  // captures a stale session value, even when invoked from mutation callbacks.
  const refreshProfile = useCallback(async () => {
    const currentSession = sessionRef.current;
    if (currentSession?.user) {
      console.log('[Auth] refreshProfile called for:', currentSession.user.id);
      await fetchProfile(currentSession.user.id);
    } else {
      // Fallback: grab session directly from Supabase in case our ref is stale
      console.log('[Auth] refreshProfile: no session in ref, fetching from Supabase');
      const { data: { session: freshSession } } = await supabaseAuth.getSession();
      if (freshSession?.user) {
        setSession(freshSession);
        await fetchProfile(freshSession.user.id);
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isLoading,
        signUp,
        signIn,
        resetPassword,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
