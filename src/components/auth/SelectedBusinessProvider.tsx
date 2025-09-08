// src/components/auth/SelectedBusinessProvider.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "./AuthContext";

type Membership = {
  business_id: string;
  role: string;
  business?: { id: string; name: string } | null;
};

type SelectedBusinessContextType = {
  /** Explicit user choice (persisted per user). */
  selectedBusinessId: string | null;
  /** Set/clear explicit selection. */
  setSelectedBusinessId: (id: string | null) => void;

  /** The business id the rest of the app should use. */
  effectiveBusinessId: string | null;

  /** Loaded memberships for current user (optional for UI like BusinessSelector). */
  memberships: Membership[];
  membershipsLoading: boolean;
  membershipsError: string | null;

  /** Manually refresh memberships. */
  refreshMemberships: () => Promise<void>;
};

const SelectedBusinessContext = createContext<
  SelectedBusinessContextType | undefined
>(undefined);

export const SelectedBusinessProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading: authLoading } = useAuth();

  const storageKey = user?.id ? `sb_selected_business_${user.id}` : null;

  const [selectedBusinessId, _setSelectedBusinessId] = useState<string | null>(
    null
  );

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState<boolean>(true);
  const [membershipsError, setMembershipsError] = useState<string | null>(null);

  // Load saved selection when user changes
  useEffect(() => {
    if (authLoading) return;
    if (!storageKey) {
      _setSelectedBusinessId(null);
      return;
    }
    const saved = window.localStorage.getItem(storageKey);
    _setSelectedBusinessId(saved || null);
  }, [authLoading, storageKey]);

  const fetchMemberships = async () => {
    if (!user?.id) {
      setMemberships([]);
      setMembershipsLoading(false);
      setMembershipsError(null);
      return;
    }

    setMembershipsLoading(true);
    setMembershipsError(null);

    const { data, error } = await supabase
      .from("memberships")
      .select("business_id, role, business:business(id, name)")
      .eq("user_id", user.id);

    if (error) {
      console.error("fetchMemberships error:", error);
      setMemberships([]);
      setMembershipsError(error.message ?? "Errore durante il caricamento.");
      setMembershipsLoading(false);
      return;
    }

    const rows = (data as Membership[]) ?? [];
    const isSuper = rows.some((r) => r.role === "super_admin");

    // If super_admin, expose ALL businesses as selectable targets
    if (isSuper) {
      const { data: allBiz, error: allBizErr } = await supabase
        .from("business")
        .select("id,name")
        .order("name", { ascending: true });

      if (allBizErr) {
        console.error("fetch all business error:", allBizErr);
        setMemberships([]);
        setMembershipsError(allBizErr.message ?? "Errore durante il caricamento.");
        setMembershipsLoading(false);
        return;
      }

      const synthesized: Membership[] =
        (allBiz ?? []).map((b: any) => ({
          business_id: b.id,
          role: "super_admin",
          business: { id: b.id, name: b.name },
        })) ?? [];

      setMemberships(synthesized);

      // Auto-select default when there is only one business and user hasn't chosen yet
      if (synthesized.length === 1 && !selectedBusinessId) {
        _setSelectedBusinessId(synthesized[0].business_id);
        if (storageKey) {
          window.localStorage.setItem(storageKey, synthesized[0].business_id);
        }
      }

      setMembershipsLoading(false);
      return;
    }

    // Normal (non-super) path: use user-specific memberships
    setMemberships(rows);

    if (rows.length === 1 && !selectedBusinessId) {
      _setSelectedBusinessId(rows[0].business_id);
      if (storageKey) {
        window.localStorage.setItem(storageKey, rows[0].business_id);
      }
    }

    setMembershipsLoading(false);
  };

  // Fetch memberships when auth state changes
  useEffect(() => {
    if (authLoading) return;
    fetchMemberships();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const setSelectedBusinessId = (id: string | null) => {
    _setSelectedBusinessId(id);
    if (!storageKey) return;
    if (id) window.localStorage.setItem(storageKey, id);
    else window.localStorage.removeItem(storageKey);
  };

  // effective = explicit selection OR (if none) null
  const effectiveBusinessId = useMemo(() => {
    return selectedBusinessId ?? null;
  }, [selectedBusinessId]);

  const value = useMemo<SelectedBusinessContextType>(
    () => ({
      selectedBusinessId,
      setSelectedBusinessId,
      effectiveBusinessId,
      memberships,
      membershipsLoading,
      membershipsError,
      refreshMemberships: fetchMemberships,
    }),
    [
      selectedBusinessId,
      effectiveBusinessId,
      memberships,
      membershipsLoading,
      membershipsError,
    ]
  );

  return (
    <SelectedBusinessContext.Provider value={value}>
      {children}
    </SelectedBusinessContext.Provider>
  );
};

export const useSelectedBusiness = (): SelectedBusinessContextType => {
  const ctx = useContext(SelectedBusinessContext);
  if (!ctx)
    throw new Error(
      "useSelectedBusiness must be used within a SelectedBusinessProvider"
    );
  return ctx;
};