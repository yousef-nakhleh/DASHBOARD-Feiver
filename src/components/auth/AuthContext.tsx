import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase"; // ✅ path from src/components/auth

// --- Minimal shape of your profiles table ---
export type Profile = {
  id: string;                       // FK to auth.users.id
  business_id: string | null;
  role: "customer" | "owner" | "manager" | "staff" | string | null;
  // add other columns if you need them globally (phone, name, etc.)
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

  // Fetch profile for current user
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.warn("profiles fetch error:", error.message);
      setProfile(null);
      return null;
    }
    setProfile(data as Profile);
    return data as Profile;
  };

  // Allow consumers to refresh on demand
  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    await fetchProfile(user.id);
  };

  // Initial session + listener
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const sess = data.session ?? null;
      setSession(sess);
      setUser(sess?.user ?? null);

      if (sess?.user) await fetchProfile(sess.user.id);
      else setProfile(null);

      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        const nextUser = newSession?.user ?? null;
        setSession(newSession ?? null);
        setUser(nextUser);

        if (nextUser) await fetchProfile(nextUser.id);
        else setProfile(null);

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Clear local state first so UI updates immediately
    setUser(null);
    setSession(null);
    setProfile(null);
    await supabase.auth.signOut().catch(() => {});
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