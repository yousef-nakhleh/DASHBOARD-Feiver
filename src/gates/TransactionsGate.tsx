// src/gates/TransactionsGate.tsx
import { ReactNode } from "react";
import { useFeatures } from "../features/FeaturesProvider";
import { FEATURE } from "../features/featureSlugs";

type Props = {
  children: ReactNode;
  fallback?: ReactNode; // optional UI when feature is disabled
};

export function TransactionsGate({ children, fallback = null }: Props) {
  const { ready, has } = useFeatures();

  if (!ready) return null; // wait until features are loaded
  return has(FEATURE.TRANSACTIONS) ? <>{children}</> : <>{fallback}</>;
}

export default TransactionsGate;