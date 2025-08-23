import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
// ⬇️ ensure this path matches your project (e.g. "../../lib/supabaseClient")
import { supabase } from "../../lib/supabase";

type Role = "admin" | "staff" | "viewer";

export type Membership = {
  user_id: string;
  business_id: string;
  role: Role;
  created_at?: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  memberships: Membership[];
  activeMembership: Membership | null;              // current business in UI
  loading: boolean;
  signOut: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
  setActiveBusinessId: (businessId: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const activeMembership = useMemo(() => {
    if (!memberships.length) return null;
    // if an explicit selection exists, use it
    if (activeBusinessId) {
      return memberships.find(m => m.business_id === activeBusinessId) ?? null;
    }
    // if only one membership, auto-pick it
    if (memberships.length === 1) return memberships[0];
    // multiple memberships but none selected yet
    return null;
  }, [memberships, activeBusinessId]);

  async function fetchMemberships(userId: string) {
    try {
      const { data, error } = await supabase
        .from("memberships")
        .select("user_id, business_id, role, created_at")
        .eq("user_id", userId);

      if (error) {
        console.error("memberships fetch error:", error.message, error);
        setMemberships([]);
        return [];
      }

      setMemberships((data ?? []) as Membership[]);
      // auto-select if exactly one
      if ((data?.length ?? 0) === 1) {
        setActiveBusinessId(data![0].business_id);
      }
      return (data ?? []) as Membership[];
    } catch (e) {
      console.error("memberships fetch exception:", e);
      setMemberships([]);
      return [];
    }
  }

  const refreshMemberships = async () => {
    if (user?.id) await fetchMemberships(user.id);
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
          await fetchMemberships(u.id);
        } else {
          setMemberships([]);
          setActiveBusinessId(null);
        }
      } catch (e) {
        console.error("getSession exception:", e);
        setMemberships([]);
        setActiveBusinessId(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession ?? null);
      const nextUser = newSession?.user ?? null;
      setUser(nextUser);

      if (nextUser?.id) {
        await fetchMemberships(nextUser.id);
      } else {
        setMemberships([]);
        setActiveBusinessId(null);
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
    setMemberships([]);
    setActiveBusinessId(null);
    await supabase.auth.signOut().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        memberships,
        activeMembership,
        loading,
        signOut,
        refreshMemberships,
        setActiveBusinessId
      }}
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