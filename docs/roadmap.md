# Swales.app — Phase 2+ Execution Roadmap

*Covers everything from both original feature lists, the new mobile app brief,*
*and the codebase-grounded audit doc ("3_Swales_App_and_Business.md"). Generated*
*alongside `roadmap_backlog.xlsx` (same data, trackable).*

> **Relocated 2026-08-23** from `SwalesApp\back\docs\roadmap.md` to here
> (`swales-backend\docs\roadmap.md`) — `SwalesApp\back` is out of scope
> going forward; `swales-backend` is the confirmed real production repo.
> See `status.md`'s "Doc relocation note" for the full story. Text below is
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

Three documents, each with one job — don't duplicate data across them or they'll drift, the way two earlier roadmap drafts already did once:

- **`docs/roadmap.md`** (this file) — the stable plan: phases, ordering, reasoning. Canonical, lives only here (`swales-backend/` repo). `swales-designer/` and `swales-services/` each carry a one-line pointer to it in their own `CLAUDE.md`, not a copy.
- **`docs/roadmap_backlog.xlsx`** — the live tracker. Same 96+ items as this file, one row each, with a `Status` column (`Not started / In progress / Blocked / Postponed / Done`). This is what gets edited sprint-to-sprint — this file doesn't try to track status.
- **`docs/status.md`** — short, session-continuity note: what just got decided, what's in progress, what's next. Updated at the end of significant sessions so a fresh chat doesn't start cold.

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
| `.env` / secrets hygiene pass — document required vars via `.env.example`, confirm nothing secret is committed, separate values per environment | Must | Not started | Prompted by finding the local Postgres port mismatch (`back/config/config.json` assumes 5432, actual local Postgres runs on 5433) and `DATABASE_URL` silently overriding local dev intent. |
| Replace `sequelize.sync({ alter: true })` with real, reviewable migrations | Must | Done | [server.js] used to auto-alter the live database schema on every server start, plus via a public `GET /api/db-sync` endpoint, with no review step. Fixed 2026-08-23: removed both, added `sequelize-cli` migrations, baselined dev-branch + production. See `status.md` for full detail. |
| Adopt Neon DB branching + Vercel Preview Deployments as the standard pre-merge testing workflow | Should | Not started | Gives an isolated database and an isolated deployment per branch/PR, with zero risk to production — without needing separate repos or projects to get that isolation. |
| Fix Google Sign-In: verify the real Google `id_token` server-side | Must | Done | [socialAuthController.js] used to trust a client-supplied email plus an unverified token string, with no check at all — a live account-takeover hole. Fixed 2026-08-23: verifies Google's real `id_token` with `google-auth-library`. See `status.md` for full detail. |
| Create and maintain `docs/status.md` as the session-continuity doc | Should | Done | Relocated into `swales-backend/docs/` on 2026-08-23. Updated at the end of significant sessions going forward. |

### Phase A — Finish & Connect the Core

**Weeks 1-4** (~mid-Aug – mid-Sep 2026) · Platform: Web + backend · 11 items

*Goal: Resolve the blocking technical/business decisions first (auth token, monetization framework), then finish the web core that's already 90% done, and lay the one piece of shared infrastructure everything else depends on.*

| Feature | Origin | Platform | Priority | Notes |
|---|---|---|---|---|
| Design canvas (zones, beds, orchards, water features) | List A – Phase 1 | web | Must | Built. Now being wired up with the plant DB + icon set delivered earlier. |
| Plant & element database (region-aware, tagged) | List A – #1 / Phase 1 | backend | Must | Schema + 53-item seed delivered. Finish import + full icon population this phase. |
| PDF export / clean map export | List A – Phase 1 | web | Must | Already done — out of scope, no further work needed. |
| Decide & implement a real auth token flow (replace HMAC workaround) | Codebase audit — Section A | backend | Must | Current token is a deterministic HMAC(secret, email); the separate backend re-derives it independently. Needs a coordinated change on both sides at once — this is a decision only you can make, not something to guess at. |
| Backend: properly verify Google id_token (signature, audience, expiry) | Codebase audit — Section A | backend | Must | Done 2026-08-23 — see Phase 0's Google Sign-In item and `status.md`. |
| Build a real AuthContext for the web app | Codebase audit — Section A | web | Must | MobileHeader.jsx references @/context/AuthContext, which doesn't exist yet — import path was fixed but the context itself still needs building. Needed before wiring the account-details modal, and useful groundwork for shared_backend. |
| Decide whether wind turbine sizing should use real wind speed | Codebase audit — Section A | web | Should | Currently matches your own wind.txt spec verbatim, including an unused meanWindSpeed parameter — deliberately not changed until you confirm intent. A product decision, not a bug. |
| Decide monetization framework (Free / free-for-contact / Core paid / Post-core) | Codebase audit — Section D | both | Must | No paywall exists today — the PDF report is free, only a voluntary tip jar (CoffeePopup) exists, and the mobile 'Subscription' menu is an inert stub. Decide the structure now (Priestley's 4-product framework proposed) — it needs to land before Reports becomes 'the monetization unlock' in the W track and before Phase F's marketplace/premium tiers are designed. |
| Reconcile plant/element schema with the long-term relationships knowledge-graph vision | Codebase audit — Section C | backend | Should | The delivered 22-field flat schema (good_companions/avoid_near as strings) is a deliberate MVP. Your long-term vision is a ~50-field plant schema plus dozens of linked entity types (guilds, pests, diseases, cover crops...) tied together by a real relationships graph. Not a conflict — but worth a short pass now so early seed data doesn't need re-keying once the graph structure gets built, since that's explicitly a 2-3 year vision per your own notes, not this sprint. |
| Pinpoint global data extraction to user (auto site data from location pin) | List A – #0 | backend | Must | Infrastructure multiplier — do this early, it speeds up every later feature that needs site context. |
| Shared account/data backend linking web + mobile | New (mobile ask) | backend | Must | The technical piece that makes 'mobile links with the web version' literally true, not just a slogan. Confirmed: today's mobile experience (MobileHeader.jsx) is responsive web only, not a native app — build this so a future native app can reuse it, but Phase B below is a genuine fresh build either way. Sequence after auth_token_decision/auth_context_build — don't build shared accounts on top of an auth flow that's still an open security question. |

### Phase A2 — Analysis Engine Quick Wins (parallel)

**Weeks 1-10, parallel to A/B** (~mid-Aug – late Oct 2026) · Platform: Web · 20 items

*Goal: A separate, parallel web-only track: ship the near-term analysis-card backlog (wind/solar/soil/precipitation) that's already scoped and doesn't touch the plant-database/canvas/mobile work at all — so it never competes with Phase A-C for attention.*

| Feature | Origin | Platform | Priority | Notes |
|---|---|---|---|---|
| Site comparison (two locations side-by-side: wind/solar/soil) | Codebase audit — Section B | web | Must | Split-panel layout; data's already fetched — a fast win. |
| Shareable link (encode lat/lng + active layer in the URL) | Codebase audit — Section B | web | Must | One-line param change — near-zero cost, ship immediately. |
| PDF site report (wind + solar + soil analysis export) | Codebase audit — Section B | web | Must | Distinct from the design-canvas PDF export in Phase A — this is the energy/soil analysis report. The pdf skill handles generation. Also the thing monetization_framework needs to decide how to gate. |
| Combined renewable score (single energy-potential badge: wind + solar) | Codebase audit — Section B | web | Should | — |
| ROI/payback calculator (electricity bill + budget -> payback years) | Codebase audit — Section B | web | Should | Uses existing wind/solar data — pairs naturally with bankability in the W track. |
| Optimal install month recommender (seasonal solar + wind data) | Codebase audit — Section B | web | Should | Built on SmartSolarAdvisor's existing seasonal data. |
| "Find best spot nearby" (draw a radius, rank top 3 solar/wind locations) | Codebase audit — Section B | web | Could | — |
| Shadow/obstruction input (mark trees/buildings to adjust solar estimate) | Codebase audit — Section B | web | Could | — |
| Onboarding tooltip tour (4-step walkthrough) | Codebase audit — Section B | web | Should | Distinct from the broader 'onboarding' beginner-mode item in Phase D — this is a lightweight tour for the existing analysis-card UI, shippable now. |
| Saved pins with notes (localStorage OK for v1) | Codebase audit — Section B | web | Could | — |
| Precipitation card — Option A (static: intensity badge, rainfall chart, guidance, soil-saturation estimate) | Codebase audit — Section B | web | Should | Ship this static version first (matches the SolarCard/WindDashboard pattern), per your own recommendation. |
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
| Field Calculators | List B | both | Should | — |
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

1. Decide the auth token approach and confirm with whoever owns the separate
   backend service — this blocks shared_backend, and shared_backend blocks Phase B.
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
   - Auth: reuse Phase A's shared backend once the auth-token decision and
     `AuthContext` land — no second auth system.
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
