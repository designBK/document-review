import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseEnv,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/env";

/** Server-only client that bypasses RLS. Never import into Client Components. */
export function createAdminClient() {
  const { url } = getSupabaseEnv();
  return createClient(url, getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
