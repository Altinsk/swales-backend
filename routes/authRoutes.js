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
} = require("../controllers/authController");
const { GoogleSignIn } = require("../controllers/socialAuthController");
const router = express.Router();

router.post("/register", register);
router.post("/google-signin", GoogleSignIn);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-email/:src/:token", verifyEmail);

// New Routes
router.get("/me", getProfile);
router.put("/update-profile", updateProfile);
router.put("/change-password", changePassword);

module.exports = router;
