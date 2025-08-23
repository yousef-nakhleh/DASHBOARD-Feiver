// /src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

// Cache on globalThis so Vite HMR doesn't create duplicates.
type G = typeof globalThis & { __sb?: SupabaseClient };

export const supabase: SupabaseClient | null =
  (globalThis as G).__sb ??
  ((globalThis as G).__sb =
    url && anon
      ? createClient(url, anon, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            storageKey: "sb-auth", // one consistent storage key
          },
        })
      : null);