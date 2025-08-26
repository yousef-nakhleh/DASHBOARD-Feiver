// src/gates/AnalyticsGate.tsx
import { ReactNode } from "react";
import { useFeatures } from "../features/FeaturesProvider";
import { FEATURE } from "../features/featureSlugs";

type Props = {
  children: ReactNode;
  fallback?: ReactNode; // optional UI when feature is disabled
};

export function AnalyticsGate({ children, fallback = null }: Props) {
  const { ready, has } = useFeatures();

  if (!ready) return null; // wait until features are loaded
  return has(FEATURE.ANALYTICS) ? <>{children}</> : <>{fallback}</>;
}

export default AnalyticsGate;