// Cabinet night. One person plays the President on their own phone; friends open a link, join
// as ministers, vote on every decision and each carry a secret agenda that is revealed at the end.
// The President's page does all of the game and keeps the score; this is a small relay that
// holds the room, shows each minister the current card, collects their votes and keeps each
// secret agenda out of every phone but its owner's.
//
//   GET  ?ping=1                      {ok}                       is the feature set up (migration 0004)?
//   POST {action:"create",nick}       {code, host_key}
//   POST {action:"join",code,nick}    {player_id, token}         409 once started or full
//   POST {action:"push",code,host_key,state,secrets?}            the President publishes the room
//   POST {action:"vote",code,token,turn,choice}                  a minister votes (latest vote counts)
//   GET  ?code&host_key               the President's poll: players, votes on the current card
//   GET  ?code[&token]                a minister's poll; without a valid token only {host, phase}
const { supabaseAdmin } = require("./_lib/supabaseAdmin");
const { sendJson } = require("./_lib/util");
const T = require("./_lib/together");

const MAX_PLAYERS = 8;
const IDLE_MS = 12 * 3600 * 1000; // a room nobody has touched for this long has closed
const PURGE_MS = 2 * 24 * 3600 * 1000; // and is deleted after this
const MAX_BODY = 40000;

function httpError(status, message) {
  const e = new Error(message);
  e.statusCode = status;
  return e;
}
const nowIso = () => new Date().toISOString();

async function loadRoom(supabase, code) {
  const c = T.roomCode(code);
  if (!c) throw httpError(404, "no such room");
  const { data, error } = await supabase.from("rooms").select("*").eq("code", c).maybeSingle();
  if (error) throw error;
  if (!data) throw httpError(404, "no such room");
  if (Date.now() - Date.parse(data.updated_at) > IDLE_MS) throw httpError(404, "room closed");
  return data;
}

async function ping(supabase) {
  const a = await supabase.from("rooms").select("code").limit(1);
  const b = await supabase.from("group_results").select("group_code").limit(1);
  return { ok: !a.error && !b.error };
}

async function create(supabase, body) {
  const nick = T.nick(body.nick);
  if (!nick) throw httpError(400, "nick is required");
  // tidy up as we go: nothing runs on a schedule here
  await supabase.from("rooms").delete().lt("updated_at", new Date(Date.now() - PURGE_MS).toISOString());
  for (let i = 0; i < 8; i++) {
    const code = T.newRoomCode();
    const host_key = T.newSecret();
    const { error } = await supabase.from("rooms").insert({
      code, host_key, host_nick: nick, phase: "lobby", state: { phase: "lobby" }, ver: Date.now(), updated_at: nowIso(),
    });
    if (!error) return { code, host_key };
    if (error.code !== "23505") throw error; // anything but "that code is taken"
  }
  throw httpError(503, "could not make a room code");
}

async function players(supabase, code) {
  const { data, error } = await supabase
    .from("room_players")
    .select("id, nick, secret, token")
    .eq("room_code", code)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function join(supabase, body) {
  const room = await loadRoom(supabase, body.code);
  if (room.phase !== "lobby") throw httpError(409, "already started");
  let nick = T.nick(body.nick);
  if (!nick) throw httpError(400, "nick is required");
  const ps = await players(supabase, room.code);
  if (ps.length >= MAX_PLAYERS) throw httpError(409, "full");
  // two ministers called Tolu would be two chips nobody can tell apart
  const taken = new Set(ps.map((p) => p.nick.toLowerCase()).concat([room.host_nick.toLowerCase()]));
  if (taken.has(nick.toLowerCase())) {
    let n = 2;
    while (taken.has((nick.slice(0, 17) + " " + n).toLowerCase())) n++;
    nick = nick.slice(0, 17) + " " + n;
  }
  const token = T.newSecret();
  const { data, error } = await supabase
    .from("room_players")
    .insert({ room_code: room.code, nick, token })
    .select("id")
    .single();
  if (error) throw error;
  await supabase.from("rooms").update({ ver: Date.now(), updated_at: nowIso() }).eq("code", room.code);
  return { player_id: data.id, token };
}

async function push(supabase, body) {
  const room = await loadRoom(supabase, body.code);
  if (!T.sameSecret(room.host_key, body.host_key)) throw httpError(403, "not the host");
  const state = T.cleanState(body.state);
  if (body.secrets) {
    const ps = await players(supabase, room.code);
    const secrets = T.cleanSecrets(body.secrets, new Set(ps.map((p) => p.id)));
    for (const id of Object.keys(secrets)) {
      const { error } = await supabase.from("room_players").update({ secret: secrets[id] }).eq("id", id);
      if (error) throw error;
    }
  }
  const { error } = await supabase
    .from("rooms")
    .update({ state, phase: state.phase, ver: Date.now(), updated_at: nowIso() })
    .eq("code", room.code);
  if (error) throw error;
  // votes on decisions long past are of no use to anyone
  if (state.card && state.card.turn > 2) {
    await supabase.from("room_votes").delete().eq("room_code", room.code).lt("turn", state.card.turn - 1);
  }
  return { ok: true };
}

async function vote(supabase, body) {
  const room = await loadRoom(supabase, body.code);
  if (room.phase !== "play") throw httpError(409, "not voting now");
  const ps = await players(supabase, room.code);
  const me = ps.find((p) => T.sameSecret(p.token, body.token));
  if (!me) throw httpError(403, "not in this room");
  const card = room.state && room.state.card;
  const turn = Number(body.turn);
  if (!card || card.turn !== turn) throw httpError(409, "that decision has passed");
  if (!T.CHOICES.includes(body.choice) || !card.opts.some((o) => o.k === body.choice)) throw httpError(400, "no such option");
  const { error } = await supabase
    .from("room_votes")
    .upsert({ room_code: room.code, player_id: me.id, turn, choice: body.choice, voted_at: nowIso() }, { onConflict: "room_code,player_id,turn" });
  if (error) throw error;
  await supabase.from("rooms").update({ ver: Date.now(), updated_at: nowIso() }).eq("code", room.code);
  return { ok: true };
}

async function currentVotes(supabase, room) {
  const card = room.state && room.state.card;
  if (!card) return [];
  const { data, error } = await supabase
    .from("room_votes")
    .select("player_id, choice")
    .eq("room_code", room.code)
    .eq("turn", card.turn);
  if (error) throw error;
  return (data || []).map((v) => ({ id: v.player_id, choice: v.choice }));
}

async function poll(supabase, q) {
  const room = await loadRoom(supabase, q.get("code"));
  const hostKey = q.get("host_key"), token = q.get("token");
  const isHost = hostKey && T.sameSecret(room.host_key, hostKey);
  if (!isHost && !token) return { host: room.host_nick, phase: room.phase };

  const ps = await players(supabase, room.code);
  const list = ps.map((p) => ({ id: p.id, nick: p.nick }));
  const votes = await currentVotes(supabase, room);
  if (isHost) return { host: room.host_nick, players: list, state: room.state, votes, ver: room.ver };

  const me = ps.find((p) => T.sameSecret(p.token, token));
  if (!me) return { host: room.host_nick, phase: room.phase }; // a stale token: show the join form again
  return {
    host: room.host_nick, players: list, state: room.state, votes, ver: room.ver,
    me: { id: me.id, secret: me.secret || {} },
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  try {
    const supabase = supabaseAdmin();
    if (req.method === "GET") {
      const q = new URL(req.url, "http://x").searchParams;
      if (q.get("ping")) return sendJson(res, 200, await ping(supabase));
      return sendJson(res, 200, await poll(supabase, q));
    }
    if (req.method !== "POST") return sendJson(res, 405, { error: "method not allowed" });
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body || "{}"); } catch { return sendJson(res, 400, { error: "invalid JSON" }); }
    }
    body = body || {};
    if (JSON.stringify(body).length > MAX_BODY) return sendJson(res, 413, { error: "too large" });
    const act = { create, join, push, vote }[body.action];
    if (!act) return sendJson(res, 400, { error: "unknown action" });
    return sendJson(res, 200, await act(supabase, body));
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("room error", err);
    return sendJson(res, status, { error: status >= 500 ? "internal error" : err.message });
  }
};
