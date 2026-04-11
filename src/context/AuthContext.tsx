import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  company_id: string | null;
  full_name: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  companyId: string | null;
  userRole: string | null;
  isAccountant: boolean;
  loading: boolean;
  authReady: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (data && mountedRef.current) setProfile(data as Profile);
      return data as Profile | null;
    } catch {
      // Profile fetch failure should never affect auth state
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      try { await fetchProfile(user.id); } catch { /* ignore */ }
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // 1. Set up listener FIRST (no async work inside callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        if (!mountedRef.current) return;
        setSession(sess);
        setUser(sess?.user ?? null);
        if (!sess?.user) {
          setProfile(null);
        } else {
          // Fire-and-forget profile fetch — never awaited in callback
          setTimeout(() => fetchProfile(sess.user.id), 0);
        }
        setLoading(false);
        setAuthReady(true);
      }
    );

    // 2. THEN restore existing session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (!mountedRef.current) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        fetchProfile(sess.user.id);
      }
      setLoading(false);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, profile,
      companyId: profile?.company_id ?? null,
      loading, authReady, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
