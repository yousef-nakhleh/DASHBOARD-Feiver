// src/components/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;                 // FK to auth.users.id
  business_id: string | null;
  role: string | null;
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

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")            // <-- ensure table name is exactly 'profiles'
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

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    await fetchProfile(user.id);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const sess = data.session ?? null;
      setSession(sess);
      const u = sess?.user ?? null;
      setUser(u);

      if (u) await fetchProfile(u.id);
      else setProfile(null);

      setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        const u = newSession?.user ?? null;
        setSession(newSession ?? null);
        setUser(u);

        if (u) await fetchProfile(u.id);
        else setProfile(null);

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();   // <-- correct unsubscribe
    };
  }, []);

  const signOut = async () => {
    // Clear local state first so UI reacts immediately
    setUser(null);
    setSession(null);
    setProfile(null);
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
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