// Basic sanity check, not full RFC 5322 validation - just enough to reject
// garbage input and a line break (relevant anywhere the value flows into a
// real email header field, e.g. contactController.js's replyTo/subject).
// Shared here instead of redeclared per-controller so it can't drift the
// way ANNUAL_DEMAND_KWH did (see swales-services/src/lib/energyDemand.js).
const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmailFormat(email) {
  return typeof email === "string" && !/[\r\n]/.test(email) && EMAIL_FORMAT_REGEX.test(email);
}

module.exports = { EMAIL_FORMAT_REGEX, isValidEmailFormat };
