const express = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
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

// New Routes
router.post("/logout", logout);
router.get("/me", getProfile);
router.put("/update-profile", updateProfile);
router.put("/change-password", changePassword);

module.exports = router;
