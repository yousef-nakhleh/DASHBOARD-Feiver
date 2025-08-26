// src/gates/AvailabilityGate.tsx
import { ReactNode } from "react";
import { useFeatures } from "../features/FeaturesProvider";
import { FEATURE } from "../features/featureSlugs";

type Props = {
  children: ReactNode;
  fallback?: ReactNode; // optional UI when feature is disabled
};

export function AvailabilityGate({ children, fallback = null }: Props) {
  const { ready, has } = useFeatures();

  if (!ready) return null; // wait for features to load
  return has(FEATURE.AVAILABILITY) ? <>{children}</> : <>{fallback}</>;
}

export default AvailabilityGate;