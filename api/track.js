const { supabaseAdmin } = require("./_lib/supabaseAdmin");
const { isUuid, isPlausibleAnonId, geo, deviceTypeFromUA, sendJson } = require("./_lib/util");
const { classifySource } = require("./_lib/source");

const EXPERIENCE_TYPES = new Set(["compass", "president"]);
const COMPLETION_STATUSES = new Set(["in_progress", "completed", "abandoned"]);

/**
 * Finds the participant by anonymous_id, or creates one. Acquisition fields
 * (source/medium/campaign/referrer/device/country) are first-touch only: set
 * on the very first row we ever see for this anonymous_id, never overwritten
 * on later visits, so we keep the original acquisition channel.
 */
async function ensureParticipant(supabase, anonymousId, meta) {
  const { data: existing, error: selErr } = await supabase
    .from("participants")
    .select("id, first_seen_at, acquisition_source")
    .eq("anonymous_id", anonymousId)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    const patch = { last_seen_at: new Date().toISOString() };
    // The page sends participant_seen and its first event at the same moment, so the
    // event can create the row before the source arrives. Let the source fill that gap,
    // but only within the first couple of minutes: a person who first came before source
    // tracking existed, and returns through an ad, keeps their original (unknown) touch.
    const justCreated = Date.now() - Date.parse(existing.first_seen_at) < 2 * 60 * 1000;
    if (meta.acquisition_source && !existing.acquisition_source && justCreated) {
      patch.acquisition_source = meta.acquisition_source;
      patch.acquisition_medium = meta.acquisition_medium || null;
      patch.acquisition_campaign = meta.acquisition_campaign || null;
      patch.referrer = meta.referrer || null;
    }
    await supabase.from("participants").update(patch).eq("id", existing.id);
    return existing.id;
  }

  const { data: inserted, error: insErr } = await supabase
    .from("participants")
    .insert({
      anonymous_id: anonymousId,
      acquisition_source: meta.acquisition_source || null,
      acquisition_medium: meta.acquisition_medium || null,
      acquisition_campaign: meta.acquisition_campaign || null,
      referrer: meta.referrer || null,
      device_type: meta.device_type || null,
      country: meta.country || null,
    })
    .select("id")
    .single();

  if (insErr) {
    // Lost a race with a concurrent request for the same anonymous_id.
    if (insErr.code === "23505") {
      const { data: retry, error: retryErr } = await supabase
        .from("participants")
        .select("id")
        .eq("anonymous_id", anonymousId)
        .single();
      if (retryErr) throw retryErr;
      return retry.id;
    }
    throw insErr;
  }
  return inserted.id;
}

async function handleParticipantSeen(supabase, body, req) {
  // classifySource is null for a page that predates source tracking: those stay unknown.
  const src = classifySource(body) || {};
  const meta = {
    acquisition_source: src.source,
    acquisition_medium: src.medium,
    acquisition_campaign: src.campaign,
    referrer: src.referrer,
    device_type: body.device_type || deviceTypeFromUA(req.headers["user-agent"]),
    country: geo(req).country,
  };
  const participantId = await ensureParticipant(supabase, body.anonymous_id, meta);
  return { participant_id: participantId };
}

async function handleSessionStart(supabase, body, req) {
  if (!isUuid(body.session_id)) throw httpError(400, "session_id must be a uuid");
  if (!EXPERIENCE_TYPES.has(body.experience_type))
    throw httpError(400, "invalid experience_type");

  const participantId = await ensureParticipant(supabase, body.anonymous_id, {
    device_type: deviceTypeFromUA(req.headers["user-agent"]),
    country: geo(req).country,
  });

  const { error } = await supabase.from("sessions").upsert(
    {
      id: body.session_id,
      participant_id: participantId,
      experience_type: body.experience_type,
    },
    { onConflict: "id" }
  );
  if (error) throw error;
  return { ok: true };
}

async function handleSessionComplete(supabase, body) {
  if (!isUuid(body.session_id)) throw httpError(400, "session_id must be a uuid");
  const status = COMPLETION_STATUSES.has(body.completion_status)
    ? body.completion_status
    : "completed";
  const { error } = await supabase
    .from("sessions")
    .update({
      completion_status: status,
      completed_at: new Date().toISOString(),
    })
    .eq("id", body.session_id);
  if (error) throw error;
  return { ok: true };
}

async function handleCompassResult(supabase, body) {
  if (!isUuid(body.session_id)) throw httpError(400, "session_id must be a uuid");
  if (!body.archetype) throw httpError(400, "archetype is required");
  const participantId = await ensureParticipant(supabase, body.anonymous_id, {});

  const { error } = await supabase.from("compass_results").upsert(
    {
      participant_id: participantId,
      session_id: body.session_id,
      content_version: body.content_version ?? null,
      archetype: body.archetype,
      archetype_share: body.archetype_share ?? null,
      tied_archetypes: body.tied_archetypes ?? null,
      final_dimension_scores: body.final_dimension_scores ?? {},
    },
    { onConflict: "session_id" }
  );
  if (error) throw error;
  return { ok: true };
}

async function handlePresidentResult(supabase, body) {
  if (!isUuid(body.session_id)) throw httpError(400, "session_id must be a uuid");
  if (!body.final_outcome) throw httpError(400, "final_outcome is required");
  const participantId = await ensureParticipant(supabase, body.anonymous_id, {});

  const { error } = await supabase.from("president_results").upsert(
    {
      participant_id: participantId,
      session_id: body.session_id,
      content_version: body.content_version ?? null,
      final_outcome: body.final_outcome,
      outcome_reason: body.outcome_reason ?? null,
      ending_bloc: body.ending_bloc ?? null,
      decisions_count: body.decisions_count ?? null,
      years_served: body.years_served ?? null,
      contradictions: body.contradictions ?? null,
      fidelity_tested: body.fidelity_tested ?? null,
      fidelity_kept: body.fidelity_kept ?? null,
      governed_dimension_scores: body.governed_dimension_scores ?? {},
      final_value_scores: body.final_value_scores ?? {},
      final_bloc_scores: body.final_bloc_scores ?? {},
    },
    { onConflict: "session_id" }
  );
  if (error) throw error;
  return { ok: true };
}

// Events that mark how far a session has got. Each one also moves the session's
// progress marker, so the dashboard can say where unfinished runs stopped without
// scanning every event row.
const PROGRESS_EVENTS = new Set(["game_decision_made", "quiz_answer_submitted"]);

// Read-only participant lookup for high-volume events (one per decision or answer):
// no last_seen write on every click. Creates the participant only if it is missing.
async function findParticipant(supabase, anonymousId) {
  const { data, error } = await supabase
    .from("participants")
    .select("id")
    .eq("anonymous_id", anonymousId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data.id;
  return ensureParticipant(supabase, anonymousId, {});
}

async function handleEvent(supabase, body) {
  if (typeof body.event_name !== "string" || !/^[a-z0-9_]{1,64}$/.test(body.event_name))
    throw httpError(400, "event_name is required (lowercase letters, digits, underscores)");
  let participantId = null;
  if (isPlausibleAnonId(body.anonymous_id)) {
    participantId = await findParticipant(supabase, body.anonymous_id);
  }
  const props = body.properties ?? {};
  if (typeof props !== "object" || Array.isArray(props) || JSON.stringify(props).length > 8000)
    throw httpError(400, "properties must be an object under 8 kB");
  // The page's evt() helper puts session_id inside properties, not beside it, so
  // until now every event_log row had a null session_id. Accept either place.
  const rawSession = body.session_id || props.session_id;
  const sessionId = isUuid(rawSession) ? rawSession : null;
  const row = { participant_id: participantId, session_id: sessionId, event_name: body.event_name, properties: props };
  let { error } = await supabase.from("event_log").insert(row);
  // The first events of a run are sent in the same instant as its session_start, so the session
  // row may not exist yet (foreign key). The id is also inside properties, which the dashboard
  // reads, so store the event unlinked rather than lose it.
  if (error && error.code === "23503" && sessionId) {
    ({ error } = await supabase.from("event_log").insert({ ...row, session_id: null }));
  }
  if (error) throw error;

  // Best effort: needs migration 0003. Until it is run this update fails quietly and
  // the event above is still stored.
  if (sessionId && PROGRESS_EVENTS.has(body.event_name) && Number.isFinite(props.n)) {
    const { error: pErr } = await supabase
      .from("sessions")
      .update({ progress: props.n, last_activity_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (pErr) console.warn("session progress not saved (run migration 0003?)", pErr.message);
  }
  return { ok: true };
}

function httpError(status, message) {
  const e = new Error(message);
  e.statusCode = status;
  return e;
}

const HANDLERS = {
  participant_seen: handleParticipantSeen,
  session_start: handleSessionStart,
  session_complete: handleSessionComplete,
  compass_result: handleCompassResult,
  president_result: handlePresidentResult,
  event: handleEvent,
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      return sendJson(res, 400, { error: "invalid JSON" });
    }
  }
  body = body || {};

  if (!isPlausibleAnonId(body.anonymous_id) && body.type !== "event") {
    return sendJson(res, 400, { error: "anonymous_id is required" });
  }

  const fn = HANDLERS[body.type];
  if (!fn) {
    return sendJson(res, 400, { error: "unknown type: " + body.type });
  }

  try {
    const supabase = supabaseAdmin();
    const result = await fn(supabase, body, req);
    return sendJson(res, 200, result);
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("track error", err);
    return sendJson(res, status, { error: err.message || "internal error" });
  }
};
