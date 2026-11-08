// The admin dashboard's analysis, as a pure function over rows already fetched, so it can be
// tested with made-up data. Rules that matter:
//   * Every share of "people who answered X" uses only the sessions that actually answered X.
//     Sessions that merely started, or saw the question and left, are counted beside it, never in it.
//   * Wording is read from the events themselves (what the page really showed), not re-typed here.
//   * Flags are signals to look at, not verdicts. A question can split people because it is a
//     real dividing line or because it confuses them; time and drop-off are shown to tell them apart.
const { channelOf, PAID_CHANNELS } = require("./source");

const ABANDON_MS = 60 * 60 * 1000;
const MIN_N = 30; // below this a share is shown but labelled too small to read

function median(xs) {
  const a = xs.filter((n) => typeof n === "number" && Number.isFinite(n)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}
const rate = (a, b) => (b ? a / b : null);
const secs = (ms) => (ms === null || ms === undefined ? null : Math.round(ms / 100) / 10);
function bump(m, k, by) {
  m[k] = (m[k] || 0) + (by === undefined ? 1 : by);
}
function top(m, n) {
  return Object.entries(m)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n || 50);
}

function cohortTest(cohort) {
  if (!cohort || cohort === "all") return () => true;
  if (cohort === "paid") return (ch) => PAID_CHANNELS.has(ch);
  return (ch) => ch === cohort;
}

function buildReport(input, opts) {
  opts = opts || {};
  const nowMs = opts.nowMs || Date.now();
  const participants = input.participants || [];
  const sessionsAll = input.sessions || [];
  const eventsAll = input.events || [];
  const compass = input.compass || [];
  const president = input.president || [];

  const chanOf = new Map();
  participants.forEach((p) => chanOf.set(p.id, channelOf(p.acquisition_source, p.acquisition_medium)));
  const chan = (pid) => chanOf.get(pid) || "Before source tracking";

  // ---- events, oldest first, each tied to a session where it has one
  const evs = eventsAll
    .map((e) => {
      const props = e.properties || {};
      return {
        name: e.event_name,
        sid: e.session_id || props.session_id || null,
        pid: e.participant_id || null,
        t: Date.parse(e.occurred_at),
        p: props,
      };
    })
    .sort((a, b) => a.t - b.t);

  const bySession = new Map();
  evs.forEach((e) => {
    if (!e.sid) return;
    if (!bySession.has(e.sid)) bySession.set(e.sid, []);
    bySession.get(e.sid).push(e);
  });

  // ---- the channel comparison always covers everybody, whatever cohort is selected
  const sessByPart = new Map();
  sessionsAll.forEach((s) => {
    if (!sessByPart.has(s.participant_id)) sessByPart.set(s.participant_id, []);
    sessByPart.get(s.participant_id).push(s);
  });
  const sharedSid = new Set();
  evs.forEach((e) => {
    if (e.sid && (e.name === "result_shared" || e.name === "share_completed")) sharedSid.add(e.sid);
  });

  function cohortRow(label, test) {
    const ps = participants.filter((p) => test(chan(p.id)));
    const row = { channel: label, visitors: ps.length, players: 0, president: {}, compass: {}, replay_rate: null, share_rate: null };
    let replayers = 0, sharers = 0, completedAll = 0;
    const per = { president: { s: 0, c: 0, p: 0 }, compass: { s: 0, c: 0, p: 0 } };
    ps.forEach((p) => {
      const ss = sessByPart.get(p.id) || [];
      if (ss.length) row.players++;
      ["president", "compass"].forEach((t) => {
        const mine = ss.filter((x) => x.experience_type === t);
        if (mine.length) per[t].p++;
        per[t].s += mine.length;
        per[t].c += mine.filter((x) => x.completion_status === "completed").length;
        if (mine.length > 1) replayers++;
      });
      ss.forEach((x) => {
        if (x.completion_status === "completed") {
          completedAll++;
          if (sharedSid.has(x.id)) sharers++;
        }
      });
    });
    ["president", "compass"].forEach((t) => {
      row[t] = { players: per[t].p, sessions: per[t].s, completed: per[t].c, completion_rate: rate(per[t].c, per[t].s) };
    });
    row.replay_rate = rate(replayers, row.players ? row.players : 0);
    row.share_rate = rate(sharers, completedAll);
    row.completed_total = completedAll;
    return row;
  }
  const channelNames = Array.from(new Set(participants.map((p) => chan(p.id)))).sort();
  const channels = channelNames.map((c) => cohortRow(c, (x) => x === c));
  channels.push(cohortRow("All paid", (x) => PAID_CHANNELS.has(x)));
  channels.push(cohortRow("Everyone else", (x) => !PAID_CHANNELS.has(x)));
  channels.push(cohortRow("Everyone", () => true));

  const campaignMap = {};
  participants.forEach((p) => {
    const k = [p.acquisition_source || "(unknown)", p.acquisition_medium || "", p.acquisition_campaign || ""].join("\u0001");
    const r = campaignMap[k] || (campaignMap[k] = { source: p.acquisition_source || "(unknown)", medium: p.acquisition_medium || "", campaign: p.acquisition_campaign || "", visitors: 0, players: 0, completed: 0 });
    r.visitors++;
    const ss = sessByPart.get(p.id) || [];
    if (ss.length) r.players++;
    if (ss.some((x) => x.completion_status === "completed")) r.completed++;
  });
  const campaigns = Object.values(campaignMap).sort((a, b) => b.visitors - a.visitors).slice(0, 60);

  // ---- from here on, only the selected cohort
  const inCohort = cohortTest(opts.cohort);
  const sessions = sessionsAll.filter((s) => inCohort(chan(s.participant_id)));
  const sidSet = new Set(sessions.map((s) => s.id));
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const cohortEvents = evs.filter((e) => (e.sid ? sidSet.has(e.sid) : e.pid ? inCohort(chan(e.pid)) : false));

  // last sign of life per session, from events as well as the stored marker
  const lastAct = new Map();
  sessions.forEach((s) => lastAct.set(s.id, Math.max(Date.parse(s.last_activity_at || s.started_at) || 0, Date.parse(s.started_at) || 0)));
  cohortEvents.forEach((e) => {
    if (e.sid && lastAct.has(e.sid) && e.t > lastAct.get(e.sid)) lastAct.set(e.sid, e.t);
  });
  const isDone = (s) => s.completion_status === "completed";
  const isAbandoned = (s) => !isDone(s) && nowMs - lastAct.get(s.id) >= ABANDON_MS;

  // ---- Play President vs the quiz, side by side
  function experience(type) {
    const rows = sessions.filter((s) => s.experience_type === type);
    const done = rows.filter(isDone);
    const abandoned = rows.filter(isAbandoned);
    const players = new Set(rows.map((s) => s.participant_id));
    const counts = new Map();
    rows.forEach((s) => counts.set(s.participant_id, (counts.get(s.participant_id) || 0) + 1));
    const replayers = Array.from(counts.values()).filter((n) => n > 1).length;
    const completers = new Set(done.map((s) => s.participant_id));
    const doneAgain = Array.from(completers).filter((p) => counts.get(p) > 1).length;
    const shared = done.filter((s) => sharedSid.has(s.id)).length;
    const methods = {};
    cohortEvents.forEach((e) => {
      if (e.name === "result_shared" && e.sid && sessionById.get(e.sid) && sessionById.get(e.sid).experience_type === type) bump(methods, e.p.method || "unknown");
      if (e.name === "share_completed" && e.sid && sessionById.get(e.sid) && sessionById.get(e.sid).experience_type === type) bump(methods, "share sheet (sent)");
    });
    const stops = {};
    abandoned.forEach((s) => {
      const evsS = bySession.get(s.id) || [];
      let n = null;
      evsS.forEach((e) => {
        if ((e.name === "game_decision_made" || e.name === "quiz_answer_submitted") && Number.isFinite(e.p.n)) n = e.p.n;
      });
      if (n === null && Number.isFinite(s.progress)) n = s.progress;
      bump(stops, n === null ? "before the first choice" : String(n));
    });
    const minutes = done
      .map((s) => (Date.parse(s.completed_at) - Date.parse(s.started_at)) / 60000)
      .filter((m) => m > 0 && m < 240);
    return {
      sessions: rows.length,
      players: players.size,
      completed: done.length,
      completion_rate: rate(done.length, rows.length),
      abandoned: abandoned.length,
      still_active: rows.length - done.length - abandoned.length,
      replay_rate: rate(replayers, players.size),
      replayed_after_finishing: rate(doneAgain, completers.size),
      share_rate: rate(shared, done.length),
      shared_sessions: shared,
      share_methods: methods,
      median_minutes_to_finish: median(minutes) === null ? null : Math.round(median(minutes) * 10) / 10,
      stopped_at: Object.entries(stops).sort((a, b) => (a[0] === "before the first choice" ? -1 : b[0] === "before the first choice" ? 1 : Number(a[0]) - Number(b[0]))),
    };
  }

  // ---- quiz questions
  const Qs = new Map();
  const qKey = (p) => p.q + "@" + (p.content_version || "?");
  const qRec = (p) => {
    const k = qKey(p);
    if (!Qs.has(k)) Qs.set(k, { q: p.q, version: p.content_version || null, axis: p.axis || null, n: p.n || null, deep: !!p.deep, head: null, stem: null, a: null, b: null, viewed: new Set(), answers: new Map(), left: 0 });
    return Qs.get(k);
  };
  cohortEvents.forEach((e) => {
    if (!e.p.q) return;
    if (e.name === "quiz_question_viewed" && e.sid) {
      const r = qRec(e.p);
      r.viewed.add(e.sid);
      if (e.p.stem && !r.stem) { r.head = e.p.head; r.stem = e.p.stem; r.a = e.p.a; r.b = e.p.b; }
    } else if (e.name === "quiz_answer_submitted" && e.sid) {
      const r = qRec(e.p);
      r.viewed.add(e.sid);
      r.answers.set(e.sid, e.p); // the latest answer wins when someone goes back and changes it
    }
  });
  // who left on which question: the last question seen in a quiz that was never finished
  sessions.filter((s) => s.experience_type === "compass" && isAbandoned(s)).forEach((s) => {
    let last = null;
    (bySession.get(s.id) || []).forEach((e) => {
      if (e.name === "quiz_question_viewed" && e.p.q) last = qKey(e.p);
    });
    if (last && Qs.has(last)) Qs.get(last).left++;
  });
  const allMs = [];
  const qRows = Array.from(Qs.values()).map((r) => {
    let scored = 0, both = 0, skipped = 0, strong = 0;
    const picked = {};
    const ms = [];
    r.answers.forEach((a) => {
      if (a.answer === "skip") { skipped++; return; }
      if (a.answer === "both") both++;
      else {
        scored++;
        if (a.answer === "strong") strong++;
        bump(picked, a.picked || "(not recorded)");
      }
      if (typeof a.ms === "number") { ms.push(a.ms); allMs.push(a.ms); }
    });
    const answered = scored + both;
    const sides = Object.values(picked).sort((x, y) => x - y);
    const minShare = scored && sides.length > 1 ? sides[0] / scored : scored ? 0 : null;
    return {
      q: r.q, version: r.version, axis: r.axis, n: r.n, deep: r.deep, head: r.head, stem: r.stem,
      option_a: r.a, option_b: r.b,
      viewed: r.viewed.size, answered, skipped, both, strong_share: rate(strong, scored),
      picked: top(picked, 4).map(([text, count]) => ({ text, count, share: rate(count, scored) })),
      both_share: rate(both, answered),
      unsure_share: rate(both + skipped, answered + skipped),
      minority_share: minShare,
      median_seconds: secs(median(ms)),
      left_here: r.left,
      left_share: rate(r.left, r.viewed.size),
      small_sample: answered < MIN_N,
      flags: [],
    };
  });
  const overallQMs = median(allMs);
  const leftRates = qRows.filter((r) => r.viewed >= MIN_N).map((r) => r.left_share);
  const avgLeft = leftRates.length ? leftRates.reduce((a, b) => a + b, 0) / leftRates.length : null;
  qRows.forEach((r) => {
    if (r.answered >= MIN_N && r.minority_share !== null && r.minority_share >= 0.35 && r.answered - r.both >= MIN_N) r.flags.push("divided");
    if (r.answered + r.skipped >= MIN_N && r.unsure_share >= 0.2) r.flags.push("many unsure");
    if (r.answered >= MIN_N && overallQMs && r.median_seconds * 1000 >= overallQMs * 1.5) r.flags.push("slow");
    if (r.viewed >= MIN_N && avgLeft !== null && r.left_here >= 3 && r.left_share >= avgLeft * 2) r.flags.push("people leave here");
  });
  qRows.sort((a, b) => b.answered - a.answered || String(a.q).localeCompare(String(b.q)));

  // how answers lean on each axis (descriptive of whoever took the quiz through these routes)
  const axes = {};
  Qs.forEach((r) => {
    if (!r.axis) return;
    const a = axes[r.axis] || (axes[r.axis] = { axis: r.axis, answers: 0, negative: 0, positive: 0, both: 0 });
    r.answers.forEach((x) => {
      if (x.answer === "skip") return;
      a.answers++;
      if (x.answer === "both" || x.value === 0) a.both++;
      else if (x.value < 0) a.negative++;
      else if (x.value > 0) a.positive++;
    });
  });

  // ---- game decisions
  const decisionKey = (p) => {
    const id = p.card !== null && p.card !== undefined ? "c" + p.card : String(p.says || p.who || "").slice(0, 80);
    return (p.continue_only ? "continue" : p.kind || "desk") + "|" + id + "@" + (p.content_version || "?");
  };
  const D = new Map();
  const dRec = (p) => {
    const k = decisionKey(p);
    if (!D.has(k)) D.set(k, { kind: p.continue_only ? "continue" : p.kind || "desk", card: p.card === undefined ? null : p.card, version: p.content_version || null, who: null, says: null, l: null, c: null, r: null, shown: new Set(), decided: new Map(), history: new Set(), left: 0, ns: [] });
    return D.get(k);
  };
  cohortEvents.forEach((e) => {
    if (e.name === "game_card_viewed" && e.sid) {
      const r = dRec(e.p);
      r.shown.add(e.sid);
      if (!r.says) { r.who = e.p.who; r.says = e.p.says; r.l = e.p.l; r.c = e.p.c; r.r = e.p.r; }
      if (Number.isFinite(e.p.n)) r.ns.push(e.p.n);
    } else if (e.name === "game_decision_made" && e.sid) {
      const r = dRec(e.p);
      r.shown.add(e.sid);
      if (!r.says) { r.who = e.p.who; r.says = e.p.says; }
      r.decided.set(e.sid, e.p);
    } else if (e.name === "game_history_opened" && e.sid) {
      // matched to a card below, by session and position
    }
  });
  sessions.filter((s) => s.experience_type === "president" && isAbandoned(s)).forEach((s) => {
    let last = null;
    (bySession.get(s.id) || []).forEach((e) => {
      if (e.name === "game_card_viewed") last = decisionKey(e.p);
    });
    if (last && D.has(last)) D.get(last).left++;
  });
  // "This happened in Nigeria" opened: credit the card shown at that position in that session
  const cardAt = new Map();
  cohortEvents.forEach((e) => {
    if (e.name === "game_card_viewed" && e.sid) cardAt.set(e.sid + "#" + e.p.n, decisionKey(e.p));
  });
  cohortEvents.forEach((e) => {
    if (e.name === "game_history_opened" && e.sid) {
      const k = cardAt.get(e.sid + "#" + e.p.n);
      if (k && D.has(k)) D.get(k).history.add(e.sid);
    }
  });
  const allDMs = [];
  const dRows = Array.from(D.values()).map((r) => {
    const choices = {};
    const ms = [];
    r.decided.forEach((d) => {
      bump(choices, d.choice_text || "(not recorded)");
      if (typeof d.ms === "number") { ms.push(d.ms); allDMs.push(d.ms); }
    });
    const decided = r.decided.size;
    const sides = Object.values(choices).sort((x, y) => x - y);
    return {
      kind: r.kind, card: r.card, version: r.version, who: r.who, says: r.says,
      options: { l: r.l, c: r.c, r: r.r },
      shown: r.shown.size, decided,
      choices: top(choices, 4).map(([text, count]) => ({ text, count, share: rate(count, decided) })),
      minority_share: decided && sides.length > 1 ? sides[0] / decided : decided ? 0 : null,
      median_seconds: secs(median(ms)),
      avg_position: r.ns.length ? Math.round(r.ns.reduce((a, b) => a + b, 0) / r.ns.length) : null,
      left_here: r.left,
      left_share: rate(r.left, r.shown.size),
      history_opened: r.history.size,
      history_rate: rate(r.history.size, r.shown.size),
      small_sample: decided < MIN_N,
      flags: [],
    };
  });
  const overallDMs = median(allDMs);
  const dLeft = dRows.filter((r) => r.shown >= MIN_N).map((r) => r.left_share);
  const dAvgLeft = dLeft.length ? dLeft.reduce((a, b) => a + b, 0) / dLeft.length : null;
  dRows.forEach((r) => {
    if (r.kind === "continue") return;
    if (r.decided >= MIN_N && r.minority_share !== null && r.minority_share >= 0.35) r.flags.push("divided");
    if (r.decided >= MIN_N && overallDMs && r.median_seconds * 1000 >= overallDMs * 1.5) r.flags.push("slow");
    if (r.shown >= MIN_N && dAvgLeft !== null && r.left_here >= 3 && r.left_share >= dAvgLeft * 2) r.flags.push("people leave here");
    if (r.shown >= MIN_N && r.history_opened >= 3 && r.history_rate >= 0.25) r.flags.push("history note opened often");
  });
  dRows.sort((a, b) => b.decided - a.decided || b.shown - a.shown);

  // time on each consequence screen: until the next card in that session
  const cons = new Map();
  bySession.forEach((list, sid) => {
    if (!sidSet.has(sid)) return;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.name !== "game_consequence_viewed") continue;
      let next = null;
      for (let j = i + 1; j < list.length; j++) {
        if (list[j].name === "game_card_viewed" || list[j].name === "game_ending_viewed") { next = list[j]; break; }
      }
      const key = (e.p.title || "(untitled)") + "@" + (e.p.content_version || "?");
      const r = cons.get(key) || { title: e.p.title || "(untitled)", version: e.p.content_version || null, text: e.p.text || null, views: new Set(), dwell: [] };
      r.views.add(sid);
      if (next) { const d = next.t - e.t; if (d >= 0 && d < 600000) r.dwell.push(d); }
      cons.set(key, r);
    }
  });
  const consequences = Array.from(cons.values())
    .map((r) => ({ title: r.title, version: r.version, text: r.text, sessions: r.views.size, median_seconds: secs(median(r.dwell)) }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 60);

  // ---- outcomes
  const endings = {};
  const endSessions = new Set();
  cohortEvents.forEach((e) => {
    if (e.name === "game_ending_viewed" && e.sid && !endSessions.has(e.sid)) {
      endSessions.add(e.sid);
      // the headline the player saw ("They voted you out."); older rows only have the code
      bump(endings, e.p.title ? e.p.title + (e.p.presidency ? " (" + e.p.presidency + ")" : "") : e.p.presidency || "(untitled)");
    }
  });
  const arch = {};
  let archN = 0;
  compass.forEach((c) => {
    if (!sidSet.has(c.session_id)) return;
    archN++;
    bump(arch, c.archetype);
  });
  const outc = {};
  let outN = 0;
  president.forEach((c) => {
    if (!sidSet.has(c.session_id)) return;
    outN++;
    bump(outc, c.final_outcome);
  });
  const share = (m, n) => top(m, 40).map(([label, count]) => ({ label, count, share: rate(count, n) }));

  return {
    cohort: opts.cohort || "all",
    min_sample: MIN_N,
    channels,
    campaigns,
    experiences: { president: experience("president"), compass: experience("compass") },
    quiz: { questions: qRows.slice(0, 120), axes: Object.values(axes) },
    game: { decisions: dRows.slice(0, 200), consequences },
    outcomes: {
      archetypes: { n: archN, rows: share(arch, archN) },
      president_outcomes: { n: outN, rows: share(outc, outN) },
      endings: { n: endSessions.size, rows: share(endings, endSessions.size) },
    },
  };
}

module.exports = { buildReport, median, MIN_N };
