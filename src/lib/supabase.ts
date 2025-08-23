// /src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Detect if running inside an iframe (Bolt preview)
const IN_IFRAME = (() => { try { return window.self !== window.top; } catch { return true; } })();

// Isolate auth storage in preview to avoid collisions with the host page
const auth = IN_IFRAME
  ? { persistSession: true, autoRefreshToken: true, storageKey: "sb-auth-dashboard-preview", storage: window.sessionStorage }
  : { persistSession: true, autoRefreshToken: true, storageKey: "sb-auth-dashboard" };

type G = typeof globalThis & { __sb?: SupabaseClient; __sb_id?: string };
const g = globalThis as G;

if (!g.__sb) {
  g.__sb = createClient(url, anon, { auth });
  g.__sb_id = Math.random().toString(36).slice(2, 8);
  console.log(`[supabase] CREATED client id=${g.__sb_id} iframe=${IN_IFRAME}`);
} else {
  console.log(`[supabase] REUSED  client id=${g.__sb_id} iframe=${IN_IFRAME}`);
}

export const supabase = g.__sb!;