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

// `expiresIn` defaults to the "remembered" 30-day lifetime; login passes a
// short-lived value when the user left "remember me" unchecked, so a token
// that leaks off the browser (the cookie itself already dies on browser
// close in that case) is only ever usable for a day, not the full 30.
exports.generateToken = async (email, firstName, expiresIn = "30d") => {
  return jwt.sign({ email, firstName }, process.env.JWT_SECRET, {
    expiresIn,
  });
};
exports.generateResetToken = async (email) => {
  return jwt.sign({ email }, process.env.RESET_SECRET, { expiresIn: "15m" });
};
exports.verifyToken = async (token) => {
  return jwt.verify(token, process.env.JWT_SECRET).email;
};
// Returns `iat` too (not just email) - resetPassword needs it to detect
// reuse of an already-consumed reset link, see assertResetTokenFresh below.
exports.verifyResetToken = async (token) => {
  const decoded = jwt.verify(token, process.env.RESET_SECRET);
  return { email: decoded.email, iat: decoded.iat };
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
  // Same gap IsBlackListed had before the check above was added: the
  // IsDeleted column exists (models/user.js, the base migration) but
  // nothing anywhere reads it. Unexploitable today since no soft-delete
  // endpoint sets it yet, but the moment one ships, every session for that
  // account would otherwise keep working exactly as before.
  if (user.IsDeleted) {
    throw new Error("Account no longer exists");
  }
  if (user.PasswordChangedAt) {
    const { iat } = jwt.decode(token);
    if (iat * 1000 < new Date(user.PasswordChangedAt).getTime()) {
      throw new Error("Session invalidated by a more recent password change");
    }
  }
  // Same shape of check, for explicit logout instead of a password change -
  // see the SessionsInvalidatedAt migration's comment for why logout used to
  // do nothing server-side (only cleared the cookie) and what this closes.
  if (user.SessionsInvalidatedAt) {
    const { iat } = jwt.decode(token);
    if (iat * 1000 < new Date(user.SessionsInvalidatedAt).getTime()) {
      throw new Error("Session invalidated by logout");
    }
  }
};

// A reset token is a bare JWT with no server-side "used" flag, so anyone who
// gets hold of a valid reset link (forwarded, cached by a mail provider,
// auto-clicked by a corporate security scanner, browser history) can reuse
// it as many times as they like inside its 15-minute window. This closes
// that for free by reusing PasswordChangedAt, which a successful reset
// already bumps: the first use succeeds and sets PasswordChangedAt to now,
// so any token issued before that (a lower `iat`, including the same token
// replayed) is rejected on every subsequent attempt - the exact invariant
// assertSessionValid already enforces for login sessions, applied here to
// the reset flow itself.
exports.assertResetTokenFresh = (tokenIat, user) => {
  if (
    user.PasswordChangedAt &&
    tokenIat * 1000 < new Date(user.PasswordChangedAt).getTime()
  ) {
    throw new Error("This reset link has already been used");
  }
};
