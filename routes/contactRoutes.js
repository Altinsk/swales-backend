const express = require("express");
const { sendMessage } = require("../controllers/contactController");
const { sensitiveActionLimiter } = require("../utils/rateLimiters");
const router = express.Router();

router.post("/message", sensitiveActionLimiter, sendMessage);

module.exports = router;
