// scripts/seedElements.js
// Imports seed-data/plants_seed.csv into the Elements table.
// Usage: node scripts/seedElements.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const db = require("../models");

const CSV_PATH = path.join(__dirname, "../seed-data/plants_seed.csv");

function toArray(value) {
  if (!value) return [];
  return value
    .split(";")
    .map((v) => v.trim())
    .filter((v) => v && v.toLowerCase() !== "n_a");
}

function toNullableString(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "n_a") return null;
  return trimmed;
}

function toNullableFloat(value) {
  const str = toNullableString(value);
  if (str === null) return null;
  const num = parseFloat(str);
  return Number.isNaN(num) ? null : num;
}

async function seed() {
  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const records = rows.map((row) => ({
    ElementId: row.id,
    CommonName: row.common_name,
    ScientificName: toNullableString(row.scientific_name),
    Category: row.category,
    Subcategory: toNullableString(row.subcategory),
    Layer: toNullableString(row.layer),
    ClimateZone: toArray(row.climate_zone),
    HardinessZone: toNullableString(row.hardiness_zone),
    Functions: toArray(row.functions),
    MatureHeightM: toNullableFloat(row.mature_height_m),
    MatureSpreadM: toNullableFloat(row.mature_spread_m),
    SunRequirement: toNullableString(row.sun_requirement),
    WaterRequirement: toNullableString(row.water_requirement),
    SoilPreference: toArray(row.soil_preference),
    PcZoneSuitability: toArray(row.pc_zone_suitability),
    GrowthRate: toNullableString(row.growth_rate),
    LifespanType: toNullableString(row.lifespan_type),
    YieldType: toArray(row.yield_type),
    HarvestSeason: toArray(row.harvest_season),
    GoodCompanions: toArray(row.good_companions),
    AvoidNear: toArray(row.avoid_near),
    IconKey: toNullableString(row.icon_key),
    Notes: toNullableString(row.notes),
  }));

  await db.sequelize.sync();

  await db.Element.bulkCreate(records, {
    updateOnDuplicate: [
      "CommonName",
      "ScientificName",
      "Category",
      "Subcategory",
      "Layer",
      "ClimateZone",
      "HardinessZone",
      "Functions",
      "MatureHeightM",
      "MatureSpreadM",
      "SunRequirement",
      "WaterRequirement",
      "SoilPreference",
      "PcZoneSuitability",
      "GrowthRate",
      "LifespanType",
      "YieldType",
      "HarvestSeason",
      "GoodCompanions",
      "AvoidNear",
      "IconKey",
      "Notes",
    ],
  });

  console.log(`Seeded ${records.length} elements.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
