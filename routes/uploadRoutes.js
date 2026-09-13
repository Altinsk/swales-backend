// routes/uploadRoutes.js
const express = require("express");
const multer = require("multer");
const { processPdf } = require("../controllers/uploadController");
const { publicActionLimiter } = require("../utils/rateLimiters");

const router = express.Router();

// CHANGED: Use memoryStorage instead of writing to "uploads/"
// No auth on this endpoint, so the file-size limit is the only thing
// stopping an arbitrarily large upload from being rendered page-by-page
// into full-resolution canvases and pushed to Vercel Blob storage.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 20 * 1024 * 1024 } });

router.post("/pdf", publicActionLimiter, upload.single("pdfFile"), processPdf);

module.exports = router;
