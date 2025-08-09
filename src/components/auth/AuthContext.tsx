import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase"; // ✅ from src/components/auth → ../../lib/supabase

// Shape of your profiles table
export type Profile = {
  id: string;                    // FK to auth.users.id
  business_id: string | null;
  role: string | null;           // e.g. 'customer' | 'owner' | 'staff'
  // add other columns if you need them in context
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;                  // true until session + (if logged) profile fetched
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // --- helpers ---
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

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    await fetchProfile(user.id);
  };

  // --- initial session + listener ---
  useEffect(() => {
    let active = true;

    const init = async () => {
      // 1) get current auth session
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      const sess = data.session ?? null;
      setSession(sess);
      const currentUser = sess?.user ?? null;
      setUser(currentUser);

      // 2) if logged in, fetch profile before clearing "loading"
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      if (active) setLoading(false);
    };

    init();

    // 3) subscribe to auth state changes (sign in / out / token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const nextUser = newSession?.user ?? null;
      setSession(newSession ?? null);
      setUser(nextUser);

      // while switching users, keep UI in a loading state briefly
      setLoading(true);
      if (nextUser) {
        await fetchProfile(nextUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
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