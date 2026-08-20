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

const router = express.Router();

// All routes in this file are protected
router.use(protect);

router.route("/").post(createProject).get(getProjects);

router
  .route("/:id")
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

module.exports = router;
