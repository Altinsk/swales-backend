// controllers/projectController.js
const fs = require("fs");
const path = require("path");
const { Project, User, Op } = require("../models");
const { successResponse, errorResponse } = require("../utils/responseHelper");
const { verifyToken, assertSessionValid } = require("../utils/tokenService");
const { put } = require("@vercel/blob");

const saveThumbnail = async (base64Image) => {
  if (!base64Image || !base64Image.startsWith("data:image/")) {
    return null;
  }

  // 1. Extract image data and create buffer
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");

  // 2. Generate a unique filename (organized in a 'thumbnails' folder)
  const imageName = `thumbnails/thumb-${Date.now()}.png`;

  // 3. Upload directly to Vercel Blob
  const blob = await put(imageName, imageBuffer, {
    access: "public",
    contentType: "image/png",
  });

  // 4. Return the public URL provided by Vercel
  return blob.url;
};

// Middleware (no change)
exports.protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const email = await verifyToken(token);
      const user = await User.findOne({ where: { Email: email } });

      if (!user) {
        return errorResponse(res, "User not found", null, 401);
      }
      assertSessionValid(token, user);
      req.user = user;
      next();
    } catch (error) {
      return errorResponse(res, "Not authorized, token failed", error, 401);
    }
  }

  if (!token) {
    return errorResponse(res, "Not authorized, no token", null, 401);
  }
};

exports.createProject = async (req, res) => {
  const { name, projectData, thumbnail } = req.body; // Destructure thumbnail
  if (!name || !projectData) {
    return errorResponse(res, "Project name and data are required.");
  }

  try {
    const thumbnailUrl = await saveThumbnail(thumbnail, req); // Save the image

    const project = await Project.create({
      UserId: req.user.UserId,
      Name: name,
      ProjectData: projectData,
      ThumbnailUrl: thumbnailUrl, // Store the URL
      DateLastUpdated: new Date(),
    });
    successResponse(res, "Project saved successfully", project);
  } catch (err) {
    errorResponse(res, err.message, err, 500);
  }
};
exports.getProjects = async (req, res) => {
  try {
    const {
      limit,
      page = 1,
      search,
      sort = "date_desc",
      startDate,
      endDate,
    } = req.query;

    const whereClause = { UserId: req.user.UserId };
    let orderClause = [["DateLastUpdated", "DESC"]];

    if (search) {
      whereClause.Name = { [Op.iLike]: `%${search}%` };
    }

    if (startDate && endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.DateLastUpdated = {
        [Op.between]: [new Date(startDate), endOfDay],
      };
    }

    switch (sort) {
      case "date_asc":
        orderClause = [["DateLastUpdated", "ASC"]];
        break;
      case "name_asc":
        orderClause = [["Name", "ASC"]];
        break;
      case "name_desc":
        orderClause = [["Name", "DESC"]];
        break;
      case "date_desc":
      default:
        orderClause = [["DateLastUpdated", "DESC"]];
        break;
    }

    if (!limit || (limit && page > 1)) {
      const pageSize = 10;
      const offset = (parseInt(page, 10) - 1) * pageSize;

      const { count, rows } = await Project.findAndCountAll({
        where: whereClause,
        order: orderClause,
        attributes: ["ProjectId", "Name", "DateLastUpdated", "ThumbnailUrl"],
        limit: pageSize,
        offset,
      });

      return successResponse(res, "Projects fetched successfully", {
        projects: rows,
        totalPages: Math.ceil(count / pageSize),
        currentPage: parseInt(page, 10),
        totalCount: count,
      });
    } else {
      const projects = await Project.findAll({
        where: whereClause,
        order: orderClause,
        attributes: ["ProjectId", "Name", "DateLastUpdated", "ThumbnailUrl"],
        limit: parseInt(limit, 10),
      });
      return successResponse(res, "Projects fetched successfully", projects);
    }
  } catch (err) {
    errorResponse(res, err.message, err, 500);
  }
};

// Get a single project by ID (no change)
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: {
        ProjectId: req.params.id,
        UserId: req.user.UserId,
      },
    });
    if (!project) {
      return errorResponse(
        res,
        "Project not found or you do not have permission.",
        null,
        404
      );
    }
    successResponse(res, "Project data fetched successfully", project);
  } catch (err) {
    errorResponse(res, err.message, err, 500);
  }
};

// ✅ MODIFIED: Update an existing project (now with thumbnail)
exports.updateProject = async (req, res) => {
  const { name, projectData, thumbnail } = req.body;
  try {
    const project = await Project.findOne({
      where: {
        ProjectId: req.params.id,
        UserId: req.user.UserId,
      },
    });

    if (!project) {
      return errorResponse(res, "Project not found", null, 404);
    }

    // Note: This simple implementation doesn't delete the old thumbnail.
    // A more advanced version could delete the old file from storage.
    const thumbnailUrl = await saveThumbnail(thumbnail, req);

    project.Name = name || project.Name;
    project.ProjectData = projectData || project.ProjectData;
    project.ThumbnailUrl = thumbnailUrl || project.ThumbnailUrl; // Update URL if new one is provided
    project.DateLastUpdated = new Date();

    await project.save();
    successResponse(res, "Project updated successfully", project);
  } catch (err) {
    errorResponse(res, err.message, err, 500);
  }
};

// Delete a project (no change)
exports.deleteProject = async (req, res) => {
  try {
    const result = await Project.destroy({
      where: {
        ProjectId: req.params.id,
        UserId: req.user.UserId,
      },
    });

    if (result === 0) {
      return errorResponse(
        res,
        "Project not found or you do not have permission.",
        null,
        404
      );
    }

    successResponse(res, "Project deleted successfully");
  } catch (err) {
    errorResponse(res, err.message, err, 500);
  }
};
