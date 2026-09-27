import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers (API routes).
 *
 * We create a fresh client per request to avoid sharing state between
 * different users/requests on the server.
 *
 * Usage:
 *   import { createServerSupabaseClient } from "@/lib/supabase-server";
 *   const supabase = createServerSupabaseClient();
 *   const { data } = await supabase.from("incidents").select("*");
 */
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing env variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseKey) {
    throw new Error("Missing env variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  return createClient(supabaseUrl, supabaseKey);
}
