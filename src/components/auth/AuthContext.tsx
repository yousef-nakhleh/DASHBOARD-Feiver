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
        console.error("profiles fetch error:", error.message, error);
        setProfile(null);
        return null;
      }
      console.log("Profile data from Supabase (raw):", data);
      console.log("Profile fetched successfully:", data);
      setProfile(data as Profile);
      console.log("Profile set in AuthContext:", data);
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
        if (error) {
          console.error("getSession error:", error.message, error);
        }

        const sess = data?.session ?? null;
        console.log("Initial session:", sess ? "Found session" : "No session");
        setSession(sess);
        const u = sess?.user ?? null;
        console.log("Initial user:", u ? `User ID: ${u.id}` : "No user");
        setUser(u);

        if (u?.id) {
          // don’t block UI on profile
          console.log("Fetching profile for user:", u.id);
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

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log("Auth state change:", _event, newSession ? "Session exists" : "No session");
      setSession(newSession ?? null);
      const nextUser = newSession?.user ?? null;
      setUser(nextUser);
      // fire-and-forget profile load; UI doesn’t hang
      if (nextUser?.id) {
        console.log("Auth change: fetching profile for user:", nextUser.id);
        fetchProfile(nextUser.id);
      }
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