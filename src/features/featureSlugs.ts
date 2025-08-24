// src/features/featureSlugs.ts

// Canonical list of feature slugs used in both DB and React code
export const FEATURE = {
  CHATBOT: "chatbot.component",
} as const;

// Type helper → only allow valid feature slugs
export type FeatureSlug = (typeof FEATURE)[keyof typeof FEATURE];