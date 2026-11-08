// Where a first visit came from. The page sends what it saw (utm_* parameters, which
// kind of ad click id was present, the referring site's host); this turns that into
// the source / medium / campaign stored on the participant, and the dashboard turns
// those into a channel. Click id VALUES are never sent or stored, only which kind.

const OWN_HOSTS = ["ifnayou.com"];

function clean(v, max) {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001f\u007f]/g, "").trim().toLowerCase().slice(0, max || 64);
  return s && s !== "undefined" && s !== "null" ? s : null;
}

function cleanHost(v) {
  let h = clean(v, 100);
  if (!h) return null;
  h = h.replace(/^https?:\/\//, "").split(/[\/?#]/)[0].replace(/^www\./, "").replace(/^m\./, "");
  if (!h || OWN_HOSTS.some((o) => h === o || h.endsWith("." + o))) return null;
  return h;
}

/** Returns {source, medium, campaign, referrer}, or null for a page that predates
 * source tracking (it sends no src_v), so those stay "unknown" rather than "direct". */
function classifySource(body) {
  if (!body || body.src_v !== 1) return null;
  const utmSource = clean(body.utm_source);
  const utmMedium = clean(body.utm_medium);
  const campaign = clean(body.utm_campaign, 100);
  const click = clean(body.click_id, 12);
  const ref = cleanHost(body.referrer);

  let source, medium;
  if (utmSource) {
    source = utmSource;
    medium = utmMedium || (click === "gclid" ? "cpc" : click === "fbclid" ? "fbclid" : "none");
  } else if (click === "gclid") {
    source = "google";
    medium = "cpc";
  } else if (click === "fbclid") {
    source = "meta";
    medium = "fbclid";
  } else if (click === "msclkid") {
    source = "bing";
    medium = "cpc";
  } else if (ref) {
    source = ref;
    medium = "referral";
  } else {
    source = "direct";
    medium = "none";
  }
  return { source, medium, campaign, referrer: ref };
}

const PAID_MEDIUM = /^(cpc|ppc|paid|paidsocial|paid[ _-]?social|paid[ _-]?search|display|cpm)$/;
const GOOGLE = /^(google|googleads|google[ _-]?ads|adwords|g)$/;
const META = /^(meta|facebook|fb|instagram|ig|facebook[ _-]?ads|meta[ _-]?ads|fb[ _-]?ads|ig[ _-]?ads)$/;

/** Coarse channel for a participant, used for cohort comparison on the dashboard. */
function channelOf(source, medium) {
  if (!source) return "Before source tracking";
  const s = String(source).toLowerCase();
  const m = String(medium || "").toLowerCase();
  if (PAID_MEDIUM.test(m)) {
    if (GOOGLE.test(s)) return "Google ads";
    if (META.test(s)) return "Meta ads";
    return "Other paid";
  }
  if (m === "fbclid") return "Meta click (untagged)";
  if (s === "direct") return "Direct";
  if (m === "referral") return "Referral";
  return "Tagged, not paid";
}

const PAID_CHANNELS = new Set(["Google ads", "Meta ads", "Meta click (untagged)", "Other paid"]);

module.exports = { classifySource, channelOf, PAID_CHANNELS, cleanHost };
