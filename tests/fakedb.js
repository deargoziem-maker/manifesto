// A small in-memory stand-in for the Supabase client, enough for the /api handlers and their tests.
let uid = 0;
const newId = () => "00000000-0000-4000-8000-" + String(++uid).padStart(12, "0");
// primary keys and unique columns for the tables that have them (default: "id")
const KEYS = {
  rooms: { pk: ["code"] },
  room_players: { pk: ["id"], unique: [["token"]] },
  room_votes: { pk: ["room_code", "player_id", "turn"] },
  group_results: { pk: ["group_code", "nick"] },
};
function makeDb(seed) {
  const tables = { participants: [], sessions: [], event_log: [], compass_results: [], president_results: [], rooms: [], room_players: [], room_votes: [], group_results: [], ...(seed || {}) };
  const failFk = { on: false };
  const clash = (name, rows, row, ignore) => {
    const cfg = KEYS[name] || { pk: ["id"] };
    return [cfg.pk, ...(cfg.unique || [])].some((cols) => rows.some((r) => r !== ignore && cols.every((c) => r[c] !== undefined && r[c] === row[c])));
  };
  function from(name) {
    const st = { name, filters: [], order: [], range: null, limit: null, op: "select", row: null, patch: null, head: false, single: null, onConflict: null };
    const run = () => {
      const rows = tables[name];
      if (st.op === "upsert") {
        const cfg = KEYS[name] || { pk: ["id"] };
        const cols = st.onConflict ? st.onConflict.split(",") : cfg.pk;
        const ex = rows.find((r) => cols.every((c) => r[c] === st.row[c]));
        if (ex) Object.assign(ex, st.row);
        else rows.push({ started_at: new Date().toISOString(), completion_status: "in_progress", ...st.row });
        return { data: null, error: null };
      }
      if (st.op === "insert") {
        if (name === "event_log" && failFk.on && st.row.session_id && !tables.sessions.some((s) => s.id === st.row.session_id))
          return { data: null, error: { code: "23503", message: "fk" } };
        const hasId = !["rooms", "room_votes", "group_results"].includes(name);
        const r = { ...(hasId ? { id: name === "event_log" ? rows.length + 1 : newId() } : {}), first_seen_at: new Date().toISOString(), occurred_at: new Date().toISOString(), ...st.row };
        if (name !== "event_log" && clash(name, rows, r)) return { data: null, error: { code: "23505", message: "duplicate" } };
        rows.push(r);
        return { data: st.single ? r : [r], error: null };
      }
      let out = rows.filter((r) => st.filters.every((f) => f(r)));
      if (st.op === "update") { out.forEach((r) => Object.assign(r, st.patch)); return { data: null, error: null }; }
      if (st.op === "delete") {
        const gone = new Set(out);
        tables[name] = rows.filter((r) => !gone.has(r));
        if (name === "rooms") {
          const codes = new Set(out.map((r) => r.code));
          tables.room_players = tables.room_players.filter((p) => !codes.has(p.room_code));
          tables.room_votes = tables.room_votes.filter((v) => !codes.has(v.room_code));
        }
        return { data: null, error: null };
      }
      st.order.forEach(([c, asc]) => out.sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1)));
      const n = out.length;
      if (st.range) out = out.slice(st.range[0], st.range[1] + 1);
      if (st.limit !== null) out = out.slice(0, st.limit);
      if (st.head) return { data: null, count: n, error: null };
      if (st.single === "maybe") return { data: out[0] || null, error: null };
      if (st.single === "one") return { data: out[0], error: null };
      return { data: out, error: null };
    };
    const q = {
      select(cols, o) { if (o && o.head) st.head = true; return q; },
      upsert(row, o) { st.op = "upsert"; st.row = row; st.onConflict = o && o.onConflict; return q; },
      insert(row) { st.op = "insert"; st.row = row; return q; },
      update(p) { st.op = "update"; st.patch = p; return q; },
      delete() { st.op = "delete"; return q; },
      eq(c, v) { st.filters.push((r) => r[c] === v); return q; },
      in(c, vs) { st.filters.push((r) => vs.includes(r[c])); return q; },
      gte(c, v) { st.filters.push((r) => r[c] >= v); return q; },
      lt(c, v) { st.filters.push((r) => r[c] < v); return q; },
      order(c, o) { st.order.push([c, !(o && o.ascending === false)]); return q; },
      range(a, b) { st.range = [a, b]; return q; },
      limit(n) { st.limit = n; return q; },
      maybeSingle() { st.single = "maybe"; return q; },
      single() { st.single = "one"; return q; },
      then(res, rej) { try { return Promise.resolve(run()).then(res, rej); } catch (e) { return Promise.reject(e); } },
    };
    return q;
  }
  return { from, tables, failFk };
}
module.exports = { makeDb, newId };
