const express = require("express");
const { subscribeEmail } = require("../controllers/subscribeController");
const { sensitiveActionLimiter } = require("../utils/rateLimiters");
const router = express.Router();

// Own limiter instance - previously shared its budget with every auth
// route also using sensitiveActionLimiter (see rateLimiters.js).
router.post("/subscribe-email", sensitiveActionLimiter(), subscribeEmail);

module.exports = router;
