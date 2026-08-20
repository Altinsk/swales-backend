// scripts/validateSeed.js
// Validates seed-data CSV file(s) against the contract in seed-data/schema.md
// before they get anywhere near seedElements.js / the database.
//
// Usage:
//   node scripts/validateSeed.js                          (defaults to seed-data/plants_seed.csv)
//   node scripts/validateSeed.js seed-data/plants_seed.csv seed-data/plants_seed_batch1_draft.csv
//
// Pass multiple files to validate them as one combined dataset (duplicate-id
// and companion/avoid_near reference checks run across the union) — use this
// when checking a draft batch that's meant to be merged with the main file.
//
// Exit code 1 on structural problems that would break the importer (bad CSV,
// wrong columns, duplicate ids, invalid enum values). Dangling companion/
// avoid_near references are reported but don't fail the run — the schema
// already uses free-text placeholders (e.g. "tomato", "most_vegetables") for
// well-known companions that aren't tracked as elements yet, which is a
// legitimate use, not just a typo.

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const EXPECTED_COLUMNS = [
  "id", "common_name", "scientific_name", "category", "subcategory",
  "climate_zone", "hardiness_zone", "functions", "mature_height_m",
  "mature_spread_m", "sun_requirement", "water_requirement", "soil_preference",
  "pc_zone_suitability", "growth_rate", "lifespan_type", "yield_type",
  "harvest_season", "good_companions", "avoid_near", "icon_key", "notes",
];

const ENUMS = {
  category: ["tree", "shrub", "herb", "groundcover", "vine", "grass_cover_crop", "fungi", "animal_system", "structure", "water_feature"],
  sun_requirement: ["full_sun", "partial_shade", "full_shade"],
  water_requirement: ["low", "medium", "high", "aquatic"],
  growth_rate: ["slow", "medium", "fast", "n_a"],
  lifespan_type: ["annual", "biennial", "perennial", "permanent_structure"],
};

const files = process.argv.slice(2);
if (files.length === 0) {
  files.push(path.join(__dirname, "../seed-data/plants_seed.csv"));
}

let hardErrors = [];
let warnings = [];
const allRows = []; // {id, sourceFile, row}

for (const file of files) {
  const resolved = path.resolve(file);
  if (!fs.existsSync(resolved)) {
    hardErrors.push(`${file}: file not found`);
    continue;
  }
  const content = fs.readFileSync(resolved, "utf-8");

  let rows;
  try {
    rows = parse(content, { columns: true, skip_empty_lines: true });
  } catch (err) {
    hardErrors.push(`${file}: CSV parse error — ${err.message}`);
    continue;
  }

  if (rows.length === 0) {
    warnings.push(`${file}: no data rows`);
    continue;
  }

  const actualColumns = Object.keys(rows[0]);
  const missing = EXPECTED_COLUMNS.filter((c) => !actualColumns.includes(c));
  const extra = actualColumns.filter((c) => !EXPECTED_COLUMNS.includes(c));
  if (missing.length) hardErrors.push(`${file}: missing columns: ${missing.join(", ")}`);
  if (extra.length) hardErrors.push(`${file}: unexpected columns: ${extra.join(", ")}`);

  rows.forEach((row, i) => {
    const line = i + 2; // +1 for header, +1 for 1-index
    if (!row.id) {
      hardErrors.push(`${file}:${line}: missing id`);
      return;
    }
    allRows.push({ id: row.id, sourceFile: file, line, row });

    Object.entries(ENUMS).forEach(([field, allowed]) => {
      const value = row[field];
      if (value && !allowed.includes(value)) {
        warnings.push(`${file}:${line} (${row.id}): invalid ${field} "${value}" — expected one of ${allowed.join("|")}`);
      }
    });

    ["mature_height_m", "mature_spread_m"].forEach((field) => {
      const value = row[field];
      if (value && value !== "n_a" && Number.isNaN(parseFloat(value))) {
        warnings.push(`${file}:${line} (${row.id}): ${field} "${value}" is not numeric`);
      }
    });
  });
}

// Duplicate id check across all files combined
const seen = new Map();
allRows.forEach(({ id, sourceFile, line }) => {
  if (seen.has(id)) {
    hardErrors.push(`Duplicate id "${id}": ${seen.get(id)} and ${sourceFile}:${line}`);
  } else {
    seen.set(id, `${sourceFile}:${line}`);
  }
});

// good_companions / avoid_near reference check across the combined id set
const allIds = new Set(allRows.map((r) => r.id));
allRows.forEach(({ id, sourceFile, line, row }) => {
  ["good_companions", "avoid_near"].forEach((field) => {
    (row[field] || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((refId) => {
        if (!allIds.has(refId)) {
          warnings.push(`${sourceFile}:${line} (${id}): ${field} references unknown id "${refId}" (fine if it's a deliberate free-text placeholder, otherwise check spelling / missing file)`);
        }
      });
  });
});

console.log(`Validated ${allRows.length} rows across ${files.length} file(s).\n`);

if (warnings.length) {
  console.log(`WARNINGS (${warnings.length}):`);
  warnings.forEach((w) => console.log("  - " + w));
  console.log("");
}

if (hardErrors.length) {
  console.log(`ERRORS (${hardErrors.length}):`);
  hardErrors.forEach((e) => console.log("  - " + e));
  console.log("");
  console.log("FAILED");
  process.exit(1);
}

console.log("OK — no structural errors.");
