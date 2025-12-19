import { createClient } from "@supabase/supabase-js";

// ✅ Usa SEMPRE variabili d'ambiente su Vercel:
// - VITE_SUPABASE_URL
// - VITE_SUPABASE_ANON_KEY
//
// Nota: l'anon key non è “segreta”, ma è buona pratica non hardcodarla nel repo.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    "[Supabase] Variabili mancanti. Imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (Vercel/Local)."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
