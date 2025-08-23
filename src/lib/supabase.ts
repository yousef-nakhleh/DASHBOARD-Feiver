// /src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

// derive a per-project storage key so different projects don't clash
let storageKey = "sb-auth";
try {
  const host = new URL(url ?? "").hostname;         // e.g. ijysjdbdwxhjwxuthzh.supabase.co
  const project = host.split(".")[0] || "sb";       // e.g. ijysjdbdwxhjwxuthzh
  storageKey = `sb-${project}-auth`;
} catch {}

type G = typeof globalThis & { __sb?: SupabaseClient; __sb_id?: string };

const g = globalThis as G;

if (!g.__sb) {
  // first time (or after full refresh)
  g.__sb = createClient(url!, anon!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey, // IMPORTANT: one consistent storage bucket
    },
  });
  g.__sb_id = Math.random().toString(36).slice(2, 8); // debug id
  console.log(`[supabase] CREATED client id=${g.__sb_id} storageKey=${storageKey}`);
} else {
  console.log(`[supabase] REUSED  client id=${g.__sb_id} storageKey=${storageKey}`);
}

export const supabase = g.__sb!;