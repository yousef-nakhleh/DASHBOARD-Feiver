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

  /** Loaded memberships or (for super admin) all businesses as synthetic memberships. */
  memberships: Membership[];
  membershipsLoading: boolean;
  membershipsError: string | null;

  /** True if current user has a super_admin membership. */
  isSuperAdmin: boolean;

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

  const [selectedBusinessId, _setSelectedBusinessId] = useState<string | null>(null);

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState<boolean>(true);
  const [membershipsError, setMembershipsError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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
      setIsSuperAdmin(false);
      setMembershipsLoading(false);
      setMembershipsError(null);
      return;
    }

    setMembershipsLoading(true);
    setMembershipsError(null);

    // Fetch user memberships
    const { data, error } = await supabase
      .from("memberships")
      .select("business_id, role, business:business(id, name)")
      .eq("user_id", user.id);

    if (error) {
      console.error("fetchMemberships error:", error);
      setMemberships([]);
      setIsSuperAdmin(false);
      setMembershipsError(error.message ?? "Errore durante il caricamento.");
      setMembershipsLoading(false);
      return;
    }

    const rows = (data as Membership[]) ?? [];
    const isSuper = rows.some((r) => r.role === "super_admin");
    setIsSuperAdmin(isSuper);

    // If super_admin, synthesize memberships from ALL businesses
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

      // ❗️Do NOT auto-select for super admins — force the selector step
      // If saved selection no longer valid, clear it
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

    // Normal (non-super) path: use user-specific memberships
    setMemberships(rows);

    // Auto-select only when the user has exactly one membership (non-super case)
    if (rows.length === 1 && !selectedBusinessId) {
      _setSelectedBusinessId(rows[0].business_id);
      if (storageKey) {
        window.localStorage.setItem(storageKey, rows[0].business_id);
      }
    }

    // If saved selection no longer valid, clear it
    if (
      selectedBusinessId &&
      !rows.some((m) => m.business_id === selectedBusinessId)
    ) {
      _setSelectedBusinessId(null);
      if (storageKey) window.localStorage.removeItem(storageKey);
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
  if (!ctx)
    throw new Error(
      "useSelectedBusiness must be used within a SelectedBusinessProvider"
    );
  return ctx;
};