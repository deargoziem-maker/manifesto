const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(v) {
  return typeof v === "string" && UUID_RE.test(v);
}

/** Loose anonymous_id check: client-generated UUID, but don't hard-fail the
 * request on shape alone since we'd rather flag-and-keep than drop data. */
function isPlausibleAnonId(v) {
  return typeof v === "string" && v.length >= 8 && v.length <= 128;
}

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  return req.socket && req.socket.remoteAddress;
}

/** Vercel populates these geo headers at the edge on every request. */
function geo(req) {
  return {
    country: req.headers["x-vercel-ip-country"] || null,
  };
}

function deviceTypeFromUA(ua) {
  if (!ua) return null;
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

function sendJson(res, status, body) {
  res.status(status).setHeader("content-type", "application/json");
  res.send(JSON.stringify(body));
}

module.exports = { isUuid, isPlausibleAnonId, clientIp, geo, deviceTypeFromUA, sendJson };
