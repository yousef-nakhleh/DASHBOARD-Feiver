// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase"; // make sure this path is correct

// ---- Types kept identical to your old API ----
type Profile = {
  id: string;
  business_id: string | null;
  role: string | null; // enum comes back as string
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- Fetch the “virtual profile” from memberships ----
  async function fetchProfile(userId: string) {
    if (!supabase) {
      console.error("Supabase client not initialized (missing env?)");
      setProfile({ id: userId, business_id: null, role: null });
      return null;
    }

    const { data, error } = await supabase
      .from("memberships")
      .select("business_id, role, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("memberships fetch error:", error.message, error);
      const fallback: Profile = { id: userId, business_id: null, role: null };
      setProfile(fallback);
      return fallback;
    }

    const first = data?.[0] as { business_id?: string; role?: string } | undefined;
    const virtual: Profile = {
      id: userId,
      business_id: first?.business_id ?? null,
      role: first?.role ?? null,
    };
    setProfile(virtual);
    return virtual;
  }

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!supabase) {
          console.error("Supabase client not initialized.");
          setLoading(false);
          return;
        }

        // ---- Guard: auto-fix invalid refresh token ----
        const { data, error } = await supabase.auth.getSession();
        if (error?.message?.toLowerCase().includes("refresh")) {
          console.warn("Invalid refresh token detected — clearing local session");
          await supabase.auth.signOut({ scope: "local" }); // clears stored session only
          location.reload();
          return;
        }

        const sess = data?.session ?? null;
        setSession(sess);

        const u = sess?.user ?? null;
        setUser(u);

        if (u?.id) {
          await fetchProfile(u.id);
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error("getSession exception:", e);
        setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } =
      supabase?.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession ?? null);
        const nextUser = newSession?.user ?? null;
        setUser(nextUser);

        if (nextUser?.id) {
          await fetchProfile(nextUser.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }) ?? { subscription: { unsubscribe: () => {} } };

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    await supabase?.auth.signOut().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}