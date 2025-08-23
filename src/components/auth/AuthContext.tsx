// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase"; // ← make sure this path matches your project

type Role = "admin" | "staff" | "viewer";

type Profile = {
  id: string;
  business_id: string | null;
  role: string | null; // enum returns as string
};

type Membership = {
  user_id: string;
  business_id: string;
  role: Role;
  created_at?: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  // legacy API (kept for compatibility)
  profile: Profile | null;
  refreshProfile: () => Promise<void>;

  // extras (useful for multi-tenant)
  memberships: Membership[];
  activeMembership: Membership | null;
  setActiveBusinessId: (businessId: string | null) => void;

  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // memberships + selection
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);

  // “profile” built from memberships to keep your old API working
  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);

  const activeMembership = useMemo(() => {
    if (!memberships.length) return null;
    if (activeBusinessId) {
      return memberships.find(m => m.business_id === activeBusinessId) ?? null;
    }
    if (memberships.length === 1) return memberships[0];
    return null; // multiple memberships, none selected yet
  }, [memberships, activeBusinessId]);

  // ---- data fetchers --------------------------------------------------------

  async function fetchMemberships(userId: string) {
    if (!supabase) {
      console.error("Supabase client not initialized (missing env?)");
      setMemberships([]);
      setProfile({ id: userId, business_id: null, role: null });
      return [];
    }
    const { data, error } = await supabase
      .from("memberships")
      .select("user_id, business_id, role, created_at")
      .eq("user_id", userId);

    if (error) {
      console.error("memberships fetch error:", error.message, error);
      setMemberships([]);
      setProfile({ id: userId, business_id: null, role: null });
      return [];
    }

    const rows = (data ?? []) as Membership[];
    setMemberships(rows);

    // auto-select if there’s exactly one membership
    if (rows.length === 1) setActiveBusinessId(rows[0].business_id);

    // build the legacy "profile" from the (selected or latest) membership
    const selected =
      rows.find(r => r.business_id === activeBusinessId) ??
      (rows.length ? rows[0] : null);

    setProfile({
      id: userId,
      business_id: selected?.business_id ?? null,
      role: (selected?.role as string) ?? null,
    });

    return rows;
  }

  // keep the name for backward compatibility
  const refreshProfile = async () => {
    if (user?.id) await fetchMemberships(user.id);
  };

  // ---- effects --------------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!supabase) {
          console.error("Supabase client not initialized.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.getSession();

if (error?.message?.toLowerCase().includes("refresh")) {
  console.warn("Invalid refresh token – clearing local session");
  await supabase.auth.signOut({ scope: "local" });
  location.reload();
  return; // stop here, don’t continue with bad state
}
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
          setProfile(null);
        }
      } catch (e) {
        console.error("getSession exception:", e);
        setMemberships([]);
        setActiveBusinessId(null);
        setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = supabase?.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession ?? null);
      const nextUser = newSession?.user ?? null;
      setUser(nextUser);

      if (nextUser?.id) {
        await fetchMemberships(nextUser.id);
      } else {
        setMemberships([]);
        setActiveBusinessId(null);
        setProfile(null);
      }
      setLoading(false);
    }) ?? { subscription: { unsubscribe: () => {} } };

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // rebuild legacy profile whenever selection changes
  useEffect(() => {
    if (!user?.id) return;
    const sel =
      memberships.find(m => m.business_id === activeBusinessId) ??
      (memberships.length ? memberships[0] : null);

    setProfile({
      id: user.id,
      business_id: sel?.business_id ?? null,
      role: (sel?.role as string) ?? null,
    });
  }, [activeBusinessId, memberships, user?.id]);

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setMemberships([]);
    setActiveBusinessId(null);
    setProfile(null);
    await supabase?.auth.signOut().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,               // ← backwards compatible
        refreshProfile,        // ← backwards compatible
        memberships,           // extras
        activeMembership,      // extras
        setActiveBusinessId,   // extras
        loading,
        signOut,
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