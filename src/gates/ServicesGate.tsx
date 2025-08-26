// src/gates/ServicesGate.tsx
import { ReactNode } from "react";
import { useFeatures } from "../features/FeaturesProvider";
import { FEATURE } from "../features/featureSlugs";

type Props = {
  children: ReactNode;
  fallback?: ReactNode; // optional UI when feature is disabled
};

export function ServicesGate({ children, fallback = null }: Props) {
  const { ready, has } = useFeatures();

  if (!ready) return null; // wait for features to load
  return has(FEATURE.SERVICES) ? <>{children}</> : <>{fallback}</>;
}

export default ServicesGate;