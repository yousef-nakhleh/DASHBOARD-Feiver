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

  // Load saved selection when user changes (runs once per auth change)
  useEffect(() => {
    if (authLoading) return;
    const uid = user?.id || "NO-USER";
    if (!storageKey) {
      console.log("[SBP] load-saved: no storageKey (uid=%s) → clearing selection", uid);
      _setSelectedBusinessId(null);
      return;
    }
    const saved = window.localStorage.getItem(storageKey);
    console.log("[SBP] load-saved: auth ready (uid=%s), storageKey=%s, saved=%s", uid, storageKey, saved);
    _setSelectedBusinessId(saved || null);
  }, [authLoading, storageKey, user?.id]);

  const fetchMemberships = async () => {
    const uid = user?.id || "NO-USER";
    console.log("[SBP] fetchMemberships: START (uid=%s)", uid);

    if (!user?.id) {
      setMemberships([]);
      setIsSuperAdmin(false);
      setMembershipsLoading(false);
      setMembershipsError(null);
      console.log("[SBP] fetchMemberships: no user → memberships=[]");
      return;
    }

    setMembershipsLoading(true);
    setMembershipsError(null);

    const { data, error } = await supabase
      .from("memberships")
      .select("business_id, role, business:business(id, name)")
      .eq("user_id", user.id);

    if (error) {
      console.error("[SBP] fetchMemberships: error:", error);
      setMemberships([]);
      setIsSuperAdmin(false);
      setMembershipsError(error.message ?? "Errore durante il caricamento.");
      setMembershipsLoading(false);
      return;
    }

    const rows = (data as Membership[]) ?? [];
    const isSuper = rows.some((r) => r.role === "super_admin");
    setIsSuperAdmin(isSuper);
    console.log("[SBP] fetchMemberships: got %d rows; isSuper=%s; current selectedBusinessId=%s", rows.length, isSuper, selectedBusinessId);

    if (isSuper) {
      // Super admin → synthesize ALL businesses as selectable
      const { data: allBiz, error: allBizErr } = await supabase
        .from("business")
        .select("id,name")
        .order("name", { ascending: true });

      if (allBizErr) {
        console.error("[SBP] fetchMemberships: allBiz error:", allBizErr);
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
      console.log("[SBP] fetchMemberships: synthesized %d businesses for super_admin", synthesized.length);

      // ⛔ DO NOT auto-clear for super_admin.
      // Only clear if a saved selection is INVALID.
      if (
        selectedBusinessId &&
        !synthesized.some((m) => m.business_id === selectedBusinessId)
      ) {
        console.log("[SBP] fetchMemberships: saved selection %s not in list → clearing", selectedBusinessId);
        _setSelectedBusinessId(null);
        if (storageKey) window.localStorage.removeItem(storageKey);
      }

      setMembershipsLoading(false);
      console.log("[SBP] fetchMemberships: END (super_admin) selectedBusinessId=%s", selectedBusinessId);
      return;
    }

    // Normal users → use their memberships
    setMemberships(rows);

    if (rows.length === 1 && !selectedBusinessId) {
      console.log("[SBP] fetchMemberships: exactly one membership → auto-select %s", rows[0].business_id);
      _setSelectedBusinessId(rows[0].business_id);
      if (storageKey) window.localStorage.setItem(storageKey, rows[0].business_id);
    }

    if (selectedBusinessId && !rows.some((m) => m.business_id === selectedBusinessId)) {
      console.log("[SBP] fetchMemberships: saved selection %s invalid for user → clearing", selectedBusinessId);
      _setSelectedBusinessId(null);
      if (storageKey) window.localStorage.removeItem(storageKey);
    }

    setMembershipsLoading(false);
    console.log("[SBP] fetchMemberships: END (normal) selectedBusinessId=%s", selectedBusinessId);
  };

  // Fetch memberships when auth state changes
  useEffect(() => {
    if (authLoading) return;
    console.log("[SBP] effect: auth ready → fetchMemberships()");
    fetchMemberships();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const setSelectedBusinessId = (id: string | null) => {
    console.log("[SBP] setSelectedBusinessId: %s (prev=%s)", id, selectedBusinessId);
    _setSelectedBusinessId(id);
    if (!storageKey) {
      console.log("[SBP] setSelectedBusinessId: no storageKey, skipping localStorage write");
      return;
    }
    if (id) {
      window.localStorage.setItem(storageKey, id);
      console.log("[SBP] setSelectedBusinessId: wrote to localStorage key=%s value=%s", storageKey, id);
    } else {
      window.localStorage.removeItem(storageKey);
      console.log("[SBP] setSelectedBusinessId: removed localStorage key=%s", storageKey);
    }
  };

  const effectiveBusinessId = useMemo(() => {
    const v = selectedBusinessId ?? null;
    console.log("[SBP] effectiveBusinessId memo → %s", v);
    return v;
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
  if (!ctx) throw new Error("useSelectedBusiness must be used within a SelectedBusinessProvider");
  return ctx;
};