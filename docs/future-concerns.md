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

4. **No resend-verification-email endpoint.** — *Severity: Low.*
   Verification links now expire in 24h (down from an accidental 30 days,
   fixed 2026-08-24) — a user who misses the window has no self-service
   way to get a new one; would need to contact support, since re-
   registering with the same email fails today.

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

6. **Monetization framework — Decided 2026-08-24, revised 2026-08-27**
   (Priestley 4-product ladder, see `status.md` for full detail). The full
   site analysis report now requires payment (Core paid), not just an
   account (free-for-contact) — only design/canvas downloads stay
   free-for-contact. **Three things still open**: (1) the actual selling
   mechanism for a single-location report — subscription-only, one-time
   purchase, or both — not yet decided; (2) actual subscription/purchase
   price points haven't been set; (3) `swales-services/src/app/pricing/page.js`'s
   copy still shows the old pre-decision aspirational tier sketch and is
   now further out of date — worth updating before this is communicated
   externally, not urgent since nothing is purchasable yet (blocked on
   Stripe/bank account regardless).

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

8. **Dead env vars** (`DB_HOST`/`DB_NAME`/`DB_USER`/`DB_PASS`/
   `config/database.js` in `swales-backend`; unused `EMAIL_USER`/
   `EMAIL_PASS`/`Password_Reset_Url`/`Email_verify_Url`/`AllowedOrigins`)
   — flagged during the `.env` hygiene pass, not removed. Cosmetic, no
   functional risk.

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
