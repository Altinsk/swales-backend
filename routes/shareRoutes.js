// routes/shareRoutes.js
const express = require("express");
const { createShare, getShare } = require("../controllers/shareController");
const { publicActionLimiter } = require("../utils/rateLimiters");
const router = express.Router();

// Anyone can create a share link - rate-limited since it's otherwise an
// unauthenticated write, and createShare itself rejects a payload over
// MAX_PROJECT_DATA_BYTES (this comment used to reference a size check that
// didn't actually exist - see swales-backend/docs/future-concerns.md).
router.post("/", publicActionLimiter, createShare);

// Anyone can view a share link
router.get("/:uuid", getShare);

module.exports = router;
