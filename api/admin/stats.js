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
      k = k === null || k === undefined || k === "" ? "Unknown" : String(k);
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

    // Raw counts by event_name over the last 500 rows. This is an inventory,
    // not a cohort funnel: a session's start can fall outside this window
    // while its completion is still inside it. The session-linked
    // started/completed numbers above (compass/president) are the real
    // funnel; treat this section as "what's happening lately," not a rate.
    const eventCounts = counter();
    events.forEach((e) => eventCounts.add(e.event_name));

    // "result_shared" collapses three different actions (copy / card / open)
    // into one event_name — split by the method recorded in properties so
    // "copied the text" and "downloaded the card" aren't conflated. Neither
    // is evidence anyone actually sent it anywhere.
    const shareMethods = counter();
    events.forEach((e) => {
      if (e.event_name === "result_shared") shareMethods.add(e.properties && e.properties.method);
    });

    // Day-bucketed signups, returned as an array sorted by date (most recent
    // first) rather than an object — an object has no defined key order, so
    // rendering it required either sorting client-side (easy to get wrong,
    // e.g. by count instead of by date) or trusting insertion order.
    const dayKey = (iso) => (iso || "").slice(0, 10);
    const dayCounts = {};
    participants.forEach((p) => {
      const d = dayKey(p.first_seen_at);
      dayCounts[d] = (dayCounts[d] || 0) + 1;
    });
    const signupsByDay = Object.keys(dayCounts)
      .sort()
      .reverse()
      .map((d) => [d, dayCounts[d]]);

    sendJson(res, 200, {
      generated_at: new Date().toISOString(),
      participants: {
        total: participants.length,
        note: "A participant is one anonymous browser identifier (a UUID stored in localStorage), not a verified person — the same person on two devices counts twice, and a cleared browser creates a new one. A tracking regression from 2026-09-19 to 2026-09-26 likely dropped some session/result rows; participant and event rows were unaffected.",
        earliest: participants.length ? participants[participants.length - 1].first_seen_at : null,
        latest: participants.length ? participants[0].first_seen_at : null,
        by_device: byDevice.get(),
        by_country: byCountry.get(),
        by_acquisition_source: bySource.get(),
        signups_by_day: signupsByDay,
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
        note: "This is the current scoring model's nearest-tradition classification of these " + compass.length + " completions — not a claim about the population, and not stable across scoring-model versions.",
      },
      president: {
        completed_total: president.length,
        outcomes: outcomes.get(),
        avg_decisions: avgDecisions,
        avg_years_served: avgYears,
        avg_contradictions: avgContradictions,
        avg_fidelity_rate: avgFidelityRate,
        note: "Fidelity and contradiction counts are experimental model outputs from the game's own comparison logic, not a validated measure of consistency.",
      },
      events: {
        total: events.length,
        window_note: "Counts over the most recent 500 event rows — an inventory, not a bounded-period funnel.",
        by_name: eventCounts.get(),
        share_methods: shareMethods.get(),
        recent: events.slice(0, 50),
      },
    });
  } catch (err) {
    console.error("admin/stats error", err);
    sendJson(res, 500, { error: err.message || "internal error" });
  }
};
