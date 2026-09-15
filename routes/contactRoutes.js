const express = require("express");
const { sendMessage } = require("../controllers/contactController");
const { sensitiveActionLimiter } = require("../utils/rateLimiters");
const router = express.Router();

// Own limiter instance - previously shared its budget with every auth
// route also using sensitiveActionLimiter (see rateLimiters.js).
router.post("/message", sensitiveActionLimiter(), sendMessage);

module.exports = router;
