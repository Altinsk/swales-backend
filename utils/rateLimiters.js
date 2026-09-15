const rateLimit = require("express-rate-limit");
const { errorResponse } = require("./responseHelper");

const handler = (req, res) => {
  errorResponse(res, "Too many requests, please try again later.", null, 429);
};

// loginLimiter/sensitiveActionLimiter are FACTORY FUNCTIONS, not pre-built
// middleware - each call creates its own independent rate-limit store. They
// used to be built once here and the same instance imported into every
// route that needed "a login-shaped limit" or "a sensitive-action-shaped
// limit" - express-rate-limit keys its store by IP only, with no idea which
// route it's mounted on, so every route sharing one instance was actually
// sharing one combined budget. `sensitiveActionLimiter` alone was reused
// across 7 unrelated actions (register, forgot-password, reset-password,
// resend-verification, change-password, the contact form, and newsletter
// signup) - a user tripping any one of them (e.g. mistyping a password
// reset a few times) could find themselves locked out of the others too,
// for up to an hour, even though each route's own comment describes the
// limit as if it were that route's own 5-per-hour budget. Each call site
// now calls the factory to get its own store - same limits, no shared
// budget. See future-concerns.md for the 2026-09-15 bug-hunt entry this
// came from.
exports.loginLimiter = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
  });

exports.sensitiveActionLimiter = () =>
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
  });

// Authenticated project saves (createProject/updateProject) each upload a
// base64 thumbnail to Vercel Blob storage with no limit of their own -
// registration is cheap (one email), so a scripted client could register
// once and then hammer these routes as fast as the network allows, running
// up real storage costs. Keyed by the authenticated user's id (set by
// projectController.js's `protect` middleware, which runs first) rather
// than IP, so this doesn't accidentally throttle unrelated users behind the
// same NAT/office network the way an IP-keyed limiter would.
exports.authenticatedWriteLimiter = () =>
  rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.UserId?.toString() || req.ip,
    handler,
  });

// publicActionLimiter stays a true singleton, deliberately shared across the
// GWA wind-atlas proxy, share-link creation, and PDF upload - all
// unauthenticated endpoints with no other limit, where one combined budget
// is the actual intent (see the routes that use it), not an oversight.
exports.publicActionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
