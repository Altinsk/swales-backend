// controllers/elementController.js
const { Element, Op } = require("../models");
const { successResponse, errorResponse } = require("../utils/responseHelper");

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 100;

// Every seed row (scripts/seedElements.js, seed-data/plants_seed.csv) is
// lowercase snake_case ("tree", "edible", "temperate", ...), but Category/
// Functions/ClimateZone were compared with exact, case-sensitive equality
// (Category) or Op.contains (Functions/ClimateZone, which is also exact-
// match per element) - a caller sending "Tree"/"Edible" got a silent,
// unexplained empty result set instead of a match or a 400.
const normalizeTag = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : null;

exports.getElements = async (req, res) => {
  try {
    const { category, function: functionTag, climate_zone, search, page, limit } = req.query;

    // Express's query parser turns `?function[]=a&function[]=b` into an
    // array - normalizeTag only accepts a plain string, so a non-string
    // filter value is rejected outright instead of reaching Sequelize as
    // e.g. `{ [Op.contains]: [['a','b']] }` against a text[] column, which
    // Postgres errors on and which then leaked its raw error text back to
    // the caller (see errorResponse below).
    for (const [name, value] of [["category", category], ["function", functionTag], ["climate_zone", climate_zone], ["search", search]]) {
      if (value !== undefined && typeof value !== "string") {
        return errorResponse(res, `"${name}" must be a single string value`, null, 400);
      }
    }

    const whereClause = {};

    const normalizedCategory = normalizeTag(category);
    if (normalizedCategory) {
      whereClause.Category = normalizedCategory;
    }
    const normalizedFunction = normalizeTag(functionTag);
    if (normalizedFunction) {
      whereClause.Functions = { [Op.contains]: [normalizedFunction] };
    }
    const normalizedClimateZone = normalizeTag(climate_zone);
    if (normalizedClimateZone) {
      whereClause.ClimateZone = { [Op.contains]: [normalizedClimateZone] };
    }
    if (search) {
      whereClause.CommonName = { [Op.iLike]: `%${search}%` };
    }

    const parsedLimit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT));
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);

    const { count, rows } = await Element.findAndCountAll({
      where: whereClause,
      order: [["Category", "ASC"], ["CommonName", "ASC"]],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
    });

    successResponse(res, "Elements fetched successfully", {
      elements: rows,
      totalCount: count,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
    });
  } catch (err) {
    console.error("getElements error:", err);
    errorResponse(res, "Failed to fetch elements", err, 500);
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
    console.error("getElementById error:", err);
    errorResponse(res, "Failed to fetch element", err, 500);
  }
};
