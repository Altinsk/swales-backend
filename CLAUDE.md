This is the **active rebuild**, not the live production backend — it deploys
to a plain `swales-backend.vercel.app` URL with no custom domain. The real
live site is `api.swales.app` / `designer.swales.app`, served by the separate
`SwalesApp\back` repo family (out of scope — do not read from or write to it).
Nothing shipped here protects real users yet — `api.swales.app` still runs
the pre-fix code until Omar cuts the real domains over.

Roadmap, backlog, session-continuity, and flagged-concerns docs live in this
repo, not elsewhere:

Roadmap & phase plan: `docs/roadmap.md`
Live status tracker: `docs/roadmap_backlog.xlsx`
Session continuity notes: `docs/status.md`
Flagged risks/gaps not yet fixed: `docs/future-concerns.md` — review before
starting a new phase or a real-users/monetization milestone.

`SwalesApp\back` (a separate, unrelated repo/database) and its own docs
are out of scope — do not read from or write to it.

Mobile stack (React Native + Expo), the auth-token approach, and
`AuthContext` are all decided/built — see `docs/roadmap.md`'s Phase A table
for current status before assuming something here is still open.
