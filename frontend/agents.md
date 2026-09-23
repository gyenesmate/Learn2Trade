# Frontend AI Agent Instructions

These instructions apply to every AI agent working in the **Learn2Trade frontend**.

## Where standards live

| Location | Use for |
| --- | --- |
| [`.cursor/rules/learn2trade.mdc`](./.cursor/rules/learn2trade.mdc) | Project map, where code/docs live |
| [`.cursor/rules/angular-expert.mdc`](./.cursor/rules/angular-expert.mdc) | Angular 22+ patterns (signals, inject, RxJS, templates) |
| [`.cursor/rules/material-expert.mdc`](./.cursor/rules/material-expert.mdc) | Angular Material theming and components |
| [`docs/FILE_STRUCTURES.md`](./docs/FILE_STRUCTURES.md) | Folder layout and file-placement rules |
| [`docs/TRADING_UI_CONTEXT.md`](./docs/TRADING_UI_CONTEXT.md) | Trading UI design system |
| [`.cursor/commands/code-review.md`](./.cursor/commands/code-review.md) | Branch review against the expert rules |

Always-on Cursor rules under `.cursor/rules/` apply automatically. Prefer them over inventing new conventions.

## 1. Mission

Produce the smallest correct change that solves the request while preserving behavior, public APIs, project conventions, accessibility, and testability.

A successful change must be:

- compatible with versions in `package.json` (Angular / Material ^22);
- strongly typed and scoped to the request;
- consistent with nearby code unless a migration is requested;
- validated with the most relevant available checks.

## 2. Instruction priority

When instructions conflict:

1. The user's explicit request
2. This file
3. `.cursor/rules/*.mdc` and `docs/` feature guides
4. Existing local architecture and conventions
5. Official Angular / Material docs for the installed version
6. General stylistic preferences

Do not modernize working code merely because a newer API exists unless it is in scope and supported by the installed version.

## 3. Before editing

1. Read the task completely.
2. Confirm Angular, Material, RxJS, and test tooling versions from `package.json`.
3. Inspect `angular.json`, `tsconfig` path aliases (`@core`, `@shared`, `@features`), and bootstrap/config when relevant.
4. Read the full target file and related templates, styles, services, guards, and tests.
5. Use `docs/FILE_STRUCTURES.md` for placement; check `docs/` for the feature.
6. Prefer an existing pattern in the repo over a new one.
7. Identify root cause before patching symptoms (especially races, auth, lifecycle).

## 4. Version compatibility

Verify a feature is stable in the installed Angular version before using it (control flow, signal inputs/queries, `resource` / `httpResource`, Signal Forms, zoneless defaults, etc.). Use the best supported equivalent when unsupported. Do not upgrade dependencies unless asked.

## 5. Change discipline

**Must:** focused diffs; reuse shared components/services; keep loading/error/empty/success explicit; update tests when behavior changes; remove obsolete code from the change.

**Must not:** unrelated cleanup or reformatting; new libraries when Angular/the repo already covers it; broad signal/architecture migrations as a side effect of a bug fix; weaken types with `any` / unsafe casts; swallow errors; claim validation passed when it was not run; alter auth, routing, interceptors, or global styles without tracing consumers.

## 6. Preferences

Correctness → installed-version compatibility → preserve behavior → simplicity → strong typing → testability → evidence-based performance → modernization.

Fix leaks, races, unstable `@for` tracking, and duplicate work when they are part of the task. Do not chase speculative optimizations.

## 7. Uncertain data

Type external payloads as `unknown` at the boundary; narrow with small guards; preserve original errors for diagnostics; separate user-facing messages from logs. Never use `JSON.stringify(error).includes(...)` for control flow.

## 8. Validation

Use scripts from `package.json` (`build`, `test:unit`, `test:e2e`). Narrowest useful check first. If you cannot run validation, say what was skipped and why.

## 9. Tests

Assert observable behavior, not private implementation. Cover the bug/request, edge cases, and loading/error/cancel paths when applicable.

## 10. Security

Do not expose tokens or sensitive payloads; do not bypass Angular sanitization without a justified trust boundary; preserve auth checks; avoid logging full auth/HTTP objects.

## 11. Git safety

No reset/revert/force-push/discard of unrelated work. Do not touch lockfiles unless dependencies change. Keep patches reviewable.

## 12. Done when

Requested behavior works on the installed stack; related behavior intact; types sound; cleanup/cancellation correct; tests updated or justified; validation run where practical; no unrelated changes.

Report briefly: goal/root cause, files touched, behavior, validation result, remaining assumptions.
