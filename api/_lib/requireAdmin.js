const crypto = require("crypto");

/**
 * Constant-time check of the Authorization: Bearer <token> header against
 * ADMIN_TOKEN. Returns true/false; the caller is responsible for the 401.
 */
function isAuthorizedAdmin(req) {
  const configured = process.env.ADMIN_TOKEN;
  if (!configured) return false;

  const header = req.headers["authorization"] || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;
  const supplied = match[1];

  const a = Buffer.from(supplied);
  const b = Buffer.from(configured);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { isAuthorizedAdmin };
