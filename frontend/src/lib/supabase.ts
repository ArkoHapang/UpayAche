import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * UpayAche Supabase Browser Client.
 *
 * CRITICAL SECURITY INVARIANT:
 * This client ONLY uses public client-safe keys (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).
 * Administrative master service keys MUST NEVER be imported, bundled, or exposed to the browser.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Helper to determine if actual Supabase credentials are configured
export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("your-project") &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")
  );
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "upayache_supabase_auth_session",
  },
});
