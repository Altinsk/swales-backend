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
    total is **236 posts** (was 242 as of 2026-09-13; 6 more deleted since
    across two passes — 3 on 2026-09-15, 3 more on 2026-09-18, see the
    deleted list below). Which specific subset counts as the "+80" still
    needing finishing wasn't specified here — Omar tracks that himself,
    but **any count/list Omar is working from should now exclude the
    deleted slugs below** — they no longer exist in `content/blog/`, so
    they can't be "finished." Once the remaining posts are done, they need the same
    treatment as the last batch: commit + push to `swales-services` `main`
    (no PR required for this repo) to actually go live.

    **Deleted entirely for naming/impersonating a real or fake commercial
    business** (own subcategory of the pattern below — these don't just
    have quality issues, they present the post as if written by, or
    advertising, an actual company):
    - **`achieve-effective-results-pest-control-now.md`** — deleted
      2026-09-13. Written in first person as an unrelated company
      ("Effective Results Pest Controls," "180-day money-back guarantee"),
      nothing about permaculture/land analysis. Its 2 images deleted too.
    - **`flowers-hawaii.md`** — deleted 2026-09-18 (data-trust audit). Its
      FAQ section was written in first person as an actual Honolulu
      florist business ("As a real local florist in Honolulu... Our very
      best drivers deliver..."), plus funeral-flower upsell copy — same
      defect class as the already-deleted `flowers-costco.md` below. 5
      images deleted too.
    - **`ultimate-guide-chicken-coop-automatic-door.md`** — deleted
      2026-09-18. Previously flagged 2026-09-13 as a "borderline case...
      left as-is" (see below); on closer read it's affiliate-review copy
      for a fabricated product ("the Smart Autodoor," specific fake specs,
      an explicit "Final Verdict from an Affiliate Perspective" section)
      plus a second invented product "available on the Amazon store," and
      the literal leftover generation marker `(Compiled Information)`
      appears 14 times, unfilled. 2 images deleted too.
    - **`chicken-coop-plastic-vs-wood.md`** — deleted 2026-09-18.
      Repeatedly promotes real commercial brands (Omlet's "Eglu Go"/"Eglu
      Cube," "Smiths Sectional Buildings") as "our top pick" — undisclosed
      advertising, same pattern as the already-deleted windbreaker/
      Stutterheim post below. 5 images deleted too.
    - *(Already deleted 2026-09-15, same pattern, listed here for one
      complete list):* **`flowers-costco.md`** (named real retailer
      Costco) and **`enhance-your-garden-with-a-designer-windbreaker.md`**
      (confused garden windbreaks with jacket brand Stutterheim throughout).

    **Already checked and fixed in place (not deleted), 2026-09-13 — skip
    when doing the +80 pass, it's done:**
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

    **Also fixed in place, 2026-09-18** (same data-trust audit, Medium-
    severity content issues): `comfrey-plants.md` (garbled sentence),
    `wind-energy-systems-understanding-parts-and-power.md` (leftover
    "Keywords: ..." SEO artifact), `seed-bank-101-a-comprehensive-guide.md`
    (duplicated paragraph), `recycle-magazines-can-magazine-be-recycled.md`
    (grammar corruption), `lime-flower.md` (merged two near-duplicate
    cons/side-effects sections, rewrote an affiliate-sales-voice "Final
    Verdict" section into neutral editorial content), and
    `courses-in-permaculture.md` (unfilled "Course 1"/"Course 2" placeholder
    headers replaced with the real course names, a "themaculture" typo, and
    a dangling "table below compares..." reference replaced with a real
    table — this last one also closes 1 of the 5 dangling-table posts noted
    below).

    **Not yet checked/fixed**: a 2026-09-18 data-trust audit sampled a
    further ~28 posts (beyond the ~40 sampled 2026-09-15) and found the 2
    deletions and 6 in-place fixes above, plus not-yet-actioned issues —
    see `status.md`'s 2026-09-18 entry for the full list: dangling
    table/list references remain in 5 posts (`comfrey-plants.md` — a
    separate dangling-table issue at a different line than the garbled-
    text sentence fixed above, `jujube-food.md`, `healing-herbs-book.md`,
    `edible-weeds.md`, `essential-oils-bed-bugs.md`), and unsourced medical
    claims remain in 2 posts (`essential-oils-bed-bugs.md`,
    `essential-oils-ear-infection.md`). Fixing already-sampled posts
    doesn't change how many are still unchecked: combined across all
    passes, roughly **211 of 236 posts (~89%) remain entirely unread** —
    the full systematic scan this item has flagged since 2026-09-13 is
    still the only way to bound this risk with confidence, and each new
    partial sample keeps finding more of the same defect families rather
    than tapering off.

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

24. ~~**Second full bug-hunting pass (2026-09-15), all findings fixed
    same day**: Google Sign-In DB error, rate-limiter budget sharing,
    two map staleness-guard gaps, a Sun Tracker stale closure, two
    auth-loading-flash gaps, a required-field gap, a designer
    constant-drift risk, a designer stale-fetch gap, and 13 blog posts
    needing de-duplication/cleanup.~~ Done 2026-09-15 — see `status.md`
    and the Resolved entry below.

25. ~~**Six remaining findings from the 2026-09-14 bug hunt**: PDF-upload
    had no page/dimension cap, the share endpoint had no real size check,
    contact-form email/subject weren't validated, `reportQAService` ranked
    incomparable metrics, `combinedReportPdf.js` had a latent normalization
    gap, and the Extreme Wind Screening's IEC classification lacked a
    documented gust-vs-mean-wind-speed caveat.~~ Done 2026-09-14 — see
    `status.md` and the Resolved entry below.

26. **Before launch: empty all test-upload artifacts from
    `swales-backend` and check `swales-designer` for the same pattern.**
    — *Severity: Low, but explicit pre-launch requirement (Omar,
    2026-09-14).* Prompted by finding a test PDF and 27 test project
    thumbnails sitting in `swales-backend/public/uploads/` and `uploads/`
    (removed 2026-09-14, see the Resolved entry below) — the underlying
    lesson is that anything landing on local disk during dev/testing can
    end up committed and served publicly, so this needs a real check right
    before cutover, not just a one-time cleanup today. `swales-designer`
    was checked 2026-09-14 and has no equivalent `uploads/`-style folder
    today (its `public/objects/` is curated app assets, not user uploads)
    — but re-check both repos again closer to the actual launch date in
    case that's changed. Added to `roadmap.md`'s pre-launch checklist as a
    "before launch, whenever possible" item (not one of the two hard
    gates).

    (Note: an earlier, narrower version of this same finding — just the
    161-file test-PDF removal, before Omar asked for the full
    `public/uploads/` cleanup — was tracked as its own item on the
    `chore/remove-test-pdf-upload-2026-09-14` branch. Superseded by the
    fuller item above; not duplicated here.)

27. ~~**Solar and Wind maintained separate, drifted copies of the annual
    energy-demand-by-category table.**~~ Done 2026-09-14 — see `status.md`
    and the Resolved entry below.

28. ~~**Third full bug-hunting pass (2026-09-15), critical/high/medium
    findings fixed same day**: an array-injection login/forgot-password
    vulnerability, missing email format validation on `Users.Email`,
    non-functional "Remember me", a Google sign-in that hung forever on
    popup-close/denial, the auth-loading-flash fix from the second pass
    never reaching `swales-designer`, missing double-submit guards on
    `swales-services` auth pages, a too-tight shared axios timeout, and no
    explicit Vercel function duration.~~ Done 2026-09-15 — see `status.md`
    and the Resolved entry below. **Deliberately deferred, Low severity**:
    a `pdfjs-dist` major-version bump (regression risk without a full PDF
    QA pass), a fragile exact-string error match in
    `AccountDetailsModal.jsx` (needs a backend error-code contract, not
    just a frontend tweak), and the scattered blog content-corruption
    residue (gibberish text, leftover template markers, malformed
    headings, affiliate-voice content, zero-width-character corruption)
    across roughly 9 of the now-478 blog posts — the first two bug hunts'
    blog cleanups were targeted at specific already-known posts, but a
    full scan of all 478 for this class of defect hasn't been done and is
    sized as its own task, not a bug-hunt add-on.

29. **`pdfjs-dist` is on `^3.11.174`, several major versions behind.** —
    *Severity: Low.* Flagged in the 2026-09-15 third bug hunt. Not bumped
    same-session because a major-version jump in a PDF-rendering library
    routinely changes worker setup / API shape and needs a real PDF
    upload/render QA pass to confirm nothing regresses — a bad bump here
    breaks the upload feature outright, worse than staying a few versions
    behind. Do alongside, not instead of, manual PDF-upload testing.

30. **`AccountDetailsModal.jsx`'s change-password error handling matches
    the backend's error message by exact string** (`"Incorrect current
    password"`) **to decide whether to show a field-level error.** —
    *Severity: Low.* Flagged in the 2026-09-15 third bug hunt. Works today,
    but silently degrades to a generic banner (not a crash) the moment
    that backend string is ever reworded. The real fix is a stable error
    `code` field from `authController.js`'s `changePassword` (it currently
    only returns 400 for two different failures — wrong current password
    vs. a weak new password — distinguishable only by message text), not
    a frontend-only patch.

31. **Blog content-corruption residue not yet scanned for** — see item 28's
    deferred note above. *Severity: Low/Medium depending on which post a
    visitor lands on* — brand-impersonation content and fake product
    guarantees are the more serious end of this, not just typos.

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

- **All 188 test-upload files removed from `swales-backend`** — Done
  2026-09-14. Confirmed with Omar all of it was test data, not needed:
  the 161 files from the test bank-manual PDF (already removed earlier
  the same day) plus the 27 project-thumbnail PNGs that were initially
  left untouched pending confirmation nothing live referenced them —
  Omar said to empty the whole `public/uploads/` directory regardless.
  `uploads/` and `public/uploads/` both gitignored going forward.

- **Six remaining 2026-09-14 bug-hunt findings** — Done 2026-09-14.
  `swales-backend`: `uploadController.js`'s `processPdf` now caps page
  count at 100 and clamps every page's render scale so no canvas exceeds
  5000px on its longest side (scales down instead of erroring on a
  genuinely large page); `shareController.js`'s `createShare` now rejects
  a payload over 5MB (the stale comment in `shareRoutes.js` claiming this
  already existed is now actually true); `contactController.js` now
  validates email format and rejects CR/LF in email/subject before they
  reach `emailService.js`'s `replyTo`/`subject` fields. `swales-services`:
  `reportQAService.answerOverallSuitability` no longer ranks Contour
  Analysis's swale/building percent-of-area figures alongside Solar/Wind's
  0-100 composite scores (a land-classification percentage isn't a
  suitability score) — reported separately instead, with the reasoning
  stated in the answer text; `combinedReportPdf.js`'s `altitudeData.weather`
  now uses the same normalized precipitation value its neighbor line
  already did. **Not fully resolved, documented instead**: the Extreme
  Wind Screening's IEC classification compares a 10m instantaneous-gust V50
  against IEC 61400-1's 10-minute-mean-at-hub-height standard — the actual
  fix (a proper gust-factor conversion) needs a specific factor decision
  Omar hasn't made, so this just adds an explicit caveat
  (`extremeWindEngine.js`'s header comment + the dashboard's info tooltip)
  that the reported class should be read as a conservative upper bound,
  not a literal mean-wind-speed classification, instead of silently
  picking a conversion factor.

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

- **Solar/Wind annual-demand-table drift** — Done 2026-09-14. Found during
  a full bug-hunting pass: `solarService.js` and `windCalculationEngine.js`
  each hardcoded their own copy of `ANNUAL_DEMAND_KWH`, which had drifted
  apart (Business 2x, Industrial 12x) — the same site got contradictory
  coverage verdicts depending which tool was used. Omar asked for real
  published figures rather than an interpolated guess before touching
  anything; after two research passes (the first one included two
  interpolated numbers that got correctly pushed back on), settled on:
  Home unchanged (3,600 — already agreed, no single better cited figure
  found), Farm unchanged (25,000 — matches a real cited "small arable
  farm" benchmark), Business set to 25,000 (was 25,000/50,000 — matches a
  real cited "small business" benchmark), Industrial set to 4,000,000
  (was 3,000,000/250,000 — matches the real cited "average factory"
  figure; Wind's old 250,000 was the actual error, ~16x off). Unified into
  one new shared file, `swales-services/src/lib/energyDemand.js`, which
  both services now import — same pattern already used for `HUB_HEIGHTS`,
  so the two can't drift apart again.

- **Second full bug-hunting pass (2026-09-15) — all findings fixed same
  day.** Full detail in `status.md`. Summary: `Users.AuthToken` widened
  from `VARCHAR(255)` to `TEXT` (a real Google id_token always exceeded
  the old limit, breaking every Google sign-in); `loginLimiter`/
  `sensitiveActionLimiter` converted from shared singletons to
  per-route factory functions (they were combining unrelated routes'
  rate-limit budgets); added a per-user rate limit to authenticated
  project-save routes; added format validation to the contact form and
  newsletter signup (`utils/emailFormat.js`); `swales-services`'
  `MapComponent.jsx` gained fetchId staleness guards on its two
  unguarded fetches (location/geocode panel, altitude overlay); fixed
  a Sun Tracker stale-closure bug (date/time customization silently
  reverting on the next pin move); fixed a false "please sign in" flash
  on Compare and Specialized Reports for already-signed-in users; made
  Specialized Reports' "which site?" field required; `swales-designer`
  got a shared `canvasConstants.ts` for `PIXELS_PER_METER` (was
  duplicated as a bare `40`) and a stale-fetch guard on
  `AllGardensModal.tsx`; 13 blog posts were de-duplicated, deleted, or
  had off-topic/brand-impersonation content removed (same defect class
  as the earlier pest-control-post fix, found to recur more widely on
  a broader sample).

- **Third full bug-hunting pass (2026-09-15) — critical/high/medium
  findings fixed same day.** Full detail in `status.md`. Most notable:
  `authController.js`'s `register`/`login`/`forgotPassword`/
  `resendVerification` accepted a non-string `email` (e.g. a JSON array)
  straight through `normalizeEmail()` into a Sequelize `where` clause,
  which compiles an array value into `IN (...)` — against `login` this
  let one request test a password against a batch of candidate emails
  (defeating the per-IP rate limiter's intent), and against
  `forgotPassword` it matched a victim's real account, minted them a
  valid reset token, and mailed that token to every address in the
  attacker-supplied array, victim included — a real account-takeover
  path. Fixed by requiring `utils/emailFormat.js`'s existing
  `isValidEmailFormat()` (already used by `subscribeController.js`) on
  all four endpoints, which also closes the separate "no format
  validation on `Users.Email`" gap in the same change. `vercel.json`
  gained an explicit `maxDuration: 60` (was relying on Vercel's 10s
  default, which register/forgotPassword's synchronous email-send could
  plausibly exceed under a slow Resend response, and a near-100-page PDF
  upload almost certainly could). `swales-services`: "Remember me" was
  fully inert — `loginUser()` in `authService.js` dropped the parameter
  entirely, and the checkbox was uncontrolled (`Input.jsx` only ever
  forwarded `value`, not `checked`) — both fixed, plus double-submit
  guards added to login/signup/forgot-password/reset-password (the
  `AccountDetailsModal.jsx` pattern hadn't been carried to the main auth
  pages), plus the shared axios instance's timeout raised from 5s to 15s
  (too tight for the same synchronous-email-send endpoints above).
  `swales-designer`: `GoogleLogin.tsx` had no path back from "Signing
  in..." if the user closed the popup or denied consent — no message
  ever arrives in that case, so nothing reset `isLoading` — fixed with a
  `popup.closed` poll; and the second pass's auth-loading-flash fix
  (gate rendering on `AuthContext`'s `isLoading`, not just `user`) had
  only ever reached `swales-services` — `swales-designer`'s `Header.tsx`,
  `MobileHeader.tsx`, `TopBar.tsx`, and `AllGardensModal.tsx` all still
  showed a Login/Sign-Up (or logged-out-state) flash on every cold load,
  fixed the same way. Deliberately deferred (Low severity, see the Open
  list items 29-31 above): a `pdfjs-dist` major-version bump, a fragile
  exact-string error match in `AccountDetailsModal.jsx`, and a full scan
  of all 478 blog posts for the content-corruption defect class (only
  ~9 posts' worth of symptoms were identified this pass, not fixed).
