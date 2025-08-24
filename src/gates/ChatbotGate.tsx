// src/gates/ChatbotGate.tsx
import { ReactNode } from "react";
import { useFeatures } from "../features/FeaturesProvider";
import { FEATURE } from "../features/featureSlugs";

type Props = {
  children: ReactNode;
  fallback?: ReactNode; // optional UI when feature disabled
};

export function ChatbotGate({ children, fallback = null }: Props) {
  const { ready, has } = useFeatures();

  if (!ready) return null; // wait for features to load
  return has(FEATURE.CHATBOT) ? <>{children}</> : <>{fallback}</>;
}

export default ChatbotGate;