// src/features/featureSlugs.ts

// Canonical list of feature slugs used in both DB and React code
export const FEATURE = {
  CHATBOT:       "chatbot.component",
  AGENDA:        "agenda.component",
  TRANSACTIONS:  "transactions.component",
  AVAILABILITY:  "availability.component",   // (spelling normalized)
  CONTACTS:      "contacts.component",
  WAITINGLIST:   "waitinglist.component",
  SERVICES:      "services.component",
  PHONECALLER:   "phonecaller.component",
  ANALYTICS:     "analytics.component",
  OPENING_EXCEPTIONS: "openingexceptions.component",
  CLOSING_EXCEPTIONS: "closingexceptions.component",
  REPORTS:       "reports.component",
} as const;

// Type helper → only allow valid feature slugs
export type FeatureSlug = (typeof FEATURE)[keyof typeof FEATURE];