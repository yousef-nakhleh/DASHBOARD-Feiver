import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl); // ✅ Verifica se è corretto
console.log('Supabase Anon Key:', supabaseAnonKey); // ✅ Verifica se esiste

export const supabase = createClient(supabaseUrl, supabaseAnonKey);