const { createClient } = require("@supabase/supabase-js");

let cached = null;

/**
 * Server-only Supabase client using the service_role key, which bypasses RLS.
 * Every table in the schema has RLS enabled with zero policies, so this is the
 * only credential in the whole system that can read or write participant data.
 * It must never be sent to, or read by, the browser.
 */
function supabaseAdmin() {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

module.exports = { supabaseAdmin };
