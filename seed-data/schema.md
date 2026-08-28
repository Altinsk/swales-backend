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
| `layer` | enum | Food-forest layer this occupies — the classic 7-layer polyculture model (canopy/sub-canopy/shrub/herbaceous/root/groundcover/vine), plus two honest extensions for what this schema also covers: `fungal` for the mycelial layer, and `cover_crop` for temporary/seasonal green-manure crops kept distinct from permanent `groundcover`. `n_a` for the three categories the layer model doesn't apply to (`animal_system`, `structure`, `water_feature`). | `canopy`, `sub_canopy`, `shrub`, `herbaceous`, `root`, `groundcover`, `vine`, `cover_crop`, `fungal`, `n_a` |
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
- **`layer` is derived, not independently curated** — added 2026-08-25 so
  the canvas/guild builder can filter or auto-suggest by food-forest layer
  directly instead of every consumer re-deriving it from `category` +
  `mature_height_m`. Derivation rules, so future additions stay consistent:
  - `tree` rows split into `canopy` (`mature_height_m` >= 15) vs
    `sub_canopy` (< 15) — 15m was picked because it's the exact floor of
    the pre-existing `canopy_tree` subcategory values (`common_oak`,
    `cork_oak`, `honey_locust`), so the new field agrees with the prior
    curation instead of contradicting it.
  - `root` is assigned only to species where an underground tuber/rhizome
    is the *primary* harvested feature (`jerusalem_artichoke`,
    `horseradish`, `sweet_potato`, `taro`) — not simply anything with
    `root` somewhere in `yield_type`. `chayote` (root is a bonus on a
    climbing vine), `dandelion`/`valerian` (herbaceous plants whose root
    is one of several harvested parts), and `egyptian_walking_onion`
    (harvested at the stem, not underground) stay in their structural
    layer (`vine`/`herbaceous`) because that's where they actually occupy
    space on a design.
  - `grass_cover_crop` → `cover_crop`, kept distinct from `groundcover`
    because it behaves differently in a design (typically dug in / annual,
    not a permanent living-mulch layer).
  - `fungi` → `fungal`, the commonly-cited 8th layer extension to the
    classic 7-layer model.
  - `animal_system`/`structure`/`water_feature` → `n_a` — honestly not
    part of the vegetation-layer model rather than force-fit somewhere.
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
