// /src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Stable, app-specific storage key (unique namespace for your app)
const APP_KEY = "sb-auth-dashboard"; // change if you have multiple apps on same host

type G = typeof globalThis & { __sb?: SupabaseClient };
const g = globalThis as G;

if (!g.__sb) {
  g.__sb = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // 👇 isolate your client’s token storage
      storageKey: APP_KEY,
      // Optional: in preview/dev, switch to sessionStorage to avoid host collisions
      // storage: window.sessionStorage,
    },
  });
  console.log("[supabase] CREATED client");
} else {
  console.log("[supabase] REUSED client");
}

export const supabase = g.__sb!;