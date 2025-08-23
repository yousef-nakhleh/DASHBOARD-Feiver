import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase"; // ← ensure this path is correct

// keep the same shape you already use elsewhere
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

  // ⬇️ now reads from memberships, not profiles
  async function fetchProfile(userId: string) {
    try {
      // get the user’s memberships; pick one (latest created) for now
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

      const first = (data && data[0]) || null;
      const virtualProfile: Profile = {
        id: userId,
        business_id: first?.business_id ?? null,
        role: (first?.role as string) ?? null, // enum comes back as string
      };

      setProfile(virtualProfile);
      return virtualProfile;
    } catch (e) {
      console.error("memberships fetch exception:", e);
      const fallback: Profile = { id: userId, business_id: null, role: null };
      setProfile(fallback);
      return fallback;
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

        if (error) console.error("getSession error:", error.message, error);

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

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession ?? null);
      const nextUser = newSession?.user ?? null;
      setUser(nextUser);

      if (nextUser?.id) {
        await fetchProfile(nextUser.id);
      } else {
        setProfile(null);
      }
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