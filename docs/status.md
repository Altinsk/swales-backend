# Status — session continuity

Short, living note. Updated at the end of significant sessions so a fresh chat
doesn't start cold. Full plan lives in `roadmap.md`; live per-item status lives
in `roadmap_backlog.xlsx`. This file is neither — it's "where the conversation
left off."

## Last updated

2026-09-04 (Discord/Substack footer links wired in; field-level validation
errors added across auth forms in both frontends — see below)

2026-09-03 (Google sign-in on permaculturetools.online now in progress —
needs a Google Cloud Console change only Omar can make; see "Still open,
needs Omar" below)

## Correction 2026-09-03: two Phase A2 roadmap rows were already done

While reviewing "what's next" with Omar, checked the actual code behind two
A2 backlog rows rather than trust the roadmap wording — both turned out to
already be shipped, just never marked as such:

- **"PDF site report (wind + solar + soil analysis export)"** — this A2 row
  was written from an earlier codebase audit, before the 2026-08-24
  monetization session discovered `combinedReportPdf.js`/
  `CombinedReportContent.jsx` already existed. Confirmed 2026-09-03:
  `CombinedReportContent.jsx` already renders Solar, Wind, and Soil sections
  (plus Sun/contour/precipitation) into one PDF. It was a duplicate entry,
  not a real gap — `roadmap.md` updated to reflect this.
- **"Precipitation card — Option A (static)"** — also already built, not
  "not started" as the roadmap said. `PrecipitationCard.jsx` exists (rain
  intensity scale, animated rain effect) and is live in
  `LayerDataPanel.jsx:181`. Only Option B (**RainAdvisor** — irrigation/
  flood-risk/swale-sizing recommendations layered on top) is still genuinely
  open.

Both corrected in `roadmap.md`'s A2 table. `roadmap_backlog.xlsx`'s
matching rows still need the same correction — not yet done.

## Test domain: permaculturetools.online (2026-08-27, live as of 2026-09-03)

Omar bought `permaculturetools.online` to test the live rebuild end-to-end
without touching `swales.app` (still serving the old `SwalesApp\back` site).
Plan: mirror the eventual `swales.app`/`designer.swales.app`/`api.swales.app`
structure — root domain → `swales-services`, `designer.` → `swales-designer`,
`api.` → `swales-backend`. Once verified, `swales.app` gets cut over the same
way (whether the test domain then redirects to `swales.app` or stays live is
explicitly **not decided yet**).

**Done so far (code side, no external accounts touched):**
- Both frontends now default every deployment to `X-Robots-Tag: noindex,
  nofollow` (`swales-services/next.config.mjs`, `swales-designer/next.config.ts`),
  gated on a new `ALLOW_INDEXING` env var (unset = noindex). This was a real
  gap, not just caution: `swales-services/src/app/robots.js` allows crawling
  from everyone, and a new domain's SSL cert shows up in public
  certificate-transparency logs within minutes of issuance regardless of
  whether it's ever submitted to Search Console — "I won't tell Google about
  it" doesn't actually stop discovery. Verified live: `curl -I` against a
  local dev server confirmed the header is present by default.
- `swales-backend/server.js`'s CORS allowlist now includes
  `https://permaculturetools.online`, `https://www.permaculturetools.online`,
  `https://designer.permaculturetools.online` (additive, doesn't affect
  existing origins).
- `roadmap.md`'s "Field Calculators" row scope decided: includes
  earthworks-sizing tools (swale volume/dimensions, terrace spacing/cut-fill)
  — not broken into individual backlog items yet.
- **Namecheap DNS → Vercel nameservers — Done (2026-09-03).** Switched
  `permaculturetools.online` to `ns1.vercel-dns.com`/`ns2.vercel-dns.com`.
  **Gotcha worth remembering for the `swales.app` cutover**: the registry-level
  delegation (checked via the `.online` TLD servers directly) showed correct
  immediately, but Vercel's own side took roughly a day to actually activate
  the DNS zone — until then, `ns1.vercel-dns.com` returned `Query refused` for
  the domain, Vercel's dashboard showed "Invalid Configuration", and the SSL
  Certificates panel showed "DNS zone not enabled for permaculturetools.online.
  Cannot solve dns-01 ACME cert challenge." No action fixed this faster than
  waiting — don't chase it by re-adding records or reverting nameservers.
  Once the zone activated, all 4 hostnames (root, `www`, `designer`, `api`)
  resolved to Vercel IPs and issued valid certs without any manual DNS record.
- **Vercel → Domains, all 3 projects — Done (2026-09-03).** `swales-services`
  has `permaculturetools.online` (redirects to `www`) + `www.permaculturetools.online`;
  `swales-designer` has `designer.permaculturetools.online`; `swales-backend`
  has `api.permaculturetools.online`. All issuing SSL automatically.
- **Vercel → Environment Variables (Production), all 3 projects — Done
  (2026-09-03).** Set exactly as planned below (see the values that were
  "still open" as of 2026-08-30) — `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_API_BASE_URL`,
  `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_BASE_URL`, `SWALES_APP_URL`,
  `DESIGNER_APP_URL`, `BASE_URL`, `CLIENT_URL` all point at the
  `permaculturetools.online` family. `ALLOW_INDEXING` left unset on both
  frontends as planned.
- **Resend domain verification + email sender flip — Done (2026-09-03).**
  Omar verified `permaculturetools.online` in Resend (SPF/DKIM/DMARC TXT +
  MX records added to Vercel's DNS zone, same shape as the records already
  live for `swales.app`). `utils/emailService.js`'s `sendVerificationEmail`
  and `sendResetPasswordEmail` now send `from: "no-reply@permaculturetools.online"`
  instead of `no-reply@swales.app` — shipped on
  `chore/email-from-permaculturetools-domain`, merged as PR #16 (`757e970`).
  **Must be flipped back to `no-reply@swales.app` at the real cutover** — see
  new item 7 in the Cutover stage checklist below.

**Still open, needs Omar:**
1. **Google Cloud Console — deferred, not needed right now (Omar's call,
   2026-08-27).** Skipping the OAuth client update for now means **Google
   sign-in will not work on `permaculturetools.online` yet** — clicking it
   will fail or redirect wrong, since the domain isn't in the OAuth client's
   authorized origins/redirect URIs. Fine as long as testing doesn't depend
   on Google sign-in specifically; native email/password sign-in works
   (confirmed live — the whole point of finishing the domain/DNS work above
   was to get this and the newsletter-subscribe flow testable end-to-end on
   the real domain). Revisit when needed: add Authorized JavaScript origins
   `https://permaculturetools.online` and `https://designer.permaculturetools.online`;
   add Authorized redirect URIs
   `https://permaculturetools.online/api/auth/callback/google` and
   `https://designer.permaculturetools.online/api/auth/callback/google`
   (NextAuth's standard callback path).

## Cutover stage: swapping in swales.app (future, not yet scheduled)

Not started — recorded now so it isn't lost. Whenever Omar decides to point
the real `swales.app` domain at this rebuild (retiring the old `SwalesApp\back`
site), the following all need doing together, mirroring everything done above
but for `swales.app`/`designer.swales.app`/`api.swales.app` instead of
`permaculturetools.online`:

1. Add `swales.app`/`www.swales.app` to `swales-services`,
   `designer.swales.app` to `swales-designer`, `api.swales.app` to
   `swales-backend` in Vercel → Domains (same as the permaculturetools.online
   steps above). CORS already allows these — added preemptively, see
   `server.js`'s `corsOptions.origin`.
2. Update the same Production env vars (`NEXT_PUBLIC_API_BASE_URL`,
   `NEXTAUTH_URL`, `SWALES_APP_URL`, `DESIGNER_APP_URL`, `BASE_URL`,
   `CLIENT_URL`, etc.) to the `swales.app` URLs.
3. **Flip the noindex guard**: set `ALLOW_INDEXING=true` in Vercel's
   Production env vars for `swales-services` and `swales-designer` — see the
   `TODO at the swales.app cutover` comment in each repo's `next.config`.
   Don't remove the guard code itself; it should keep defaulting non-canonical
   domains (any future staging/test domain) to noindex even after this.
4. Actually do the deferred Google Cloud Console step (item 5 above) for the
   real `swales.app` domains, not just the test ones.
5. **Decide what happens to `permaculturetools.online` afterward** — still
   open per Omar: redirect it to `swales.app`, or leave it live as a
   separate/standing test surface. Whichever is chosen, if it stays live it
   should stay noindexed (guard already defaults that way — nothing extra
   needed unless it's deliberately given `ALLOW_INDEXING=true` too, which
   would create a duplicate-content risk with `swales.app` — avoid that).
6. Point DNS at Namecheap for `swales.app` the same way as
   `permaculturetools.online` (nameservers or A/CNAME to Vercel) if not
   already done — `swales.app` currently still resolves to the old
   `SwalesApp\back` site. Expect the same Vercel-side zone-activation lag
   noted above (registry delegation can look correct immediately while
   Vercel's own DNS zone takes up to ~a day to actually enable) — don't
   troubleshoot it as a real misconfiguration if "Invalid Configuration"
   persists briefly right after the nameserver switch.
7. **Flip the email sender back**: revert `utils/emailService.js`'s
   `sendVerificationEmail`/`sendResetPasswordEmail` `from` address from
   `no-reply@permaculturetools.online` back to `no-reply@swales.app` (see
   the "Resend domain verification + email sender flip" entry above,
   2026-09-03) — `swales.app` is already the verified Resend sender, so this
   is just reverting the string, no new Resend/DNS work needed. Needs its
   own branch+PR, same as the original flip.

## New directives from Omar (2026-08-26) — see `roadmap.md`'s "Guiding directives" section for full detail

1. **On-ground equipment link** is a long-term vision (link the software tool
   to physical on-ground tools/equipment — built, sourced, or resold) to keep
   active in mind now, not deferred to Phase F.
2. **Community is core**, not a late add-on — helping, knowledge-sharing, and
   marketplace, not just a design gallery. Consider pulling core community
   mechanics earlier than the current Phase C/F placement once Phase B is
   closer to done.
3. **Relaunch the live rebuild ASAP**, keep developing in the background
   afterward — supersedes the earlier "finish the rebuild fully, then cut
   over" assumption. Still needs a concrete pre-launch checklist (not
   written yet).

**httpOnly-cookie auth migration — Done 2026-08-26.** Omar's explicit
priority for this session, directly supporting directive 3 (it was the
biggest open security gap and worth closing before a real relaunch).
Bearer tokens no longer live in `localStorage` in either frontend — auth
now rides the `httpOnly` cookie the backend already set on login but
neither frontend was actually using.

- **Backend** (`swales-backend`): `projectController.js`'s `protect`
  middleware and `authController.js`'s `getUserIdFromRequest` both now read
  the session from `req.cookies.token` first, falling back to an
  `Authorization: Bearer` header only for non-browser callers (kept for
  compatibility, not expected to be used by either frontend anymore). Added
  `POST /api/auth/logout` (clears the cookie) — previously logout only
  existed as a frontend-side `localStorage.removeItem`, no server-side
  cookie clearing existed at all. `updateProfile` now also reissues the
  cookie (previously only returned the new token in the response body,
  which nothing read from a cookie-based flow), matching `login` and
  `google-signin`.
- **Real bug caught before shipping**: the cookie was already being set
  with `sameSite: "lax"`, which silently never gets attached on a
  cross-site `fetch`/`XHR` request (only on top-level navigations). That's
  fine for `designer.swales.app` → `api.swales.app` (same registrable
  domain under `swales.app`, so same-site), but the *currently deployed*
  rebuild only has plain `*.vercel.app` URLs — each `*.vercel.app` subdomain
  is its own site per the public suffix list, so `swales-designer.vercel.app`
  calling `swales-backend.vercel.app` is cross-site. Under `lax` this
  migration would have compiled and looked fine locally, then silently
  failed to authenticate anything the moment it was tested against the real
  deployed rebuild. Fixed by adding `utils/tokenService.js#sessionCookieOptions()`,
  a shared helper used by every place that sets/clears the cookie: `sameSite:
  "none"` in production (works for both the same-site custom-domain future
  and the cross-site `.vercel.app` present; requires `secure`, already
  gated on `NODE_ENV === "production"`), `"lax"` in local dev (localhost is
  plain http, can't set `secure`, and doesn't need cross-site cookies
  anyway).
- **Frontends** (`swales-designer`, `swales-services`): both `AuthContext`s
  rewritten — `user` is now the only piece of session state exposed; there
  is no raw token anymore. `login()` takes no arguments (the backend has
  already set the cookie by the time it's called) and just re-fetches
  `/auth/me`; `logout()` calls the new `/api/auth/logout` endpoint before
  clearing local state. Every call site that read `localStorage.getItem("accessToken"/"token")`
  or attached `Authorization: Bearer ${token}` was converted to
  `withCredentials: true` (axios) with no header — this touched `TopBar.tsx`,
  `AllGardensModal.tsx`, `AccountDetailsModal.tsx`/`.jsx` (both apps),
  `GoogleLogin.tsx`, `app/page.tsx`, `app/share/[uuid]/page.tsx`, `app/login/page.tsx`
  (designer), and `login/page.js`, `googleUtils.js`, `pricing/page.js`,
  `SignupQuotePopup.jsx` (services). `pricing/page.js` and
  `SignupQuotePopup.jsx` had been reading `localStorage` directly just to
  render an "is this visitor logged in" state — switched to `useAuth().user`
  instead. `google-signin` calls in both apps were also missing
  `withCredentials: true` on the axios call itself (needed for the browser
  to accept the `Set-Cookie` on a cross-origin response) — added.
- **Verified**: both apps build clean (`npm run build`, `swales-designer`
  and `swales-services`) with no new type errors (cross-checked designer's
  full `tsc --noEmit` output against `git status` — every reported error is
  in a file this change didn't touch, e.g. `GardenCanvas.tsx`'s pre-existing
  Konva typing issues).
- **Full login round-trip verified live against the Neon dev branch
  (2026-08-26, same session)** — ran the backend locally with
  `DATABASE_URL` overridden to `DATABASE_URL_DEV_BRANCH` (local `.env`'s own
  `DATABASE_URL` points at the main branch per its own comment, so this
  override was required to avoid touching real/main data). Registered a
  throwaway `swales-qa-cookie-test+<timestamp>@example.com` account,
  verified it by generating a real `EMAIL_VERIFY_SECRET` token via
  `tokenService.generateEmailVerifyToken` directly (same code path a real
  email link uses, no inbox needed), then confirmed with `curl` + a cookie
  jar: login sets the cookie with the correct attributes; `GET /api/auth/me`
  and `GET /api/projects` (`protect` middleware) both authenticate off the
  cookie alone with **no** `Authorization` header sent; `PUT
  /api/auth/update-profile` correctly reissues the cookie with the updated
  payload; `POST /api/auth/logout` clears the cookie and the same jar
  correctly gets 401 on the next request. Also restarted the same server
  with `NODE_ENV=production` (still pointed at the dev branch, not
  production) and confirmed the `Set-Cookie` header actually reads `Secure;
  SameSite=None` in that mode vs. plain `SameSite=Lax` in dev — the specific
  fix for the cross-site `*.vercel.app` bug is confirmed at the header
  level. Cleaned up afterward: deleted the throwaway test user from the dev
  branch, stopped both local server instances. **Still not verified**: real
  browser enforcement of `Secure`/`SameSite=None` against an actual
  `https://*.vercel.app` deployment (curl's cookie jar doesn't enforce the
  same-origin/HTTPS restrictions a browser does, so this was confirmed at
  the header-content level, not via an end-to-end HTTPS round trip) — worth
  a real click-through test against a live Vercel preview URL before or
  during the actual relaunch, but the mechanism itself is now proven
  correct against real data.
- **Not done, explicitly out of scope for this item**: rate-limiting or
  auditing the new `/logout` endpoint (it doesn't need auth to call — always
  safe to no-op-clear a cookie you may not have, but worth a glance later);
  the Authorization-header fallback path is now genuinely unused by both
  frontends and could eventually be removed once we're confident nothing
  else depends on it.

## Corrected 2026-08-28: the old "BLOCKING" migration note was stale

This section used to warn that `Invalidate sessions on password change...`
and `Fix verification-token leak, add auth rate limiting...` were **local,
unpushed** commits adding a `Users.PasswordChangedAt` column, and that Omar
needed to run the production migration *before* pushing them or every login
would break.

That was already out of date by the time it was re-read on 2026-08-28: both
commits had actually been sitting on `origin/main` since **2026-08-24** —
four days, with a full week of other work merged on top — and this note was
simply never updated to reflect that the push had already happened.

**No outage actually occurred.** Confirmed 2026-08-28 by running the
production migration command this note itself specified
(`NODE_ENV=production npx sequelize-cli db:migrate`): it skipped straight to
`20260825010000-add-layer-to-elements` without touching
`20260824010000-add-password-changed-at-to-users` at all — proof the
password-column migration was already applied to production before this
check ever ran (Sequelize runs pending migrations in timestamp order, so it
would have run the password one first had it still been pending).

**Side effect of that same run**: `20260825010000-add-layer-to-elements` —
previously applied only to the Neon **dev branch** — is now also applied to
**production**. Purely additive (a `layer` enum column on `Elements`,
already proven on dev), doesn't unblock the canvas merge (still paused on
real per-species images, see `future-concerns.md` item 11), but production's
schema and the dev branch's are now back in sync on this column. The
migration file itself is now committed too — see the
`chore/commit-layer-field-code` PR.

**Lesson for next time**: a "BLOCKING before next push" note needs to be
deleted or corrected the moment the referenced push actually happens —
leaving it in place after the fact makes it silently misleading instead of
protective.

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
  is drafted. **Companion-planting data — Done (2026-08-24).** All 98
  plant rows that had an empty `good_companions` (the 9 non-plant rows —
  animal systems, water features, structures — correctly stay blank, that
  field doesn't apply to them) now have `good_companions` filled, following
  the same convention as the original 64 rows: real `id` cross-references
  where the seed has a matching species, free text for well-known
  companions outside the seed's scope (e.g. `tomato`, `most_brassicas`).
  A few `avoid_near` gaps were also filled where a real antagonism was
  missing (e.g. stone fruit vs walnut juglone, alliums vs asparagus).
  `validateSeed.js` still passes with only the expected free-text
  warnings, no structural errors. **Subcategory vocabulary cleanup — Done
  (2026-08-24).** 65 distinct `subcategory` values reduced to 53: fixed 3
  rows where `subcategory` crossed top-level `category` boundaries
  (`pistachio`/`katuk` tagged with tree/herb-only subcats despite being
  `shrub`; `strawberry_tree` tagged `hedge_fruit`, a shrub-only value,
  despite being `tree`), and merged 9 near-duplicate pairs that meant the
  same thing (`fruit_hedge`/`hedge_fruit` reordered, `hedge`/
  `hedge_wildlife`, `fruit_shrub`/`soft_fruit`, `fruit_vine`/
  `edible_vine`, `allium`→`culinary`, `annual_companion` split into
  `dynamic_accumulator`/`edible_groundcover` depending on category,
  `culinary_medicinal`/`succulent_medicinal`→`medicinal`,
  `salad_perennial`→`perennial_vegetable`, `fast_multipurpose`→
  `multipurpose_tree`, `edible_succulent`/`fruit_groundcover`→
  `edible_groundcover`). The one remaining value that still spans two
  categories (`nitrogen_fixer_cover`, used by both `groundcover` and
  `grass_cover_crop`) is intentional — same concept, correctly reused, not
  a naming inconsistency. No frontend code referenced any of the old
  values (`swales-designer` doesn't read `subcategory` at all yet), so
  this was a pure data change. **`layer` field added — Done (2026-08-25).**
  Omar asked whether the 171-species seed distinguished food-forest layers
  (canopy vs sub-canopy etc.) — it didn't; `category`/`subcategory` only
  got you partway there. Added a new `layer` column (enum: `canopy`,
  `sub_canopy`, `shrub`, `herbaceous`, `root`, `groundcover`, `vine`,
  `cover_crop`, `fungal`, `n_a`) derived from `category` +
  `mature_height_m`, with full derivation rules recorded in
  `schema.md`'s "Why this shape" section (canopy/sub_canopy split at 15m,
  matching the pre-existing `canopy_tree` subcategory rows; `root` reserved
  for species where an underground tuber/rhizome is the *primary* harvest,
  not just anything with `root` in `yield_type`). Touched: CSV (new
  column), `schema.md`, `validateSeed.js` (new expected column + enum),
  `models/element.js`, a new migration
  (`20260825010000-add-layer-to-elements.js`), and `seedElements.js`'s
  column mapping. Migration applied and dev branch re-seeded — same
  pattern as before, `sequelize-cli` already defaults to
  `DATABASE_URL_DEV_BRANCH` per `config/config.json`, no manual override
  needed for the migration step (only `seedElements.js` needs the
  override, since it reads `DATABASE_URL` directly via `models/index.js`
  rather than through sequelize-cli's env-aware config). **Still paused,
  not forgotten, not finished** — real per-species images remain the
  blocker (see `future-concerns.md` item 11: the plant DB has zero images
  today; merging into the canvas now would render every species as one
  generic per-category placeholder shape, not a distinct picture). The
  `layer` field itself does not depend on photos and is functionally
  complete and applied to both the Neon dev branch and production — but
  that's only the data-model half of this item. **The actual point of
  this work — the canvas showing real plant data instead of static
  `presets.json` — has not started and cannot start until Omar sources or
  creates a real image per `icon_key`.**
  Code housekeeping only (2026-08-30): the backend code
  (`models/element.js`, `scripts/seedElements.js`, `scripts/validateSeed.js`,
  `seed-data/plants_seed.csv`, `seed-data/schema.md`,
  `migrations/20260825010000-add-layer-to-elements.js`) and the designer
  side (`public/presets.json`'s `food-forest-layers` restructuring) had
  been sitting uncommitted in the working tree for days — both are now
  committed and pushed (`swales-backend` PR #13; `swales-designer`
  `6829213`). This is purely a "stop the repo silently drifting from what
  the database already has" cleanup — it does not advance the paused item,
  does not touch the canvas, and should not be read as progress toward
  unblocking it. Still waiting on Omar for images.
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

- **`docs/future-concerns.md` created (2026-08-24), at Omar's request.** A
  4th tracking doc, distinct from `roadmap.md`/`status.md`/
  `roadmap_backlog.xlsx`: a living checklist of risks/gaps intentionally
  deferred rather than fixed immediately, meant to be reviewed before
  starting a new phase or a real-users/monetization milestone so nothing
  gets silently forgotten until it forces backtracking. Seeded with
  everything flagged-but-not-fixed from the auth threat sweep, plus two new
  items Omar asked to add to scope: **2FA** (TOTP, not SMS — target before
  monetization go-live, not necessarily before the monetization framework
  is decided) and **blocking disposable/temporary email domains at
  registration**. Both added to `roadmap.md`'s Phase A table and
  `roadmap_backlog.xlsx` as new "Should" rows, neither built yet. All three
  `CLAUDE.md` files updated to point to the new doc and cleaned up of
  several sessions' worth of stale "corrected" notes that had accumulated.

- **Monetization framework — Decided (2026-08-24).** Omar's opening
  question: what stops someone from just screenshotting a "report" instead
  of paying for it? Correct instinct — no technical measure stops
  screenshots (true of every SaaS product with visual output), so the
  answer isn't to lock down pixels, it's to design what's free vs. paid so
  a screenshot of the free tier isn't worth anything a paying user has.
  Landed on a Priestley 4-product ladder, but reconciled against what's
  *actually already built* rather than designed from a blank slate —
  investigated the codebase before proposing anything:

  - Found a fully working **combined "Site Report" PDF generator**
    already wired into `swales-services`'s map page
    (`utils/combinedReportPdf.js` → `generateCombinedReport`, triggered
    from `MapComponent.jsx`), already gated behind sign-up via
    `ReportAuthGateModal` ("Sign in or create a free account to download
    it"). This *is* the free-for-contact stage Omar described — already
    live, no build needed.
  - Found a live **`SmartSolarAdvisor`** component (solar-specific advice,
    shown in the solar layer panel and inside the combined report) — real,
    but distinct from a *planting-recommendation* advisor, which doesn't
    exist.
  - Found `swales-services/src/app/pricing/page.js` already sketches a
    4-tier structure (Explorer/free, Homestead, Farm & Business,
    Industrial) with three tiers marked "Coming Soon" and aspirational
    feature lists — not wired to any real checkout. Worth revisiting once
    the framework below is final, since its copy doesn't match the
    decision.
  - Saved-project limits: the CRUD exists, no limit is enforced on free
    users today. Sharing: a read-only share-link feature exists
    (`/api/shares`, `/share/[uuid]`) — single-link, not multi-user
    collaboration.

  **Decided structure:**
  - **Free** — all analysis maps (solar/wind/soil/water stress/altitude/
    contour/flooding/weather) + the design canvas. No gate, no account
    needed to browse or design.
  - **Free-for-contact** — printing/downloading a report or a design
    requires an account. Already built and working as of today; nothing
    to change here.
  - **Core paid** (subscription, monthly + yearly billing options; actual
    price points not yet set — a separate, still-open decision) — at
    *launch*, this is an enhanced version of the report (multi-location
    comparison, unlimited regenerations, no upsell footer), deliberately
    **not** just re-gating the same free report behind a paywall (would
    have made the free tier pointless). Saved-project-limit enforcement,
    real multi-user collaboration, the planting-recommendation AI advisor,
    and the not-yet-built "consulting site details for energy" feature are
    all explicitly **deferred, not part of the initial paid bundle** —
    Omar's call, specifically to avoid building a full feature set before
    a single subscriber exists.
  - **Post-core** — intentionally undefined. To be designed once there's
    real usage data telling us what's actually working, not speculatively
    now.

  **Blocked on**: Stripe actually being wired for real subscription
  checkout, which is itself blocked on Omar opening a business bank
  account (already tracked). The framework is decided; nothing here can
  go live yet regardless.

  **Not yet done, follow-up work**: `pricing/page.js`'s copy doesn't match
  this decision yet (still shows the old aspirational 4-tier sketch) —
  worth updating once ready to communicate this externally, not urgent
  since nothing is purchasable yet anyway. Actual subscription price
  points still need deciding — separate from the framework itself.

- **Monetization framework — revised 2026-08-27: the full report moves
  from free-for-contact to Core paid.** Came up while scoping the shared
  site-data cache work (see the entry above) — Omar asked how a full,
  single-location report gets sold to premium users, which surfaced that
  the 2026-08-24 decision had already given the combined Site Report away
  free-for-contact (account required, no payment). Decided: that's wrong
  now — **the full site analysis report itself (solar/wind/soil/water
  stress/flood risk/precipitation/elevation, plus contour once the
  in-progress report work lands) requires payment, not just an account.**

  What stays free-for-contact: **downloading/printing a design** (a canvas
  export) — only the *analysis report* moved, not everything that
  `ReportAuthGateModal` currently gates. The previously-decided "enhanced"
  Core-paid layer (multi-location comparison, unlimited regenerations, no
  upsell footer) still applies on top of this — it was originally meant to
  differentiate paid from a *free* base report; now it differentiates paid
  from a *paid* base report, which is a smaller gap than before and may be
  worth revisiting once the base paid report actually exists.

  **Not decided yet, flagged for a follow-up session**: the actual selling
  mechanism for the single-location report — subscription-only (must
  subscribe even for one report), one-time pay-per-report purchase, or
  both offered together. Three options were discussed inline (subscription
  only / one-time purchase / both) with a lean toward eventually offering
  both, but nothing was locked in — this needs its own decision before
  building any paywall UI.

  **Still blocked on the same thing as before**: Stripe isn't wired for
  real payments, itself blocked on Omar opening a business bank account.
  This decision changes what the eventual paywall gates, not the fact that
  no paywall can go live yet regardless.

  **Not yet done**: actually building the gate (currently
  `ReportAuthGateModal` only checks for a logged-in account, not a paid
  subscription — it will need a real "is this user on Core paid" check
  once Stripe exists) and updating `pricing/page.js`'s copy, which was
  already stale before this change and is now further out of date.

- **Shared site-data cache (roadmap's "Pinpoint global data extraction") —
  in progress, 2026-08-27.** Investigated first: the map
  (`swales-services/src/components/map/MapComponent.jsx`, ~4,500 lines) had
  no shared data layer at all — each of 9 external datasets was fetched
  independently from up to 3-4 separate call sites (an address-search
  handler, a mount/activation effect, a click/drag handler, and sometimes a
  dedicated lib-module function), with zero coordination between them.
  Switching tabs or revisiting a pin always re-fetched everything from
  scratch. Decided direction: **lazy + shared cache** — keep today's
  fetch-on-view-only behavior (no new eager fetching, no increase in API
  call volume), just dedupe so the same dataset for the same location is
  never fetched twice in one session.

  Built `swales-services/src/lib/map/siteDataCache.js` — a plain
  module-level `Map` cache (not React Context, since roughly half the call
  sites are non-component lib modules with no natural hook access) keyed by
  dataset name + rounded lat/lng, storing the **in-flight Promise** (not
  just the resolved value) so near-simultaneous calls from different call
  sites collapse into one real fetch instead of both racing to the
  network. Wired in phase by phase, verified live in the browser after
  each: **solar, soil** (soil turned out to have a 4th call site inside
  `lib/map/soilLayer.js` — found only because the plan said to grep for
  every call site rather than assume a count, not by memory), **wind
  planning, water stress, flood risk**, and **elevation/geocode/
  precipitation** (the biggest win — these are shared across the most call
  sites, including `updateLocationAndTimeGeoInfo`, which runs on every
  click/drag on every map page regardless of active layer).

  **Real debugging detour, worth recording:** wind planning appeared
  completely broken during verification — no network request ever showed
  up in the browser's network log, no error either. Root cause turned out
  to be a blind spot in the verification method, not the code: `windService.js`
  calls its data sources via `axios`, which the browser executes as
  `XMLHttpRequest`, and the browser tool's network inspector wasn't
  capturing those (unlike the `fetch()`-based calls solar/soil's proxy
  routes use). Confirmed via temporary console logging (added, verified,
  then fully removed) that the fetch was succeeding the whole time — GWA
  and ERA5 both responded 200, and despite ~7 re-renders of the triggering
  effect, the real fetch only fired once, proving the cache worked
  correctly. Lesson for next time: this app's data services are a mix of
  `axios` and `fetch()` — don't conclude "nothing happened" from an empty
  network-request list alone; check console/application-level evidence too.

  **Report generation wired to the same cache.** `combinedReportPdf.js`'s
  `generateCombinedReport` was calling `fetchSolarData`,
  `fetchAllWindData`, `fetchSoilData`, `fetchAltitude`/`getLocationName`,
  `fetchWaterStressData`, `fetchFloodRiskData`, and `fetchPrecipitation`
  directly, bypassing the cache — every report regeneration re-fetched all
  7, even on the exact same spot. Now wrapped through the same
  `getOrFetch`, same dataset keys as the map — a report that reuses
  already-browsed tabs' data is free, and regenerating the same report is
  free; a cold "Generate Report" with no prior browsing still costs the
  same as before (a full report always needs full data; the cache only
  removes *redundant* fetching, not the first one).

  **Real gap found and fixed along the way, not part of the original
  plan:** Omar asked "where is Sun in this report?" — turned out the Sun
  Tracking section was only in the report if `sunTrackerDetails` happened
  to already be populated in React state, which only happens if the user
  visited the Sun Tracking tab first. Since sun position (dawn/sunrise/
  culmination/sunset/dusk/azimuth/altitude/shadow length) is a pure local
  calculation (`calculateSunDetails`/`getSunDistance` in
  `lib/map/sunCalculations.js` — no API call, no cost), there was no reason
  for it to depend on prior browsing. Fixed: it's now always computed fresh
  at report time, same as every other section — field-mapped to match
  `updateSunInfo`'s existing shape exactly (`daylightDurationData` →
  `DaylightDuration`, `getSunDistance()` called with no date argument,
  matching that function's own behavior).

  **Explicitly excluded, per Omar's call:** weather forecast — not wrapped
  in the cache, not added to the report. It changes constantly, so caching
  it doesn't make sense and it was already correctly excluded from the
  report as a "live/current-moment" thing.

  **Contour-in-report — built, 2026-08-27.** `generateCombinedReport` now
  takes an optional `contourInterval`. Priority order: if the user already
  drew and analyzed a rectangle this session (`contourAnalysisSummary`
  already set), that exact result is reused as-is — unchanged from before.
  Otherwise, a new `ContourIntervalPromptModal`
  (`swales-services/src/components/ui/ContourIntervalPromptModal.jsx`,
  mirroring `ReportAuthGateModal`'s existing style) appears when
  "Generate Report" is clicked with no contour analysis yet — same
  1/2/5/10/20/50/100m options as the manual "Analyze" dropdown, plus a
  "Skip this section" option. Whichever interval is picked, a
  `fetchApproximateContourSummary` helper auto-draws a ~175m box around the
  pin (same fixed-degree-delta approximation `windService.js`'s
  `generatePolygonPayload` already uses, for consistency) and hits the same
  `/api/proxy/contour-analysis` endpoint the manual flow uses, run through
  `getOrFetchContour` (already built into `siteDataCache.js` alongside
  `getOrFetch`, keyed by bounding box + interval since contour is
  area-based). The report clearly labels this case — `contourIsApproximate`
  flows through to `CombinedReportContent`'s section subtitle: "...an
  approximate area around the pin — not your exact property boundary."

  **To test before final validation** (not yet done, needs a logged-in
  session):
  - Generate a report on a fresh pin with **no prior tab browsing** —
    confirm the Sun section now appears (previously would have silently
    been missing).
  - Browse a couple of tabs (e.g. Solar, Soil) for a pin, then generate a
    report — confirm those two datasets are *not* re-fetched (check
    Network tab, remembering axios-based calls won't show there — check
    console/timing instead, or temporarily re-add the cache hit/miss
    logging used during phase 6's verification).
  - Regenerate the same report a second time — confirm zero new fetches
    for any dataset.
  - Generate a report on a pin with no contour analysis done yet — confirm
    `ContourIntervalPromptModal` appears, picking an interval produces a
    contour section labeled as approximate, and "Skip this section" omits
    it entirely with no error.
  - Manually draw and analyze a real contour rectangle first, then generate
    a report for that same pin — confirm the report reuses that exact
    result (no prompt, no new fetch, and the subtitle does *not* say
    "approximate").
  - This needs an actual login. `swales-services`' local dev server talks
    to the **deployed** `swales-backend.vercel.app`, not a local backend
    pointed at the Neon dev branch — so creating a throwaway test account
    to do this writes to the real deployed backend's database, unlike the
    cookie-migration testing earlier, which used an isolated dev branch.
    Omar declined to do this test right now; flagged here instead of
    skipped silently.

- **Report section-selection — considered, declined, 2026-08-27.** Came up
  when discussing whether a user could choose which categories (solar,
  wind, soil, etc.) go into a generated report. Decided: no — the report
  stays all-or-nothing (every dataset is always attempted; a section only
  appears if that fetch actually returns data). Not building a
  selection UI for this, at least to start with.

- **Pre-launch checklist — decided 2026-08-27.** See `roadmap.md`'s
  Guiding directives, directive 3, for the full record: the only two hard
  launch-blocking gates are (1) plant images done (in progress) and (2) a
  business bank account opened so Stripe can be wired for the paid report
  tier (not started). 2FA, disposable-email blocking, and the plant/element
  schema reconciliation are explicitly **not** launch gates — scheduled as
  "before launch whenever possible" instead (see `future-concerns.md`
  items 2, 3, 9).

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
10. ~~`main` branch protection: decide "require a pull request before
   merging".~~ **Decided 2026-08-26: yes, always** — see `future-concerns.md`
   item 12 for the reason (the per-PR Neon migration check gets bypassed
   entirely on a direct push, confirmed live). Omar is flipping the actual
   GitHub toggle himself. From here on: backend changes go to a branch with
   a PR for Omar to merge, not pushed straight to `main`.
11. Optional, not blocking anything: file a Vercel Support ticket about the
   stuck "already connected" error in the Neon integration's "Connect a
   Project" dialog, if the native Vercel-Neon branching (vs. the
   GitHub-integration workaround now in place) is ever wanted instead.
12. **Done (2026-09-04):** Discord and Substack links, flagged 2026-08-27 as
   on hold until Omar created the accounts, are now both live. Omar provided
   the real URLs (Discord channel invite, `https://substack.com/@swalesapp`)
   and both `href="#"` placeholders in `swales-services/src/components/ui/Footer.jsx`
   were swapped in, `target="_blank"` added to Discord to match the rest of
   the social-icons list (Substack's `<a>` already had it). Committed and
   pushed directly to `main` (`swales-services`, code-only change, no
   backend/schema involved — same low-risk category as other direct-to-main
   frontend commits in this repo's history).

## Field-level validation errors added across auth forms (2026-09-04)

Both frontends' auth-adjacent forms were showing a single top-level error
message (e.g. "Passwords do not match.") rather than pointing at which
field was wrong. Reworked to show inline per-field errors instead —
empty-field and format checks (email shape, password rule, confirm-password
match) now surface directly under the relevant input, with the input's
border color reflecting its own valid/invalid/untouched state rather than
one shared error banner for the whole form. Touched:

- `swales-services`: `AccountDetailsModal.jsx` (profile + change-password
  sections).
- `swales-designer`: `login/page.tsx`, `signup/page.tsx`,
  `reset-password/page.tsx`, `AccountDetailsModal.tsx`,
  `ForgotPasswordModal.tsx`.

Alongside this, `swales-designer`'s popups (`CoffeePopup`,
`SignupQuotePopup`, `PrintAuthGatePopup`) were restyled to match
`swales-services`'s existing popup look (shadow, z-index, spacing), the
signup-quote/coffee-popup delay dropped from 15s to 4s to match services,
and `PrintAuthGatePopup` was redesigned from a quote-card into an
icon-header gate (mirroring `swales-services`'s `ReportAuthGateModal`)
with copy specific to gating "print" rather than "download report".

Both changes are code-only, no schema/backend involved. Committed and
pushed directly to `main` in both `swales-services` and `swales-designer`,
matching this repo's existing pattern of direct-to-main for pure
frontend/UI work (backend/schema changes still always go through a
branch+PR — see item 10 below).
