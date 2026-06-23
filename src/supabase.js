import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // Surfaced clearly in the console if the .env values are missing.
  console.warn("[Tandem] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.");
}

export const supabase = createClient(url || "http://localhost", anon || "anon", {
  auth: { persistSession: false },
});
