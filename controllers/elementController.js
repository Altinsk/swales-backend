// controllers/elementController.js
const { Element, Op } = require("../models");
const { successResponse, errorResponse } = require("../utils/responseHelper");

exports.getElements = async (req, res) => {
  try {
    const { category, function: functionTag, climate_zone, search } = req.query;

    const whereClause = {};

    if (category) {
      whereClause.Category = category;
    }
    if (functionTag) {
      whereClause.Functions = { [Op.contains]: [functionTag] };
    }
    if (climate_zone) {
      whereClause.ClimateZone = { [Op.contains]: [climate_zone] };
    }
    if (search) {
      whereClause.CommonName = { [Op.iLike]: `%${search}%` };
    }

    const elements = await Element.findAll({
      where: whereClause,
      order: [["Category", "ASC"], ["CommonName", "ASC"]],
    });

    successResponse(res, "Elements fetched successfully", elements);
  } catch (err) {
    errorResponse(res, err.message, err, 500);
  }
};

exports.getElementById = async (req, res) => {
  try {
    const element = await Element.findOne({
      where: { ElementId: req.params.id },
    });

    if (!element) {
      return errorResponse(res, "Element not found", null, 404);
    }

    successResponse(res, "Element fetched successfully", element);
  } catch (err) {
    errorResponse(res, err.message, err, 500);
  }
};
