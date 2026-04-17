import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { logError } from "@/utils/errorLog";

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
  profileLoaded: boolean;
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
  const [profileLoaded, setProfileLoaded] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    let loadedProfile: Profile | null = null;
    try {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();
        if (data && mountedRef.current) {
          loadedProfile = data as Profile;
          setProfile(loadedProfile);
        }
      } catch {
        // Profile fetch failure should never affect auth state
      }

      // Auto-recover: if profile exists but has no company, try to create one
      // from auth metadata captured at signup. This rescues users who signed up
      // with email confirmation enabled (where setup_new_company was never called).
      if (loadedProfile && !loadedProfile.company_id) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          const meta = (authUser?.user_metadata || {}) as Record<string, string>;
          const companyName = meta.company_name?.trim();
          const fullName = (meta.full_name || loadedProfile.full_name || "").trim();
          if (companyName) {
            const { error: rpcError } = await supabase.rpc("setup_new_company", {
              p_company_name: companyName,
              p_full_name: fullName,
            });
            if (rpcError) {
              logError({
                source: "rpc:setup_new_company:auto-recovery",
                error: rpcError,
                context: { userId, hasCompanyName: true },
              });
            } else {
              const { data: refreshed } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", userId)
                .single();
              if (refreshed && mountedRef.current) setProfile(refreshed as Profile);
            }
          }
        } catch (err) {
          logError({ source: "auth:auto-recovery", error: err, severity: "warning", context: { userId } });
        }
      }

      // Fetch role
      try {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .single();
        if (roleData && mountedRef.current) setUserRole(roleData.role);
      } catch {
        if (mountedRef.current) setUserRole(null);
      }
    } finally {
      if (mountedRef.current) setProfileLoaded(true);
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
          setUserRole(null);
          setProfileLoaded(true); // nothing to load when signed out
        } else {
          setProfileLoaded(false); // new session — profile not loaded yet
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
        setProfileLoaded(false);
        fetchProfile(sess.user.id);
      } else {
        setProfileLoaded(true);
      }
      setLoading(false);
      setAuthReady(true);
    });

    // 3. Re-validate session when tab becomes visible (prevents unexpected logouts)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        supabase.auth.getSession().then(({ data: { session: sess } }) => {
          if (!mountedRef.current) return;
          setSession(sess);
          setUser(sess?.user ?? null);
          if (sess?.user) fetchProfile(sess.user.id);
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    setUser(null);
    setSession(null);
    setProfile(null);
    setUserRole(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, profile,
      companyId: profile?.company_id ?? null,
      userRole,
      isAccountant: userRole === "accountant",
      loading, authReady, profileLoaded, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
