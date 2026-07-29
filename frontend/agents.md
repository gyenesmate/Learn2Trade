# Repository AI Agent Instructions

These instructions apply to every AI agent working in this repository.

For Angular, TypeScript, RxJS, Angular Material, templates, styles, routing, forms, or frontend architecture tasks, also read and follow [`angular_expert.md`](./angular_expert.md).

## 1. Mission

Produce the smallest correct change that solves the requested problem while preserving existing behavior, public APIs, project conventions, accessibility, and testability.

A successful change must be:

- compatible with the Angular version installed in this repository;
- understandable without hidden assumptions;
- strongly typed;
- limited to the requested scope;
- consistent with nearby code unless a migration is explicitly requested;
- validated with the most relevant available checks.

## 2. Instruction priority

When instructions conflict, use this order:

1. The user's explicit request.
2. Repository-specific instructions in this file.
3. Domain instructions in `angular_expert.md`.
4. Existing local architecture and conventions.
5. Official framework documentation.
6. General preferences or stylistic improvements.

Never replace a working project convention merely because a newer alternative exists. Modernize only when the installed framework supports it and the change is in scope.

## 3. Required investigation before editing

Before changing code:

1. Read the task completely.
2. Inspect `package.json` and determine the installed Angular, TypeScript, RxJS, Angular Material, and testing versions.
3. Inspect `angular.json`, relevant `tsconfig` files, lint configuration, and the application bootstrap/configuration when they affect the task.
4. Read the complete target file, not only the referenced method.
5. Trace related templates, styles, services, models, routes, tests, interceptors, and call sites.
6. Search for an existing implementation of the same pattern elsewhere in the repository.
7. Identify the actual cause before editing. Do not patch only the visible symptom.
8. Establish the expected behavior and invariants that must remain unchanged.

For race conditions or lifecycle problems, explicitly identify:

- the producers of each value;
- when each value becomes available;
- what triggers rendering or side effects;
- whether requests can overlap or complete out of order;
- what cleanup occurs when the component, route, dialog, or selection changes.

## 4. Version compatibility gate

Do not assume the repository uses the newest Angular release.

Before using a framework feature, verify that it exists and is stable in the installed version. In particular, check compatibility before introducing:

- built-in control flow such as `@if`, `@for`, and `@switch`;
- signal inputs, outputs, models, and queries;
- `linkedSignal`, `resource`, `httpResource`, or asynchronous reactivity APIs;
- Signal Forms;
- zoneless-specific behavior;
- Angular version-specific decorator defaults;
- the Angular v22 `@Service` decorator.

When a newer approach is unsupported, use the best supported equivalent. Do not upgrade dependencies unless the task explicitly requests an upgrade.

## 5. Change discipline

### Must

- Make focused changes with a clear relationship to the task.
- Preserve existing public interfaces unless changing them is necessary and requested.
- Reuse project abstractions when they are appropriate.
- Keep error, loading, empty, and success states explicit.
- Update affected tests when behavior changes.
- Remove imports, branches, and helpers made obsolete by the change.
- Explain any assumption that could not be verified from the repository.

### Must not

- Perform unrelated cleanup.
- Reformat entire files for a small change.
- introduce a new library when Angular or the repository already provides the needed capability;
- convert an entire feature to signals, standalone APIs, Signal Forms, or another architecture as a side effect of a bug fix;
- alter global interceptors, providers, shared styles, authentication, routing, or error handling without tracing all consumers;
- weaken types with `any`, unsafe casts, or non-null assertions to silence errors;
- use stringification or keyword searches as the primary way to understand typed error objects;
- hide failures with empty `catch` blocks, swallowed Observable errors, or broad fallback behavior;
- claim commands passed when they were not executed.

## 6. Decision-making rules

Prefer, in order:

1. Correctness.
2. Compatibility with the installed project.
3. Preservation of existing behavior.
4. Simplicity and readability.
5. Strong typing.
6. Testability.
7. Performance supported by evidence.
8. Modernization.

Do not optimize speculative bottlenecks. Do fix obvious repeated work, duplicate subscriptions, leaking listeners, unstable list tracking, and request races when they are directly related to the task.

## 7. Working with uncertain data

When an external value has an uncertain runtime shape:

- type it as `unknown` at the boundary;
- narrow it with small reusable type guards or normalization functions;
- support only shapes justified by API contracts or existing repository evidence;
- preserve the original error for diagnostics;
- separate user-facing messages from technical logging;
- avoid recursively traversing arbitrary objects unless the API genuinely returns nested heterogeneous error structures and recursion is bounded against cycles.

Never use `JSON.stringify(error).includes(...)` as normal application control flow. It is fragile, loses semantic structure, can fail on circular values, and creates false matches.

## 8. Validation

Run the narrowest meaningful checks first, then broader checks when practical.

Typical order:

1. Relevant unit tests.
2. Type checking or Angular build.
3. Linting for changed files or project.
4. Broader test suite when the change affects shared infrastructure.

Use repository scripts from `package.json`. Do not invent command names.

If validation cannot run, state exactly what was not run and why. Still inspect the changed code for:

- TypeScript errors;
- missing imports;
- template type errors;
- incorrect signal invocation;
- subscription cleanup;
- unreachable branches;
- accessibility regressions;
- accidental API changes.

## 9. Tests

Tests should verify observable behavior, not private implementation details.

Add or update tests for:

- the reported bug or requested behavior;
- relevant edge cases;
- loading, error, empty, and cancellation behavior when applicable;
- input/output interactions;
- route, dialog, or service integration boundaries affected by the change.

A regression test should fail before the fix and pass after it whenever practical.

## 10. Security and privacy

- Never expose tokens, secrets, personal data, or raw sensitive backend payloads.
- Do not bypass Angular sanitization with `bypassSecurityTrust...` unless the trust boundary is explicitly justified.
- Do not use `innerHTML` for ordinary rendering.
- Validate and encode data at the correct boundary.
- Preserve authorization checks and server-side enforcement; client-side visibility is not security.
- Avoid logging full authentication, user, or HTTP objects in production code.

## 11. Git and repository safety

- Do not reset, revert, force-push, delete branches, or discard unrelated changes.
- Do not modify generated files unless the project expects them to be committed.
- Do not edit lockfiles unless dependencies actually change.
- Keep patches reviewable.
- Mention any pre-existing issue that blocks validation, but do not silently fix unrelated failures.

## 12. Completion report

When finishing a task, report:

- the root cause or implementation goal;
- the files changed;
- the behavior now implemented;
- the validation performed and its result;
- any remaining limitation or assumption.

Do not provide a long walkthrough unless requested. Do not say a task is complete when a required part is still missing.

## 13. Definition of done

A task is done only when:

- the requested behavior is implemented;
- the implementation is compatible with the repository's actual versions;
- related behavior remains intact;
- types are sound;
- cleanup and cancellation are correct;
- relevant tests are updated or a reason is given;
- validation is run where available;
- no unrelated changes are included.
