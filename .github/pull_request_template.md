## Task

Task ID: N/A — maintainer fix (workshop review-tooling gap found during a full six-area code review), not an attendee task from `workshop/TASKS.md`.

Outcome: Fixed a broken local PR-review harness (the credential-redaction sanitizer it claimed to run never existed) and two small app-correctness bugs surfaced by the same review pass.

## What changed

- `review/sanitize-evidence.mjs` (new): dependency-free credential-redaction tool with `sanitize <file>` and `report <file>` subcommands. Redacts private-key blocks, OpenAI/AWS/GitHub/Slack tokens, JWTs, bearer tokens, credentialed URLs, and generic `*_SECRET`/`*_TOKEN`/`*_KEY` assignments.
- `scripts/review-pr.sh`: `sanitize_file()` now pipes evidence through the new sanitizer before its existing control-character escaping; added `review/sanitize-evidence.mjs` to the `trusted_files` integrity list.
- `scripts/agent-review-claude.sh`: runs the sanitizer's `report` mode on the evidence file before invoking Claude and refuses (`credential_redactions_detected: yes`, nonzero exit) if anything credential-shaped remains.
- `src/common/config/app-config.service.ts`: `AppConfigService.port` now guards a malformed `PORT` value (non-numeric, negative, out-of-range) and falls back to `3000` instead of returning `NaN` and crashing `app.listen()`.
- `src/projects/dto/project-input.dto.ts`: `slug` is now trimmed via the existing `@Transform(trimString)` before validation, matching `name`'s existing behavior.
- `public/builder/app.js`: `insertionIndex()` now falls back to appending (`state.blocks.length`) instead of inserting at position 0 when a drop target's block id isn't found in `state.blocks`, matching `reorderBlock()`'s existing fallback.
- `test/browser/baseline-flow-fixture.ts`: mock `escapeHtml` now also escapes `'` → `&#39;`, matching `src/publisher/render-project.ts`'s 5-character escaping contract; added a comment noting the two must stay in sync.

## Acceptance evidence

- Criterion: `review/test-harness-static.sh` (the harness's own self-test) must pass.
  Evidence: previously failed immediately with `FAIL: missing evidence sanitizer`; now passes with `PASS: review harness static contract`.
- Criterion: `scripts/agent-review-claude.sh` must refuse evidence containing credential-shaped values, per the claim documented in `docs/LOCAL_REVIEW.md`.
  Evidence: replicated the harness's `OPENAI_API_KEY=sk-proj-...` fixture — `sanitize` redacts the key and `report` returns `"redactionsDetected": true`; a diff containing a Postgres credentialed URL plus an AWS key is correctly flagged (`credential_redactions_detected: yes`), and a clean diff proceeds.
- Criterion: `AppConfigService.port` must not crash on a malformed `PORT` env value.
  Evidence: falls back to `3000` for missing/non-integer/out-of-range input instead of returning `NaN`.
- Criterion: `insertionIndex()` must append, not insert-at-start, when a drop target is stale/unmatched.
  Evidence: now matches `reorderBlock()`'s existing append fallback.

## Verification

```text
bash review/test-harness-static.sh -> PASS: review harness static contract
bash -n scripts/review-pr.sh -> no syntax errors
bash -n scripts/agent-review-claude.sh -> no syntax errors
node scripts/policy.mjs -> POLICY PASS: 67 tasks, 40 commands, 93 repository files checked
npm run test:unit -> 34/34 passing
npm run build -> clean (tsc via nest build)
npm run lint -> clean (eslint . --max-warnings=0)
```

## Residual risk

None observed for the app-level fixes. Two pre-existing, out-of-scope items were noted during review but intentionally left unchanged: the Dockerfile is single-stage (`devDependencies` remain in the final image), and `docker/postgres/init.sql`'s `session5_test` database is only used by the API test suite, not by the app itself.

## Safety

- [x] Only task-permitted files changed — `review/sanitize-evidence.mjs` (new), `scripts/agent-review-claude.sh`, `scripts/review-pr.sh`, `src/common/config/app-config.service.ts`, `src/projects/dto/project-input.dto.ts`, `test/browser/baseline-flow-fixture.ts`, `public/builder/app.js`
- [ ] No dependency, lockfile, workflow, Docker, or review-infrastructure changes — **does not hold**: this PR intentionally touches review infrastructure (`scripts/review-pr.sh`, `scripts/agent-review-claude.sh`, new `review/sanitize-evidence.mjs`) to fix the broken sanitizer. This is maintainer-only scope, outside the normal attendee restriction in `CONTRIBUTING.md`.
- [x] No secret values or generated artifacts
- [x] The complete diff was reviewed before submission
