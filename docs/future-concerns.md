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

7. **Wind turbine sizing** — decide whether to use real wind-speed data
   vs. the current stub that matches `wind.txt` verbatim (including an
   unused `meanWindSpeed` parameter). Low severity, deliberately
   unchanged pending a decision.

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
    Two local, uncommitted changesets are sitting in the working tree
    specifically because of this pause, not because they were forgotten:
    `swales-backend` (`models/element.js`, `scripts/seedElements.js`,
    `scripts/validateSeed.js`, `seed-data/plants_seed.csv`,
    `seed-data/schema.md`, and the untracked
    `migrations/20260825010000-add-layer-to-elements.js`) add the `layer`
    field the merge will key off of — already applied to and re-seeded on
    the Neon dev branch, just not committed; and `swales-designer`
    (`public/presets.json`) holds the `food-forest-layers` restructuring
    described above. Both are functionally complete and safe to commit
    independently of the pause if that's ever useful, but committing them
    doesn't unblock anything — the merge itself waits on the images.

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
