// Run: node tests/together.test.js — Cabinet night and group boards against an in-memory database.
const assert = require("assert");
const Module = require("module");
const { makeDb } = require("./fakedb");
const db = makeDb();
const real = Module._load;
Module._load = function (req, parent, ...r) {
  if (/_lib\/supabaseAdmin$/.test(req)) return { supabaseAdmin: () => db };
  return real.call(this, req, parent, ...r);
};
const room = require("../api/room");
const group = require("../api/group");
function call(h, method, url, body) {
  return new Promise((resolve) => {
    const res = { headers: {}, status(c) { this.code = c; return this; }, setHeader(k, v) { this.headers[k] = v; }, send(b) { resolve({ code: this.code, body: JSON.parse(b), headers: this.headers }); } };
    h({ method, url, body, headers: {} }, res);
  });
}
const R = (body) => call(room, "POST", "/api/room", body);
const Rget = (qs) => call(room, "GET", "/api/room?" + qs);

(async () => {
  assert.deepStrictEqual((await Rget("ping=1")).body, { ok: true });
  assert.strictEqual((await Rget("ping=1")).headers["cache-control"], "no-store");

  // ---- create and join
  assert.strictEqual((await R({ action: "create", nick: "  " })).code, 400);
  const c = (await R({ action: "create", nick: "Ada<b>" })).body;
  assert.ok(/^[A-Z]{4}$/.test(c.code) && !/[ILOU]/.test(c.code), "four letters, no look-alikes");
  assert.strictEqual(db.tables.rooms[0].host_nick, "Adab", "markup stripped from nicknames");
  const j1 = (await R({ action: "join", code: c.code.toLowerCase(), nick: "Tolu" })).body;
  const j2 = (await R({ action: "join", code: c.code, nick: "tolu" })).body;
  const j3 = (await R({ action: "join", code: c.code, nick: "Ngozi" })).body;
  assert.ok(j1.token && j1.player_id && j1.token !== j2.token);
  let host = (await Rget(`code=${c.code}&host_key=${c.host_key}`)).body;
  assert.deepStrictEqual(host.players.map((p) => p.nick), ["Tolu", "tolu 2", "Ngozi"], "duplicate names are told apart");
  assert.ok(!JSON.stringify(host).includes(j1.token), "tokens are never sent back to the host");

  // ---- what a stranger or a stale token can see
  assert.deepStrictEqual(Object.keys((await Rget(`code=${c.code}`)).body).sort(), ["host", "phase"]);
  assert.deepStrictEqual(Object.keys((await Rget(`code=${c.code}&token=nope`)).body).sort(), ["host", "phase"]);
  assert.strictEqual((await Rget("code=ZZZZ")).code, 404);
  assert.strictEqual((await Rget(`code=${c.code}&host_key=wrong`)).body.state, undefined);

  // ---- the host starts the presidency, with each minister's secret
  const seats = {}, secrets = {};
  [j1, j2, j3].forEach((j, i) => {
    seats[j.player_id] = { nick: "n" + i, role: "Minister of Finance", b: "purse" };
    secrets[j.player_id] = { role: "Minister of Finance", b: "purse", agenda: { t: "own", b: "purse", txt: "Keep the purse above 55 " + i } };
  });
  const stranger = "00000000-0000-4000-8000-0000000000ff";
  secrets[stranger] = { role: "x", agenda: { t: "sab", txt: "ghost" } };
  const card = (turn) => ({ who: "The Governor", says: "Fuel is dear.", opts: [{ k: "l", t: "Hold" }, { k: "r", t: "Float" }], stake: { l: { purse: -5 }, r: { purse: 6 } }, turn });
  assert.strictEqual((await R({ action: "push", code: c.code, host_key: "bad", state: { phase: "play" } })).code, 403);
  assert.strictEqual((await R({ action: "push", code: c.code, host_key: c.host_key, state: { phase: "play", seats, blocs: { purse: 60 }, card: card(1) }, secrets })).code, 200);
  assert.strictEqual(db.tables.room_players.filter((p) => p.secret).length, 3);
  assert.ok(!db.tables.room_players.some((p) => JSON.stringify(p.secret).includes("ghost")), "secrets for non-members dropped");
  assert.strictEqual((await R({ action: "join", code: c.code, nick: "Late" })).code, 409, "no joining once started");

  // ---- a minister sees only their own secret
  const m1 = (await Rget(`code=${c.code}&token=${j1.token}`)).body;
  assert.strictEqual(m1.me.id, j1.player_id);
  assert.ok(m1.me.secret.agenda.txt.endsWith("0"));
  assert.ok(!JSON.stringify(m1).includes("the purse above 55 1"), "no one else's agenda");
  assert.ok(!JSON.stringify(m1.state).includes("agenda"), "the shared state carries no agendas");

  // ---- voting
  assert.strictEqual((await R({ action: "vote", code: c.code, token: j1.token, turn: 1, choice: "l" })).code, 200);
  await R({ action: "vote", code: c.code, token: j1.token, turn: 1, choice: "r" }); // changed mind
  await R({ action: "vote", code: c.code, token: j2.token, turn: 1, choice: "r" });
  assert.strictEqual((await R({ action: "vote", code: c.code, token: j3.token, turn: 9, choice: "l" })).code, 409, "wrong decision");
  assert.strictEqual((await R({ action: "vote", code: c.code, token: j3.token, turn: 1, choice: "c" })).code, 400, "an option that is not on the card");
  assert.strictEqual((await R({ action: "vote", code: c.code, token: "nope", turn: 1, choice: "l" })).code, 403);
  host = (await Rget(`code=${c.code}&host_key=${c.host_key}`)).body;
  assert.deepStrictEqual(host.votes.map((v) => v.choice).sort(), ["r", "r"]);
  const v0 = host.ver;
  await R({ action: "push", code: c.code, host_key: c.host_key, state: { phase: "play", seats, card: card(2), last: { turn: 1, side: "r", t: "Float", over: false, n: 2 } } });
  host = (await Rget(`code=${c.code}&host_key=${c.host_key}`)).body;
  assert.strictEqual(host.votes.length, 0, "a new decision starts with no votes");
  assert.ok(host.ver >= v0);

  // ---- nothing crafted gets through to the ministers' pages
  await R({ action: "push", code: c.code, host_key: c.host_key, state: {
    phase: "play", seats: { "x\"><img>": { nick: "bad" }, [j1.player_id]: { nick: "<b>Z</b>", role: "R", b: "a\" onclick=\"x" } },
    blocs: { purse: "50\"><script>", "bad key": 5, army: 250 },
    card: { who: "w", says: "s", turn: 3, opts: [{ k: "l\"><x>", t: "no" }, { k: "r", t: "yes" }], stake: { r: { "bad\"": 1, purse: 7 } } },
  } });
  const clean = (await Rget(`code=${c.code}&token=${j1.token}`)).body.state;
  assert.deepStrictEqual(Object.keys(clean.seats), [j1.player_id]);
  assert.strictEqual(clean.seats[j1.player_id].b, null);
  assert.strictEqual(clean.seats[j1.player_id].nick, "bZ/b");
  assert.deepStrictEqual(clean.blocs, { army: 100 });
  assert.deepStrictEqual(clean.card.opts, [{ k: "r", t: "yes" }]);
  assert.deepStrictEqual(clean.card.stake, { r: { purse: 7 } });

  // ---- the end, and the reveal
  await R({ action: "push", code: c.code, host_key: c.host_key, state: { phase: "end", result: { title: "They voted you out.", days: 40, term: 1 },
    reveal: [{ id: j1.player_id, nick: "Tolu", role: "Finance", txt: "Keep the purse above 55", sab: false, done: true, agree: 3, cast: 4 }, { id: "bad", nick: "x" }] } });
  const end = (await Rget(`code=${c.code}&token=${j2.token}`)).body;
  assert.strictEqual(end.state.phase, "end");
  assert.strictEqual(end.state.reveal.length, 1);
  assert.strictEqual(end.state.result.title, "They voted you out.");

  // ---- full rooms, expiry, size
  const c2 = (await R({ action: "create", nick: "Host" })).body;
  for (let i = 0; i < 8; i++) assert.strictEqual((await R({ action: "join", code: c2.code, nick: "P" + i })).code, 200);
  assert.strictEqual((await R({ action: "join", code: c2.code, nick: "P9" })).code, 409, "eight ministers at most");
  db.tables.rooms.find((r) => r.code === c2.code).updated_at = new Date(Date.now() - 13 * 3600e3).toISOString();
  assert.strictEqual((await Rget(`code=${c2.code}&host_key=${c2.host_key}`)).code, 404, "idle rooms close");
  assert.strictEqual((await R({ action: "push", code: c.code, host_key: c.host_key, state: { phase: "play", x: "y".repeat(50000) } })).code, 413);
  assert.strictEqual((await R({ action: "nope" })).code, 400);
  db.tables.rooms.find((r) => r.code === c2.code).updated_at = new Date(Date.now() - 3 * 86400e3).toISOString();
  await R({ action: "create", nick: "Next" });
  assert.ok(!db.tables.rooms.some((r) => r.code === c2.code), "rooms are deleted two days after last use");

  // ---- group boards
  const G = (body) => call(group, "POST", "/api/group", body);
  const res = (title, days, term) => ({ title, kick: "k", name: "Pres " + title, days, term, end: "lost", kept: 3, tested: 5 });
  assert.strictEqual((await G({ code: "AB", nick: "x", result: res("a", 1, 1) })).code, 400);
  assert.strictEqual((await G({ code: "ABC234", nick: "", result: res("a", 1, 1) })).code, 400);
  await G({ code: "abc234", nick: "Tolu", result: res("short", 20, 1) });
  await G({ code: "ABC234", nick: "Ngozi", result: res("long", 90, 2) });
  await G({ code: "ABC234", nick: "Ada", result: res("mid", 60, 1) });
  assert.strictEqual((await G({ code: "ABC234", nick: "Tolu", result: res("worse", 5, 1) })).body.kept, "earlier", "a worse replay does not replace");
  await G({ code: "ABC234", nick: "Tolu", result: res("better", 70, 1) });
  const b = (await call(group, "GET", "/api/group?code=ABC234")).body.results;
  assert.deepStrictEqual(b.map((r) => r.nick + ":" + r.result.title), ["Ngozi:long", "Tolu:better", "Ada:mid"]);
  assert.strictEqual((await call(group, "GET", "/api/group?code=ZZZZZZ")).body.results.length, 0);
  for (let i = 0; i < 60; i++) db.tables.group_results.push({ group_code: "FULL123", nick: "n" + i, result: {}, term: 1, days: 1, posted_at: new Date().toISOString() });
  assert.strictEqual((await G({ code: "FULL123", nick: "new", result: res("x", 1, 1) })).code, 409);
  assert.ok(JSON.stringify(b).indexOf("<") < 0);
  console.log("together tests passed");
})().catch((e) => { console.error(e); process.exit(1); });
