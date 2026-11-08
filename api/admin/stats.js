const { supabaseAdmin } = require("../_lib/supabaseAdmin");
const { sendJson } = require("../_lib/util");
const { isAuthorizedAdmin } = require("../_lib/requireAdmin");
const { buildReport } = require("../_lib/report");

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


// Supabase's API returns at most 1000 rows per request however high .limit() is set, so
// every table is read a page at a time (pages run side by side). `truncated` says the cap
// was hit and the numbers below it are a sample, not everything.
const PAGE = 1000;
async function fetchAll(make, cap) {
  cap = cap || ROW_CAP;
  const first = await make().range(0, PAGE - 1);
  if (first.error) return { error: first.error, data: [] };
  let rows = first.data || [];
  if (rows.length < PAGE) return { data: rows, truncated: false };
  const starts = [];
  for (let from = PAGE; from < cap; from += PAGE) starts.push(from);
  let truncated = true;
  for (let i = 0; i < starts.length; i += 8) {
    const batch = await Promise.all(starts.slice(i, i + 8).map((f) => make().range(f, f + PAGE - 1)));
    for (const r of batch) {
      if (r.error) return { error: r.error, data: rows };
      rows = rows.concat(r.data || []);
      if ((r.data || []).length < PAGE) truncated = false;
    }
    if (!truncated) break;
  }
  return { data: rows, truncated };
}

// Sessions with their progress marker (migration 0003). If that migration has not
// been run yet, fall back to the original columns so the dashboard keeps working.
async function fetchSessions(supabase, sinceIso) {
  const base = "id, participant_id, experience_type, completion_status, started_at, completed_at";
  const make = (cols) => () => {
    let q = supabase.from("sessions").select(cols);
    if (sinceIso) q = q.gte("started_at", sinceIso);
    return q.order("started_at", { ascending: false }).order("id");
  };
  const r = await fetchAll(make(base + ", progress, last_activity_at"));
  if (!r.error) return r;
  return fetchAll(make(base));
}

// Every event the report reads, over the window. Rows are fetched by name so the one-off
// "landing" and "viewed" volume is bounded by what the report actually uses.
const REPORT_EVENTS = [
  "quiz_question_viewed", "quiz_answer_submitted", "game_card_viewed", "game_decision_made",
  "game_consequence_viewed", "game_history_opened", "game_ending_viewed", "result_shared", "share_completed",
];
const EVENT_CAP = 60000;
async function fetchReportEvents(supabase, sinceIso) {
  const make = () => {
    let q = supabase
      .from("event_log")
      .select("event_name, session_id, participant_id, properties, occurred_at")
      .in("event_name", REPORT_EVENTS);
    if (sinceIso) q = q.gte("occurred_at", sinceIso);
    return q.order("id", { ascending: true });
  };
  return fetchAll(make, EVENT_CAP);
}

// Exact counts for the analytics-plan events over a recent window, one cheap
// head-only count per name (not limited by the 500-row recent-events sample).
const PLAN_EVENTS = [
  "landing_viewed", "return_visit", "experience_selected", "compass_started", "president_started",
  "experience_restarted", "experience_abandoned", "game_decision_made", "game_ending_viewed",
  "quiz_answer_submitted", "compass_completed", "president_completed", "result_viewed",
  "result_shared", "share_clicked", "share_completed", "invite_link_opened",
  "quiz_question_viewed", "game_card_viewed", "game_consequence_viewed", "game_history_opened",
];
async function countEvents(supabase, sinceIso) {
  const out = {};
  await Promise.all(
    PLAN_EVENTS.map(async (name) => {
      const { count, error } = await supabase
        .from("event_log")
        .select("id", { count: "exact", head: true })
        .eq("event_name", name)
        .gte("occurred_at", sinceIso);
      out[name] = error ? null : count || 0;
    })
  );
  return out;
}

const ABANDON_AFTER_MS = 60 * 60 * 1000;

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "method not allowed" });
  }
  if (!isAuthorizedAdmin(req)) {
    return sendJson(res, 401, { error: "unauthorized" });
  }

  try {
    const supabase = supabaseAdmin();

    // ?days=30 (default; 0 = everything) and ?cohort=all|paid|<channel name>
    const url = new URL(req.url, "http://x");
    const daysRaw = Number(url.searchParams.get("days"));
    const days = Number.isFinite(daysRaw) && url.searchParams.has("days") ? Math.max(0, Math.min(3650, Math.floor(daysRaw))) : 30;
    const cohort = (url.searchParams.get("cohort") || "all").slice(0, 40);
    const sinceIso = days ? new Date(Date.now() - days * 24 * 3600 * 1000).toISOString() : null;

    const [participantsQ, sessionsQ, compassQ, presidentQ, eventsQ, reportEventsQ] = await Promise.all([
      fetchAll(() =>
        supabase
          .from("participants")
          .select("id, first_seen_at, last_seen_at, device_type, country, acquisition_source, acquisition_medium, acquisition_campaign, referrer")
          .order("first_seen_at", { ascending: false })
          .order("id")
      ),
      fetchSessions(supabase, null),
      fetchAll(() =>
        supabase
          .from("compass_results")
          .select("session_id, archetype, archetype_share, tied_archetypes, final_dimension_scores, completed_at")
          .order("completed_at", { ascending: false })
          .order("id")
      ),
      fetchAll(() =>
        supabase
          .from("president_results")
          .select(
            "session_id, final_outcome, outcome_reason, ending_bloc, decisions_count, years_served, contradictions, fidelity_tested, fidelity_kept, completed_at"
          )
          .order("completed_at", { ascending: false })
          .order("id")
      ),
      supabase
        .from("event_log")
        .select("event_name, properties, occurred_at")
        .order("occurred_at", { ascending: false })
        .limit(500),
      fetchReportEvents(supabase, sinceIso),
    ]);

    for (const [name, q] of [
      ["participants", participantsQ],
      ["sessions", sessionsQ],
      ["compass_results", compassQ],
      ["president_results", presidentQ],
      ["event_log", eventsQ],
      ["event_log (report)", reportEventsQ],
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

    // Funnel per experience. A session still "in_progress" with no activity for an
    // hour is counted as abandoned: phones rarely tell the page they are closing.
    const nowMs = Date.now();
    function funnel(type) {
      const rows = sessions.filter((x) => x.experience_type === type);
      let completed = 0, abandoned = 0, active = 0;
      const stopped = counter();
      rows.forEach((x) => {
        if (x.completion_status === "completed") { completed++; return; }
        const lastMs = Date.parse(x.last_activity_at || x.started_at);
        if (nowMs - lastMs < ABANDON_AFTER_MS) { active++; return; }
        abandoned++;
        if (x.progress === undefined) return; // migration 0003 not run yet
        stopped.add(x.progress == null ? "before the first choice" : x.progress);
      });
      const order = (a, b) =>
        a[0] === "before the first choice" ? -1 : b[0] === "before the first choice" ? 1 : Number(a[0]) - Number(b[0]);
      return {
        started: rows.length,
        completed,
        abandoned,
        in_progress: active,
        completion_rate: rows.length ? completed / rows.length : null,
        abandoned_stopped_at: Object.entries(stopped.get()).sort(order),
        progress_tracked: rows.some((x) => x.progress !== undefined),
      };
    }
    const funnels = { president: funnel("president"), compass: funnel("compass") };

    // Returning visitors: last seen more than 30 minutes after first seen.
    const returning = participants.filter(
      (p) => Date.parse(p.last_seen_at) - Date.parse(p.first_seen_at) > 30 * 60 * 1000
    ).length;

    const since = new Date(nowMs - 30 * 24 * 3600 * 1000).toISOString();
    const eventCounts30 = await countEvents(supabase, since);

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

    // Report window: sessions that started inside it (the funnel tables above stay all-time).
    const windowSessions = sinceIso ? sessions.filter((x) => x.started_at >= sinceIso) : sessions;
    const report = buildReport(
      { participants, sessions: windowSessions, events: reportEventsQ.data || [], compass, president },
      { cohort }
    );
    report.window = { days, since: sinceIso };
    report.truncated = {
      participants: !!participantsQ.truncated,
      sessions: !!sessionsQ.truncated,
      events: !!reportEventsQ.truncated,
    };

    sendJson(res, 200, {
      generated_at: new Date().toISOString(),
      report,
      participants: {
        total: participants.length,
        note: "A participant is one anonymous browser identifier (a UUID stored in localStorage), not a verified person — the same person on two devices counts twice, and a cleared browser creates a new one. A tracking regression from 2026-09-19 to 2026-09-26 likely dropped some session/result rows; participant and event rows were unaffected.",
        earliest: participants.length ? participants[participants.length - 1].first_seen_at : null,
        latest: participants.length ? participants[0].first_seen_at : null,
        by_device: byDevice.get(),
        by_country: byCountry.get(),
        by_acquisition_source: bySource.get(),
        signups_by_day: signupsByDay,
        returning,
      },
      funnels,
      events_30d: eventCounts30,
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
