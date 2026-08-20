# Status — session continuity

Short, living note. Updated at the end of significant sessions so a fresh chat
doesn't start cold. Full plan lives in `roadmap.md`; live per-item status lives
in `roadmap_backlog.xlsx`. This file is neither — it's "where the conversation
left off."

## Last updated

2026-08-19

## Where things actually are

- **Stage 1 (plant DB + canvas + icons)**: schema, 171-species seed data,
  Postgres `Element` model + API routes are built, verified, and pushed to
  `back`'s `main`. `icon_spec.md` (fallback-chain icon rendering, not 1:1 art)
  is drafted. Still open: companion-planting data on the 118 newly-added
  species (107/171 rows have empty `good_companions`), subcategory vocabulary
  cleanup (65 near-duplicate values), and all frontend canvas wiring — the
  designer app still only reads the static `presets.json`, nothing reads
  `/api/elements` or resolves `icon_key` yet.
- **Roadmap**: `back/docs/roadmap.md` is the merged, canonical Phase 0→F plan
  (106 items total after adding Phase 0). `back/docs/roadmap_backlog.xlsx` is
  the matching live tracker with a `Status` column. `designer/CLAUDE.md` and
  `services/CLAUDE.md` point at the canonical copy rather than duplicating it.
- **Phase 0 (infrastructure/ownership reset)** was just added — see
  `roadmap.md` for the full item list. Confirmed this session: all three repos
  (`back`, `designer`, `services`) are owned by the user's own Altinsk GitHub
  account — no third-party ownership risk. Real risk found instead:
  `back/server.js` runs `sequelize.sync({ alter: true })` on every deploy, so
  a merge can silently alter the live production schema with no review step.
  Also found: `back/controllers/socialAuthController.js`'s Google sign-in
  never verifies the token it's given — a live account-takeover hole. Decided
  fix: verify Google's real `id_token` server-side (not the HMAC patch, not a
  full external auth provider).

## In progress / decided but not yet done

- Repo consolidation into a GitHub Organization — discussed, not decided.
- Pushing this session's new files (`CLAUDE.md`, `docs/roadmap.md`,
  `docs/status.md`, `docs/roadmap_backlog.xlsx`) in all three repos — not yet
  committed or pushed anywhere (per this session's git-safety rules: commits
  only happen when explicitly requested).

## Next up

1. Decide the repo-consolidation question, or explicitly defer it.
2. Get sign-off to commit + push this session's planning docs across all 3
   repos.
3. Start the Google `id_token` verification fix (Option 1), on a branch, not
   on `main` directly.
4. Replace `sequelize.sync({ alter: true })` with real migrations before any
   further schema changes land.
