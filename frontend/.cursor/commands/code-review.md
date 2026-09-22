# Code review for AI

Review the **latest changes on the current branch** against the Learn2Trade frontend expert rules.

## Scope

1. Determine the review baseline:
   - Prefer `git diff` / `git diff --stat` against the branch’s merge base with the default base branch (`main` or `master`).
   - Include staged and unstaged work if present.
   - If the branch has no commits ahead of base, review the current working-tree diff.
2. Focus on `frontend/` changes. Mention out-of-scope repo changes only if they affect the frontend.
3. Read and apply:
   - `.cursor/rules/angular-expert.mdc`
   - `.cursor/rules/material-expert.mdc`
   - `.cursor/rules/learn2trade.mdc`
   - `agents.md` when relevant
4. Inspect changed files fully enough to judge behavior, not only the hunk headers. Trace nearby templates, styles, services, guards, and tests when the diff depends on them.
5. Do **not** implement fixes unless the user asks. This command is review-only.

## What to evaluate

- Angular 22+ patterns: `inject()`, signals / `computed` / inputs-outputs-queries, OnPush-friendly state, control flow (`@if` / `@for`), lifecycle and cleanup
- RxJS boundaries: no leaky subscriptions; correct use of `toSignal` / `takeUntilDestroyed` / cancellation (`switchMap`, resources)
- Angular Material: `mat.theme` / overrides only; no private `.mat-mdc-*` / `::ng-deep` hacks; token usage
- Project map: changes land in the right area (pages vs shared vs services vs `src/styles`); reuse existing abstractions
- Correctness: auth/guards, race conditions, error/loading/empty states, typing (`any` / unsafe casts)
- Tests: missing or outdated coverage for behavior changes
- Scope hygiene: unrelated refactors, drive-by formatting, accidental API breaks

## Output format

Start with a 1–2 sentence summary of branch risk and overall alignment.

Then report findings in **exactly these three levels** (omit a level only if empty, and say so):

### Changes required

Must-fix issues before merge: bugs, broken auth/routing, leaked subscriptions, incorrect signal/RxJS usage that causes wrong UI or races, Material private-API breakage risk, security/privacy problems, clear rule violations that will cause production defects.

### Important

Should-fix soon: missing cancellation, fragile patterns, weak typing at boundaries, inconsistent project structure, missing tests for changed behavior, theme/token inconsistencies, accessibility regressions.

### Suggestions

Optional improvements: naming, small simplifications, further signal modernization, doc pointers for future `docs/features/`, non-blocking style nits.

For each finding:

- **File** (and symbol/line if known)
- **Issue** (what is wrong)
- **Why** (which guideline or defect)
- **Recommendation** (concrete fix direction — no large unrelated rewrite)

End with:

- **Verdict**: `Blocked` (any Changes required), `Needs attention` (only Important), or `Looks good` (only Suggestions / clean)
- **Files reviewed** count and whether tests were part of the diff
