// src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Detect if running inside Bolt/iframe preview
const IN_IFRAME = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

type G = typeof globalThis & { __sb?: SupabaseClient };
const g = globalThis as G;

if (!g.__sb) {
  g.__sb = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Use separate storage key for preview to avoid refresh token clashes
      storageKey: IN_IFRAME ? "sb-auth-preview" : "sb-auth-dashboard",
      storage: window.localStorage, // or sessionStorage if you want preview-isolated
    },
  });
  console.log("[supabase] CREATED client (iframe:", IN_IFRAME, ")");
} else {
  console.log("[supabase] REUSED client");
}

export const supabase = g.__sb!;