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
} = require("../utils/tokenService");
const { Op } = require("sequelize");

exports.register = async (req, res) => {
  const { firstName, lastName, email, password, dateOfBirth, src } = req.body;
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
    const token = await generateToken(user.Email);

    await sendVerificationEmail(user.Email, token, src);
    successResponse(res, `User registered, check email for verification`);
  } catch (err) {
    errorResponse(res, err.message, err, 500);
  }
};

exports.verifyEmail = async (req, res) => {
  // Define where to send them (Frontend Login)
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

  try {
    const { token, src } = req.params;

    const loginUrl =
      src == "swales"
        ? `${process.env.SWALES_APP_URL}/login`
        : `${process.env.DESIGNER_APP_URL}`;
    const email = await verifyToken(token); // Assuming this throws error if invalid

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
  const { email, password } = req.body;
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
  if (!user) return errorResponse(res, "User doesn't exist.", null, 401);

  if (!user.Verified)
    return errorResponse(res, "Please verify your email first.", null, 401);

  if (!(await bcrypt.compare(password, user.PasswordHash)))
    return errorResponse(res, "Invalid credentials", null, 401);
  await User.update({ DateLastLogin: new Date() }, { where: { Email: email } });

  const accessToken = await generateToken(
    user.Email,
    user.dataValues.FirstName,
  );

  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // domain: process.env.ROOT_DOMAIN, // e.g., '.yourdomain.com'
    path: "/",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  successResponse(
    res,
    "login successfull!!",
    { accessToken, userName: user.dataValues.FirstName },
    user.UserId,
  );
};

exports.forgotPassword = async (req, res) => {
  const { email, source } = req.body;
  const user = await User.findOne({ where: { Email: email } });
  if (!user) return errorResponse(res, "User not found", null, 404);
  const token = await generateResetToken(user.Email);
  await sendResetPasswordEmail(email, token, source);
  successResponse(res, "Reset link sent");
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const email = await verifyResetToken(token);
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);
    await User.update(
      { PasswordHash: hash, PasswordSalt: salt, DateLastUpdated: new Date() },
      { where: { Email: email } },
    );
    successResponse(res, "Password reset successfully");
  } catch (error) {
    errorResponse(res, "Invalid or expired token", error, 400);
  }
};

const getUserIdFromRequest = async (req) => {
  // 1. Get the Authorization header
  const authHeader = req.headers.authorization;

  // 2. Check if the header exists and follows the 'Bearer <token>' format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Not authenticated");
  }

  // 3. Extract the token (the part after "Bearer ")
  const token = authHeader.split(" ")[1];

  // The rest of your logic remains the same
  const email = await verifyToken(token);

  const user = await User.findOne({ where: { Email: email } });
  if (!user) throw new Error("User not found");

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

    // 4. Send new token in response
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

    // 2. Hash New Password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    // 3. Update User
    await User.update(
      {
        PasswordHash: hash,
        PasswordSalt: salt,
        DateLastUpdated: new Date(),
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
