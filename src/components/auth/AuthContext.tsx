import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
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

  async function fetchProfile(userId: string) {
    try {
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
    } catch (e) {
      console.error("profiles fetch exception:", e);
      setProfile(null);
      return null;
    }
  }

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) console.warn("getSession error:", error.message);

        const sess = data?.session ?? null;
        setSession(sess);
        const u = sess?.user ?? null;
        setUser(u);

        if (u?.id) {
          // don’t block UI on profile
          fetchProfile(u.id);
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

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      const nextUser = newSession?.user ?? null;
      setUser(nextUser);
      // fire-and-forget profile load; UI doesn’t hang
      if (nextUser?.id) fetchProfile(nextUser.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const signOut = async () => {
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