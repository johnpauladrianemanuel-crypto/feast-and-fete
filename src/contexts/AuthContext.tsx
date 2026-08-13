'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const AuthContext = createContext<any>({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        try {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        } catch {}
      });
      subscription = data.subscription;
    } catch {
      setLoading(false);
    }

    return () => {
      try {
        subscription?.unsubscribe();
      } catch {}
    };
  }, []);

  useEffect(() => {
    try {
      const guestId = localStorage.getItem('guestProfileId');
      const guestContactType = localStorage.getItem('guestContactType');
      const guestContactValue = localStorage.getItem('guestContactValue');
      if (!user && guestId) {
        setUser({ id: `guest:${guestId}`, user_metadata: { full_name: 'Guest' }, is_guest: true, guestProfileId: guestId, guestContactType, guestContactValue });
      }
    } catch {}
  }, []);

  // 🌟 IDINAGDAG: Function para ma-update agad ang user state (pangalan, avatar, metadata) sa buong app
  const updateUserProfile = (updatedFields: { fullName?: string; avatarUrl?: string; [key: string]: any }) => {
    setUser((prevUser: any) => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        user_metadata: {
          ...prevUser.user_metadata,
          ...(updatedFields.fullName && { full_name: updatedFields.fullName }),
          ...(updatedFields.avatarUrl && { avatar_url: updatedFields.avatarUrl }),
          ...updatedFields,
        }
      };
    });
  };

  const signUp = async (email: string, password: string, metadata = {}) => {
    const signUpPayload: any = { email, password };
    const signUpOptions: any = {
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    };

    const metaDataPayload: Record<string, string> = {};
    if ((metadata as any)?.fullName) metaDataPayload.full_name = (metadata as any).fullName;
    if ((metadata as any)?.avatarUrl) metaDataPayload.avatar_url = (metadata as any).avatarUrl;

    if (Object.keys(metaDataPayload).length > 0) {
      signUpOptions.options.data = metaDataPayload;
    }

    const { data, error } = await supabase.auth.signUp({
      ...signUpPayload,
      options: signUpOptions.options,
    });
    if (!error) return data;

    if (error.message?.includes('Database error saving new user')) {
      const { data: fallbackData, error: fallbackError } = await supabase.auth.signUp({
        ...signUpPayload,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (!fallbackError) return fallbackData;
    }
    throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (user?.is_guest) {
      try {
        localStorage.removeItem('guestProfileId');
        localStorage.removeItem('guestContactType');
        localStorage.removeItem('guestContactValue');
      } catch {}
      setUser(null);
      setSession(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInAsGuest = (profile: { id: string; contactType?: string; contactValue?: string }) => {
    let displayName = 'Guest';
    try {
      const val = profile.contactValue || '';
      if (profile.contactType === 'phone') {
        const digits = val.replace(/\D/g, '');
        const local = digits.startsWith('63') ? '0' + digits.slice(2) : digits.startsWith('0') ? digits : digits;
        displayName = local ? (local.length === 11 ? `${local.slice(0,4)} ${local.slice(4,7)} ${local.slice(7)}` : local) : 'Guest';
      } else if (profile.contactType === 'email') {
        displayName = (val.split('@')[0] || 'Guest');
      }
    } catch {
      displayName = 'Guest';
    }

    const guestUser = {
      id: `guest:${profile.id}`,
      user_metadata: { full_name: displayName },
      is_guest: true,
      guestProfileId: profile.id,
      guestContactType: profile.contactType,
      guestContactValue: profile.contactValue,
    };
    try {
      localStorage.setItem('guestProfileId', profile.id);
      if (profile.contactType) localStorage.setItem('guestContactType', profile.contactType);
      if (profile.contactValue) localStorage.setItem('guestContactValue', profile.contactValue);
    } catch {}
    setUser(guestUser as any);
  };

  const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  };

  const isEmailVerified = () => {
    return user?.email_confirmed_at !== null;
  };

  const getUserProfile = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    return data;
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    isEmailVerified,
    getUserProfile,
    signInAsGuest,
    updateUserProfile, // 🌟 Idinagdag dito para magamit sa profile page
    setUser            // 🌟 O kaya pwede ring direktang gamitin ang setUser kung kinakailangan
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};