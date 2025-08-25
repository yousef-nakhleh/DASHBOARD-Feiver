// src/gates/AgendaGate.tsx
import { ReactNode } from "react";
import { useFeatures } from "../features/FeaturesProvider";
import { FEATURE } from "../features/featureSlugs";

export function AgendaGate({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { ready, has } = useFeatures();
  if (!ready) return null;
  return has(FEATURE.AGENDA) ? <>{children}</> : <>{fallback}</>;
}
export default AgendaGate;