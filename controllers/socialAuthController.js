// controllers\socialAuthController.js
const { successResponse, errorResponse } = require("../utils/responseHelper");
const { User } = require("../models");
const { generateToken } = require("../utils/tokenService");
const { Op } = require("sequelize");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.GoogleSignIn = async (req, res) => {
  try {
    const { authToken } = req.body;

    if (!authToken) {
      return errorResponse(res, "Missing Google authToken", null, 400);
    }

    // Verify the token against Google's public keys (signature, audience,
    // issuer, expiry) instead of trusting the client-supplied email/name —
    // this was previously a live account-takeover hole (see roadmap.md Phase 0).
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: authToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error("Google id_token verification failed:", verifyErr.message);
      return errorResponse(res, "Invalid Google token", null, 401);
    }

    if (!payload.email_verified) {
      return errorResponse(res, "Google email is not verified", null, 401);
    }

    const email = payload.email;
    const firstName = payload.given_name || payload.name || "";

    let targetUser = null;

    // 1. Check if a user with this email already exists
    const existingUser = await User.findOne({
      where: { Email: email },
    });

    if (existingUser) {
      targetUser = existingUser;

      // OPTIONAL: Update their AuthToken if it's a google user
      if (existingUser.loginType === "google") {
        await User.update(
          { DateLastLogin: new Date(), AuthToken: authToken },
          { where: { UserId: existingUser.UserId } }
        );
      } else {
        // If they are a 'native' user logging in via Google, we just update the login time
        await User.update(
          { DateLastLogin: new Date() },
          { where: { UserId: existingUser.UserId } }
        );
      }
    } else {
      // 2. If user doesn't exist, create them
      targetUser = await User.create({
        FirstName: firstName,
        LastName: firstName, // Google often provides full name as one string, or you can split it
        Email: email,
        PasswordHash: null,
        PasswordSalt: null,
        Verified: true, // Google emails are verified by default
        DateLastUpdated: new Date(),
        DateLastLogin: new Date(),
        loginType: "google",
        AuthToken: authToken,
      });
    }

    // 3. Generate Token (MATCHING authController: Pass firstName)
    const accessToken = await generateToken(
      targetUser.Email,
      targetUser.FirstName
    );

    // 4. Set Cookie (MATCHING authController)
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    // 5. Send Response (MATCHING authController: Include userName)
    successResponse(
      res,
      "login successfully!!",
      {
        accessToken,
        userName: targetUser.FirstName,
      },
      targetUser.UserId || 2
    );
  } catch (err) {
    console.error("Google Login Error:", err);
    errorResponse(res, err.message, err, 500);
  }
};
