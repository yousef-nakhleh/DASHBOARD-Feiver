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
  selectedBusinessId: string | null;
  setSelectedBusinessId: (id: string | null) => void;
  effectiveBusinessId: string | null;

  memberships: Membership[];
  membershipsLoading: boolean;
  membershipsError: string | null;

  isSuperAdmin: boolean;

  refreshMemberships: () => Promise<void>;
};

const SelectedBusinessContext = createContext<
  SelectedBusinessContextType | undefined
>(undefined);

export const SelectedBusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  const storageKey = user?.id ? `sb_selected_business_${user.id}` : null;

  const [selectedBusinessId, _setSelectedBusinessId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState<boolean>(true);
  const [membershipsError, setMembershipsError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // 🔁 When the authenticated user changes (including logout) → clear in-memory selection.
  useEffect(() => {
    if (authLoading) return;
    _setSelectedBusinessId(null);
  }, [authLoading, user?.id]);

  const fetchMemberships = async () => {
    if (!user?.id) {
      setMemberships([]);
      setIsSuperAdmin(false);
      setMembershipsLoading(false);
      setMembershipsError(null);
      return;
    }

    setMembershipsLoading(true);
    setMembershipsError(null);

    // Load all memberships for this user
    const { data, error } = await supabase
      .from("memberships")
      .select("business_id, role, business:business(id, name)")
      .eq("user_id", user.id);

    if (error) {
      console.error("[SelectedBusiness] memberships error:", error);
      setMemberships([]);
      setIsSuperAdmin(false);
      setMembershipsError(error.message ?? "Errore durante il caricamento.");
      setMembershipsLoading(false);
      return;
    }

    const rows = (data as Membership[]) ?? [];
    const superFlag = rows.some((r) => r.role === "super_admin");
    setIsSuperAdmin(superFlag);

    if (superFlag) {
      // Super admin → offer ALL businesses; do NOT preload any saved selection.
      const { data: allBiz, error: allBizErr } = await supabase
        .from("business")
        .select("id,name")
        .order("name", { ascending: true });

      if (allBizErr) {
        console.error("[SelectedBusiness] fetch business error:", allBizErr);
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

      // If an old selection is hanging around (rare), clear it.
      if (
        selectedBusinessId &&
        !synthesized.some((m) => m.business_id === selectedBusinessId)
      ) {
        _setSelectedBusinessId(null);
        if (storageKey) window.localStorage.removeItem(storageKey);
      }

      setMembershipsLoading(false);
      return;
    }

    // Normal user path → use their memberships
    setMemberships(rows);

    // Try restore saved selection (only for non-super users)
    const saved = storageKey ? window.localStorage.getItem(storageKey) : null;
    if (saved && rows.some((m) => m.business_id === saved)) {
      _setSelectedBusinessId(saved);
      setMembershipsLoading(false);
      return;
    }

    // If exactly one membership → auto-select it
    if (rows.length === 1) {
      _setSelectedBusinessId(rows[0].business_id);
      if (storageKey) window.localStorage.setItem(storageKey, rows[0].business_id);
    } else {
      // Multiple memberships → leave null, UI will ask
      _setSelectedBusinessId(null);
    }

    setMembershipsLoading(false);
  };

  // Fetch memberships whenever auth is ready or user changes
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

  const effectiveBusinessId = useMemo(() => selectedBusinessId ?? null, [selectedBusinessId]);

  const value = useMemo<SelectedBusinessContextType>(
    () => ({
      selectedBusinessId,
      setSelectedBusinessId,
      effectiveBusinessId,
      memberships,
      membershipsLoading,
      membershipsError,
      isSuperAdmin,
      refreshMemberships: fetchMemberships,
    }),
    [
      selectedBusinessId,
      effectiveBusinessId,
      memberships,
      membershipsLoading,
      membershipsError,
      isSuperAdmin,
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
  if (!ctx) throw new Error("useSelectedBusiness must be used within a SelectedBusinessProvider");
  return ctx;
};