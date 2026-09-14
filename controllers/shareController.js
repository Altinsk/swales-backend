// controllers/shareController.js
const { Share } = require("../models");
const { successResponse, errorResponse } = require("../utils/responseHelper");

// Only the global 15MB express.json() body limit (server.js) bounded this
// before - which is sized for the whole request, not specifically for a
// share payload. This endpoint is unauthenticated and has no owner/schema
// validation on ProjectData at all (by design - see shareRoutes.js), so a
// real per-endpoint cap keeps it from being usable as a large anonymous
// blob store. 5MB comfortably covers a real design's JSON plus a base64
// canvas thumbnail.
const MAX_PROJECT_DATA_BYTES = 5 * 1024 * 1024;

// Create a new shareable link
exports.createShare = async (req, res) => {
  const { projectData } = req.body;
  if (!projectData) {
    return errorResponse(res, "Project data is required.");
  }
  // projectData arrives as a parsed JS object (express.json() has already
  // decoded the request body), not a string - it's only serialized to JSON
  // text implicitly when the DB driver stores it in the TEXT column, which
  // is also why it round-trips through JSON.parse() on the read side
  // (app.tsx/[uuid]/page.tsx). Buffer.byteLength requires a string, so this
  // has to stringify first rather than measure the object directly.
  const projectDataString =
    typeof projectData === "string" ? projectData : JSON.stringify(projectData);
  if (Buffer.byteLength(projectDataString, "utf8") > MAX_PROJECT_DATA_BYTES) {
    return errorResponse(res, "Project data is too large to share.", null, 413);
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
