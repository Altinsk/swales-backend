This is the **active rebuild**, not the live production backend — it deploys
to a plain `swales-backend.vercel.app` URL with no custom domain. The real
live site is `api.swales.app` / `designer.swales.app`, served by the separate
`SwalesApp\back` repo family (out of scope — do not read from or write to it).

(Corrected 2026-08-24 — see `docs/status.md`'s "Doc relocation note" for the
full story. This file previously stated the opposite, twice: first calling
this repo an "independent dev/sandbox... kept deliberately separate from
production" — backwards — then "confirmed" on 2026-08-23 as *the* real
production backend, which was also wrong. `docs/status.md` had the correct,
later-session correction the whole time; this file just never caught up.
Nothing shipped here protects real users yet — `api.swales.app` still runs
the pre-fix code until Omar cuts the real domains over.)

Roadmap, backlog, and session-continuity docs live in this repo, not
elsewhere:

Roadmap & phase plan: `docs/roadmap.md`
Live status tracker: `docs/roadmap_backlog.xlsx`
Session continuity notes: `docs/status.md`

`SwalesApp\back` (a separate, unrelated repo/database) and its own docs
are out of scope — do not read from or write to it.

**Mobile stack confirmed (2026-08-24):** React Native + Expo (see
`docs/roadmap.md`'s "First 2 weeks" item 5). Phase B (Mobile MVP) is still
gated on the separate auth-token decision, not the stack — see
`docs/status.md`'s "Next up" item 1.
