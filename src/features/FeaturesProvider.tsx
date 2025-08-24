// src/features/FeaturesProvider.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase"; // adjust path if different
import type { FeatureSlug } from "./featureSlugs";

// Row type returned from Supabase
type FeatureRow = { feature_slug: string; enabled: boolean };

type FeaturesContextType = {
  ready: boolean;
  has: (slug: FeatureSlug | string) => boolean;
  refetch: () => Promise<void>;
};

const FeaturesContext = createContext<FeaturesContextType>({
  ready: false,
  has: () => false,
  refetch: async () => {},
});

export function FeaturesProvider({
  businessId,
  children,
}: {
  businessId: string;
  children: React.ReactNode;
}) {
  const [enabledSlugs, setEnabledSlugs] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const fetchFeatures = async () => {
    setReady(false);
    const { data, error } = await supabase
      .from("business_features")
      .select("feature_slug, enabled")
      .eq("business_id", businessId);

    if (error) {
      console.error("[FeaturesProvider] load error:", error);
      setEnabledSlugs(new Set());
      setReady(true);
      return;
    }

    const active = (data as FeatureRow[] | null)
      ?.filter((r) => r.enabled)
      .map((r) => r.feature_slug) ?? [];

    setEnabledSlugs(new Set(active));
    setReady(true);
  };

  useEffect(() => {
    if (!businessId) return;
    fetchFeatures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const ctx: FeaturesContextType = useMemo(
    () => ({
      ready,
      has: (slug) => enabledSlugs.has(String(slug)),
      refetch: fetchFeatures,
    }),
    [ready, enabledSlugs]
  );

  return <FeaturesContext.Provider value={ctx}>{children}</FeaturesContext.Provider>;
}

export const useFeatures = () => useContext(FeaturesContext);