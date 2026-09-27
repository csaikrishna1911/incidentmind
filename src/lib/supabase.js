import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env variable: NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseKey) {
  throw new Error("Missing env variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

/**
 * Supabase client for use in Client Components (browser-side).
 *
 * This uses the publishable (anon) key — safe to expose in the browser.
 * Row Level Security (RLS) on Supabase protects the data.
 *
 * Usage:
 *   import { supabase } from "@/lib/supabase";
 *   const { data } = await supabase.from("incidents").select("*");
 */
export const supabase = createClient(supabaseUrl, supabaseKey);
