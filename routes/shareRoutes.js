// routes/shareRoutes.js
const express = require("express");
const { createShare, getShare } = require("../controllers/shareController");
const { publicActionLimiter } = require("../utils/rateLimiters");
const router = express.Router();

// Anyone can create a share link - rate-limited since it's otherwise an
// unauthenticated, unbounded write (see createShare's own size check too).
router.post("/", publicActionLimiter, createShare);

// Anyone can view a share link
router.get("/:uuid", getShare);

module.exports = router;
