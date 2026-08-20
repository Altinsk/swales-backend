// controllers/shareController.js
const { Share } = require("../models");
const { successResponse, errorResponse } = require("../utils/responseHelper");

// Create a new shareable link
exports.createShare = async (req, res) => {
  const { projectData } = req.body;
  if (!projectData) {
    return errorResponse(res, "Project data is required.");
  }

  try {
    const newShare = await Share.create({
      ProjectData: projectData,
    });
    // Return only the UUID, which is what the frontend needs
    successResponse(res, "Share link created successfully", {
      uuid: newShare.uuid,
    });
  } catch (err) {
    errorResponse(res, "Failed to create share link", err, 500);
  }
};

// Get a shared project by its UUID
exports.getShare = async (req, res) => {
  try {
    const share = await Share.findOne({
      where: {
        uuid: req.params.uuid,
      },
    });
    if (!share) {
      return errorResponse(res, "Shared project not found.", null, 404);
    }
    successResponse(res, "Shared project fetched successfully", share);
  } catch (err) {
    errorResponse(res, "Failed to fetch shared project", err, 500);
  }
};
