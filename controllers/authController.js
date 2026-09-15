const { successResponse, errorResponse } = require("../utils/responseHelper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const {
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../utils/emailService");
const {
  generateToken,
  generateResetToken,
  verifyToken,
  verifyResetToken,
  assertSessionValid,
  assertResetTokenFresh,
  generateEmailVerifyToken,
  verifyEmailVerifyToken,
  sessionCookieOptions,
} = require("../utils/tokenService");
const { Op } = require("sequelize");
const normalizeEmail = require("../utils/normalizeEmail");
const { isValidEmailFormat } = require("../utils/emailFormat");
const { isValidPassword, PASSWORD_HINT } = require("../utils/passwordPolicy");

exports.register = async (req, res) => {
  const { firstName, lastName, password, dateOfBirth, src } = req.body;
  const email = normalizeEmail(req.body.email);
  // Without this, a non-string email (e.g. an array) sails through
  // normalizeEmail() untouched, and Sequelize compiles an array `where`
  // value into `IN (...)` - see the matching guard in login()/forgotPassword()
  // for the exploit this closes.
  if (!isValidEmailFormat(email))
    return errorResponse(res, "Please enter a valid email address.", null, 400);
  const checkUserEmailSimple = await User.findOne({
    where: { [Op.and]: [{ Email: email }, { loginType: "google" }] },
  });
  if (checkUserEmailSimple)
    return errorResponse(
      res,
      "This email is associated with a Google account. Please try logging in using the Google Sign-In option.",
      null,
      200,
    );
  let ExistingUser = await User.findOne({ where: { Email: email } });
  if (ExistingUser)
    return errorResponse(res, "User already exists", "Duplicate Email", 200);
  if (!isValidPassword(password))
    return errorResponse(res, PASSWORD_HINT, null, 400);
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  try {
    const user = await User.create({
      FirstName: firstName,
      LastName: lastName,
      Email: email,
      dateOfBirth: dateOfBirth,
      PasswordHash: hash,
      PasswordSalt: salt,
      DateLastUpdated: new Date(),
      loginType: "native",
      AuthToken: null,
    });
    const token = await generateEmailVerifyToken(user.Email);

    await sendVerificationEmail(user.Email, token, src);
    successResponse(res, `User registered, check email for verification`);
  } catch (err) {
    // The findOne-then-create above isn't atomic: two concurrent
    // registrations for the same new email (a double-submit, a client
    // retry) can both pass the "does this exist" check before either
    // commits. The DB's own unique constraint on Users.Email stops an
    // actual duplicate row, but the losing request used to fall through to
    // the generic err.message path below - a raw SequelizeUniqueConstraintError
    // message sent to the client instead of the same graceful "User
    // already exists" response the code already gives for the non-race case.
    if (err.name === "SequelizeUniqueConstraintError") {
      return errorResponse(res, "User already exists", null, 200);
    }
    console.error("Register error:", err);
    errorResponse(res, "Failed to register user", err, 500);
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { src } = req.body;
    const email = normalizeEmail(req.body.email);
    // Same array-injection guard as login()/forgotPassword() - see there.
    if (!isValidEmailFormat(email))
      return successResponse(
        res,
        "If that email is registered and not yet verified, a new verification link has been sent.",
      );
    const user = await User.findOne({ where: { Email: email } });
    // Same response whether the account doesn't exist, is already verified,
    // or a new link was actually sent - mirrors forgotPassword's
    // enumeration-safe pattern above.
    if (user && !user.Verified) {
      const token = await generateEmailVerifyToken(user.Email);
      await sendVerificationEmail(user.Email, token, src);
    }
    successResponse(
      res,
      "If that email is registered and not yet verified, a new verification link has been sent.",
    );
  } catch (error) {
    // sendVerificationEmail can throw (e.g. Resend API rejection) - without
    // this catch, an async Express 4 handler that rejects just hangs the
    // request instead of responding (confirmed no global rejection handler
    // exists in server.js).
    errorResponse(res, "Could not send the verification email. Please try again shortly.", error, 500);
  }
};

exports.verifyEmail = async (req, res) => {
  const { token, src } = req.params;
  // Computed before the try block (and thus visible to the catch block
  // below too) - confirmed live 2026-09-05 that having this declared
  // inside try instead crashes the process with "ReferenceError: loginUrl
  // is not defined" the moment verifyEmailVerifyToken throws, which is
  // every single expired or invalid link - i.e. the entire error-path this
  // redirect page exists for. On Vercel this manifested as the request
  // hanging until the platform's own timeout rather than a fast response,
  // since nothing catches the resulting unhandled rejection.
  const loginUrl =
    src == "swales"
      ? `${process.env.SWALES_APP_URL}/login`
      : `${process.env.DESIGNER_APP_URL}`;

  try {
    const email = await verifyEmailVerifyToken(token); // Assuming this throws error if invalid

    await User.update(
      { Verified: true, DateLastUpdated: new Date() },
      { where: { Email: email } },
    );

    // 1. Send SUCCESS HTML
    const html = getRedirectHtml(
      true,
      "Your email has been successfully verified. You can now access your account.",
      loginUrl,
    );
    res.send(html);
  } catch (error) {
    console.error("Verification Error:", error);

    // 2. Send ERROR HTML
    // We still redirect to login, but show an error message first
    const html = getRedirectHtml(
      false,
      "This verification link is invalid or has expired. Please try requesting a new one.",
      loginUrl,
    );
    res.status(400).send(html);
  }
};

exports.login = async (req, res) => {
  const { password, rememberMe } = req.body;
  const email = normalizeEmail(req.body.email);
  // A non-string email (e.g. `["victim@x.com", "attacker@x.com"]`) would
  // otherwise reach Sequelize's `where` untouched and compile to an `IN
  // (...)` clause - letting one request test a password against a whole
  // batch of candidate emails (bypassing the per-IP rate limit's intent)
  // and, in forgotPassword's case, mint a real reset token for a victim
  // while the email carrying it also gets sent to an attacker-controlled
  // address included in the same array.
  if (!isValidEmailFormat(email))
    return errorResponse(res, "Invalid email or password.", null, 401);
  const checkUserEmailSimple = await User.findOne({
    where: { [Op.and]: [{ Email: email }, { loginType: "google" }] },
  });
  if (checkUserEmailSimple)
    return errorResponse(
      res,
      "This email is associated with a Google account. Please try logging in using the Google Sign-In option.",
      null,
      401,
    );
  const user = await User.findOne({ where: { Email: email } });
  // "No such user" and "wrong password" used to be two distinguishable
  // messages - the classic login-enumeration vector (an attacker can bulk-
  // check which emails are registered without ever needing a real
  // password), and inconsistent with forgotPassword's deliberately generic
  // response just above. Both now return the same message; email-verified
  // and Google-account status still get their own messages since knowing
  // "this email needs Google sign-in" or "check your inbox" is real,
  // low-risk UX value for a legitimate user who already knows the account
  // exists (they're looking at their own login form).
  if (!user) return errorResponse(res, "Invalid email or password.", null, 401);

  if (!user.Verified)
    return errorResponse(res, "Please verify your email first.", null, 401);

  if (!(await bcrypt.compare(password, user.PasswordHash)))
    return errorResponse(res, "Invalid email or password.", null, 401);
  await User.update({ DateLastLogin: new Date() }, { where: { Email: email } });

  // "Keep me logged in" unchecked now shortens the token's own lifetime
  // too, not just the cookie's persistence - previously every token was a
  // full 30 days regardless, so a token that leaked off the browser (copied
  // cookie value, compromised machine) outlived the "session-only" cookie
  // wrapping it by a huge margin.
  const accessToken = await generateToken(
    user.Email,
    user.dataValues.FirstName,
    rememberMe ? "30d" : "1d",
  );

  // "Keep me logged in" unchecked -> no `expires`, so it's a session cookie
  // the browser drops on close, instead of always issuing the 30-day
  // persistent cookie regardless of what the checkbox said (its previous
  // behavior - the control existed in the UI but did nothing).
  res.cookie(
    "token",
    accessToken,
    rememberMe
      ? sessionCookieOptions(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
      : sessionCookieOptions(),
  );

  successResponse(
    res,
    "login successfull!!",
    { accessToken, userName: user.dataValues.FirstName },
    user.UserId,
  );
};

exports.logout = async (req, res) => {
  // Previously this only cleared the client's cookie - a token that existed
  // outside the browser's cookie jar at logout time (copied cookie value,
  // compromised machine, a synced/backed-up cookie jar) stayed fully valid
  // for the rest of its life even though the user believed they'd logged
  // out. Bumping SessionsInvalidatedAt closes that: assertSessionValid now
  // rejects any token issued before it. Note this invalidates every session
  // for the account, not just this one device/tab - there's no per-session
  // tracking in this schema to scope it more narrowly. Best-effort: if the
  // request has no valid session to identify (already expired/missing
  // token), still clear the cookie and succeed rather than error - logging
  // out of a session that's already unusable should never fail.
  try {
    const user = await getUserIdFromRequest(req);
    await User.update(
      { SessionsInvalidatedAt: new Date() },
      { where: { UserId: user.UserId } },
    );
  } catch (error) {
    // No-op: nothing to invalidate for a request with no valid session.
  }
  res.clearCookie("token", sessionCookieOptions());
  successResponse(res, "Logged out");
};

exports.forgotPassword = async (req, res) => {
  try {
    const { source } = req.body;
    const email = normalizeEmail(req.body.email);
    // See login()'s matching guard - without this, an array-valued email
    // matches the victim's account via Sequelize's `IN (...)` compilation
    // and a valid reset token gets minted and emailed to every address in
    // the array, attacker-controlled ones included.
    if (!isValidEmailFormat(email))
      return successResponse(res, "If that email is registered, a reset link has been sent.");
    const user = await User.findOne({ where: { Email: email } });
    // Same response whether or not the account exists - a distinguishable
    // "User not found" here lets anyone enumerate every registered email.
    if (user) {
      const token = await generateResetToken(user.Email);
      await sendResetPasswordEmail(email, token, source);
    }
    successResponse(res, "If that email is registered, a reset link has been sent.");
  } catch (error) {
    // sendResetPasswordEmail can throw (e.g. Resend API rejection) - without
    // this catch, an async Express 4 handler that rejects just hangs the
    // request instead of responding.
    errorResponse(res, "Could not send the reset link. Please try again shortly.", error, 500);
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const { email, iat } = await verifyResetToken(token);
    if (!isValidPassword(newPassword))
      return errorResponse(res, PASSWORD_HINT, null, 400);
    const user = await User.findOne({ where: { Email: email } });
    if (!user) throw new Error("Invalid or expired token");
    // Rejects replay of an already-consumed reset link - see
    // assertResetTokenFresh's comment in tokenService.js.
    assertResetTokenFresh(iat, user);
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);
    await User.update(
      {
        PasswordHash: hash,
        PasswordSalt: salt,
        DateLastUpdated: new Date(),
        PasswordChangedAt: new Date(),
      },
      { where: { Email: email } },
    );
    successResponse(res, "Password reset successfully");
  } catch (error) {
    errorResponse(res, "Invalid or expired token", error, 400);
  }
};

const getUserIdFromRequest = async (req) => {
  // Primary path: the httpOnly cookie set on login. Falls back to an
  // Authorization header for any caller that isn't a browser with cookies.
  const authHeader = req.headers.authorization;
  const headerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
  const token = req.cookies?.token || headerToken;

  if (!token) {
    throw new Error("Not authenticated");
  }

  const email = await verifyToken(token);

  const user = await User.findOne({ where: { Email: email } });
  if (!user) throw new Error("User not found");

  assertSessionValid(token, user);

  return user;
};
exports.updateProfile = async (req, res) => {
  try {
    const user = await getUserIdFromRequest(req);
    const { firstName, lastName, dateOfBirth } = req.body;

    // 1. Update fields
    await User.update(
      {
        FirstName: firstName,
        LastName: lastName,
        DateOfBirth: dateOfBirth,
        DateLastUpdated: new Date(),
      },
      { where: { UserId: user.UserId } },
    );

    // 2. Fetch updated user
    const updatedUser = await User.findOne({ where: { UserId: user.UserId } });

    // 3. GENERATE NEW TOKEN with updated details
    // Ensure you pass the same arguments as you do in your login function
    const newToken = await generateToken(
      updatedUser.Email,
      updatedUser.FirstName,
    );

    // 4. Refresh the session cookie so it carries the updated details too
    res.cookie(
      "token",
      newToken,
      sessionCookieOptions(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    );

    // 5. Send new token in response
    successResponse(res, "Profile updated successfully", {
      firstName: updatedUser.FirstName,
      lastName: updatedUser.LastName,
      dateOfBirth: updatedUser.DateOfBirth,
      accessToken: newToken, // <--- SEND NEW TOKEN
    });
  } catch (error) {
    return errorResponse(res, error.message || "Update failed", error, 401);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await getUserIdFromRequest(req);

    // Return only necessary profile fields
    successResponse(res, "User profile fetched", {
      firstName: user.FirstName,
      lastName: user.LastName,
      email: user.Email,
      dateOfBirth: user.dateOfBirth,
      // Add any other fields you need here
    });
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Failed to fetch profile",
      error,
      401,
    );
  }
};

exports.changePassword = async (req, res) => {
  try {
    const user = await getUserIdFromRequest(req);
    const { currentPassword, newPassword } = req.body;

    // 1. Verify Current Password
    const isMatch = await bcrypt.compare(currentPassword, user.PasswordHash);
    if (!isMatch) {
      return errorResponse(res, "Incorrect current password", null, 400);
    }

    if (!isValidPassword(newPassword))
      return errorResponse(res, PASSWORD_HINT, null, 400);

    // 2. Hash New Password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    // 3. Update User
    await User.update(
      {
        PasswordHash: hash,
        PasswordSalt: salt,
        DateLastUpdated: new Date(),
        PasswordChangedAt: new Date(),
      },
      { where: { UserId: user.UserId } },
    );

    successResponse(res, "Password changed successfully");
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Password change failed",
      error,
      401,
    );
  }
};

const getRedirectHtml = (isSuccess, message, redirectUrl) => {
  const color = isSuccess ? "#10b981" : "#ef4444"; // Green or Red
  const icon = isSuccess
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${
          isSuccess ? "Verification Success" : "Verification Failed"
        }</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f3f4f6;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
            }
            .card {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                text-align: center;
                max-width: 400px;
                width: 90%;
            }
            .icon-container {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background-color: ${isSuccess ? "#d1fae5" : "#fee2e2"};
                color: ${color};
                margin-bottom: 24px;
            }
            svg { width: 40px; height: 40px; }
            h1 { color: #1f2937; margin: 0 0 10px 0; font-size: 24px; }
            p { color: #6b7280; margin: 0 0 24px 0; line-height: 1.5; }
            .btn {
                display: inline-block;
                background-color: ${color};
                color: white;
                padding: 12px 24px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 600;
                transition: opacity 0.2s;
            }
            .btn:hover { opacity: 0.9; }
            .timer { font-size: 14px; color: #9ca3af; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon-container">${icon}</div>
            <h1>${isSuccess ? "Verified!" : "Error"}</h1>
            <p>${message}</p>
            <a href="${redirectUrl}" class="btn">Continue to Login</a>
            <div class="timer">Redirecting in <span id="countdown">5</span> seconds...</div>
        </div>

        <script>
            let seconds = 5;
            const countdownEl = document.getElementById('countdown');
            
            const timer = setInterval(() => {
                seconds--;
                countdownEl.textContent = seconds;
                if (seconds <= 0) {
                    clearInterval(timer);
                    window.location.href = "${redirectUrl}";
                }
            }, 1000);
        </script>
    </body>
    </html>
  `;
};
