> **Snapshot review** — not source of truth. Promote selectively into permanent docs.
> Generated: 2026-10-06. Code paths listed below are the live references.

# Suggestions

Optional follow-ups discovered while assembling this snapshot. Validate each item against live code before promoting it; this page is a backlog, not a source of truth.

## Docs

- Add permanent auth-session guidance covering [`clearClientSession()`](./core/service-auth.md), expiry polling, and the distinction between local cleanup and API logout.
- Add a dedicated crypto-card modes guide for compact, intermediate, and detailed states, including Markets ownership of aggregate tickers, promotion, and disabled card-level watchlist controls.
- Add a search-provider registration cookbook: keep contracts and orchestration in `core/search/`, feature providers under `features/<feature>/search/`, and register eager providers through `GLOBAL_SEARCH_PROVIDERS` with `useExisting` and `multi: true`.
- Fix the `FILE_STRUCTURES.md` high-level tree: it still labels watchlist as “dialog + config route,” while live routes and its own feature table correctly describe a dialog-only feature.
- Document user-visible empty/error/fallback semantics before expanding affected surfaces. The review found API failures collapsing to empty state in Trading and Watchlist, and zero or stale fallback prices appearing authoritative in Markets and Dashboard.
- Decide whether `/testing-ground` is intentionally public in production and record that policy; the current unlisted route remains directly reachable.
- Keep implementation smells in the issue backlog rather than permanent architecture docs, prioritizing the navbar/sidebar route-list drift, login console logging, and portfolio table type/format mismatches called out in the linked review pages.

## Rules / skills

- Add a thin snapshot-promotion checklist to `agents.md`: re-check live code, choose the owning source-of-truth doc, copy only durable guidance, remove the snapshot banner, and avoid maintaining `docs/review/` as a parallel truth.
- Keep `angular-guide.mdc` and `material-guide.mdc` as focused guides; do not duplicate their Angular and Material rules into review pages.
- Keep the concrete `@core/*`, `@shared/*`, and `@features/*` import rule in `FILE_STRUCTURES.md`; `learn2trade.mdc` already links that source of truth, so only add wording there if future edits make the concrete-file-path requirement unclear.
- For future multi-step frontend changes, use the Superpowers planning and execution skills, then verify against the repository guides before implementation.

## Plugins / tools

- Invoke `ui-styling` for Tailwind/Material component styling and accessibility work, `design-system` for token architecture or token validation, and `ui-ux-pro-max` for broader interaction and visual-design decisions; treat their output as guidance constrained by Learn2Trade’s existing tokens and Material rules.
- Use the existing banner-audit and Markdown inventory commands when regenerating this review package so missing snapshot labels and omitted pages fail visibly.
- Do not add NgRx or another state library for the reviewed architecture. Signals in services plus RxJS at asynchronous stream boundaries already cover the current needs, matching the improvement plan’s “NOT recommended” direction.
