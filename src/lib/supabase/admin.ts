/**
 * Service-role Supabase client — bypasses RLS.
 * Use ONLY in server-side admin operations (creating users, etc.).
 * NEVER expose to the browser.
 */
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
