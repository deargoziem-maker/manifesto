const { supabaseAdmin } = require("./_lib/supabaseAdmin");
const { sendJson } = require("./_lib/util");

/**
 * Public completion counter. Hidden by default (COUNTER_ENABLED unset/false)
 * so the frontend can ship the UI now and switch it on later purely via a
 * Vercel env var, no redeploy of index.html needed. Counts completed
 * experiences only, never page visits.
 */
module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "method not allowed" });
  }

  const enabled = process.env.COUNTER_ENABLED === "true";
  if (!enabled) {
    return sendJson(res, 200, { enabled: false });
  }

  try {
    const supabase = supabaseAdmin();
    const [compass, president] = await Promise.all([
      supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("experience_type", "compass")
        .eq("completion_status", "completed"),
      supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("experience_type", "president")
        .eq("completion_status", "completed"),
    ]);
    if (compass.error) throw compass.error;
    if (president.error) throw president.error;

    const compassCompleted = compass.count || 0;
    const presidentCompleted = president.count || 0;

    res.setHeader("cache-control", "public, s-maxage=60, stale-while-revalidate=300");
    return sendJson(res, 200, {
      enabled: true,
      compass_completed: compassCompleted,
      president_completed: presidentCompleted,
      total_completed_experiences: compassCompleted + presidentCompleted,
    });
  } catch (err) {
    console.error("counter error", err);
    return sendJson(res, 500, { error: "internal error" });
  }
};
