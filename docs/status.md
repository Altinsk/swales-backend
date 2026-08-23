# Status — session continuity

Short, living note. Updated at the end of significant sessions so a fresh chat
doesn't start cold. Full plan lives in `roadmap.md`; live per-item status lives
in `roadmap_backlog.xlsx`. This file is neither — it's "where the conversation
left off."

## Last updated

2026-08-23

## Doc relocation note

These three docs (`roadmap.md`, `status.md`, `roadmap_backlog.xlsx`) moved
here from `SwalesApp\back\docs\` on 2026-08-23, at Omar's explicit
instruction: the only folder in scope going forward is `SwalesApp-dev`
(`swales-backend`, `swales-designer`, `swales-services`) — `SwalesApp\back`
is out of scope entirely and should not be read from or written to again.

This also resolves a mix-up from earlier the same session: `back`'s own
`roadmap.md`/`status.md` called itself canonical/production, while
`swales-backend`'s `CLAUDE.md` called itself "an independent dev/sandbox...
kept deliberately separate from production" — both wrong. `swales-backend`
(this repo, deployed to `swales-backend.vercel.app`, Neon `us-east-1` DB) is
confirmed to be the real production backend. Two fixes below (Google
id_token verification, sequelize migrations) both actually shipped here,
even though at the time this file still lived in `back`'s `docs/` folder.
Older bullets below that say "`back`" are historical record from before
this was sorted out — read them as "this repo," not literally `back`.

## Where things actually are

- **Stage 1 (plant DB + canvas + icons)**: schema, 171-species seed data,
  Postgres `Element` model + API routes are built, verified, and pushed to
  main. `icon_spec.md` (fallback-chain icon rendering, not 1:1 art)
  is drafted. Still open: companion-planting data on the 118 newly-added
  species (107/171 rows have empty `good_companions`), subcategory vocabulary
  cleanup (65 near-duplicate values), and all frontend canvas wiring — the
  designer app still only reads the static `presets.json`, nothing reads
  `/api/elements` or resolves `icon_key` yet.
- **Roadmap**: `docs/roadmap.md` is the merged, canonical Phase 0→F plan
  (106 items total after adding Phase 0). `docs/roadmap_backlog.xlsx` is
  the matching live tracker with a `Status` column. `swales-designer/CLAUDE.md`
  and `swales-services/CLAUDE.md` point at this copy rather than duplicating it.
- **Phase 0 (infrastructure/ownership reset)** was added in an earlier
  session — see `roadmap.md` for the full item list. Confirmed then: all
  three repos (`back`, `designer`, `services` — as understood at the time)
  are owned by the user's own Altinsk GitHub account — no third-party
  ownership risk. Real risk found instead: `server.js` ran
  `sequelize.sync({ alter: true })` on every deploy plus via a public
  endpoint, so a merge — or literally anyone hitting the endpoint — could
  silently alter the live production schema with no review step. Also
  found: `socialAuthController.js`'s Google sign-in never verified the
  token it was given — a live account-takeover hole. Decided fix: verify
  Google's real `id_token` server-side (not the HMAC patch, not a full
  external auth provider).
- **Google id_token verification — Done (2026-08-23).**
  `socialAuthController.js` now verifies `authToken` via
  `google-auth-library`'s `OAuth2Client.verifyIdToken` (signature, audience =
  `GOOGLE_CLIENT_ID`, issuer, expiry) and derives `email`/`firstName` from the
  verified payload instead of trusting the request body. `swales-designer`'s
  NextAuth callback was also fixed to send Google's real `account.id_token`
  instead of a fabricated `HMAC(secret, email)` — `swales-services` already
  had this half of the fix live. Both changes shipped on
  `fix/google-id-token-verification` branches, PR'd, merged to `main` in both
  repos, and `GOOGLE_CLIENT_ID` added to Vercel production env. Verified live
  against `https://swales-backend.vercel.app`: a missing or forged
  `authToken` now correctly returns 400/401 instead of minting a session for
  an arbitrary email.
- **Replace sequelize.sync({alter:true}) with migrations — Done (2026-08-23).**
  Removed the unauthenticated public `GET /api/db-sync` endpoint (triggered
  `sync({alter:true})` on demand) and the alter-on-local-start call; local
  startup now just calls `sequelize.authenticate()`. Added `sequelize-cli`
  config (`.sequelizerc`, `config/config.json` reading
  `DATABASE_URL_DEV_BRANCH` for development and `DATABASE_URL` for
  production) and 4 baseline migrations (Users/Elements/Projects/Shares)
  reproducing the existing schema exactly — verified column-for-column
  against production via `information_schema`, including the
  Projects→Users FK's `ON UPDATE CASCADE` (a Sequelize association-level
  default, not visible on the raw column reference). Both the Neon dev
  branch and production already had these tables, so baselined both by
  inserting the 4 migration names into a new `SequelizeMeta` table — no
  schema/data touched, confirmed via `db:migrate:status` showing all 4 as
  `up`. Shipped on `chore/replace-sync-alter-with-migrations`, merged to
  `main`, verified live: `GET /api/db-sync` now 404s in production. Side
  finding, not yet acted on: repeated `sync({alter:true})` calls over time
  likely left duplicate redundant unique constraints on `Users.Email` in
  production — worth a small cleanup later. Future schema changes now go
  through `npm run migration:generate -- <name>` + review + `npm run migrate`.

## In progress / decided but not yet done

- Repo consolidation into a GitHub Organization — discussed, not decided.
- Dedupe the redundant unique constraints that likely accumulated on
  `Users.Email` in production from years of repeated `sync({alter:true})`
  calls (found while baselining migrations, not yet fixed).

## Next up

1. Decide the repo-consolidation question, or explicitly defer it.
2. Small cleanup: dedupe `Users.Email` unique constraints in production.
