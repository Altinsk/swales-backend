const express = require("express");
const { subscribeEmail } = require("../controllers/subscribeController");
const { sensitiveActionLimiter } = require("../utils/rateLimiters");
const router = express.Router();

router.post("/subscribe-email", sensitiveActionLimiter, subscribeEmail);

module.exports = router;
