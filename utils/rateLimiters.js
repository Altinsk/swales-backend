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
