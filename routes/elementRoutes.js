// routes/elementRoutes.js
const express = require("express");
const {
  getElements,
  getElementById,
} = require("../controllers/elementController");

const router = express.Router();

// Public read-only catalog — no auth required.
router.route("/").get(getElements);
router.route("/:id").get(getElementById);

module.exports = router;
