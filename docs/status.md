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
- **Adopt Neon DB branching + Vercel Preview Deployments — Done
  (2026-08-23).** Vercel Preview Deployments were already working (confirmed
  via a real Vercel bot comment on PR #1). The Neon-branch-per-PR half took
  real effort: Vercel's own "Connect a Project" dialog (Storage → Neon →
  Connect to Project, with "Create Database Branch For Deployment" → Preview
  checked) got permanently stuck with *"This project is already connected to
  the target store in one of the chosen environments"* — survived deleting
  `DATABASE_URL`/`DATABASE_URL_UNPOOLED` entirely, a hard reload, and
  reinstalling the Neon integration. Root cause unresolved; likely needs
  Vercel Support if the native Vercel-Neon path is ever wanted instead.
  Worked around it via **Neon's GitHub integration** instead (Neon console →
  Integrations → GitHub → Install GitHub App, scoped to `swales-backend`),
  which sidesteps Vercel's flow entirely: `.github/workflows/neon_workflow.yml`
  (`neondatabase/create-branch-action` + `delete-branch-action`) gives every
  PR an isolated Neon branch forked from `main`, runs `npm run migrate`
  against it as a pre-merge check, and deletes the branch on PR close.
  Caught and fixed a wrong output name in Neon's own in-console template
  (`db_url_with_pooler` doesn't exist; real one is `db_url_pooled`). Shipped
  on `chore/neon-branch-per-pr-ci`, merged as `be916dc`.

  Then closed the remaining gap: added a workflow step that scopes a
  `DATABASE_URL` override to Vercel Preview deployments for that PR's exact
  git branch via Vercel's env API (new `VERCEL_TOKEN` secret +
  `VERCEL_PROJECT_ID`/`VERCEL_TEAM_ID` variables), so a PR's live preview URL
  now actually uses its isolated branch instead of the shared dev database.
  Marked `continue-on-error: true` on that step since the migration job is
  now a **required status check** (branch protection added to `main` this
  session: blocks force-push/deletion, requires this check to pass) — a
  Vercel API hiccup must not block merges.

  **Security incident, self-caught and fixed same session:** the first
  version of this step's error-diagnostics logging used `jq 'del(.value)'`
  to redact Vercel's API response before printing it, but Vercel nests the
  field under `.created.value`, not top-level `.value` — the redaction
  silently did nothing, and one CI run printed Vercel's encrypted-envelope
  ciphertext for the branch's `DATABASE_URL` into this **public repo's**
  Actions log. Not the raw Neon password (Vercel's "encrypted" type returns
  its own server-side envelope, not the original value), but secret
  material regardless. Fixed with a recursive `jq walk()` that strips
  `value` at any nesting depth, stopped echoing response bodies on success
  at all, and deleted the exposed run's logs (Actions run → "..." →
  "Delete all logs") via the GitHub UI, since that specific action opens a
  native browser confirm dialog the browser-automation tooling couldn't
  click through. Verified clean on the next run. Shipped on
  `chore/wire-vercel-preview-db`, merged as `5a3067d`.

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
5. `main` now has branch protection (no force-push/deletion, required
   status check = the Neon migration job) — worth deciding if "require a
   pull request before merging" should be turned on too, now that the PR
   workflow is well-established; left off for now since this session still
   mixed in some direct-to-main doc pushes.
6. Optional, not blocking anything: file a Vercel Support ticket about the
   stuck "already connected" error in the Neon integration's "Connect a
   Project" dialog, if the native Vercel-Neon branching (vs. the
   GitHub-integration workaround now in place) is ever wanted instead.
