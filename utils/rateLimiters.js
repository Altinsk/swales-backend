const rateLimit = require("express-rate-limit");
const { errorResponse } = require("./responseHelper");

const handler = (req, res) => {
  errorResponse(res, "Too many requests, please try again later.", null, 429);
};

// Login/Google sign-in: generous enough for a real user mistyping a
// password a few times, tight enough to make brute-forcing impractical.
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Register/forgot-password/reset-password: legitimate users hit these
// rarely, so a stricter limit here doesn't cost real users much while
// closing off spam-registration and password-reset-email-bombing abuse.
exports.sensitiveActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Public, unauthenticated endpoints with no other limit (the GWA wind-atlas
// proxy, share-link creation, PDF upload): generous enough that a visitor
// checking several sites in one session never notices it, tight enough that
// scripting one of these into a free third-party-API relay or a storage-cost
// bomb stops being practical.
exports.publicActionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
