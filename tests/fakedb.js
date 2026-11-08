// A small in-memory stand-in for the Supabase client, enough for /api/track and /api/admin/stats.
let uid = 0;
const newId = () => "00000000-0000-4000-8000-" + String(++uid).padStart(12, "0");
function makeDb(seed) {
  const tables = { participants: [], sessions: [], event_log: [], compass_results: [], president_results: [], ...(seed || {}) };
  const failFk = { on: false };
  function from(name) {
    const st = { name, filters: [], order: [], range: null, limit: null, op: "select", row: null, patch: null, head: false, single: null, count: null };
    const run = () => {
      const rows = tables[name];
      if (st.op === "upsert") {
        const ex = rows.find((r) => r.id === st.row.id);
        if (ex) Object.assign(ex, st.row);
        else rows.push({ started_at: new Date().toISOString(), completion_status: "in_progress", ...st.row });
        return { data: null, error: null };
      }
      if (st.op === "insert") {
        if (name === "event_log" && failFk.on && st.row.session_id && !tables.sessions.some((s) => s.id === st.row.session_id))
          return { data: null, error: { code: "23503", message: "fk" } };
        const r = { id: name === "event_log" ? rows.length + 1 : newId(), first_seen_at: new Date().toISOString(), occurred_at: new Date().toISOString(), ...st.row };
        rows.push(r);
        return { data: st.single ? r : [r], error: null };
      }
      let out = rows.filter((r) => st.filters.every((f) => f(r)));
      if (st.op === "update") { out.forEach((r) => Object.assign(r, st.patch)); return { data: null, error: null }; }
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
      select(cols, o) { if (st.op === "select") st.op = "select"; if (o && o.head) st.head = true; return q; },
      upsert(row) { st.op = "upsert"; st.row = row; return q; },
      insert(row) { st.op = "insert"; st.row = row; return q; },
      update(p) { st.op = "update"; st.patch = p; return q; },
      eq(c, v) { st.filters.push((r) => r[c] === v); return q; },
      in(c, vs) { st.filters.push((r) => vs.includes(r[c])); return q; },
      gte(c, v) { st.filters.push((r) => r[c] >= v); return q; },
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
