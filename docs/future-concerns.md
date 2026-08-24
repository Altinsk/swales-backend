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

1. **Bearer tokens live in `localStorage`, not the `httpOnly` cookie the
   backend already sets on login.** — *Severity: Medium, no known exploit
   today.* Any XSS bug anywhere in `swales-designer`/`swales-services`
   could read the token directly via script; an `httpOnly` cookie can't be
   read by JS at all. Fix is a real refactor — switching both frontends'
   API calls off `Authorization` headers onto cookie-based auth — flagged
   2026-08-24, not started.

2. **No 2FA.** — *Severity: Low now, rising to Medium/High once
   monetization ships.* Account takeover today just exposes garden
   designs. Once a paid tier / billing info exists, the stakes change.
   Recommend TOTP-based 2FA (not SMS — costs money, SIM-swap risk), target
   completion **before monetization go-live**, not necessarily before the
   monetization framework is decided. Added to roadmap 2026-08-24.

3. **No disposable/temporary email blocking at registration.** —
   *Severity: Low.* Combined with (now-fixed) rate limiting, this closes
   off using throwaway addresses to spam-create accounts. Added to
   roadmap 2026-08-24 per Omar's request, not yet implemented.

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

6. **Monetization framework — Decided 2026-08-24** (Priestley 4-product
   ladder, see `status.md` for full detail), **but two things still
   open**: actual subscription price points haven't been set (a separate
   decision from the framework shape), and `swales-services/src/app/pricing/page.js`'s
   copy still shows the old pre-decision aspirational tier sketch — worth
   updating before this is communicated externally, not urgent since
   nothing is purchasable yet (blocked on Stripe/bank account regardless).

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
   2-3 year vision gets built.

10. **Companion-planting data incomplete**: 107 of 171 species have empty
    `good_companions`. Subcategory vocabulary also has ~65 near-duplicate
    values needing cleanup.

11. **Canvas not wired to the real plant database.** `swales-designer`
    still reads a static `presets.json` — nothing calls `/api/elements` or
    resolves `icon_key` yet, despite the schema/API/seed data existing.

### Infrastructure

12. **`main` branch protection**: decide whether to turn on "require a PR
    before merging" now that the PR workflow is well-established (currently
    only a required status check is enforced; direct pushes to `main` are
    still possible and have happened, including doc-only pushes this
    session).

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

*(Nothing yet — this section fills in as items above get fixed, each with
the date and a pointer to where the work actually happened.)*
