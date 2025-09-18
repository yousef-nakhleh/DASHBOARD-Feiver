// src/hooks/useBusinessTimezone.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSelectedBusiness } from "../components/auth/SelectedBusinessProvider";

/**
 * Use the business timezone for the currently selected business.
 * Falls back to "Europe/Rome" until loaded (or if missing).
 */
export function useBusinessTimezone(defaultTz: string = "Europe/Rome") {
  const { effectiveBusinessId } = useSelectedBusiness();
  const [timezone, setTimezone] = useState<string>(defaultTz);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      if (!effectiveBusinessId) {
        // No business selected yet — keep default and stop loading
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("business")
        .select("timezone")
        .eq("id", effectiveBusinessId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Failed to load business timezone:", error.message);
        setError(error.message);
        setTimezone(defaultTz); // keep fallback
      } else {
        setTimezone((data?.timezone as string) || defaultTz);
      }
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [effectiveBusinessId, defaultTz]);

  return { timezone, loading, error };
}

export default useBusinessTimezone;