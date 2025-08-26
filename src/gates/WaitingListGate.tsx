// src/gates/WaitingListGate.tsx
import { ReactNode } from "react";
import { useFeatures } from "../features/FeaturesProvider";
import { FEATURE } from "../features/featureSlugs";

type Props = {
  children: ReactNode;
  fallback?: ReactNode; // optional UI when feature disabled
};

export function WaitingListGate({ children, fallback = null }: Props) {
  const { ready, has } = useFeatures();

  if (!ready) return null; // wait until features are loaded
  return has(FEATURE.WAITINGLIST) ? <>{children}</> : <>{fallback}</>;
}

export default WaitingListGate;