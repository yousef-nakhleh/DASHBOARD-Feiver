import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Detect if we're running inside an iframe (Bolt preview)
const IN_IFRAME = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();

// Auth options: isolate storage in preview to avoid clashes with host page
const authPreview = {
  persistSession: true,
  autoRefreshToken: true,       // ok with sessionStorage; no cross-tab races
  storageKey: "sb-auth-dashboard-preview",
  storage: window.sessionStorage, // per iframe/tab, no collision with host
};

const authProd = {
  persistSession: true,
  autoRefreshToken: true,
  storageKey: "sb-auth-dashboard", // stable app namespace
  // (uses default localStorage)
};

// HMR-safe singleton
type G = typeof globalThis & { __sb?: SupabaseClient };
const g = globalThis as G;

if (!g.__sb) {
  g.__sb = createClient(url, anon, {
    auth: IN_IFRAME ? authPreview : authProd,
  });
  console.log(`[supabase] CREATED client (iframe=${IN_IFRAME})`);
} else {
  console.log("[supabase] REUSED client");
}

export const supabase = g.__sb!;