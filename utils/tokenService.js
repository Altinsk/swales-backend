const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

// The frontends and backend don't share a registrable domain in every
// deployed environment - designer.swales.app/api.swales.app do (same-site),
// but the pre-cutover *.vercel.app URLs used for the rebuild are each their
// own site, so a `lax` cookie would silently never be sent on a cross-site
// fetch/XHR call. `none` (with `secure`, required alongside it) works for
// both cases, at the cost of requiring HTTPS - which is why `secure` still
// gates on production and dev keeps `lax` (localhost is plain http).
exports.sessionCookieOptions = (expires) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  ...(expires ? { expires } : {}),
});

exports.generateToken = async (email, firstName) => {
  return jwt.sign({ email, firstName }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};
exports.generateResetToken = async (email) => {
  return jwt.sign({ email }, process.env.RESET_SECRET, { expiresIn: "15m" });
};
exports.verifyToken = async (token) => {
  return jwt.verify(token, process.env.JWT_SECRET).email;
};
exports.verifyResetToken = async (token) => {
  return jwt.verify(token, process.env.RESET_SECRET).email;
};

// Email-verification links previously carried a full generateToken() -
// the same 30-day session token used for real logins - so intercepting a
// verification email (forwarded, cached by a mail provider, auto-clicked
// by a corporate security scanner) handed over a working session, not
// just "email verified" status. Signed with its own secret so it's
// useless as a Bearer token against JWT_SECRET-protected routes even if
// intercepted, regardless of its expiry.
exports.generateEmailVerifyToken = async (email) => {
  return jwt.sign({ email }, process.env.EMAIL_VERIFY_SECRET, {
    expiresIn: "24h",
  });
};
exports.verifyEmailVerifyToken = async (token) => {
  return jwt.verify(token, process.env.EMAIL_VERIFY_SECRET).email;
};

// A JWT is stateless — its signature/expiry checking out doesn't mean the
// session should still be trusted. Called after the caller has already
// loaded the User row (so this adds no extra query): rejects a token
// issued before the user's last password change (stolen-token kill switch,
// since nothing else invalidates old tokens), and rejects any token for a
// blacklisted user (the IsBlackListed column existed but nothing checked it).
exports.assertSessionValid = (token, user) => {
  if (user.IsBlackListed) {
    throw new Error("Account access revoked");
  }
  if (user.PasswordChangedAt) {
    const { iat } = jwt.decode(token);
    if (iat * 1000 < new Date(user.PasswordChangedAt).getTime()) {
      throw new Error("Session invalidated by a more recent password change");
    }
  }
};
