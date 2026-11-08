// Run: node tests/api.test.js  — exercises /api/track and /api/admin/stats against an in-memory database.
const assert = require("assert");
const Module = require("module");
const { makeDb, newId } = require("./fakedb");
const db = makeDb();
const real = Module._load;
Module._load = function (req, parent, ...r) {
  if (/_lib\/supabaseAdmin$/.test(req)) return { supabaseAdmin: () => db };
  if (/_lib\/requireAdmin$/.test(req)) return { isAuthorizedAdmin: () => true };
  return real.call(this, req, parent, ...r);
};
const track = require("../api/track");
const stats = require("../api/admin/stats");
function call(h, req) {
  return new Promise((resolve) => {
    const res = { status(c) { this.code = c; return this; }, setHeader() {}, send(b) { resolve({ code: this.code, body: JSON.parse(b) }); } };
    h({ method: "POST", headers: { "user-agent": "iPhone mobile", "x-vercel-ip-country": "NG" }, ...req }, res);
  });
}
const post = (body) => call(track, { body });
(async () => {
  const A = "11111111-aaaa-4aaa-8aaa-111111111111";
  // ad visit: the event races ahead of participant_seen and creates the row first
  let r = await post({ type: "event", anonymous_id: A, event_name: "landing_viewed", properties: {} });
  assert.strictEqual(r.code, 200);
  r = await post({ type: "participant_seen", anonymous_id: A, src_v: 1, utm_source: "google", utm_medium: "cpc", utm_campaign: "Launch", click_id: "gclid", referrer: "www.google.com" });
  const p = db.tables.participants[0];
  assert.deepStrictEqual([p.acquisition_source, p.acquisition_medium, p.acquisition_campaign], ["google", "cpc", "launch"], "source fills the row the event created");
  // later visit via another route must not overwrite first touch
  await post({ type: "participant_seen", anonymous_id: A, src_v: 1, utm_source: "meta", utm_medium: "cpc" });
  assert.strictEqual(db.tables.participants[0].acquisition_source, "google");
  // a participant from before source tracking keeps unknown even if they come back through an ad
  db.tables.participants.push({ id: "legacy", anonymous_id: "legacy-anon-id", first_seen_at: "2026-09-01T00:00:00Z", acquisition_source: null });
  await post({ type: "participant_seen", anonymous_id: "legacy-anon-id", src_v: 1, utm_source: "google", utm_medium: "cpc" });
  assert.strictEqual(db.tables.participants[1].acquisition_source, null);
  // an old page (no src_v) creates an unknown participant, not a "direct" one
  await post({ type: "participant_seen", anonymous_id: "oldpage-anon-id" });
  assert.strictEqual(db.tables.participants[2].acquisition_source, null);
  // event validation
  assert.strictEqual((await post({ type: "event", anonymous_id: A, event_name: "Bad Name!" })).code, 400);
  assert.strictEqual((await post({ type: "event", anonymous_id: A, event_name: "x", properties: { a: "y".repeat(9000) } })).code, 400);
  // FK race: session row not there yet
  const S = newId();
  db.failFk.on = true;
  r = await post({ type: "event", anonymous_id: A, event_name: "compass_started", properties: { session_id: S } });
  assert.strictEqual(r.code, 200);
  const stored = db.tables.event_log[db.tables.event_log.length - 1];
  assert.strictEqual(stored.session_id, null); assert.strictEqual(stored.properties.session_id, S, "id kept in properties");
  db.failFk.on = false;
  // real session + events
  await post({ type: "session_start", anonymous_id: A, session_id: S, experience_type: "compass" });
  await post({ type: "event", anonymous_id: A, event_name: "quiz_question_viewed", properties: { session_id: S, content_version: "v1", q: "E1", axis: "econ", n: 1, head: "H", stem: "Stem", a: "AA", b: "BB" } });
  await post({ type: "event", anonymous_id: A, event_name: "quiz_answer_submitted", properties: { session_id: S, content_version: "v1", q: "E1", axis: "econ", n: 1, value: 2, answer: "strong", picked: "AA", ms: 4200 } });
  // dashboard
  r = await call(stats, { method: "GET", url: "/api/admin/stats?days=30&cohort=paid", headers: {} });
  assert.strictEqual(r.code, 200, JSON.stringify(r.body));
  const q = r.body.report.quiz.questions[0];
  assert.deepStrictEqual([q.q, q.stem, q.viewed, q.answered, q.median_seconds], ["E1", "Stem", 1, 1, 4.2]);
  assert.strictEqual(r.body.report.channels.find((c) => c.channel === "Google ads").visitors, 1);
  r = await call(stats, { method: "GET", url: "/api/admin/stats?cohort=Direct", headers: {} });
  assert.strictEqual(r.body.report.quiz.questions.length, 0, "other cohorts do not see that player");
  assert.ok(r.body.participants && r.body.funnels, "old response shape intact");
  console.log("api tests passed");
})().catch((e) => { console.error(e); process.exit(1); });
