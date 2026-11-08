// Run: node tests/report.test.js  (no database needed)
const assert = require("assert");
const { buildReport } = require("../api/_lib/report");
const { classifySource, channelOf } = require("../api/_lib/source");

// ---- source classification
assert.deepStrictEqual(classifySource({}), null, "old pages stay unknown");
let c = classifySource({ src_v: 1, utm_source: "Google", utm_medium: "CPC", utm_campaign: "Launch" });
assert.deepStrictEqual([c.source, c.medium, c.campaign], ["google", "cpc", "launch"]);
c = classifySource({ src_v: 1, click_id: "gclid" });
assert.deepStrictEqual([c.source, c.medium], ["google", "cpc"]);
c = classifySource({ src_v: 1, click_id: "fbclid", referrer: "l.facebook.com" });
assert.deepStrictEqual([c.source, c.medium], ["meta", "fbclid"]);
c = classifySource({ src_v: 1, referrer: "www.ifnayou.com" });
assert.deepStrictEqual([c.source, c.medium], ["direct", "none"], "own site is not a referral");
c = classifySource({ src_v: 1, referrer: "https://www.news.example/story?x=1" });
assert.deepStrictEqual([c.source, c.medium, c.referrer], ["news.example", "referral", "news.example"]);
assert.strictEqual(classifySource({ src_v: 1, utm_source: "undefined" }).source, "direct");
assert.strictEqual(channelOf("google", "cpc"), "Google ads");
assert.strictEqual(channelOf("facebook", "paid_social"), "Meta ads");
assert.strictEqual(channelOf("meta", "fbclid"), "Meta click (untagged)");
assert.strictEqual(channelOf("news.example", "referral"), "Referral");
assert.strictEqual(channelOf(null, null), "Before source tracking");

// ---- the answered-only denominator: 934 played, 180 answered E1
const T0 = Date.parse("2026-11-01T10:00:00Z");
const NOW = T0 + 10 * 24 * 3600e3;
const participants = [], sessions = [], events = [];
let ev = 0;
const push = (name, sid, pid, p, dt) => events.push({ event_name: name, session_id: sid, participant_id: pid, properties: p, occurred_at: new Date(T0 + (dt || 0) + ev++).toISOString() });
for (let i = 0; i < 934; i++) {
  const paid = i % 3 === 0;
  participants.push({ id: "p" + i, first_seen_at: new Date(T0).toISOString(), acquisition_source: paid ? "google" : "direct", acquisition_medium: paid ? "cpc" : "none" });
  sessions.push({ id: "s" + i, participant_id: "p" + i, experience_type: "compass", completion_status: i < 100 ? "completed" : "in_progress", started_at: new Date(T0).toISOString(), completed_at: i < 100 ? new Date(T0 + 600e3).toISOString() : null });
  const base = { content_version: "v1", q: "E1", axis: "econ", n: 1, deep: false };
  if (i < 300) push("quiz_question_viewed", "s" + i, "p" + i, { ...base, head: "The new power plant", stem: "Who should own it?", a: "A government company.", b: "Private investors." });
  if (i < 180) {
    const pickA = i < 90; // 50/50
    push("quiz_answer_submitted", "s" + i, "p" + i, { ...base, value: pickA ? 1 : -1, answer: "lean", picked: pickA ? "A government company." : "Private investors.", ms: 8000 + i * 10 });
  } else if (i < 200) {
    push("quiz_answer_submitted", "s" + i, "p" + i, { ...base, value: null, answer: "skip", ms: 3000 });
  }
}
// a changed answer must count once
push("quiz_answer_submitted", "s0", "p0", { content_version: "v1", q: "E1", axis: "econ", n: 1, value: -2, answer: "strong", picked: "Private investors.", ms: 4000 });
const R = buildReport({ participants, sessions, events, compass: [], president: [] }, { nowMs: NOW });
const e1 = R.quiz.questions.find((q) => q.q === "E1");
assert.strictEqual(e1.answered, 180, "denominator is people who answered, not who played");
assert.strictEqual(e1.skipped, 20);
assert.strictEqual(e1.viewed, 300);
assert.strictEqual(e1.picked.reduce((a, x) => a + x.count, 0), 180);
assert.strictEqual(e1.picked.find((x) => x.text === "Private investors.").count, 91, "s0 changed its answer");
assert.strictEqual(e1.stem, "Who should own it?", "wording comes from the event");
assert.ok(e1.flags.includes("divided"));
assert.strictEqual(R.experiences.compass.sessions, 934);
assert.strictEqual(R.experiences.compass.completed, 100);
// cohorts
const g = R.channels.find((x) => x.channel === "Google ads"), d = R.channels.find((x) => x.channel === "Direct");
assert.strictEqual(g.visitors + d.visitors, 934);
assert.strictEqual(R.channels.find((x) => x.channel === "All paid").visitors, g.visitors);
const Rp = buildReport({ participants, sessions, events, compass: [], president: [] }, { nowMs: NOW, cohort: "paid" });
assert.ok(Rp.experiences.compass.sessions === g.visitors);
assert.ok(Rp.quiz.questions[0].answered < 180 && Rp.quiz.questions[0].answered > 40);

// ---- game decisions + leaving + consequence dwell
const gp = [], gs = [], ge = [];
for (let i = 0; i < 40; i++) {
  gp.push({ id: "g" + i, first_seen_at: new Date(T0).toISOString(), acquisition_source: "meta", acquisition_medium: "cpc" });
  gs.push({ id: "gs" + i, participant_id: "g" + i, experience_type: "president", completion_status: i < 5 ? "completed" : "in_progress", started_at: new Date(T0).toISOString(), completed_at: i < 5 ? new Date(T0 + 900e3).toISOString() : null });
  const card = { content_version: "v1", kind: "desk", card: 7, n: 3, who: "The Governor", says: "Fuel is too dear.", l: "Keep it down", r: "Let it float", continue_only: false };
  const pg = (name, p, dt) => ge.push({ event_name: name, session_id: "gs" + i, participant_id: "g" + i, properties: p, occurred_at: new Date(T0 + dt).toISOString() });
  pg("game_card_viewed", card, 1000);
  if (i < 30) {
    pg("game_decision_made", { ...card, choice: i < 10 ? "l" : "r", choice_text: i < 10 ? "Keep it down" : "Let it float", ms: 5000 }, 6000);
    pg("game_consequence_viewed", { content_version: "v1", title: "Queues form", text: "…" }, 6100);
    pg("game_card_viewed", { ...card, card: 8, n: 4, who: "Next", says: "Another", l: "x", r: "y" }, 9100);
  }
  if (i < 5) pg("game_ending_viewed", { content_version: "v1", presidency: "The Caretaker" }, 20000);
}
const G = buildReport({ participants: gp, sessions: gs, events: ge, compass: [], president: gs.slice(0, 5).map((s) => ({ session_id: s.id, final_outcome: "served_full_term" })) }, { nowMs: NOW });
const d7 = G.game.decisions.find((x) => x.card === 7);
assert.strictEqual(d7.shown, 40); assert.strictEqual(d7.decided, 30);
assert.strictEqual(d7.choices[0].text, "Let it float"); assert.strictEqual(d7.choices[0].count, 20);
assert.strictEqual(d7.left_here, 10, "10 abandoned sessions last saw card 7");
assert.strictEqual(d7.median_seconds, 5);
assert.strictEqual(G.game.consequences[0].median_seconds, 3);
assert.strictEqual(G.outcomes.endings.rows[0].label, "The Caretaker");
assert.strictEqual(G.outcomes.president_outcomes.n, 5);
assert.strictEqual(G.experiences.president.completion_rate, 5 / 40);
console.log("all report/source tests passed");
