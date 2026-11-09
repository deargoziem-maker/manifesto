// Everything a stranger's browser can send to /api/room and /api/group is rebuilt here from
// scratch, field by field, before it is stored or handed to another player. The page puts
// some of these values into HTML attributes and inline styles (a ministry key, a bar width,
// a button's choice letter), so a host that sent something crafted could otherwise reach
// the ministers' browsers. Only the shapes the game itself produces get through.
const crypto = require("crypto");
const { isUuid } = require("./util");

const CTRL = /[\u0000-\u001f\u007f<>]/g;
const KEY = /^[a-z]{2,12}$/;
const CHOICES = ["l", "r", "c"];
const AGENDA_KINDS = ["sab", "own", "rival", "heard", "survive"];

function str(v, max) {
  return typeof v === "string" ? v.replace(CTRL, "").replace(/\s+/g, " ").trim().slice(0, max) : "";
}
function int(v, lo, hi) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : 0;
}
const nick = (v) => str(v, 20);
const bloc = (v) => (typeof v === "string" && KEY.test(v) ? v : null);

const ROOM_CODE = /^[A-Z]{4}$/;
const GROUP_CODE = /^[A-Z0-9]{5,8}$/;
const roomCode = (v) => (typeof v === "string" && ROOM_CODE.test(v.toUpperCase()) ? v.toUpperCase() : null);
const groupCode = (v) => (typeof v === "string" && GROUP_CODE.test(v.toUpperCase()) ? v.toUpperCase() : null);

// the letters the page uses for codes: no I, L, O or U, so a code read aloud is not misheard
const ROOM_LETTERS = "ABCDEFGHJKMNPQRSTVWXYZ";
function newRoomCode() {
  let s = "";
  for (let i = 0; i < 4; i++) s += ROOM_LETTERS[crypto.randomInt(ROOM_LETTERS.length)];
  return s;
}
const newSecret = () => crypto.randomBytes(16).toString("hex");

function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function cleanStake(s) {
  const out = {};
  if (!s || typeof s !== "object") return out;
  CHOICES.forEach((k) => {
    const m = s[k];
    if (!m || typeof m !== "object") return;
    const o = {};
    Object.keys(m).slice(0, 12).forEach((b) => {
      if (KEY.test(b) && Number.isFinite(Number(m[b]))) o[b] = int(m[b], -100, 100);
    });
    out[k] = o;
  });
  return out;
}

function cleanCard(c) {
  if (!c || typeof c !== "object") return null;
  const opts = (Array.isArray(c.opts) ? c.opts : [])
    .slice(0, 3)
    .filter((o) => o && CHOICES.includes(o.k))
    .map((o) => ({ k: o.k, t: str(o.t, 400) }));
  if (!opts.length) return null;
  return { who: str(c.who, 160), says: str(c.says, 1400), opts, stake: cleanStake(c.stake), turn: int(c.turn, 0, 100000) };
}

function cleanResult(r) {
  r = r && typeof r === "object" ? r : {};
  return {
    title: str(r.title, 160), kick: str(r.kick, 160), name: str(r.name, 80), end: str(r.end, 24),
    days: int(r.days, 0, 100000), term: int(r.term, 1, 9), kept: int(r.kept, 0, 100000), tested: int(r.tested, 0, 100000),
  };
}

function cleanState(s) {
  s = s && typeof s === "object" ? s : {};
  const out = { phase: ["lobby", "play", "end"].includes(s.phase) ? s.phase : "lobby" };
  out.seats = {};
  Object.keys(s.seats || {}).slice(0, 12).forEach((id) => {
    if (!isUuid(id)) return;
    const v = s.seats[id] || {};
    out.seats[id] = { nick: nick(v.nick), role: str(v.role, 60), b: bloc(v.b) };
  });
  out.blocs = {};
  Object.keys(s.blocs || {}).slice(0, 12).forEach((k) => {
    if (KEY.test(k) && Number.isFinite(Number(s.blocs[k]))) out.blocs[k] = int(s.blocs[k], 0, 100);
  });
  out.card = cleanCard(s.card);
  const l = s.last && typeof s.last === "object" ? s.last : null;
  out.last = l && CHOICES.includes(l.side)
    ? { turn: int(l.turn, 0, 100000), side: l.side, t: str(l.t, 400), over: !!l.over, n: int(l.n, 0, 50) }
    : null;
  out.day = int(s.day, 0, 100000);
  out.clock = str(s.clock, 40);
  out.over = int(s.over, 0, 100000);
  if (s.result) out.result = cleanResult(s.result);
  if (Array.isArray(s.reveal)) {
    out.reveal = s.reveal
      .slice(0, 12)
      .filter((r) => r && isUuid(r.id))
      .map((r) => ({
        id: r.id, nick: nick(r.nick), role: str(r.role, 60), txt: str(r.txt, 300),
        sab: !!r.sab, done: !!r.done, agree: int(r.agree, 0, 100000), cast: int(r.cast, 0, 100000),
      }));
  }
  return out;
}

/** {playerId: {role, b, agenda}} for the ids in `allowed`; anything else is dropped. */
function cleanSecrets(sec, allowed) {
  const out = {};
  if (!sec || typeof sec !== "object") return out;
  Object.keys(sec).slice(0, 12).forEach((id) => {
    if (!allowed.has(id)) return;
    const v = sec[id] || {};
    const a = v.agenda && typeof v.agenda === "object" ? v.agenda : null;
    out[id] = {
      role: str(v.role, 60),
      b: bloc(v.b),
      agenda: a && AGENDA_KINDS.includes(a.t)
        ? { t: a.t, b: bloc(a.b), o: bloc(a.o), txt: str(a.txt, 300) }
        : null,
    };
  });
  return out;
}

module.exports = {
  str, int, nick, roomCode, groupCode, newRoomCode, newSecret, sameSecret,
  cleanState, cleanSecrets, cleanResult, CHOICES,
};
