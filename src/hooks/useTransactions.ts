// src/hooks/useTransactions.ts
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../components/auth/AuthContext";

export type TransactionAny = Record<string, any>;

export function useTransactions() {
  const { profile } = useAuth();
  const businessId = profile?.business_id ?? null;

  const [transactions, setTransactions] = useState<TransactionAny[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("transactions")
        .select("*") // fetch EVERYTHING; we’ll pick fields in the components
        .eq("business_id", businessId)
        .order("completed_at", { ascending: false });

      if (err) throw err;
      setTransactions(data || []);
    } catch (e: any) {
      setError(e.message || "Errore nel caricamento delle transazioni");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;

    // initial load
    fetchAll();

    // realtime subscription
    const channel = supabase
      .channel(`transactions-realtime-${businessId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `business_id=eq.${businessId}` },
        () => {
          // simple strategy: refetch on any change
          fetchAll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, fetchAll]);

  return {
    transactions,
    loading,
    error,
    refresh: fetchAll,
  };
}

export default useTransactions;