// routes/projectRoutes.js
const express = require("express");
const {
  protect,
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");
const { authenticatedWriteLimiter } = require("../utils/rateLimiters");

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// createProject/updateProject each upload a thumbnail to Vercel Blob - rate
// limited (keyed by user id, see rateLimiters.js) since auth alone doesn't
// stop a scripted client from hammering these and running up real storage
// costs. getProjects/getProjectById/deleteProject are read/delete-only, no
// storage write, so no limiter needed on them.
router.route("/").post(authenticatedWriteLimiter(), createProject).get(getProjects);

router
  .route("/:id")
  .get(getProjectById)
  .put(authenticatedWriteLimiter(), updateProject)
  .delete(deleteProject);

module.exports = router;
