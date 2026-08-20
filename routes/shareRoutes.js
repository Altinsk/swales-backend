// routes/shareRoutes.js
const express = require("express");
const { createShare, getShare } = require("../controllers/shareController");
const router = express.Router();

// Anyone can create a share link
router.post("/", createShare);

// Anyone can view a share link
router.get("/:uuid", getShare);

module.exports = router;
