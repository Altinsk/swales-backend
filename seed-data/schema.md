# Swales.app — Plant & Element Database Schema (Stage 1)

Purpose: give the design canvas something real to place, and give the AI
advisor (already in progress) a consistent data shape to reason over. This
schema covers plants AND non-plant design elements (water features,
structures, animal systems) since the canvas needs both.

One row = one placeable item in the sketch tool.

| Field | Type | Description | Example |
|---|---|---|---|
| `id` | string (slug) | Unique key, used by canvas + icon system | `apple_standard` |
| `common_name` | string | Display name | `Apple (standard)` |
| `scientific_name` | string | Latin name, blank for non-living elements | `Malus domestica` |
| `category` | enum | Top-level type — drives which icon set + which canvas tool it appears under | `tree`, `shrub`, `herb`, `groundcover`, `vine`, `grass_cover_crop`, `fungi`, `animal_system`, `structure`, `water_feature` |
| `subcategory` | string | Finer grouping within category | `fruit_tree`, `nitrogen_fixer_tree` |
| `climate_zone` | multi-tag | Which broad climates it suits — filters what a user sees by region | `temperate`, `mediterranean`, `tropical`, `arid`, `continental` |
| `hardiness_zone` | string | RHS or USDA range, for frost-risk filtering | `RHS H5, USDA 4-8` |
| `functions` | multi-tag | Guild-building logic lives here — this is what the AI advisor and guild builder query against | `nitrogen_fixer`, `pollinator_attractor`, `edible`, `medicinal`, `windbreak`, `erosion_control`, `mulch_producer`, `dynamic_accumulator`, `pest_repellent`, `timber`, `fodder`, `habitat` |
| `mature_height_m` | number | For canvas scale + spacing suggestions | `4.5` |
| `mature_spread_m` | number | For canvas scale + spacing suggestions | `3.5` |
| `sun_requirement` | enum | `full_sun`, `partial_shade`, `full_shade` |
| `water_requirement` | enum | `low`, `medium`, `high`, `aquatic` |
| `soil_preference` | multi-tag | `well_drained`, `clay_tolerant`, `acidic`, `alkaline`, `tolerant_poor_soil` |
| `pc_zone_suitability` | multi-value (0-5) | Which permaculture Zones (0-5) it's typically placed in | `1;2` |
| `growth_rate` | enum | `slow`, `medium`, `fast` |
| `lifespan_type` | enum | `annual`, `biennial`, `perennial`, `permanent_structure` |
| `yield_type` | multi-tag | What it produces, if anything | `fruit`, `nut`, `leaf`, `root`, `wood`, `flower`, `eggs`, `honey`, `none` |
| `harvest_season` | multi-tag | `spring`, `summer`, `autumn`, `winter`, `year_round`, `n_a` |
| `good_companions` | list of `id`, or free text | Feeds the guild builder / conflict warnings | `comfrey;chives;daffodil` |
| `avoid_near` | list of `id`, or free text | Feeds conflict warnings | `walnut_black` |
| `icon_key` | string | Exact filename/key the icon set must match — see `icon_spec.md` | `icon_tree_apple_std` |
| `notes` | text | Free text, source, or caveats | `Juglone-sensitive area, keep clear of walnut` |

## Why this shape

- **`functions` + `good_companions`/`avoid_near`** are the fields that turn a
  static database into the guild builder and AI advisor from Stage 2 — build
  this schema once, don't redo it when the AI advisor work catches up.
- **Free-text entries in `good_companions`/`avoid_near` are allowed and
  expected**, not a data-entry error. This is a woody-perennial/permaculture
  element database, not a general vegetable-garden one — well-known
  companions or antagonists that fall outside its scope (annual vegetables
  like `tomato`/`carrot`, bulbs like `daffodil`, or a broad grouping like
  `most_fruit_trees`/`most_solanaceae`) get written as plain text instead of
  a resolvable `id`. The guild builder should treat a non-resolving reference
  as informational (render as text), not as a broken link. `validateSeed.js`
  reports these as warnings, not errors, for exactly this reason — a
  reference is only a real problem if it was meant to point at another row
  in this file and doesn't.
- **`icon_key` is a hard 1:1 contract** with the icon spec, not a loose
  description. This is what lets the canvas populate automatically once
  artwork lands, instead of someone manually wiring each icon by hand.
- **`category` maps directly to canvas tool groups** (the palette the user
  drags from) — trees, shrubs, structures, water, etc. as separate drawers.
- Kept flat and CSV-friendly on purpose (multi-tag fields use `;` as an
  in-field separator) so this can be imported straight into whatever
  database Swales already uses, or read directly by the AI advisor.

## Suggested import path

1. Load `plants_seed.csv` into the real database as-is (columns match this
   schema 1:1).
2. Treat `icon_key` as the join key between the database and the icon asset
   folder — canvas renders `icon_key + ".svg"` (or `.png`) by convention.
3. Expand region-by-region: this seed set is UK/temperate only. Add a
   `climate_zone` batch per new region rather than trying to cover every
   climate on day one.
