// "Same game, compare after": everyone who opens a group link plays the same seeded game, and each
// finished presidency is posted here under the group's code so the group sees one board.
//
//   POST {code, nick, result}   {ok}   one row per nickname; a replay replaces it only if it went further
//   GET  ?code                  {results:[{nick, result}]}
const { supabaseAdmin } = require("./_lib/supabaseAdmin");
const { sendJson } = require("./_lib/util");
const T = require("./_lib/together");

const MAX_ROWS = 60; // per group
const KEEP_MS = 30 * 24 * 3600 * 1000;

function httpError(status, message) {
  const e = new Error(message);
  e.statusCode = status;
  return e;
}

async function post(supabase, body) {
  const code = T.groupCode(body.code);
  const nick = T.nick(body.nick);
  if (!code) throw httpError(400, "bad group code");
  if (!nick) throw httpError(400, "nick is required");
  if (!body.result || typeof body.result !== "object") throw httpError(400, "result is required");
  const result = T.cleanResult(body.result);

  const { data: rows, error } = await supabase
    .from("group_results")
    .select("nick, term, days")
    .eq("group_code", code);
  if (error) throw error;
  const mine = (rows || []).find((r) => r.nick === nick);
  if (!mine && (rows || []).length >= MAX_ROWS) throw httpError(409, "this group is full");
  if (mine && (mine.term > result.term || (mine.term === result.term && mine.days >= result.days))) return { ok: true, kept: "earlier" };

  const { error: upErr } = await supabase
    .from("group_results")
    .upsert({ group_code: code, nick, result, term: result.term, days: result.days, posted_at: new Date().toISOString() }, { onConflict: "group_code,nick" });
  if (upErr) throw upErr;
  await supabase.from("group_results").delete().lt("posted_at", new Date(Date.now() - KEEP_MS).toISOString());
  return { ok: true };
}

async function board(supabase, q) {
  const code = T.groupCode(q.get("code"));
  if (!code) throw httpError(400, "bad group code");
  const { data, error } = await supabase
    .from("group_results")
    .select("nick, result, term, days")
    .eq("group_code", code)
    .order("term", { ascending: false })
    .order("days", { ascending: false })
    .limit(MAX_ROWS);
  if (error) throw error;
  return { results: (data || []).map((r) => ({ nick: r.nick, result: r.result })) };
}

module.exports = async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  try {
    const supabase = supabaseAdmin();
    if (req.method === "GET") return sendJson(res, 200, await board(supabase, new URL(req.url, "http://x").searchParams));
    if (req.method !== "POST") return sendJson(res, 405, { error: "method not allowed" });
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body || "{}"); } catch { return sendJson(res, 400, { error: "invalid JSON" }); }
    }
    body = body || {};
    if (JSON.stringify(body).length > 4000) return sendJson(res, 413, { error: "too large" });
    return sendJson(res, 200, await post(supabase, body));
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("group error", err);
    return sendJson(res, status, { error: status >= 500 ? "internal error" : err.message });
  }
};
