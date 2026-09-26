const { supabaseAdmin } = require("../_lib/supabaseAdmin");
const { sendJson } = require("../_lib/util");
const { isAuthorizedAdmin } = require("../_lib/requireAdmin");

// Early-stage volume — fetching raw rows and aggregating in JS is simpler
// and plenty fast at this scale. Revisit with real GROUP BY / pagination
// once any table is pushing five figures.
const ROW_CAP = 20000;

function counter() {
  const m = {};
  return {
    add(k) {
      k = k === null || k === undefined ? "(none)" : String(k);
      m[k] = (m[k] || 0) + 1;
    },
    get: () => m,
  };
}

function mean(nums) {
  const xs = nums.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "method not allowed" });
  }
  if (!isAuthorizedAdmin(req)) {
    return sendJson(res, 401, { error: "unauthorized" });
  }

  try {
    const supabase = supabaseAdmin();

    const [participantsQ, sessionsQ, compassQ, presidentQ, eventsQ] = await Promise.all([
      supabase
        .from("participants")
        .select("id, first_seen_at, last_seen_at, device_type, country, acquisition_source, acquisition_medium")
        .order("first_seen_at", { ascending: false })
        .limit(ROW_CAP),
      supabase
        .from("sessions")
        .select("id, experience_type, completion_status, started_at, completed_at")
        .order("started_at", { ascending: false })
        .limit(ROW_CAP),
      supabase
        .from("compass_results")
        .select("archetype, archetype_share, tied_archetypes, final_dimension_scores, completed_at")
        .order("completed_at", { ascending: false })
        .limit(ROW_CAP),
      supabase
        .from("president_results")
        .select(
          "final_outcome, outcome_reason, ending_bloc, decisions_count, years_served, contradictions, fidelity_tested, fidelity_kept, completed_at"
        )
        .order("completed_at", { ascending: false })
        .limit(ROW_CAP),
      supabase
        .from("event_log")
        .select("event_name, properties, occurred_at")
        .order("occurred_at", { ascending: false })
        .limit(500),
    ]);

    for (const [name, q] of [
      ["participants", participantsQ],
      ["sessions", sessionsQ],
      ["compass_results", compassQ],
      ["president_results", presidentQ],
      ["event_log", eventsQ],
    ]) {
      if (q.error) throw new Error(`${name}: ${q.error.message}`);
    }

    const participants = participantsQ.data || [];
    const sessions = sessionsQ.data || [];
    const compass = compassQ.data || [];
    const president = presidentQ.data || [];
    const events = eventsQ.data || [];

    // participants
    const byDevice = counter();
    const byCountry = counter();
    const bySource = counter();
    participants.forEach((p) => {
      byDevice.add(p.device_type);
      byCountry.add(p.country);
      bySource.add(p.acquisition_source);
    });

    // sessions, split by experience type then completion status
    const sessionBreakdown = { compass: counter(), president: counter() };
    sessions.forEach((s) => {
      const bucket = sessionBreakdown[s.experience_type];
      if (bucket) bucket.add(s.completion_status);
    });

    // compass results
    const archetypes = counter();
    let tiedCount = 0;
    compass.forEach((c) => {
      archetypes.add(c.archetype);
      if (Array.isArray(c.tied_archetypes) && c.tied_archetypes.length > 1) tiedCount++;
    });

    // president results
    const outcomes = counter();
    president.forEach((p) => outcomes.add(p.final_outcome));
    const avgDecisions = mean(president.map((p) => p.decisions_count));
    const avgYears = mean(president.map((p) => p.years_served));
    const avgContradictions = mean(president.map((p) => p.contradictions));
    const fidelityRates = president
      .filter((p) => p.fidelity_tested)
      .map((p) => p.fidelity_kept / p.fidelity_tested);
    const avgFidelityRate = mean(fidelityRates);

    // events — funnel counts + recent feed
    const eventCounts = counter();
    events.forEach((e) => eventCounts.add(e.event_name));

    // simple day-bucketed signups for the last 30 days
    const dayKey = (iso) => (iso || "").slice(0, 10);
    const signupsByDay = counter();
    participants.forEach((p) => signupsByDay.add(dayKey(p.first_seen_at)));

    sendJson(res, 200, {
      generated_at: new Date().toISOString(),
      participants: {
        total: participants.length,
        earliest: participants.length ? participants[participants.length - 1].first_seen_at : null,
        latest: participants.length ? participants[0].first_seen_at : null,
        by_device: byDevice.get(),
        by_country: byCountry.get(),
        by_acquisition_source: bySource.get(),
        signups_by_day: signupsByDay.get(),
      },
      sessions: {
        total: sessions.length,
        compass: sessionBreakdown.compass.get(),
        president: sessionBreakdown.president.get(),
      },
      compass: {
        completed_total: compass.length,
        archetypes: archetypes.get(),
        multi_way_ties: tiedCount,
      },
      president: {
        completed_total: president.length,
        outcomes: outcomes.get(),
        avg_decisions: avgDecisions,
        avg_years_served: avgYears,
        avg_contradictions: avgContradictions,
        avg_fidelity_rate: avgFidelityRate,
      },
      events: {
        total: events.length,
        by_name: eventCounts.get(),
        recent: events.slice(0, 50),
      },
    });
  } catch (err) {
    console.error("admin/stats error", err);
    sendJson(res, 500, { error: err.message || "internal error" });
  }
};
