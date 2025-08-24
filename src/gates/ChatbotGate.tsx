import { ReactNode } from "react";
import { useFeatures } from "@/features/FeaturesProvider";
import { FEATURE } from "@/features/featureSlugs";

type Props = {
  children: ReactNode;
  fallback?: ReactNode; // optional: what to show if disabled (default = null)
};

export function ChatbotGate({ children, fallback = null }: Props) {
  const { ready, has } = useFeatures();

  if (!ready) return null;                  // still loading
  return has(FEATURE.CHATBOT) ? <>{children}</> : <>{fallback}</>;
}