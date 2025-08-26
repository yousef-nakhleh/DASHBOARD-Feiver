// src/gates/ContactsGate.tsx
import { ReactNode } from "react";
import { useFeatures } from "../features/FeaturesProvider";
import { FEATURE } from "../features/featureSlugs";

type Props = {
  children: ReactNode;
  fallback?: ReactNode; // optional UI when feature is disabled
};

export function ContactsGate({ children, fallback = null }: Props) {
  const { ready, has } = useFeatures();

  if (!ready) return null; // wait for features to load
  return has(FEATURE.CONTACTS) ? <>{children}</> : <>{fallback}</>;
}

export default ContactsGate;