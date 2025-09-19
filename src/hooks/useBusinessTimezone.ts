// src/hooks/useBusinessTimezone.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSelectedBusiness } from "../components/auth/SelectedBusinessProvider";

/**
 * Returns the business timezone string for the selected business.
 * Always resolves to a valid IANA timezone string (e.g. "Europe/Rome").
 */
export function useBusinessTimezone(defaultTz: string = "Europe/Rome"): string {
  const { effectiveBusinessId } = useSelectedBusiness();
  const [timezone, setTimezone] = useState<string>(defaultTz);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!effectiveBusinessId) {
        setTimezone(defaultTz);
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
        setTimezone(defaultTz);
      } else {
        setTimezone((data?.timezone as string) || defaultTz);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [effectiveBusinessId, defaultTz]);

  return timezone; // ✅ Always a string
}

export default useBusinessTimezone;