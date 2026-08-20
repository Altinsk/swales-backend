// routes/uploadRoutes.js
const express = require("express");
const multer = require("multer");
const { processPdf } = require("../controllers/uploadController");

const router = express.Router();

// CHANGED: Use memoryStorage instead of writing to "uploads/"
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/pdf", upload.single("pdfFile"), processPdf);

module.exports = router;
