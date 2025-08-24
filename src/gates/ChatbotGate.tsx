// src/gates/ChatbotGate.tsx
import { ReactNode } from "react";
import { useFeatures } from "../features/FeaturesProvider";
import { FEATURE } from "../features/featureSlugs";

type Props = {
  children: ReactNode;
  fallback?: ReactNode; // optional UI to show when the feature is disabled
};

export function ChatbotGate({ children, fallback = null }: Props) {
  const { ready, has } = useFeatures();

  if (!ready) return null; // wait until feature flags are loaded
  return has(FEATURE.CHATBOT) ? <>{children}</> : <>{fallback}</>;
}

export default ChatbotGate;