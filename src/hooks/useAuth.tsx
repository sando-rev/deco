import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseAuth } from '../services/supabase';
import { Profile, Role } from '../types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, role: Role) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('[Auth] Fetching profile for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('[Auth] Profile fetch error:', error.message, error.code);
      }

      if (data && !error) {
        console.log('[Auth] Profile loaded:', data.full_name, data.role);
        setProfile(data as Profile);
      }
      return (data as Profile) ?? null;
    } catch (e) {
      console.log('[Auth] Profile fetch exception:', e);
      return null;
    }
  };

  useEffect(() => {
    console.log('[Auth] Initializing...');

    // Get initial session
    supabaseAuth
      .getSession()
      .then(({ data: { session } }) => {
        console.log('[Auth] Session:', session ? 'exists' : 'none');
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id).finally(() => {
            console.log('[Auth] Done loading (with session)');
            setIsLoading(false);
          });
        } else {
          console.log('[Auth] Done loading (no session)');
          setIsLoading(false);
        }
      })
      .catch((e) => {
        console.log('[Auth] getSession error:', e);
        setIsLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseAuth.onAuthStateChange(async (_event, session) => {
      console.log('[Auth] Auth state changed:', _event);
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
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
    const { error } = await supabaseAuth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabaseAuth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isLoading,
        signUp,
        signIn,
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
