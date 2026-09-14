const express = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  updateProfile, // New
  changePassword,
  getProfile, // New
  logout,
} = require("../controllers/authController");
const { GoogleSignIn } = require("../controllers/socialAuthController");
const { loginLimiter, sensitiveActionLimiter } = require("../utils/rateLimiters");
const router = express.Router();

router.post("/register", sensitiveActionLimiter, register);
router.post("/google-signin", loginLimiter, GoogleSignIn);
router.post("/login", loginLimiter, login);
router.post("/forgot-password", sensitiveActionLimiter, forgotPassword);
router.post("/reset-password", sensitiveActionLimiter, resetPassword);
router.get("/verify-email/:src/:token", verifyEmail);
router.post("/resend-verification", sensitiveActionLimiter, resendVerification);

// New Routes
router.post("/logout", logout);
router.get("/me", getProfile);
router.put("/update-profile", loginLimiter, updateProfile);
// changePassword checks currentPassword via bcrypt.compare - unlike every
// other auth-adjacent route here, this one had no rate limit at all, so
// anyone holding a valid session (stolen token, shared device, XSS) but
// not the plaintext password could brute-force it unboundedly.
router.put("/change-password", sensitiveActionLimiter, changePassword);

module.exports = router;
