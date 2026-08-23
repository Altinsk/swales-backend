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

**Important correction (same day, later in the session):** an earlier
version of this note wrongly claimed `swales-backend` (this repo) was the
real production backend. It isn't. Confirmed via Vercel's Domains settings
and directly by Omar: the real live site is `api.swales.app` /
`designer.swales.app`, served by the `SwalesApp\back` repo family —
`swales-backend`/`swales-designer`/`swales-services` only have plain
`.vercel.app` URLs, no custom domain, not live yet. This repo is the
**active rebuild** for the roadmap; Omar is building the new version here
deliberately separate from the live site, and will point the real domains
here once it's ready. So: `SwalesApp-dev` stays the only folder in scope
(that instruction is unaffected), but nothing shipped here is protecting
real users yet — `api.swales.app` still runs the pre-fix code. Every
"Done" bullet below describes work landing in the rebuild, not in
production. Older bullets that say "`back`" are historical record from
before the relocation — read them as "this repo," not literally `back`.

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
  silently alter the schema with no review step (this repo isn't live yet,
  so the immediate risk was to the rebuild's own DB, not real user data —
  see the correction note above). Also
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

- **`.env` hygiene pass — Done (2026-08-23).** Cross-checked every
  `process.env.*` reference in code against each repo's `.env`/`.env.local`
  in all three repos and added a `.env.example` to each documenting what's
  actually required. Real findings: `swales-backend`'s `DB_HOST`/`DB_NAME`/
  `DB_USER`/`DB_PASS` and `config/database.js` are dead code (`DATABASE_URL`
  always wins in `models/index.js`, and nothing requires
  `config/database.js`); `EMAIL_USER`/`EMAIL_PASS`/`Password_Reset_Url`/
  `Email_verify_Url`/`AllowedOrigins` are unused leftovers (nodemailer is
  imported but never called — Resend replaced it; CORS origins are
  hardcoded in `server.js`). `swales-designer` and `swales-services` were
  both missing `NEXT_PUBLIC_STRIPE_LINK_3`/`_5`/`_10` locally (only
  `_CUSTOM` was set — the donation preset buttons resolve to `undefined`
  without them). `swales-services` was also missing `WEATHER_API_KEY2`,
  `NEXT_PUBLIC_SUPPORT_LINK`, and 4 `NEXT_PUBLIC_CARTO_WRI_MAP_TILE_URL`
  vars referenced in code. Confirmed no `.env`/`.env.local` file is
  currently tracked or gitignore-leaking in any of the 3 repos. One
  historical finding, already resolved: `swales-services` had a real
  `.env.local` committed to git history on 2025-04-23 (`c6ae545`), later
  untracked — every secret in it (`GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`,
  etc.) has since been rotated and no longer matches current values, so no
  live exposure; left git history as-is rather than a disruptive rewrite
  for already-dead secrets. Shipped directly to `main` in all 3 repos
  (docs/config-only change, no branch/PR).
- **Adopt Neon DB branching + Vercel Preview Deployments — Partially done
  (2026-08-23).** Vercel Preview Deployments were already working (confirmed
  via a real Vercel bot comment on PR #1). The Neon-branch-per-PR half took
  real effort: Vercel's own "Connect a Project" dialog (Storage → Neon →
  Connect to Project, with "Create Database Branch For Deployment" → Preview
  checked) got stuck in a persistent *"This project is already connected to
  the target store in one of the chosen environments"* error — survived
  deleting `DATABASE_URL`/`DATABASE_URL_UNPOOLED` entirely, a hard reload,
  and reinstalling the Neon integration. Root cause unresolved; likely needs
  Vercel Support. Worked around it via **Neon's GitHub integration** instead
  (Neon console → Integrations → GitHub → Install GitHub App, scoped to the
  `swales-backend` repo), which sidesteps Vercel's flow entirely: added
  `.github/workflows/neon_workflow.yml` (`neondatabase/create-branch-action`
  + `delete-branch-action`) so every PR gets an isolated Neon branch forked
  from `main`, `npm run migrate` runs against it as a pre-merge check, and
  the branch is deleted when the PR closes. Note: Neon's own in-console
  workflow template has a wrong output name (`db_url_with_pooler` — doesn't
  exist; the real one is `db_url_pooled`, confirmed against the action's
  README) — caught this because the first CI run failed with "Error parsing
  url", fixed in a follow-up commit, verified working end-to-end on PR #3
  (fresh branch created, `db:migrate` correctly reported "No migrations were
  executed, database schema was already up to date"). Shipped on
  `chore/neon-branch-per-pr-ci`, merged to `main` as commit `be916dc`.
  **What's still missing**: this gives every PR an isolated *database*, but
  doesn't yet wire that branch's connection string into the actual live
  Vercel Preview *deployment's* `DATABASE_URL` for that PR — so visiting a
  PR's preview URL in a browser still hits the shared dev database. Doing
  that needs a Vercel API token (`VERCEL_TOKEN`) as an additional GitHub
  secret plus a workflow step calling Vercel's env API scoped to the PR's
  git branch — left as a follow-up pending a decision from Omar.

## In progress / decided but not yet done

- **The live site (`api.swales.app`/`designer.swales.app`, `SwalesApp\back`
  family) still runs pre-fix code** — Google sign-in account-takeover hole,
  `sync({alter:true})` risk, no `.env.example`. Explicitly out of scope to
  touch right now per Omar's plan (build the rebuild in `SwalesApp-dev`
  fully, then cut the real domains over) — not forgotten, just deliberately
  deferred until cutover.
- Repo consolidation into a GitHub Organization — discussed, not decided.
- Dedupe the redundant unique constraints that likely accumulated on
  `Users.Email` in production from years of repeated `sync({alter:true})`
  calls (found while baselining migrations, not yet fixed).

## Next up

1. Decide the repo-consolidation question, or explicitly defer it.
2. Small cleanup: dedupe `Users.Email` unique constraints in production.
3. Decide on the env-var gaps the hygiene pass surfaced: set the missing
   `NEXT_PUBLIC_STRIPE_LINK_3`/`_5`/`_10` (designer + services),
   `WEATHER_API_KEY2`, `NEXT_PUBLIC_SUPPORT_LINK`, and the 4
   `NEXT_PUBLIC_CARTO_WRI_MAP_TILE_URL` vars (services) if those features
   are meant to be live — or confirm they're intentionally incomplete.
4. Optional cleanup: remove the dead `DB_HOST`/`DB_NAME`/`DB_USER`/
   `DB_PASS`/`config/database.js` and the unused `EMAIL_USER`/`EMAIL_PASS`/
   `Password_Reset_Url`/`Email_verify_Url`/`AllowedOrigins` vars from
   `swales-backend` — flagged, not removed, during the hygiene pass.
5. Decide whether to finish wiring Neon branches into live Vercel Preview
   deployments (needs a `VERCEL_TOKEN`), or leave the CI-only migration
   check as sufficient for now.
6. Still unresolved: file a Vercel Support ticket about the stuck
   "already connected" error in the Neon integration's "Connect a Project"
   dialog, if the native Vercel-Neon branching (vs. the GitHub-integration
   workaround now in place) is ever wanted.
