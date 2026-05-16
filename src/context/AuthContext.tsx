import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from "react";
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

// Throttle the visibility re-check so background tab flips don't thrash auth state.
const VISIBILITY_RECHECK_MS = 60_000;

function profilesEqual(a: Profile | null, b: Profile | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.user_id === b.user_id &&
    a.company_id === b.company_id &&
    a.full_name === b.full_name &&
    a.email === b.email &&
    a.phone === b.phone
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [session, setSessionState] = useState<Session | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const mountedRef = useRef(true);
  const userIdRef = useRef<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const profileRef = useRef<Profile | null>(null);
  const lastVisibilityCheckRef = useRef(0);
  const recoveryAttemptedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Idempotent setters — only update state if something meaningful changed.
  const applySession = useCallback((sess: Session | null) => {
    const nextToken = sess?.access_token ?? null;
    const nextUserId = sess?.user?.id ?? null;
    const tokenChanged = nextToken !== accessTokenRef.current;
    const userChanged = nextUserId !== userIdRef.current;

    if (tokenChanged) {
      accessTokenRef.current = nextToken;
      setSessionState(sess);
    }
    if (userChanged) {
      userIdRef.current = nextUserId;
      setUserState(sess?.user ?? null);
    }
    return { userChanged, tokenChanged };
  }, []);

  const applyProfile = useCallback((next: Profile | null) => {
    if (profilesEqual(profileRef.current, next)) return;
    profileRef.current = next;
    setProfileState(next);
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
          applyProfile(loadedProfile);
        }
      } catch {
        // Profile fetch failure should never affect auth state
      }

      // Auto-recover: if profile exists but has no company, try to create one
      // from auth metadata captured at signup. Gated to once per session per user
      // so it never re-fires on visibility ticks or token refreshes.
      if (
        loadedProfile &&
        !loadedProfile.company_id &&
        !recoveryAttemptedRef.current.has(userId)
      ) {
        recoveryAttemptedRef.current.add(userId);
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
              if (refreshed && mountedRef.current) applyProfile(refreshed as Profile);
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
        if (roleData && mountedRef.current) {
          setUserRole((prev) => (prev === roleData.role ? prev : roleData.role));
        }
      } catch {
        if (mountedRef.current) setUserRole((prev) => (prev === null ? prev : null));
      }
    } finally {
      if (mountedRef.current) setProfileLoaded(true);
    }
  }, [applyProfile]);

  const refreshProfile = useCallback(async () => {
    const uid = userIdRef.current;
    if (uid) {
      try { await fetchProfile(uid); } catch { /* ignore */ }
    }
  }, [fetchProfile]);

  useEffect(() => {
    // 1. Set up listener FIRST (no async work inside callback). Only refetch
    //    the profile when the actual user identity changes — TOKEN_REFRESHED,
    //    USER_UPDATED, and INITIAL_SESSION must not cause skeleton flashes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sess) => {
        if (!mountedRef.current) return;
        const prevUserId = userIdRef.current;
        const { userChanged } = applySession(sess);

        if (!sess?.user) {
          // Signed out — clear everything once.
          if (prevUserId !== null) {
            applyProfile(null);
            setUserRole(null);
            recoveryAttemptedRef.current.clear();
          }
          setProfileLoaded(true);
        } else if (userChanged) {
          // New identity — fetch profile fresh.
          setProfileLoaded(false);
          setTimeout(() => fetchProfile(sess.user.id), 0);
        }
        // For TOKEN_REFRESHED / USER_UPDATED with same user: do nothing.

        setLoading(false);
        setAuthReady(true);
      }
    );

    // 2. THEN restore existing session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (!mountedRef.current) return;
      const { userChanged } = applySession(sess);
      if (sess?.user) {
        if (userChanged || !profileRef.current) {
          setProfileLoaded(false);
          fetchProfile(sess.user.id);
        }
      } else {
        setProfileLoaded(true);
      }
      setLoading(false);
      setAuthReady(true);
    });

    // 3. Re-validate session when tab becomes visible — throttled, and only
    //    triggers a profile refetch if the user id actually changed.
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastVisibilityCheckRef.current < VISIBILITY_RECHECK_MS) return;
      lastVisibilityCheckRef.current = now;

      supabase.auth.getSession().then(({ data: { session: sess } }) => {
        if (!mountedRef.current) return;
        const { userChanged } = applySession(sess);
        if (sess?.user && userChanged) {
          // Don't flip profileLoaded — keep current UI, refresh quietly.
          fetchProfile(sess.user.id);
        }
      });
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [applySession, applyProfile, fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    accessTokenRef.current = null;
    userIdRef.current = null;
    profileRef.current = null;
    recoveryAttemptedRef.current.clear();
    setUserState(null);
    setSessionState(null);
    setProfileState(null);
    setUserRole(null);
  }, []);

  const companyId = profile?.company_id ?? null;

  const value = useMemo<AuthContextType>(() => ({
    user, session, profile,
    companyId,
    userRole,
    loading, authReady, profileLoaded,
    signOut, refreshProfile,
  }), [user, session, profile, companyId, userRole, loading, authReady, profileLoaded, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
