// src/components/auth/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔑 Load session on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        const sess = data?.session ?? null;
        setSession(sess);
        setUser(sess?.user ?? null);
      } catch (e) {
        console.error("getSession failed:", e);
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    // 🔄 Listen for login/logout/refresh
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // 🔄 Force refresh from Supabase
  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    setSession(data.session ?? null);
    setUser(data.session?.user ?? null);
    setLoading(false);
  };

  const signOut = async () => {
    // 🚿 Clear tenant selection BEFORE ending the session
    try {
      // Clear key bound to current user id (most precise)
      const currentUserId = user?.id;
      if (currentUserId) {
        const key = `sb_selected_business_${currentUserId}`;
        localStorage.removeItem(key);
      }
      // 🧹 Safety: also clear any stray keys from previous sessions/browsers
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sb_selected_business_"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore localStorage errors */
    }

    // Let onAuthStateChange drive state; avoid racing by not mutating user/session here
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      // onAuthStateChange will set loading=false when it fires
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      signOut,
      refresh,
    }),
    [user, session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}