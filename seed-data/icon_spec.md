# Icon Spec — Plant/Element Canvas Icons

Referenced by [`schema.md`](./schema.md) (`icon_key` field). This is the spec for
whoever implements icon rendering on the design canvas.

## Status check first

As of this writing, the designer app (`designer/components/GardenCanvas.tsx`)
does not yet read from the Elements database or the `/public/objects/` asset
folders at all — there's no palette/drag-in wired up. This doc is written
ahead of that build, not documenting something already working. The existing
files under `designer/public/objects/plants/**` are decorative stock art
(tropical houseplants, ornamentals) left over from an earlier UI pass — they
don't correspond to any `icon_key` in `plants_seed.csv` and shouldn't be
treated as the icon set to build on.

## The problem

`schema.md` currently implies `icon_key` is a hard 1:1 contract — one piece of
art per species. That doesn't scale: the seed data is headed toward 150-200+
species, and no comparable tool (GrowVeg/Small Blue Printer, other
permaculture design tools) hand-draws unique art per species past a few dozen
entries. Blocking canvas work on bespoke illustration for every row is not
worth it, and most of the value of a food-forest design tool comes from
distinguishing plant *shape/size* and *guild function* at a glance — not
species-accurate art.

## Approach: fallback chain, not 1:1 lookup

Render an element by resolving icons in this order, stopping at the first hit:

1. **Exact match** — a real asset file exists for this row's `icon_key`
   (e.g. a handful of "hero" species that get bespoke art — see below).
2. **Generic shape** — a small reusable icon keyed off `category` +
   a size tier derived from `mature_height_m` (see matrix below).
3. **Bare category fallback** — one icon per `category` value, no size
   variation, so nothing ever renders blank.

Then, regardless of which tier resolved, **layer function badges on top**
(see below) — badges are additive, not part of the fallback chain.

```
function resolveIcon(element):
  if assetExists(element.icon_key):
    return element.icon_key
  tier = sizeTier(element.category, element.mature_height_m)
  generic = `icon_generic_${element.category}_${tier}`
  if assetExists(generic):
    return generic
  return `icon_generic_${element.category}` // always exists, guaranteed fallback
```

## Generic icon matrix (what actually needs to be drawn)

Size tier is computed from `mature_height_m` (already in the schema — no new
column needed):

| Tier | tree | shrub | herb / groundcover / vine / grass_cover_crop |
|---|---|---|---|
| small | < 4m | < 1m | (no tier — one icon per category is enough) |
| medium | 4-10m | 1-2.5m | — |
| large | > 10m | > 2.5m | — |

That's **~11 base icons** to cover every plant category at a useful size
distinction (tree×3, shrub×3, herb/groundcover/vine/grass_cover_crop/fungi×1
each), plus `animal_system`, `structure`, `water_feature` (already
non-species, 1 generic icon each is fine). **Total generic set: ~17 icons.**
Everything else — apple vs. pear vs. plum — is communicated by the on-hover
label (`common_name`), not by the icon shape.

### Hero species exception

A short, deliberately bounded list of species placed disproportionately
often can get bespoke art, same pattern the current 53 already half-follows
(`apple_standard` vs `apple_dwarf` have distinct icons). Suggested starter
list — confirm with whoever's populating real garden designs, don't guess
much further than this:

`apple_standard`, `apple_dwarf`, `pear_standard`, `comfrey`, `hazel_cobnut`,
`grape_vine`, `raised_bed`, `pond`, `swale`, `beehive`

Everything else uses the generic matrix. Growing this list later is cheap
(just add more real assets — the fallback chain means nothing breaks in the
meantime).

## Function badges (the part that's actually useful to a designer)

Small overlay marker, corner-anchored on the base icon, driven directly by
the existing `functions` field — no new data needed. Cap at **2 badges
shown per element** (pick highest priority present) to avoid clutter; full
function list stays available in a tooltip/detail panel.

Priority order (highest first) — these are the functions a permaculture
designer actually scans a bed for:

1. `nitrogen_fixer`
2. `edible`
3. `pollinator_attractor`
4. `medicinal`
5. `pest_repellent`
6. `dynamic_accumulator`

(`windbreak`, `erosion_control`, `mulch_producer`, `timber`, `fodder`,
`habitat` — no badge for now; lower glance-value, revisit if user feedback
asks for it.)

**6 badge icons total.**

## Total asset ask for a first pass

- 17 generic category/size icons
- 6 function badge icons
- ~10 hero-species icons (reuse whatever already exists for these where
  the current decorative set happens to have a plausible match; draw new
  otherwise)

**~33 assets**, not 150-200. This is what actually unblocks canvas work.

## Naming convention

- Generic: `icon_generic_<category>_<tier>` (tier omitted for
  categories with only one tier) — e.g. `icon_generic_tree_medium`,
  `icon_generic_herb`.
- Badge: `badge_<function>` — e.g. `badge_nitrogen_fixer`.
- Hero/species-specific: keep using the existing per-row `icon_key` values
  already in `plants_seed.csv` (e.g. `icon_tree_apple_std`) — no rename
  needed, the fallback chain checks for these first automatically.

## Open decisions for the frontend implementer

- Exact visual style (flat color silhouette vs. line icon vs. isometric) —
  should match whatever direction `designer/public/objects/structures/` and
  `water-earthworks/` already established, since those are structure/water
  categories that already have real assets.
- Badge placement/size and whether they're toggleable (some users may want
  a decluttered view).
- Where generic + badge assets live — suggest `designer/public/objects/generic/`
  and `designer/public/objects/badges/` as new folders, separate from the
  existing per-theme folders, so the fallback logic has one predictable
  place to look.
