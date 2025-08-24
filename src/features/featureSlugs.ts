// Canonical list of feature slugs used in code + DB
export const FEATURE = {
  VOICEFLOW: "voiceflow.component",
} as const;

export type FeatureSlug = (typeof FEATURE)[keyof typeof FEATURE];