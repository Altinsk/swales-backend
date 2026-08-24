# Status — session continuity

Short, living note. Updated at the end of significant sessions so a fresh chat
doesn't start cold. Full plan lives in `roadmap.md`; live per-item status lives
in `roadmap_backlog.xlsx`. This file is neither — it's "where the conversation
left off."

## Last updated

2026-08-24

## BLOCKING before the next push to this repo

Two local commits (`Invalidate sessions on password change...` and `Fix
verification-token leak, add auth rate limiting...`) add a
`Users.PasswordChangedAt` column reference used on every login and every
protected-route request. **Confirmed locally: running the app against a
database that doesn't have this column crashes on every login/protected
request** (`SequelizeDatabaseError: column "PasswordChangedAt" does not
exist` — read-only query, nothing was corrupted, but the request fails).

The migration (`migrations/20260824010000-add-password-changed-at-to-users.js`)
is already applied to the Neon **dev branch** (`DATABASE_URL_DEV_BRANCH`) —
tested there, confirmed working. It is **not yet applied to whatever
`DATABASE_URL` points to** (the database `swales-backend.vercel.app`
actually runs on — confirmed via `models/index.js`, which uses
`DATABASE_URL` directly whenever it's set, regardless of `NODE_ENV`; this
is a different Neon endpoint than `DATABASE_URL_DEV_BRANCH`). Per the
established pattern from the `Users.Email` constraint dedupe earlier this
month, the auto-mode classifier blocks any `sequelize-cli --env production`
command, including read-only status checks — **Omar needs to run this one
himself**:

```powershell
cd swales-backend
$env:NODE_ENV = "production"; npx sequelize-cli db:migrate
```

Run that *before* (or in the same breath as) pushing these two commits to
`origin/main` — pushing first would break every login on the deployed
backend until the migration catches up.

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
- **Env-var gaps follow-up (2026-08-23).** Weather/map part — Done:
  confirmed `swales-services/.env.local` now has real values for
  `WEATHER_API_KEY2` (a deliberate second OpenWeatherMap key, isolated
  rate-limit budget for the bulk box-weather endpoint — not a leftover)
  and all 4 `NEXT_PUBLIC_CARTO_WRI_MAP_TILE_URL1-4` (CARTO/WRI water-stress
  map layer tiles). Nothing further needed there. Still open, **on hold
  until Omar opens a real business bank account**: `NEXT_PUBLIC_SUPPORT_LINK`
  (services) and the Stripe donation links
  (`NEXT_PUBLIC_STRIPE_LINK_3`/`_5`/`_10`/`_CUSTOM` in both `swales-designer`
  and `swales-services` — both currently hold `REPLACE_ME` stub values). A
  Stripe account needs a linked bank account to activate and issue real
  Payment Links; PayPal.me/Buy Me a Coffee for the support link is
  independent of that but Omar chose to hold both together. Code on both
  sides already reads the same env-var names identically — nothing to
  build once real links exist, just paste them into both `.env.local`
  files and both Vercel projects' env vars.
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
- **Repo consolidation into a GitHub Organization — Decided: not needed
  right now (2026-08-23).** No other developers are working on this
  application at the moment, so there's no collaborator-access-management
  need driving it — the entire benefit an Organization would add. Revisit
  if/when a freelancer or team member joins; until then, staying on the
  personal `Altinsk` account avoids the real migration cost (every Vercel
  project's git integration would need manually reconnecting after any
  transfer, since it's tied to the exact repo location).
- **Dedupe `Users.Email` unique constraints — Done (2026-08-23).** Years of
  `sync({alter:true})` had left redundant UNIQUE constraints on the same
  column: 2 on the Neon dev branch (`Users_Email_key`, `_key1`), 4 in
  production (`_key` through `_key3`). Added
  `migrations/20260823020000-dedupe-users-email-unique-constraint.js`,
  which queries `information_schema` at runtime for every UNIQUE
  constraint on `Users.Email` and drops all but the first — self-adjusting
  to each environment's actual count rather than hardcoding names. Also
  added `scripts/check-email-constraints.js`, a small read-only helper to
  inspect `Users` constraints/indexes in dev or prod. Tested on the dev
  branch first (2 → 1), then shipped on `chore/dedupe-users-email-constraint`,
  PR'd (#5), merged to `main` (`0bf6d6d`). Applying the migration itself
  against production required Omar to run it directly — the auto-mode
  classifier hard-blocks any `sequelize-cli --env production` command,
  including read-only status checks, so it isn't something this
  assistant can run unattended. Verified live: production now shows a
  single `Users_Email_key` constraint, matching dev.

- **Auth threat sweep — Done (2026-08-24), production migration still
  pending.** Omar asked what other bugs/threats were lurking in the auth
  system after the earlier auth-token-decision work. Findings and fixes
  (see the "BLOCKING before the next push" note at the top of this file for
  the one that needs Omar's action before either commit ships):

  - **Session invalidation didn't exist at all.** A stolen/leaked JWT was
    valid until natural expiry no matter what — changing your password did
    nothing to it. Added `Users.PasswordChangedAt` +
    `tokenService.assertSessionValid()`, wired into both places that gate
    access (`authController`'s `getUserIdFromRequest`, `projectController`'s
    `protect`). Also wired up `Users.IsBlackListed`, a column that's existed
    since the schema was created but nothing ever checked. Known UX side
    effect, not yet addressed on the frontend: changing your password now
    also logs out the session that made the change, with no messaging that
    explains why.
  - **Email verification links leaked a full 30-day session.** `register()`
    reused the same `generateToken()` login uses, so an intercepted
    verification email (forwarded, cached by a mail provider, auto-clicked
    by a corporate security scanner) handed over real access, not just
    "verified" status. Now signed with a dedicated `EMAIL_VERIFY_SECRET`
    (24h expiry) that's cryptographically useless as a Bearer token —
    verified the separation actually holds (a token from the new function
    is rejected by the regular session-token verifier). No resend-verification
    endpoint exists, so a user who doesn't click within 24h has no
    self-service way to get a new link — pre-existing gap, slightly more
    exposed now than under the old 30-day link; flagged, not built.
  - **No rate limiting anywhere.** Added `express-rate-limit`:
    login/google-signin at 10/15min, register/forgot-password/reset-password
    at 5/hour. Verified live in isolation (10 requests pass, 11th+ get 429).
  - **`forgotPassword` leaked which emails are registered** (distinguishable
    404 vs success). Now returns the same response either way.
  - **CORS allowlist had two domains that didn't match this project at
    all** (`garden-desinger.vercel.app` — typo'd — and
    `perma-app-vercel.vercel.app`), while the actual current
    `swales-designer.vercel.app`/`swales-services.vercel.app` deployments
    weren't listed. Confirmed the real URLs with Omar directly and swapped
    them in.

  **Still open, not fixed this session:** Bearer tokens live in
  `localStorage` on both frontends rather than relying on the `httpOnly`
  cookie the backend already sets — real XSS exposure, but a bigger
  refactor (switching both frontends' API calls off `Authorization` headers
  onto cookie-based auth) than fit alongside everything else here. No known
  XSS today; not urgent, but the largest remaining gap on this list.

- **`shared_backend` — folded into Phase B, not a separate task
  (2026-08-24).** Investigated before writing any code: `swales-backend`
  already *is* the single shared backend serving both `swales-designer` and
  `swales-services` — one `Users` table, one `Projects` table, same auth.
  There's no second backend to unify. What's actually still missing (a
  photo-upload-with-GPS endpoint, whatever data model mobile "captures"
  need) is Phase-B-specific work, not a standalone prerequisite. Omar
  agreed — `roadmap.md`'s "Shared account/data backend" row updated to
  reflect this rather than treated as separate open work.

## Next up

1. **Mobile stack — confirmed by Omar (2026-08-24).** React Native + Expo
   (TypeScript), offline-first local store (WatermelonDB/SQLite) with a sync
   queue for field capture, auth reused from Phase A's shared backend, external
   vision API for photo/plant ID at MVP, Expo push for notifications. See
   `roadmap.md`'s "First 2 weeks" item 5 for the full reasoning.
2. **Auth-token decision — Done (2026-08-24).** Investigated whether the
   roadmap's flagged "HMAC workaround" still needed a fix: it didn't — the
   2026-08-23 Google id_token fix had already retired it (backend now mints a
   JWT on login, native or Google, used as a `Bearer` token on every call; the
   HMAC path and any backend-side "re-derivation" of it no longer exist).
   Decided with Omar: keep this single JWT/Bearer mechanism as the shared auth
   for web + mobile, skip a refresh-token scheme for now (not enough
   sensitivity/risk here to justify the extra complexity yet — revisit if the
   app starts handling payments directly). Extended token lifetime 7d → 30d
   for mobile-friendliness: `utils/tokenService.js`'s `generateToken` plus the
   matching cookie `expires` in `authController.js` and
   `socialAuthController.js`. Confirmed `swales-designer`/`swales-services`
   need no change — their NextAuth config has no `maxAge` override, so both
   already default to a 30-day session, now aligned. `shared_backend`/Phase B
   is unblocked on the auth front; see item 3 for what's still open.
3. **Build `AuthContext` for the web app — Done (2026-08-24).**
   `swales-designer` already had a working `context/AuthContext.tsx`; the gap
   was specifically `swales-services`, which didn't. Built
   `swales-services/src/context/AuthContext.jsx` mirroring designer's
   pattern, adapted to services' existing conventions (`accessToken`
   localStorage key set by `login/page.js`/`googleUtils.js`, the
   `NEXT_PUBLIC_API_BASE_URL + "/api"` base-URL convention already used by
   `Header.jsx`/`AccountDetailsModal.jsx`), wired into `providers.js`, and
   hooked into `login/page.js`'s `handleLogin` so `user` state updates
   immediately after login instead of waiting for a hard reload (the
   Google-signin path already does a hard `window.location.href` redirect,
   so it didn't need the same fix). Cleaned up the now-stale "doesn't exist
   yet" comment block in `MobileHeader.jsx`.

   **Caught and fixed a real regression before shipping:** the first draft
   copied designer's `{!isLoading && children}` render gate on the provider.
   `npm run build` still succeeded and looked fine at a glance, but a direct
   before/after diff of the static HTML output (`git stash` to get a clean
   baseline, rebuild, compare) showed the gate was silently blanking
   Header/nav content (`Sign Up`, the Designer link, etc.) out of every
   statically-prerendered page — invisible in the terminal build log, only
   visible by actually inspecting `.next/server/app/*.html`. That's fine for
   `swales-designer` (an app-like tool, not SEO-dependent) but wrong here:
   `swales-services` is the public marketing/blog site with real SEO
   requirements (`metadataBase`, Google site verification, 180+ static
   blog/use-case pages). Fixed by always rendering `children` regardless of
   `isLoading` — matches how `Header.jsx` already behaves (shows logged-out
   UI immediately, updates once `/auth/me` resolves).

   Verified end-to-end with a live dev server against the real rebuild
   backend (`https://swales-backend.vercel.app`, no local backend needed):
   confirmed the logged-out page renders correctly (build regression fixed),
   then set an invalid token in `localStorage` and reloaded — confirmed via
   console/network inspection that `/api/auth/me` fires with the `Bearer`
   header, correctly gets 401, and the context's error handling clears
   `accessToken`/`userName` from `localStorage` (self-healing `logout()`
   path). No real account was created for this — didn't want to write a
   throwaway row into the rebuild's Neon DB just for a QA pass; the failure
   path alone was enough to prove the request/header/error-handling wiring
   is correct, and the success path is structurally identical to designer's
   already-proven implementation.

   **Not done, explicitly out of scope for this item:** `Header.jsx` (the
   header component actually rendered on every page) keeps its own
   independent, duplicate auth-state logic (`getUserDetails()`, manual
   `localStorage` reads, an ineffective cookie-clearing loop on logout since
   the real auth cookie is `httpOnly`) rather than being migrated onto the
   new context. `MobileHeader.jsx` — the component that actually needed
   `AuthContext` to compile — is still not imported/rendered anywhere in the
   app; whether it should replace Header.jsx's built-in mobile view or stay
   unused is a product decision, not this item's job. Both are reasonable
   follow-ups if useful later, not correctness gaps in what shipped.
4. **Both resolved 2026-08-24**, see the entries above: `MobileHeader.jsx`
   removed (dead code, `Header.jsx` already covers mobile); `Header.jsx`
   migrated onto `AuthContext`, dropping its duplicate auth logic. `swales-backend`'s
   `shared_backend` item folded into Phase B rather than treated as
   standalone work.
5. **Run the production migration before pushing** — see the "BLOCKING
   before the next push" note at the top of this file. This is the actual
   next action, ahead of everything else below.
6. **Biggest remaining item from the auth threat sweep**: switch both
   frontends off `localStorage`-stored Bearer tokens onto the `httpOnly`
   cookie the backend already sets on login. Real XSS exposure today (any
   script-injection bug can read the token directly), no known exploit yet,
   but the largest gap left open after this session's fixes. A genuine
   refactor — touches every authenticated API call in both
   `swales-designer` and `swales-services` — worth its own session rather
   than squeezing in alongside other work.
7. No resend-verification-email endpoint exists, and the verification
   token now expires in 24h instead of the old (accidental) 30 days — a
   user who doesn't click in time has no self-service recovery today
   (would need to contact support, since re-registering with the same
   email fails). Worth building if this becomes a real support burden;
   flagged, not built.
8. **On hold until Omar opens a real business bank account:**
   `NEXT_PUBLIC_SUPPORT_LINK` (services) and the Stripe donation links
   (`NEXT_PUBLIC_STRIPE_LINK_3`/`_5`/`_10`/`_CUSTOM`, designer + services) —
   both need a real payout destination Omar doesn't have yet. Everything
   else on the code side is already wired and waiting on real values.
9. Optional cleanup: remove the dead `DB_HOST`/`DB_NAME`/`DB_USER`/
   `DB_PASS`/`config/database.js` and the unused `EMAIL_USER`/`EMAIL_PASS`/
   `Password_Reset_Url`/`Email_verify_Url`/`AllowedOrigins` vars from
   `swales-backend` — flagged, not removed, during the hygiene pass.
10. `main` now has branch protection (no force-push/deletion, required
   status check = the Neon migration job) — worth deciding if "require a
   pull request before merging" should be turned on too, now that the PR
   workflow is well-established; left off for now since this session still
   mixed in some direct-to-main doc pushes.
11. Optional, not blocking anything: file a Vercel Support ticket about the
   stuck "already connected" error in the Neon integration's "Connect a
   Project" dialog, if the native Vercel-Neon branching (vs. the
   GitHub-integration workaround now in place) is ever wanted instead.
