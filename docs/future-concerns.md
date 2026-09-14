# Future Concerns — things not to forget

A living checklist of things flagged during development that could become
blocking, costly, or embarrassing later if forgotten — not a bug tracker for
work actively in progress (that's `status.md`), and not the phase plan
(that's `roadmap.md`). This is specifically for things **intentionally
deferred** that carry real risk if ignored too long.

## How to use this doc

- Whenever a concern, risk, or "we should really deal with this eventually"
  surfaces during a session, it gets added here — not just mentioned in
  passing and lost in chat history.
- Review this doc **before starting a new phase, before a monetization/real-
  users milestone, and periodically otherwise** — the point is catching
  "oh, we forgot about X" before it forces backtracking, not after.
- When something here gets fixed, move it to **Resolved** with the date and
  a one-line pointer to where it was actually done (usually `status.md` has
  the full story) — don't just delete it. The point of keeping resolved
  items visible is confidence that this list is maintained, not just a pile
  that grows forever.
- Severity is a judgment call, re-assessed at each review — something
  "Low" today can become "High" once real users or real money show up.

---

## Open

### Security

1. ~~**Bearer tokens live in `localStorage`, not the `httpOnly` cookie the
   backend already sets on login.**~~ Done 2026-08-26 — see `status.md`.

2. **No 2FA.** — *Severity: Low now, rising to Medium/High once
   monetization ships.* Account takeover today just exposes garden
   designs. Once a paid tier / billing info exists, the stakes change.
   Recommend TOTP-based 2FA (not SMS — costs money, SIM-swap risk), target
   completion **before monetization go-live**, not necessarily before the
   monetization framework is decided. Added to roadmap 2026-08-24.
   **Scheduling decided 2026-08-27**: do whenever there's time before the
   actual relaunch — not one of the hard launch-blocking gates (see
   `roadmap.md`'s Guiding directives, directive 3, for what those actually
   are), just something to fit in beforehand if possible.

3. **No disposable/temporary email blocking at registration.** —
   *Severity: Low.* Combined with (now-fixed) rate limiting, this closes
   off using throwaway addresses to spam-create accounts. Added to
   roadmap 2026-08-24 per Omar's request, not yet implemented.
   **Scheduling decided 2026-08-27**: same as 2FA above — before launch
   whenever possible, not a hard gate.

4. ~~**No resend-verification-email endpoint.**~~ Done 2026-09-05 —
   `POST /api/auth/resend-verification` added (`authController.js`'s
   `resendVerification`, wired in `authRoutes.js` behind the same
   `sensitiveActionLimiter` as `/register`/`/forgot-password`/
   `/reset-password`). Mirrors `forgotPassword`'s enumeration-safe pattern:
   same generic success response whether the account doesn't exist, is
   already verified, or a new link was actually sent — only sends a fresh
   24h token when a matching unverified user is found. Re-registering with
   the same email still fails as before (out of scope for this item); use
   this endpoint instead.

5. **CORS allowlist requires manual updates whenever a new deployment
   domain exists — no dynamic discovery.** — *Severity: Low, but has
   already bitten once.* On 2026-08-24 the allowlist had two domains that
   didn't match this project's naming at all, while the real
   `swales-designer.vercel.app`/`swales-services.vercel.app` weren't
   listed — fixed, but a silent version of this (a forgotten update after
   a domain change) would quietly block real traffic with no obvious
   error on the frontend side. Worth a periodic sanity check whenever a
   new environment/domain is added.

### Product / business decisions pending

6. ~~**Monetization framework — Decided 2026-08-24, revised 2026-08-27,
   revised again 2026-09-08.**~~ **Resolved (as a decision) 2026-09-08**,
   still blocked on Stripe/bank account for actually going live. Final
   shape: the full site report and Site Comparison (2 sites) both stay
   **free-for-contact** — the 2026-08-27 change moving the report to paid
   was reverted. **Core paid** ($9/mo or $79/yr, subscription-only, no
   one-time option) = uncapped Compare (3+ sites) + three new paid-only
   advisory modules not yet built (RainAdvisor, soil health score, crop
   suitability engine) + no watermark on downloads. `pricing/page.js`
   updated 2026-09-08 to show the real price with checkout disabled. See
   `status.md`'s 2026-09-08 entry for the full reasoning. **Still
   open**: the three advisory modules themselves aren't built yet (Phase
   A2 backlog), and the actual Stripe/subscription-status wiring hasn't
   started (blocked on Omar opening a business bank account).

7. ~~**Wind turbine sizing** — decide whether to use real wind-speed data
   vs. the current stub that matches `wind.txt` verbatim (including an
   unused `meanWindSpeed` parameter).~~ Done 2026-09-03 — `autoSelectTurbine`
   now sizes off the site's real capacity factor instead of a fixed
   category-wide assumption (commit `8beb549`). Same session also fixed a
   related bug where the Reliability score could show "Stable" on a
   visibly seasonal site (Commonwealth Bay was scoring 76/"Stable" despite
   a 45% peak-to-trough monthly swing) by removing a raw-wind-speed
   component that had nothing to do with actual consistency, and added a
   real Weibull-k steadiness signal and a Gumbel-fit Extreme Wind Screening
   (IEC 61400-1 turbine class estimate). Full detail in the session's
   `swales-services/solar-wind-analysis.md` and the wind-potential blog
   post, both updated to match.

### Technical debt / cleanup

8. ~~**Dead env vars** (`DB_HOST`/`DB_NAME`/`DB_USER`/`DB_PASS`/
   `config/database.js` in `swales-backend`; unused `EMAIL_USER`/
   `EMAIL_PASS`/`Password_Reset_Url`/`Email_verify_Url`/`AllowedOrigins`)~~
   Done 2026-09-05 — `config/database.js` deleted (confirmed nothing
   required/imported it; `models/index.js`'s `DATABASE_URL` path is the
   only live connection mechanism), `DB_HOST`/`DB_NAME`/`DB_USER`/`DB_PASS`
   and the already-commented-out dead-vars block removed from
   `.env.example`. Each real `.env` file still has these lines and can be
   trimmed the same way at leisure — no functional risk either way.

9. **Plant/element schema not yet reconciled with the long-term
   knowledge-graph vision** (~50-field schema, linked entity types). Worth
   a short pass now so early seed data doesn't need re-keying once that
   2-3 year vision gets built. **Scheduling decided 2026-08-27**: before
   launch whenever possible, not a hard launch-blocking gate.

10. ~~**Companion-planting data incomplete**: 107 of 171 species have empty
    `good_companions`. Subcategory vocabulary also has ~65 near-duplicate
    values needing cleanup.~~ Done 2026-08-24 — see `status.md`.

11. **PAUSED (decided 2026-08-25, not abandoned): canvas not wired to the
    real plant database.** `swales-designer` still reads a static
    `presets.json` — nothing calls `/api/elements` or resolves `icon_key`
    yet. Reason: the plant DB has **zero images** — each row's `icon_key`
    (e.g. `icon_tree_walnut`) is meant to point at real art, but no such
    files exist anywhere in `swales-designer/public/objects/` (confirmed by
    direct search). Merging today would render every DB species as one
    generic per-category placeholder shape, not a distinct picture — Omar
    also rejected a "smart" badge on merged items with no real logic behind
    it as confusing UI. **Waiting on**: Omar sourcing/creating a real image
    per `icon_key` (54 tree species already handed off as a worked example;
    the same breakdown can be pulled for the other 8 categories from
    `seed-data/plants_seed.csv` on request). **Once images exist**: merge
    unbadged into the already-restructured `food-forest-layers` palette in
    `swales-designer/public/presets.json` (verified working 2026-08-25, no
    further redesign needed) — actual guild-builder/badge logic is
    deliberately deferred further, to Phase 2/W, on top of that.
    **Still not started, still waiting on images as of 2026-08-30** — no
    change to this pause's status. The `layer` field (the data-model half
    of what the eventual merge will key off) and `swales-designer`'s
    `food-forest-layers` `presets.json` restructuring were committed this
    session (previously sat uncommitted for days) — that's repo hygiene
    only, not progress on the merge itself. The canvas still reads only
    the static `presets.json`, `/api/elements` is still never called, and
    none of that changes until Omar sources or creates a real image per
    `icon_key`.

### Infrastructure

12. ~~**`main` branch protection**: decide whether to turn on "require a PR
    before merging".~~ **Decided 2026-08-26: yes, always.** Reason: this
    repo's `.github/workflows/neon_workflow.yml` gives every PR its own
    isolated Neon DB branch and runs migrations against it as a required
    status check before merge — a direct push to `main` skips that check
    entirely (confirmed live: a direct push this session printed `Bypassed
    rule violations... Required status check "Create Neon Branch and Run
    Migrations" is expected`), meaning a migration could land on `main`
    completely untested. Omar is enabling the actual GitHub "require PR
    before merging" toggle himself (Settings → Branches on
    `swales-backend`). Going forward, backend changes get pushed to a
    branch with a PR opened for Omar to review/merge, never pushed straight
    to `main` — this applies to `swales-backend` specifically, since
    `swales-designer`/`swales-services` have no equivalent per-PR DB
    validation workflow.

13. **Vercel Support ticket** for the stuck "already connected" error in
    Neon's native "Connect a Project" dialog — optional, only matters if
    native Vercel-Neon branching is ever wanted over the current
    GitHub-integration workaround.

14. **Vercel serverless constraints worth monitoring as the app grows** —
    not a problem yet: execution time limits (relevant once Phase B calls
    an external vision API for photo/plant ID, or does heavier report
    generation), no persistent WebSocket support (relevant if Phase C's
    social layer ever wants real-time updates — would need a separate
    service alongside Vercel), Vercel Cron's limited invocation
    guarantees (relevant for any future scheduled/background job). File
    storage and DB pooling are already handled correctly (Vercel Blob,
    Neon pooled connections) — not a concern.

### Wind/solar potential — deferred data-accuracy improvements

15. **Local mirror of Global Wind Atlas / Global Solar Atlas, instead of
    live third-party calls on every map click.** — *Severity: Low
    (reliability/cost improvement, not a correctness bug)*. Motivated by a
    real, repeated failure: the GWA proxy (`swales-backend/server.js`'s
    `/api/gwa/custom/windSpeed` and `/windFrequencyRose`) returned a genuine
    `504 Gateway Timeout` (`FUNCTION_INVOCATION_TIMEOUT`) for Commonwealth
    Bay, Antarctica on two separate test runs on 2026-09-03, silently
    degrading that site to raw ERA5 with no terrain correction. Scoped but
    **not started** — this is a real infrastructure project, not a quick
    add. Key findings from research, before any code is touched:
    - GWA's download page states their API "is not to be used for bulk
      downloads of all countries or datasets" — but their own dropdown
      offers **"The World"** as one deliberate, sanctioned single-file
      option; confirmed a real working URL via their UI:
      `https://globalwindatlas.info/api/gis/global/wind-speed/100`
      (redirects to a DTU Figshare-hosted file). Reading the restriction in
      context: a **one-time** download of a named "World" layer is fine;
      **scripting a loop** over all 267 countries or every layer/height
      combination is what's prohibited.
    - Global Solar Atlas's Terms of Use explicitly forbid "any robot,
      spider or other automatic device... to access" their interactive map
      app — but this governs the interactive app specifically, not their
      separate bulk GIS download portal (`globalsolaratlas.info/download/world`),
      which exists for exactly this kind of one-time retrieval. Both
      datasets are CC BY 4.0 (GSA adds a WIPO-mediation/arbitration clause)
      and explicitly permit redistribution/self-hosting with attribution
      (exact citation text is in GSA's Terms of Use page).
    - GWA's data is **not a simple point lookup** — the live proxy sends a
      ~3km polygon and GWA's server returns pre-computed zonal statistics
      (a value/count histogram over that polygon). A local mirror has to
      replicate that aggregation itself (read a windowed region of the
      raster, compute the same weighted histogram), not just read one
      pixel. Global Solar Atlas, by contrast, already is a simple point
      lookup (`PVOUT_csi`, `GHI`) — much simpler to mirror.
    - The app only actually consumes **2 layers today**: GWA wind-speed @
      100m (the app always requests height=100 and derives other hub
      heights itself via a log-wind-profile — see `windService.js`), and
      GSA's PVOUT (annual+monthly) + GHI (annual). Neither atlas's other
      published layers (power density, air density, Weibull A/K, IEC
      fatigue/extreme-load classes, etc.) are used anywhere in the
      codebase — the recommended mirror scope is these 2 layers only, not
      either atlas's full catalog.
    - Recommended architecture: Cloud-Optimized GeoTIFF (COG) files in
      Vercel Blob (`swales-backend` already has `@vercel/blob` and
      `BLOB_READ_WRITE_TOKEN` configured — reuse, don't re-provision),
      queried via windowed HTTP range-reads using the `geotiff` npm
      package (new dependency — neither repo has any raster/geospatial
      tooling today). New backend endpoint(s) reproduce the exact response
      shape `windService.js`/`solarService.js` already parse, so
      `swales-services` needs zero changes, and always fall back to the
      existing live proxy call on any read failure — a reliability
      upgrade, never a new single point of failure.
    - **Explicitly out of scope for a first pass**: the Wind Frequency
      Rose, which needs a different directional/sector dataset with no
      confirmed simple global-layer equivalent found yet.
    - **Unresolved, needs confirming before committing spend**: real file
      sizes (GWA's download redirects through Figshare's `ndownloader`,
      which wouldn't reveal size via HEAD/Range probing without triggering
      a full download — not attempted), current Vercel Blob pricing at
      that scale, and whether default Vercel function memory/timeout is
      sufficient for a windowed COG read (should be fine in principle,
      needs empirical validation).

16. **Extreme Wind Screening has no tornado-risk signal for US sites.** —
    *Severity: Low.* The wind-potential dashboard's Extreme Wind Screening
    (added 2026-09-03, see item 7 above) estimates a 50-year gust from
    ERA5 reanalysis data via a Gumbel fit — structurally blind to
    tornadoes, which are far smaller than the ~31km data grid. NOAA's
    Storm Prediction Center publishes a historical US tornado track
    database (1950–present) that could add a US-only "tornado exposure:
    elevated/typical" badge alongside the existing IEC gust-class
    indicator. Deliberately deferred: unlike the GWA/GSA data above, this
    isn't a live-queryable API — it's a static, annually-updated
    CSV/shapefile requiring a one-time ETL into a lat/lon-queryable density
    grid before it's usable. Must never feed into Suitability/Reliability/
    Annual Yield/Specific Yield — tornado risk is a hazard signal
    unrelated to average energy resource (confirmed: Bridgeport, TX has
    unremarkable average wind and "Moderate" suitability despite real
    tornado risk) — it would only ever be an additional, separate badge.

### Infrastructure (continued)

18. ~~**`POST /api/sub/subscribe-email` is missing from `swales-backend`,
    same class of bug as the just-fixed `/api/contact-us/message`.**~~
    Done 2026-09-12 — added a real `Subscribers` table (migration +
    model) rather than just forwarding to an inbox, plus
    `subscribeController.js`/`subscribeRoutes.js` mounted at `/api/sub`.
    `findOrCreate` makes re-subscribing an already-subscribed email a
    silent success, not an error. On branch
    `feature/newsletter-subscribe-endpoint`, PR not yet merged — the
    migration hasn't run against the Neon dev branch from this
    environment (classifier blocks `db:migrate` locally); the
    `neon_workflow.yml` CI check will apply and validate it on an
    isolated branch once the PR opens. See `status.md`'s 2026-09-12 entry.

### Technical debt / cleanup (continued)

20. **`swales-designer/public/favicon.ico` is stale (old logo) and
    unreferenced.** — *Severity: Low.* Found 2026-09-12 during the logo
    rollout: Next.js's `metadata.icons` config points at `fab-icon.png`
    (already updated to the new logo), so `favicon.ico` is never actually
    served by this app — browsers won't pick it up. Left as-is rather than
    regenerating a multi-resolution `.ico` for a dead file. Worth
    revisiting only if something starts referencing it directly.

### Marketing / brand assets

21. **Social media profile/cover images still carry the old logo.** —
    *Severity: Low.* Follow-up to the 2026-09-12 logo rollout (`status.md`)
    which covered both frontend apps (`swales-services`, `swales-designer`)
    plus the backend's email template — external platforms (e.g. Facebook,
    Instagram, X/Twitter, LinkedIn, YouTube, Discord) are outside this
    codebase and weren't touched. Needs Omar to manually update each
    platform's profile/cover image with the new logo — not something a code
    change can fix. Flagged 2026-09-13 at Omar's request.

### Content

22. **Finish the remaining blog posts (up to +80), then republish.** —
    *Severity: Low.* Omar's own content task, not a code fix — flagged
    2026-09-13 after the ~53-post batch found uncommitted and shipped the
    same day (see `status.md`'s 2026-09-13 entry). `content/blog/` current
    total is 242 posts (243 minus the one pulled below). Which specific
    subset counts as the "+80" still needing finishing wasn't specified
    here — Omar tracks that himself. Once the remaining posts are done,
    they need the same treatment as the last batch: commit + push to
    `swales-services` `main` (no PR required for this repo) to actually go
    live.

    **Already checked and fixed, 2026-09-13 — skip these two when doing
    the +80 pass, they're done:**
    - **`avoid-these-bad-companion-plants-for-pumpkins.md`** — the
      "Recommended Seed Suppliers" section had 5 literal unfilled
      `[Insert your own talking point]` placeholder bullets, live on the
      site. Replaced with real (non-branded — no specific supplier names
      invented) guidance on what to look for in a seed supplier. Also
      fixed a second issue in the same post: a "Can Bad Companion Plants
      Affect the Taste of Pumpkins?" section that teased an answer
      ("Here's how...") and then never gave one — replaced with a real
      answer addressing the actual horticultural question (cross-
      pollination affects next year's saved seed, not this season's fruit
      flavor).
    - **`achieve-effective-results-pest-control-now.md`** — **deleted
      entirely**, not fixed in place. The whole post was written in first
      person as a different, unrelated company ("Effective Results Pest
      Controls" — "we are a reliable and professional pest control
      company," a "180-day money-back guarantee," etc.), with nothing
      about permaculture, land analysis, or Swales — looked like
      mismatched content from a bulk-generation batch that landed on the
      wrong site. Its two images (`achieve-effective-results-pest-
      control-now-hero.jpg`, `achieve-effective-results-pest-control-
      now-2.jpg`) were deleted too; nothing else in the codebase
      referenced the slug.

    **Not yet checked**: the remaining ~241 posts were only scanned for
    these two specific patterns (placeholder brackets, off-brand "we are
    a company" language) via a targeted grep pass, not read individually
    — other, differently-shaped problems may still exist. One borderline
    case noted but left as-is: `ultimate-guide-chicken-coop-automatic-
    door.md` recommends a specific "Smart Autodoor" product with
    unverified claims (180-day money-back guarantee) — on-topic and not
    obviously broken like the two above, but the product claim itself
    hasn't been verified as real.

23. **`/courses` links to third-party sites Swales doesn't control.** —
    *Severity: Low.* Flagged 2026-09-14 when the page shipped
    (`swales-services` `790801d`, see `status.md`). Every card on the new
    Permaculture Design Courses directory links to an external provider
    (Oregon State/edX, Geoff Lawton/PRI, Milkwood, Permaculture Women's
    Guild, Regenerative Leadership Institute, Permaculture Visions,
    Permaculture Association Britain, Permaculture Principles, Gaia
    University) — none were verified as still-live/still-accurate beyond
    the initial build, so a provider rebranding, changing its URL
    structure, or shutting down a course would silently leave a dead or
    stale link on the page. No automated link-checking exists yet.
    Recommend a periodic (quarterly is probably enough at this traffic
    level) manual click-through, or a simple scheduled link-checker
    against the URLs in `swales-services/src/lib/courses/registry.js`,
    before this page gets meaningful traffic of its own.

### Monetization / access control

19. **Specialized Data Package ($159 one-time) has no automated payment or
    delivery — fully manual for now.** — *Severity: Low now, rises with
    real order volume.* Built 2026-09-12 (`/specialized-reports`): a
    visitor submits an enquiry, Omar has to manually arrange payment
    (PayPal) and manually generate + email the export files — nothing in
    the code actually charges anyone or produces a file automatically on
    payment. Fine at low volume; becomes a real bottleneck if this starts
    generating regular orders. The eventual fix (Stripe Checkout webhook
    → auto-trigger the already-built `siteDataExport.js` functions →
    email the result) is a clear, scoped follow-up once Stripe exists —
    not started.

17. **RainAdvisor and Crop Suitability Engine ship with no real
    entitlement gate.** — *Severity: Low now, rising to High once
    Stripe/subscription billing exists.* RainAdvisor built 2026-09-08,
    Crop Suitability Engine built 2026-09-13 (see the monetization
    decision in `status.md`) — both marked with a "Core" pill in the UI,
    but fully visible and functional to every visitor, signed in or not,
    paid or not. Deliberate for now: there's no `Users.SubscriptionStatus`
    column, no Stripe webhook handler, and no live subscriber base to
    protect revenue from, so building a real gate ahead of that
    infrastructure would be premature. **Correction, 2026-09-13**: the
    "soil health score" originally expected to be this pair's third
    module turned out to already be a free, ungated feature
    (`SoilCard.jsx`'s hero score) — it was never a Core-paid module and
    doesn't need this gate at all; `pricing/page.js` has been corrected to
    stop listing it as one. **Must be fixed before RainAdvisor and Crop
    Suitability Engine actually go live as paid** — the fix is a
    straightforward extension of the existing `protect`-middleware pattern
    (DB-backed per-request check, same as `PasswordChangedAt`/
    `IsBlackListed`), not a new architecture; see `status.md`'s 2026-09-08
    RainAdvisor entry for the exact reasoning and the code comment at the
    top of `RainAdvisor.jsx` (and now `CropSuitabilityEngine.jsx`) where
    this is flagged inline.

### Security (continued)

24. **187 old uploaded PDF-page images (plus one raw source PDF) are
    committed to git and served publicly with no auth.** — *Severity:
    Medium — depends entirely on whether any of that content is
    sensitive.* Found 2026-09-14 during a full bug-hunting pass:
    `swales-backend/public/uploads/pdf-*-page-*.png` (187 files) is served
    by `express.static` (`server.js`) with zero access control, and
    `swales-backend/uploads/<hash>` (an 80-page PDF) sits outside the
    served tree but is still permanently in git history. Both are leftovers
    from before `uploadController.js` moved to `multer.memoryStorage()` +
    Vercel Blob (see the comment at the top of `routes/uploadRoutes.js`).
    **Not fixed in this pass** — removing files from git history is a
    destructive, hard-to-reverse operation and wasn't done without
    confirming first whether the actual content is sensitive. Next step:
    Omar reviews what's actually in those files, then either a simple
    `git rm` (if going-forward removal is enough) or a full history purge
    (if the content itself needs to stop existing anywhere), plus
    gitignoring `uploads/`/`public/uploads/` either way.

25. **PDF-upload endpoint (`POST /api/upload/pdf`) has no page-count or
    page-dimension cap.** — *Severity: Medium.* Found 2026-09-14. Both
    `numPages` and each page's rendered canvas size come straight from
    attacker-controlled PDF content with no upper bound — only the 20MB
    file-size cap and the 40-req/5-min rate limit apply. A small, valid PDF
    declaring thousands of pages or one huge page forces large synchronous
    in-memory canvas allocations in a loop; a handful of concurrent
    requests (well within the rate limit) can exhaust server memory/CPU.
    Fix direction: cap `numPages` and reject pages above a sane
    width/height before rendering, in `controllers/uploadController.js`'s
    `processPdf`. Not fixed in this pass — needs a threshold decision
    (what's a legitimate max page count for a garden-design reference PDF)
    rather than an arbitrary number picked blind.

26. **`shareController`'s create-share endpoint is fully unauthenticated,
    unvalidated, and never expires.** — *Severity: Low-medium.* Found
    2026-09-14. `createShare` stores whatever `projectData` blob is posted
    with only a truthiness check — no size/schema validation, no owner, no
    expiry or deletion path anywhere in `shareController.js` or the `Share`
    model. Functionally usable as an anonymous, rate-limited (40/5min/IP)
    "paste bin" for arbitrary content, retrievable forever via
    `GET /api/shares/:uuid`. Not currently exploited, but worth a size cap
    and/or an expiry column if abuse ever shows up. A stale comment in
    `routes/shareRoutes.js` also references "createShare's own size check"
    which doesn't exist — worth fixing the comment regardless of whether a
    real cap gets added.

27. **Contact-form email/subject fields aren't format-validated before
    use as email headers.** — *Severity: Low, low confidence.*
    Found 2026-09-14. `contactController.js` only checks
    truthiness of `name`/`email`/`message`; the raw values flow into
    `emailService.js` as `replyTo`/`subject` fields on a real outbound
    email via the Resend SDK. The HTML body is properly escaped
    (`escapeHtml`) — only the header-like fields aren't. Likely low risk in
    practice since Resend's structured JSON API probably rejects/strips
    control characters, but not independently verified either way.

### Advisory engine correctness

28. **Solar and Wind maintain separate, drifted copies of the annual
    energy-demand-by-category table.** — *Severity: High — gives users
    contradictory answers from the same input.* Found 2026-09-14:
    `swales-services/src/services/solarService.js`'s `ANNUAL_DEMAND_KWH`
    and `swales-services/src/lib/wind/windCalculationEngine.js`'s table of
    the same name disagree for `business` (25,000 vs 50,000 kWh/yr — 2x)
    and `industrial` (3,000,000 vs 250,000 kWh/yr — 12x). The same site pin
    gets a wildly different coverage/verdict from Solar vs. Wind for the
    same category. `windService.js` already fixed this exact anti-pattern
    for `HUB_HEIGHTS` (imported from `windCalculationEngine` specifically
    "so the two can't silently drift apart") — `ANNUAL_DEMAND_KWH` never
    got the same treatment. **Not fixed in this pass**: unifying the
    source is mechanical, but which numbers are actually right is a
    domain-judgment call for Omar to confirm, not something to pick
    silently.

29. **`reportQAService.answerOverallSuitability` ranks heterogeneous
    scores as if directly comparable.** — *Severity: Medium.* Found
    2026-09-14: `reportQAService.js` sorts Solar suitability (0-100
    composite), Wind suitability (0-100 composite), and swale/building
    percent-of-analyzed-area (a raw area percentage, different scale
    entirely) in one array and calls the top one "this site's strongest
    signal" — e.g. 90% of a small drawn rectangle happening to be
    swale-suitable can out-rank a genuinely strong 70/100 solar score.
    Needs real normalization before the four metrics can be compared, not
    yet done.

30. **`combinedReportPdf.js` skips a normalization step its neighbor line
    applies.** — *Severity: Low, currently harmless.* Found 2026-09-14:
    line ~208 passes the raw (possibly `_fetchFailed`) precipitation fetch
    into `altitudeData.weather`, while the line just above it correctly
    nulls that sentinel out for the precipitation section itself. Doesn't
    currently misfire because every field on the `_fetchFailed` sentinel
    happens to fail `buildWeatherInsights`'s thresholds — but it's latent,
    and would misfire if that sentinel's shape ever changed.

31. **Extreme-wind IEC turbine classification may compare the wrong wind
    statistic against the standard.** — *Severity: Medium, methodological
    — needs a read, not a blind fix.* Found 2026-09-14:
    `windExtremeService.js` fits a Gumbel distribution to annual-maximum
    daily *gusts* at 10m, then classifies the resulting V50 against IEC
    61400-1's Class I/II/III table, which is formally defined as a 10-min
    *mean* wind speed at *hub height*. Gusts run systematically higher than
    10-min means, so this likely overstates the required turbine class
    (recommending a more expensive turbine than necessary) — or, if gust
    loading was the actual intent, it's mislabeled against the wrong
    standard's units. Unlike every other cross-source unit reconciliation
    in this codebase, there's no comment here explaining the choice, which
    is conspicuous. Needs a decision on what the feature is actually
    supposed to model before fixing.

---

## Resolved

- **Bearer tokens in `localStorage` → `httpOnly` cookie auth** — Done
  2026-08-26. See `status.md` for full detail: backend now reads the
  session from `req.cookies.token` (Authorization header kept only as a
  fallback for non-browser callers), added `POST /api/auth/logout`, cookie
  `sameSite` switched to `none` in production so it survives the current
  cross-site `*.vercel.app` deployment topology, and both frontends
  (`swales-designer`, `swales-services`) no longer read/write the token via
  `localStorage` or send an `Authorization` header — everything rides the
  cookie via `withCredentials: true`.

- **8 auth/session-security gaps found by a 2026-09-14 full-codebase audit**
  — Done same day, see `status.md`'s 2026-09-14 entry for full detail on
  each: (1) rate limiting was non-functional on Vercel (no `trust proxy`,
  every request shared one bucket) — fixed with `app.set("trust proxy", 1)`
  in `server.js`; (2) password complexity was client-side only — added
  `utils/passwordPolicy.js`, enforced in `register`/`resetPassword`/
  `changePassword`; (3) login enabled user enumeration via 4 distinguishable
  error messages — "no such user" and "wrong password" now return one
  generic message (Google-account/unverified messages kept, low
  enumeration value, real UX value); (4) password-reset tokens had no
  single-use enforcement — closed via `assertResetTokenFresh` in
  `tokenService.js`, reusing the `PasswordChangedAt` bump a successful
  reset already does; (5) logout didn't invalidate the session
  server-side, only cleared the cookie — added a `SessionsInvalidatedAt`
  column (migration `20260914010000`) checked the same way
  `PasswordChangedAt` already is (note: this invalidates every session for
  the account, not just the current device — no per-session tracking
  exists to scope it narrower); (6) "remember me" unchecked still issued a
  full 30-day token, only the cookie's persistence changed — `generateToken`
  now takes an `expiresIn` and login passes `"1d"` when unchecked; (7)
  bearer token returned in the login response body on every web call, not
  gated to mobile — reviewed, left as-is since mobile needs it and neither
  web frontend persists it; (8) `swales-designer`'s `AuthContext` was
  missing the `else { setUser(null) }` branch `swales-services`' already
  has for a `200 {success:false}` response — added. Both frontends' builds
  verified clean after the fix.
