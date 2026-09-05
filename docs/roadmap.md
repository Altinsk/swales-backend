# Swales.app — Phase 2+ Execution Roadmap

*Covers everything from both original feature lists, the new mobile app brief,*
*and the codebase-grounded audit doc ("3_Swales_App_and_Business.md"). Generated*
*alongside `roadmap_backlog.xlsx` (same data, trackable).*

> **Relocated 2026-08-23** from `SwalesApp\back\docs\roadmap.md` to here
> (`swales-backend\docs\roadmap.md`) — `SwalesApp\back` is out of scope
> going forward. **Correction (same day, later that session):** `swales-backend`
> is the **active rebuild**, not the real production repo — the real live
> site is `api.swales.app`/`designer.swales.app`, served by the separate
> `SwalesApp\back` repo family, which stays untouched until cutover. See
> `status.md`'s "Doc relocation note" for the full story. Text below is
> otherwise unchanged from the original, including any stray `back/`
> references in older notes — read those as "this repo."

## How to read this

Stage 1-3 (plant database, canvas, AI advisor, export) are your existing work —
referenced here for continuity but not re-planned. Everything below is what comes
next: **96 distinct items**, deduplicated across your Notion lists and the
codebase audit (several entries — Quiz/SwalesQuiz/Test-your-knowledge, Coins/Rewards,
School/Skool/Mind-Valley — were the same feature named more than once; merged below
and flagged where merged).

**This version folds in a second document** — a codebase-grounded audit that surfaced
real blocking decisions (an auth-token workaround, unverified Google sign-in), a full
backlog of near-term web work on the existing wind/solar/soil analysis cards, and a
monetization framework decision that was never addressed before. Two items from that
audit — website/email infrastructure setup, and a few content ideas (children's books,
an Alexa skill, a cross-format content engine) — were explicitly excluded at your request
and are not reflected below. Also confirmed: today's "mobile" experience (`MobileHeader.jsx`)
is responsive web only, not a native app — so Phase B is a genuine fresh build, not an
extension of existing mobile code.

Timeframes assume a small team (you, plus the data/design people already active,
plus either a hired mobile developer or AI-assisted solo development) working at a
realistic, non-crunch pace. Treat every date as a planning estimate to recheck at
the end of each phase, not a fixed commitment — the ordering matters more than the
exact week count.

## Tracking convention

Four documents, each with one job — don't duplicate data across them or they'll drift, the way two earlier roadmap drafts already did once:

- **`docs/roadmap.md`** (this file) — the stable plan: phases, ordering, reasoning. Canonical, lives only here (`swales-backend/` repo). `swales-designer/` and `swales-services/` each carry a one-line pointer to it in their own `CLAUDE.md`, not a copy.
- **`docs/roadmap_backlog.xlsx`** — the live tracker. Same 96+ items as this file, one row each, with a `Status` column (`Not started / In progress / Blocked / Postponed / Done`). This is what gets edited sprint-to-sprint — this file doesn't try to track status.
- **`docs/status.md`** — short, session-continuity note: what just got decided, what's in progress, what's next. Updated at the end of significant sessions so a fresh chat doesn't start cold.
- **`docs/future-concerns.md`** — a living checklist of risks/gaps intentionally deferred rather than fixed immediately (security hardening not yet done, pending product decisions, technical debt) — reviewed periodically so nothing gets silently forgotten until it forces backtracking. Not a duplicate of the other three: this is specifically for "we should deal with this eventually" items, not active work or the phase plan itself.

## Guiding directives (added 2026-08-26 — read before re-prioritizing any phase)

Three standing directives from Omar that should shape sequencing decisions
from here on, not just sit as one more backlog row:

1. **On-ground equipment link is the long-term differentiator.** The vision
   is for Swales to stop being pure software and become a system of
   assistance that connects, over time, to physical on-ground tools/equipment
   — built, sourced, or resold. This is explicitly a multi-year direction
   ("work with this as much as we can, from now"), not a Phase F line item to
   defer until usage data exists — it should inform product decisions now
   (e.g., what data the app should already be capturing that a future
   equipment-integration layer would need). Overlaps existing `Hardware`
   (Phase F) and `Services directory`/`Quotes` rows — those get folded into
   this vision rather than treated as separate later-stage ideas. No
   concrete build items yet; the immediate ask is to keep this lens active
   while making other roadmap calls, and to start noting/collecting
   concrete equipment/partner candidates as they come up.
2. **Community is core infrastructure, not a late nice-to-have.** Explicitly
   more than a design gallery or image showcase: real community means
   *helping* (people answering each other), *sharing knowledge* (wiki/
   reference content), and a *marketplace* — the things that make people
   keep coming back and make the tool durable long-term. Today's phase plan
   pushes most of this into Phase C (weeks 13-19) and Phase F (marketplace,
   later/gated on usage data). Keep this directive in mind when Phase B
   nears completion — there's a case for pulling core community mechanics
   (comments/sharing, a real reference/wiki, a lightweight marketplace)
   earlier than currently scheduled, rather than waiting the full original
   sequence. Not yet re-sequenced in the phase tables below; flagging here
   so it isn't lost, and revisit concretely once Phase B is closer to done.
3. **Relaunch the live version ASAP; keep building in the background.**
   Supersedes the prior assumption (recorded in `status.md`'s doc-relocation
   note) that the rebuild would be finished fully before cutting the real
   domains (`api.swales.app`/`designer.swales.app`) over. New direction:
   get the updated rebuild live sooner rather than later, and continue
   Phase A-onward development against the live app afterward instead of in
   isolation. This changes the cutover criterion from "fully done" to
   "stable enough for real users."

   **Pre-launch checklist — decided 2026-08-27, the only two hard gates:**
   1. **Plant images done** — the paused canvas merge (`future-concerns.md`
      item 11): the plant DB has zero per-species art, so the designer
      canvas can't wire up to `/api/elements` until real images exist for
      at least the species being merged. **In progress** — Omar is
      sourcing/creating them.
   2. **Business bank account opened → Stripe wired** — needed for the
      paid report tier (see the monetization decision above) to actually
      go live, not just be decided. **Not started.**

   Everything else flagged as "before launch, whenever possible" (2FA,
   disposable-email blocking, plant/element schema reconciliation — see
   `future-concerns.md` items 2, 3, 9) is explicitly **not** a launch
   gate — worth fitting in if there's time, but the cutover doesn't wait
   on them.

## The split logic: why web and mobile do different jobs

The mobile app is **not** a smaller version of the web app. Web is where deep,
seated design work happens — the canvas, the AI advisor, reports. Mobile is where
you are when you're not at a desk: on-site, camera in hand. So mobile's core loop
is capture and identify (photo → AI recognition → GPS-tagged log) and social
(comment, like, share, browse others' finds) — not a cut-down design canvas. This
is also *why* the giant second feature list (community, quiz, marketplace, coins,
school...) maps almost entirely onto mobile: those are all things people do between
visits to the field, not while laying out a swale.

A single shared backend (Phase A) is what makes "linked with the web version" real
— one account, one plant/element database, one set of designs, viewable (not
necessarily editable) from both places.

## Phase-by-phase plan

### Phase 0 — Infrastructure & Ownership Reset

**Immediate, before any repo migration** (~Aug 2026) · Platform: Infra/backend · 10 items

*Goal: added after a session that traced real, live problems in the current setup — not hypothetical cleanup. Nothing in Phase A should start until the items marked Must here are done, since two of them (the auth fix and the migrations fix) are the same category of risk as the things Phase A is already fixing.*

| Feature | Priority | Status | Notes |
|---|---|---|---|
| Confirm GitHub/Vercel/Neon account ownership for all 3 repos | Must | Done | Confirmed: `back`/`designer`/`services` repos are under the Altinsk GitHub account, owned by you. Still worth double-checking Vercel + Neon project ownership/billing directly in their own consoles. |
| Decide: consolidate repos into a GitHub Organization vs. keep as-is | Should | Not started | Only worth doing for cleaner team/collaborator access management going forward — ownership risk itself is already resolved. |
| Transfer or mirror the 3 repos to their final home | Should | Not started | Depends on the decision above. GitHub's built-in "Transfer ownership" preserves full history and auto-redirects the old URL; a manual mirror (`git push --mirror`) is only needed for a brand-new repo identity. |
| Re-link Vercel projects to repos' new location (if transferred) | Must | Not started | Vercel's git integration is tied to the specific repo location — must be reconnected after any transfer, or pushes silently stop auto-deploying. |
| Push pending local-only planning docs (`CLAUDE.md`, `docs/roadmap.md`, `docs/status.md`, `docs/roadmap_backlog.xlsx`) in all 3 repos | Must | Done | Relocated into `swales-backend/docs/` on 2026-08-23; pushed from there going forward. |
| `.env` / secrets hygiene pass — document required vars via `.env.example`, confirm nothing secret is committed, separate values per environment | Must | Done | Prompted by finding the local Postgres port mismatch (`back/config/config.json` assumes 5432, actual local Postgres runs on 5433) and `DATABASE_URL` silently overriding local dev intent. Done 2026-08-23 — `.env.example` added to all 3 repos, dead vars flagged (not removed). See `status.md`. |
| Replace `sequelize.sync({ alter: true })` with real, reviewable migrations | Must | Done | [server.js] used to auto-alter the live database schema on every server start, plus via a public `GET /api/db-sync` endpoint, with no review step. Fixed 2026-08-23: removed both, added `sequelize-cli` migrations, baselined dev-branch + production. See `status.md` for full detail. |
| Adopt Neon DB branching + Vercel Preview Deployments as the standard pre-merge testing workflow | Should | Done | Gives an isolated database and an isolated deployment per branch/PR, with zero risk to production — without needing separate repos or projects to get that isolation. Done 2026-08-23 via Neon's GitHub integration (`.github/workflows/neon_workflow.yml`). **2026-08-26: "require a PR before merging" decided (always, for this repo)** — a direct push to `main` was found to bypass this workflow's migration check entirely; see `future-concerns.md` item 12. |
| Fix Google Sign-In: verify the real Google `id_token` server-side | Must | Done | [socialAuthController.js] used to trust a client-supplied email plus an unverified token string, with no check at all — a live account-takeover hole. Fixed 2026-08-23: verifies Google's real `id_token` with `google-auth-library`. See `status.md` for full detail. |
| Create and maintain `docs/status.md` as the session-continuity doc | Should | Done | Relocated into `swales-backend/docs/` on 2026-08-23. Updated at the end of significant sessions going forward. |

### Phase A — Finish & Connect the Core

**Weeks 1-4** (~mid-Aug – mid-Sep 2026) · Platform: Web + backend · 11 items

*Goal: Resolve the blocking technical/business decisions first (auth token, monetization framework), then finish the web core that's already 90% done, and lay the one piece of shared infrastructure everything else depends on.*

| Feature | Origin | Platform | Priority | Notes |
|---|---|---|---|---|
| Design canvas (zones, beds, orchards, water features) | List A – Phase 1 | web | Must | Built. Now being wired up with the plant DB + icon set delivered earlier. |
| Plant & element database (region-aware, tagged) | List A – #1 / Phase 1 | backend | Must | Schema + 171-species seed delivered; companion-planting data, subcategory vocabulary cleanup, and a new derived `layer` field (canopy/sub-canopy/shrub/herbaceous/root/groundcover/vine/cover_crop/fungal) are all functionally complete and already applied/re-seeded on the Neon dev branch **and production** (2026-08-24/25/30); the code was committed 2026-08-30 (previously sat uncommitted for days — pure repo hygiene, not progress on the item below). **Still not started, still paused since 2026-08-25, waiting on Omar for images**: the actual canvas merge (wiring `/api/elements`, real per-species art, into the designer palette instead of static `presets.json`) has not begun and cannot begin until real per-species images exist. See `future-concerns.md` item 11 for the full reason and what unblocks it. |
| PDF export / clean map export | List A – Phase 1 | web | Must | Already done — out of scope, no further work needed. |
| Decide & implement a real auth token flow (replace HMAC workaround) | Codebase audit — Section A | backend | Must | Done 2026-08-24. The HMAC(secret, email) workaround was already retired by the 2026-08-23 Google id_token fix — backend now mints a JWT (native login or verified Google login), issued via an `httpOnly` cookie on login. Decided: keep this single JWT mechanism as the shared auth for web + mobile (Phase B), no refresh-token scheme for now — deferred until there's a real security need (e.g. handling payments). Extended JWT/cookie expiry 7d → 30d for mobile-friendliness. **2026-08-26: both web frontends switched from reading this JWT out of `localStorage`/`Authorization` headers to relying purely on the cookie** (`withCredentials`) — see the auth threat sweep entry in `status.md` for full detail, including the `sameSite: "none"` fix needed for the current cross-site `*.vercel.app` deployment topology. The backend still accepts an `Authorization: Bearer` header as a fallback specifically so mobile (Phase B) — which won't use a browser cookie jar — can keep using the originally planned Bearer-token-in-SecureStore approach unaffected. |
| Backend: properly verify Google id_token (signature, audience, expiry) | Codebase audit — Section A | backend | Must | Done 2026-08-23 — see Phase 0's Google Sign-In item and `status.md`. |
| Build a real AuthContext for the web app | Codebase audit — Section A | web | Must | Done 2026-08-24 (`swales-services` gap filled, mirroring `swales-designer`'s existing `context/AuthContext.tsx`), then **rewritten 2026-08-26 in both apps** as part of the cookie migration below — no longer stores a raw token (`accessToken` localStorage key retired entirely), exposes only `user`, backed by the `httpOnly` session cookie. `login()` now takes no arguments and just re-syncs `user` from `GET /auth/me`; `logout()` calls the new `POST /api/auth/logout`. `Header.jsx`/`Header.tsx` (the actually-rendered headers) already use `user`/`logout` from context in both apps — no further migration needed there. |
| Decide whether wind turbine sizing should use real wind speed | Codebase audit — Section A | web | Should | Currently matches your own wind.txt spec verbatim, including an unused meanWindSpeed parameter — deliberately not changed until you confirm intent. A product decision, not a bug. |
| Decide monetization framework (Free / free-for-contact / Core paid / Post-core) | Codebase audit — Section D | both | Must | **Decided 2026-08-24, revised 2026-08-27.** Priestley 4-product ladder, reconciled against what's actually already built (verified in code, not assumed): **Free** — all analysis maps (solar/wind/soil/water stress/altitude/contour/flooding/weather) + the design canvas, no gate, no account needed. **Free-for-contact** — printing/downloading a **design** (canvas export) requires an account; this stage already exists and works today (`ReportAuthGateModal`) — no build needed. **Revised 2026-09-05**: the map's "copy shareable link" action (Phase A2's Shareable link row) also moved here — copying/using the link now requires an account, same gate/component as the design/report downloads, reusing `ReportAuthGateModal` with share-specific copy. Merely *viewing* an analysis map (including one opened from someone else's shared link) still needs no account — only the act of generating/copying your own share link is gated. **Core paid** (monthly + yearly subscription, price points not yet set) — **revised 2026-08-27: the full site analysis report itself (the combined Site Report PDF — solar/wind/soil/water stress/flood risk/precipitation/elevation, plus the contour-in-report work) moves here, no longer free-for-contact.** Originally (2026-08-24) the report was free-for-contact and Core paid was only an *enhanced* version on top of it (multi-location comparison, unlimited regenerations, no upsell footer) — that enhanced layer still applies, now on top of a report that itself requires payment rather than just an account. **Exact selling mechanism not yet decided** — subscription-only, one-time single-report purchase, or both; flagged for a follow-up decision, not blocking the data-layer work already in progress. Saved-project-limit enforcement, real multi-user collaboration (beyond today's single-link sharing), the planting-recommendation AI advisor, and the not-yet-built "consulting site details for energy" feature remain explicitly **deferred, not part of the initial paid launch**. **Post-core**: intentionally undefined — to be designed once there's real usage data. Blocked on Stripe actually being wired for real payments, which is itself blocked on Omar opening a business bank account (tracked separately) — this decision can't go live regardless until then. See `status.md` for the full reasoning, including what was verified already-built vs. assumed. |
| Reconcile plant/element schema with the long-term relationships knowledge-graph vision | Codebase audit — Section C | backend | Should | The delivered 22-field flat schema (good_companions/avoid_near as strings) is a deliberate MVP. Your long-term vision is a ~50-field plant schema plus dozens of linked entity types (guilds, pests, diseases, cover crops...) tied together by a real relationships graph. Not a conflict — but worth a short pass now so early seed data doesn't need re-keying once the graph structure gets built, since that's explicitly a 2-3 year vision per your own notes, not this sprint. |
| Pinpoint global data extraction to user (auto site data from location pin) | List A – #0 | backend | Must | **Built, 2026-08-27** (validation pending). Shared `getOrFetch` site-data cache (`swales-services/src/lib/map/siteDataCache.js`) so the same dataset for the same pin is never re-fetched twice in one session — wired into solar, soil, wind planning, water stress, flood risk, elevation, geocode, and precipitation, plus the "full report" PDF generator, which now also always computes Sun position fresh (previously silently missing unless the user had visited the Sun Tracking tab first) and includes contour: reuses an already-drawn/analyzed rectangle if one exists this session, otherwise prompts for an interval (`ContourIntervalPromptModal`, same 1-100m options as the manual UI) and auto-draws a ~175m approximate box around the pin, clearly labeled as such in the report. **Explicitly excluded, per Omar's call**: weather forecast — not cached, not in the report, since it changes constantly. **To test before final validation** — see `status.md`'s dated entry for the full checklist; needs a logged-in click-through against the deployed backend, not yet done. |
| Shared account/data backend linking web + mobile | New (mobile ask) | backend | Must | Folded into Phase B, not standalone (decided with Omar, 2026-08-24). Investigated before starting: `swales-backend` already *is* the single shared backend serving both `swales-designer`/`swales-services` — one Users table, one Projects table, same auth. There's no second backend to unify. What's actually still missing (a photo-upload-with-GPS endpoint, whatever data model mobile "captures" need) is genuine Phase B scope, not a separate prerequisite — build it there instead of as its own item. |
| Add optional 2FA (TOTP) for user accounts | Added 2026-08-24 (Omar) | backend + web | Should | Not urgent pre-monetization — account takeover today just exposes garden designs. Target: built and available **before monetization goes live**, not necessarily before the monetization framework itself is decided, since a paid tier/billing info is what actually raises the stakes. TOTP (e.g. `otplib`), not SMS — SMS costs money per message and has known SIM-swap weaknesses. See `docs/future-concerns.md`. |
| Block disposable/temporary email domains at registration | Added 2026-08-24 (Omar) | backend | Should | Anti-abuse: check the email domain against a maintained blocklist (e.g. the `disposable-email-domains` package) in `register()`, reject with a clear message. Closes off spam-account creation via throwaway addresses, pairs with the rate limiting already added 2026-08-24. Not yet implemented. See `docs/future-concerns.md`. |
| Gate the single-pin map's analysis calls behind an explicit "Analyze" action | Added 2026-09-05 (Omar) | web | Must | **Done, 2026-09-05** — unblocks Phase A2's Site comparison row below. Every pin placement (map click, drag, "My location", typed lat/lng) used to fire the active layer's real analysis call (`fetchSolarData`/`fetchAllWindData`/`fetchSoilData`/etc.) immediately, zero debounce or confirmation, so idle browsing/mis-clicks/a bad geolocation guess/a typo'd coordinate all cost a real call. Fixed: placing/moving a pin stays free (still resolves the cheap place-name/elevation preview); the active layer's real fetch only runs from an explicit per-category "Analyze" action (toolbar button + in-panel "ready to analyze" prompt) — matches the existing per-tab fetch scoping, not a bulk "analyze everything" (Download Site Report already covers that case). Also fixed two real bugs found along the way: "My location" duplicated the geocode/elevation call on the Altitude layer, and had no branch at all for wind data. `MapComponent.jsx`'s four separate auto-fire code paths consolidated into one `runActiveLayerAnalysis`, net ~290 lines removed. Verified live in the browser preview across solar/wind/soil/altitude routes — see `status.md`'s 2026-09-05 entry for the full write-up and verification detail. |

### Phase A2 — Analysis Engine Quick Wins (parallel)

**Weeks 1-10, parallel to A/B** (~mid-Aug – late Oct 2026) · Platform: Web · 20 items

*Goal: A separate, parallel web-only track: ship the near-term analysis-card backlog (wind/solar/soil/precipitation) that's already scoped and doesn't touch the plant-database/canvas/mobile work at all — so it never competes with Phase A-C for attention.*

| Feature | Origin | Platform | Priority | Notes |
|---|---|---|---|---|
| Site comparison (two locations side-by-side: wind/solar/soil) | Codebase audit — Section B | web | Must | **Unblocked, 2026-09-05** — the Analyze-gate prerequisite above has shipped, so this is next up. Design finalized (not yet built): one shared mini-map with two pins (A/B toggle, all three location-input methods — click, "my location", typed lat/lng — write to whichever pin is active), nothing fetches until an explicit "Compare" click, gated **Free-for-contact** (sign-in required to run a comparison, same tier as the shareable link and report/design downloads, but the entry point stays visible to signed-out visitors rather than hidden). Full design in `status.md`'s 2026-09-05 entry. |
| Shareable link (encode lat/lng + active layer in the URL) | Codebase audit — Section B | web | Must | **Done, 2026-09-05.** Was already implemented in `MapComponent.jsx` (URL `?lat=&lng=` kept in sync on pin move, restored on load, path itself encodes the active layer, "Copy shareable link" button in both desktop/mobile toolbars) — found already built while starting this item, not new work. What *was* built this session: gating the copy-link action behind sign-in (Omar's call, 2026-09-05) — see the revised monetization row above. Generalized `ReportAuthGateModal` to accept `icon`/`title`/`description` props so the same component now serves both the report-download gate and this share-link gate with distinct copy, instead of duplicating the modal. |
| PDF site report (wind + solar + soil analysis export) | Codebase audit — Section B | web | Must | **Done — this row was already satisfied by `combinedReportPdf.js`/`CombinedReportContent.jsx` (see Phase A's monetization row and `status.md`'s 2026-08-27 entry), discovered after this row was originally written. Confirmed 2026-09-03: that component already renders Solar, Wind, and Soil sections into one PDF, alongside Sun/contour/precipitation. No separate build needed — this was a duplicate of already-shipped work, not a gap.** |
| Combined renewable score (single energy-potential badge: wind + solar) | Codebase audit — Section B | web | Should | — |
| ROI/payback calculator (electricity bill + budget -> payback years) | Codebase audit — Section B | web | Should | Uses existing wind/solar data — pairs naturally with bankability in the W track. |
| Optimal install month recommender (seasonal solar + wind data) | Codebase audit — Section B | web | Should | Built on SmartSolarAdvisor's existing seasonal data. |
| "Find best spot nearby" (draw a radius, rank top 3 solar/wind locations) | Codebase audit — Section B | web | Could | — |
| Shadow/obstruction input (mark trees/buildings to adjust solar estimate) | Codebase audit — Section B | web | Could | — |
| Onboarding tooltip tour (4-step walkthrough) | Codebase audit — Section B | web | Should | Distinct from the broader 'onboarding' beginner-mode item in Phase D — this is a lightweight tour for the existing analysis-card UI, shippable now. |
| Saved pins with notes (localStorage OK for v1) | Codebase audit — Section B | web | Could | — |
| Precipitation card — Option A (static: intensity badge, rainfall chart, guidance, soil-saturation estimate) | Codebase audit — Section B | web | Should | **Done — confirmed 2026-09-03: `PrecipitationCard.jsx` exists (intensity scale, animated rain effect) and is live in `LayerDataPanel.jsx`.** Option B (RainAdvisor: irrigation decisions, flood/runoff risk, swale/water-harvesting sizing) remains **not started**. |
| RainAdvisor service — Option B (irrigation decisions, flood/runoff risk, swale/water-harvesting sizing) | Codebase audit — Section B | web | Could | Layer in after precipitation_card ships, the same way SmartSolarAdvisor was bolted onto the sun tracker — don't build both at once. |
| Composite soil health score (0-100, weighted, with trend indicator) | Codebase audit — Section B | web | Should | — |
| Crop suitability engine (ranks wheat/maize/legumes/vegetables/fruit trees with reasons) | Codebase audit — Section B | web | Should | — |
| Amendment calculator (exact kg/hectare dosing) | Codebase audit — Section B | web | Should | — |
| Soil depth profile visualization (SoilGrids 0-100cm) | Codebase audit — Section B | web | Could | — |
| Carbon sequestration estimate (tonnes/hectare/year, linked to carbon credit schemes) | Codebase audit — Section B | web | Could | — |
| Erosion risk score (texture + bulk density + slope + rainfall intensity) | Codebase audit — Section B | web | Could | — |
| Cross-layer integration (soil x precipitation x sun x wind unified farm advisory) | Codebase audit — Section B | web | Should | Overlaps ai_advisor/decision_layer conceptually — likely the same underlying advisory engine applied to the analysis cards instead of the design canvas. Worth deciding if these converge into one engine. |
| UI consistency pass (spacing, tooltips, blog-post links, subtle animation across cards) | Codebase audit — Section B | web | Should | — |

### Phase B — Mobile MVP — Capture & Identify

**Weeks 5-12** (~mid-Sep – mid-Nov 2026) · Platform: Mobile · 5 items

*Goal: Ship a mobile app that's useful to exactly one person, alone, with zero other users — the photo-ID + logging loop has to earn its own install.*

| Feature | Origin | Platform | Priority | Notes |
|---|---|---|---|---|
| Photo recognition AI (trees, plants, flowers, mushrooms) | List B | mobile | Must | Merge with 'Natural identifier' below — same feature. This is the single best reason to install the mobile app. |
| Natural identifier | List B | mobile | Must | Duplicate of photo_recognition — ship as one feature, not two. |
| Location-based site/observation logging (GPS pins) | New (mobile ask) | mobile | Must | Foundation for biodiversity tool, mushroom map, and community map — build the pin system once, reuse everywhere. |
| "My Sites/Designs" synced view from web account | New (mobile ask) | mobile | Must | Read-only on mobile at first — don't try to rebuild the design canvas on a phone screen. Confirmed there's no existing native app to build on — this is a genuine fresh build. |
| Weather integration | List B | both | Should | Useful context for field capture; relatively cheap via a weather API. |

### Phase C — Mobile Social Layer

**Weeks 13-19** (~mid-Nov – early Jan 2027) · Platform: Mobile · 9 items

*Goal: Turn the app people are already using solo into something they open because other people are on it too.*

| Feature | Origin | Platform | Priority | Notes |
|---|---|---|---|---|
| Core social mechanics: comments, likes, sharing | New (mobile ask) | mobile | Must | Build once as shared infrastructure — every social feature below (community, success stories, etc.) sits on top of this. |
| Community (feed of designs/observations) | List B | mobile | Must | — |
| Community map + Quora-style Q&A | List C | mobile | Should | Q&A layer can start simple — threaded comments on map pins. |
| Perma app map (gamified exploration, like Yusuf's map game) | List C | mobile | Could | Builds on community_map — sequence after the base map has real content. |
| Biodiversity observation tool | List B | mobile | Should | Reuses the location_logging pin system from Phase B. |
| Mushroom map | List B | mobile | Could | A filtered view of the same pin system, not a separate build. |
| Success Stories | List B | mobile | Should | — |
| Messaging app (DMs) | List B | mobile | Could | Real engineering + moderation surface — confirm it's worth it before/instead of just comments+DM-via-email. |
| Decide the social/engagement layer's style (Twitter-like vs Instagram-like vs other) | Codebase audit — Section F | mobile | Should | Open question from your own notes — decide before building out social_engine/community_feed in detail, since it shapes the UI pattern (feed vs. grid, text-first vs. photo-first). |

### Phase D — Reference & Content Layer

**Weeks 20-27** (~early Jan – late Feb 2027) · Platform: Both (mobile-first) · 16 items

*Goal: Fill in the reference/content layer — cheap to build once the database exists, and it's what keeps people opening the app between site visits.*

| Feature | Origin | Platform | Priority | Notes |
|---|---|---|---|---|
| Wiki | List B | both | Should | — |
| Trees reference pages | List B | both | Should | Pulls from the same plant_database schema — content expansion, not new architecture. |
| Plants reference pages | List B | both | Should | Same as above. |
| Flowers reference pages | List B | both | Could | Same schema, lower priority content set. |
| Animals reference pages | List B | both | Could | Same schema, extends the animal_system category already in the seed data. |
| Mushrooms reference pages | List B | both | Could | Same schema. |
| Materials reference/catalog | List B | both | Could | — |
| Energy Calculators | List B | both | Should | Contained scope, good quick win once content team has capacity. |
| Field Calculators | List B | both | Should | Scope decided 2026-08-27: includes earthworks-sizing tools (swale volume/dimensions, terrace spacing/cut-fill, etc.), not yet broken into individual items. |
| Books and magazines library | List B | both | Could | — |
| Resources library | List B | both | Could | Overlaps books_magazines — consider one unified library section. |
| Ideas (inspiration gallery) | List B | both | Could | Overlaps design_gallery below — merge if possible. |
| "Permaculture" content hub / landing page | List B | both | Could | — |
| Design library / public gallery | List A – Phase 5 / List B – Design | both | Should | Needs real user designs to populate — sequence after Phase B/C produce some. |
| Templates (UK garden, homestead, agroforestry) | List A – Phase 5 | web | Should | — |
| Usability & onboarding (beginner mode) | List A – #8 | both | Must | Don't skip this — it's explicitly why MyPermagarden beats Swales today on ease of entry. |

### Phase E — Education & Gamification

**Weeks 28-34** (~late Feb – mid-Apr 2027) · Platform: Both · 8 items

*Goal: Add competitive and educational hooks now that there's an actual user base to compete against and learn alongside.*

| Feature | Origin | Platform | Priority | Notes |
|---|---|---|---|---|
| Yield planner | List B | both | Should | — |
| Planner / Tips / To-do list | List B | mobile | Should | — |
| Events calendar | List B | both | Could | — |
| Quiz / SwalesQuiz | List B / List C | both | Should | Merge Quiz + SwalesQuiz + 'Test your knowledge' into one feature. |
| Test your knowledge | List B | both | Should | Duplicate of quiz — don't build twice. |
| Competitions / challenges / tests | List B | both | Could | Needs an active user base to have anyone to compete against — correctly gated here, not earlier. |
| Coins / earnings or similar | List B | both | Could | Merge with 'Rewards using the app' — same mechanic. |
| Rewards using the app | List B | both | Could | Duplicate of coins_rewards. |

### Phase F — Platform & Business Layer

**Month 9+** (~Apr 2027 onward, gated on usage data) · Platform: Both · 14 items

*Goal: The business-model layer: marketplace, services, education platform, hardware. Each of these is close to its own product — gate the start date on real usage data from B–E, not the calendar.*

| Feature | Origin | Platform | Priority | Notes |
|---|---|---|---|---|
| 3D model / visualization | List A – #12 | web | Later | Most expensive line item relative to payoff. Recommend skipping until 2D + AI + data clearly beat AgroForest Designer on their own turf. |
| Swales marketplace | List C | both | Later | Needs finished designs worth trading — gate on Phase B/C/D producing real content. |
| Services directory (consultants/designers) | List B | both | Later | — |
| Quotes (supplier/contractor quote requests) | List B | both | Later | Pairs naturally with services + cost_estimation. |
| Hardware (physical products) | List C | both | Later | This is close to a separate business — treat as its own go/no-go decision, not a feature ticket. |
| School | List B | both | Later | Merge with skool_mentors + mind_valley — pick one education-platform model, don't build three. |
| Skool of mentors idea | List B | both | Later | Duplicate bucket — see school. |
| Mind Valley-style permaculture course platform | List B | both | Later | Duplicate bucket — see school. |
| Swales Media (video/photo content hub) | List B | both | Later | Merge with journal_magazine — one content hub, not two. |
| Journal or news magazine | List B | both | Later | Duplicate bucket — see swales_media. |
| Permaculture Photo book | List B | both | Later | — |
| A KPI-led movement (impact metrics framework) | List C | both | Later | More a marketing/positioning initiative than a build item. |
| Integrations (GIS, farm tools) | List A – Phase 5 | backend | Later | — |
| Technical considerations in the future (infra/scaling) | List C | backend | Later | Revisit once there's real load to scale for. |

### Phase W — Web Pro Track (parallel)

**Runs alongside B–E** (~Sep 2026 – Apr 2027) · Platform: Web · 12 items

*Goal: Everything from your original Phase 2-4 that stays on web, running in parallel at its own pace so the mobile build doesn't stall it.*

| Feature | Origin | Platform | Priority | Notes |
|---|---|---|---|---|
| AI design assistant ("Swales AI") — swale placement, orchard siting, windbreak recs | List A – Phase 2 / List C – Swales AI / List B – Design with AI help | web | Must | Already in background dev. Treat Swales AI, Decision Intelligent Layer, and Design-with-AI-help as ONE product surface, not three. |
| Decision intelligent layer | List C | web | Should | Merge into ai_advisor — same underlying engine, don't build twice. Also overlaps cross_layer_advisory below — one engine, not three. |
| Guild builder (auto-suggest combos, conflict warnings) | List A – Phase 2 | web | Must | Directly uses the good_companions/avoid_near fields already in the delivered schema. |
| Zones & sectors auto-generation (Zone 1-5, sun/wind/water) | List A – Phase 2 | web | Should | — |
| Reports (site analysis, water flow, design rationale) | List A – Phase 3 / List C | web | Must | This is the monetization unlock — what consultants pay for. |
| Cost + materials estimation | List A – Phase 3 | web | Should | — |
| Client sharing (view-only links, commenting) | List A – Phase 3 | web | Should | — |
| Bankability for systems (financial/ROI viability) | List A – #13 | web | Should | Real differentiator — no competitor in the teardown has this. Worth protecting time for. |
| Growth simulation (trees over 5-10 years) | List A – Phase 4 | web | Could | Slides to late W / early F if capacity is tight — real engineering effort. |
| Water behavior modeling (before/after swales) | List A – Phase 4 | web | Could | Same caveat as growth_sim. |
| Yield projections | List A – Phase 4 | web | Could | — |
| Succession planning | List A – #5 / Phase 4 | web | Could | — |

### Parked — needs your clarification

| Feature | Origin | Platform | Priority | Notes |
|---|---|---|---|---|
| "Eco system Features" (as named in your Notion list) | List C | — | — | Title alone doesn't tell me what's inside this page — looked private/inaccessible to me. Overlaps growth_sim/water_modeling/yield_projection unless it means something else — flag for you to clarify or fold in. |

## Merged / deduplicated items

These pairs (or trios) were listed separately in your notes but are the same
feature — built once, not twice:

- Photo recognition AI = Natural identifier
- Swales AI = Decision intelligent layer = Design with AI help (one AI product surface)
- Quiz = SwalesQuiz = Test your knowledge
- Coins/earnings = Rewards using the app
- School = Skool of mentors = Mind Valley-style course platform
- Swales Media = Journal/news magazine (one content hub)
- Resources ≈ Books and magazines (consider one library section)
- Ideas ≈ Design gallery (consider one inspiration/showcase section)
- Cross-layer integration (soil x precipitation x sun x wind) likely overlaps the AI
  advisor / decision layer — probably one advisory engine applied in two places, not two engines

## Explicitly excluded from this roadmap

Per your instruction, these are deliberately left out rather than parked — not
forgotten, just not part of this plan:

- Website/email infrastructure setup (Namecheap/Vercel/Resend DNS work)
- Children's books, an Alexa skill, and a general cross-format content engine

## First 2 weeks — concrete next actions

1. ~~Decide the auth token approach~~ — Done 2026-08-24, hardened to
   httpOnly-cookie-based auth 2026-08-26, see Phase A table.
   `shared_backend`/Phase B is fully unblocked on this front.
2. Decide the monetization framework (Priestley's 4-product model or otherwise) —
   cheap to decide now, expensive to retrofit once Reports/Phase F get built.
3. Ship the Section-B fast wins in parallel (shareable link, PDF site report, site
   comparison) — near-zero cost, doesn't touch the plant-database/canvas code at all.
4. Finish importing `plants_seed.csv` into the real database and confirm the
   canvas renders every `icon_key` correctly (Tier-1 generic icons are enough to
   unblock this — don't wait on all 53 species icons).
5. Decide the mobile stack and who's building it (you + AI-assisted coding, a
   hired freelancer, or a small contracted team) — this single decision sets the
   realistic pace for every Phase B-E date above. Confirmed there's no existing
   native app to build on, so this is a from-scratch decision.

   **Stack confirmed by Omar (2026-08-24):**
   - React Native + Expo (managed workflow), TypeScript — closest skill/code
     overlap with the existing Next.js/TypeScript web stack (`swales-designer`,
     `swales-services`); lets mobile share types/validation with the backend's
     Sequelize models instead of redefining them.
   - Offline-first local store (WatermelonDB or plain SQLite) with a sync
     queue — field capture (GPS pins, photos) must work with no signal on-site,
     then sync once back online.
   - Auth: reuse Phase A's shared backend (auth-token decision made
     2026-08-24 — JWT/Bearer, no refresh tokens for now; `AuthContext` built
     2026-08-24) — no second auth system.
   - Photo/plant ID: call an external vision API first for MVP speed; only
     consider an on-device model later if latency/cost becomes a real problem.
   - Push notifications: Expo's push service — no separate APNs/FCM wiring
     needed at MVP scale.
6. Scope Phase B down to literally just: camera → photo recognition → GPS-tagged
   log → save. Resist adding comments/likes/sharing until Phase C — that's the
   "prove the core loop works" test applied to mobile specifically.

## One honest flag

69 items is a lot for a small team, even spread to March 2027 and beyond. The
phase order above already does the prioritization — Phase F exists specifically
to hold the marketplace/school/hardware/media items until there's real usage data
to justify them. If timelines slip (they usually do), protect Phase A-C before
anything else: those are the phases where the app either proves itself or doesn't.
