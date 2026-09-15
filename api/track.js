const { supabaseAdmin } = require("./_lib/supabaseAdmin");
const { isUuid, isPlausibleAnonId, geo, deviceTypeFromUA, sendJson } = require("./_lib/util");

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
    .select("id")
    .eq("anonymous_id", anonymousId)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    await supabase
      .from("participants")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", existing.id);
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
  const meta = {
    acquisition_source: body.utm_source,
    acquisition_medium: body.utm_medium,
    acquisition_campaign: body.utm_campaign,
    referrer: body.referrer,
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

async function handleEvent(supabase, body) {
  if (!body.event_name) throw httpError(400, "event_name is required");
  let participantId = null;
  if (isPlausibleAnonId(body.anonymous_id)) {
    participantId = await ensureParticipant(supabase, body.anonymous_id, {});
  }
  const { error } = await supabase.from("event_log").insert({
    participant_id: participantId,
    session_id: isUuid(body.session_id) ? body.session_id : null,
    event_name: body.event_name,
    properties: body.properties ?? {},
  });
  if (error) throw error;
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
