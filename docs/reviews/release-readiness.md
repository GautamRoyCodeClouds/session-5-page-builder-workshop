# Release Readiness Checklist — Workshop Baseline

This checklist covers the **prepared local workshop baseline** (this repository's
`main`, before any attendee forks it) — not an individual attendee pull request.
Use [docs/LOCAL_REVIEW.md](../LOCAL_REVIEW.md) to review a submitted PR instead.

Run this checklist once per session before sharing the repository link with
attendees, and again after any change to `main` that touches setup, schema, or
the verification commands.

## How to use this checklist

1. Work through every item in order, on a clean clone of the exact commit being
   released.
2. Record the evidence artifact for each item (command output, screenshot, or
   file path) so the result is reproducible by someone other than the person
   who ran it.
3. Mark each item `Pass` or `Fail`. A `Fail` on a **Blocking** item stops the
   release; a `Fail` on a **Nonblocking** item is logged under Known Issues and
   may ship with a documented workaround.
4. Complete the [Release Decision](#release-decision) section only after every
   Blocking item is `Pass`.

## Checklist

| # | Area | Item | Owner | Evidence artifact | Blocking | Result |
|---|------|------|-------|--------------------|----------|--------|
| 1 | Install | `npm ci` completes on Node ≥22 (per `package.json` `engines`) with no install-script failures | Maintainer | Terminal transcript of `npm ci` (exit code 0, package count) | Yes | |
| 2 | Configuration names | `.env.example` lists exactly the variables the app reads (`DATABASE_URL`, `DIRECT_URL`, `PORT`, `PUBLISH_DIR`, `SITE_LANGUAGE`) with placeholder, non-secret values | Maintainer | Diff of `.env.example` against `AppConfigService` reads; `npm run policy` secret-pattern scan output | Yes | |
| 3 | Migration | `npm run prisma:deploy` applies the committed migration history (`prisma/migrations/20260712000000_initial`) cleanly to a fresh, empty database | Maintainer | Command output: `All migrations have been successfully applied.` | Yes | |
| 4 | Build | `npm run build` (runs `prisma generate` via `prebuild`, then `nest build`) completes with zero TypeScript errors | Maintainer | Command exit code 0; `dist/main.js` present | Yes | |
| 5 | Tests | `npm run test:unit`, `npm run test:api`, and `npm run test:browser` all pass on a freshly migrated database | Maintainer | Three command output summaries (suite/test counts, 0 failures) | Yes | |
| 6 | Browser flow | The real dev server (not the Playwright mock fixture) supports create → add blocks → save → reload → publish → view published page, driven manually or via a browser tool | Maintainer | Screenshot sequence or trace of the flow against `npm run start:dev`; matches steps in [README.md](../../README.md#start-locally) | Yes | |
| 7 | Publish output | Published HTML at `/sites/{slug}` is well-formed, HTML-escapes user content, and does not leak another project's blocks | Maintainer | `curl` output of a published page showing escaped text; confirmation a second project's content is absent, matching `test/api/projects-api.spec.ts` | Yes | |
| 8 | Rollback | A rehearsed path exists to revert the baseline and local data if a defect is found after attendees have forked | Maintainer | See [Rollback Plan](#rollback-plan) below; confirmation the prior release tag/commit still resolves | Yes | |
| 9 | Repository policy & lint | `npm run policy` (catalogue integrity + forbidden-path + secret scan) and `npm run lint` both pass | Maintainer | Command output: `POLICY PASS: ...`; zero ESLint warnings | Yes | |
| 10 | Trusted PR review harness | The Docker image in [docs/LOCAL_REVIEW.md](../LOCAL_REVIEW.md) is built and labeled for the release commit | Maintainer | `docker build` output showing the trusted-SHA label matching item 8's commit | No — required before merging the *first* attendee PR, not before the session starts | |
| 11 | Documentation cross-links | Links between `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, and `docs/*` resolve to files that exist | Maintainer | Manual link check or `grep` for referenced filenames | No — cosmetic; log as a known issue if broken | |

## Rollback Plan

If a defect is discovered after the baseline has been shared:

1. **Identify the last known-good commit.** Tag or record the commit SHA used
   for item 8 above before making further changes to `main`.
2. **Revert `main`.** Use `git revert` (preferred, preserves history) or reset
   the branch to the last known-good SHA if no attendee has forked yet.
3. **Database state.** The workshop database is disposable per attendee
   (`docker compose up -d --wait postgres` creates a fresh local instance); no
   shared production data exists to roll back. If the migration itself is
   defective, do not author a destructive down-migration — instead fix forward
   with a new migration, since `prisma migrate deploy` only applies forward.
4. **Communicate.** Post the reverted commit SHA and a one-line reason to
   attendees before the session resumes, and update
   [workshop/TASKS.md](../../workshop/TASKS.md) if any task's `allowedFiles` or
   `verify` commands were affected.
5. **Re-verify.** Re-run this entire checklist against the reverted commit
   before resuming.

## Release Decision

- **Decision:** _Go / No-Go — fill in after all Blocking items are `Pass`_
- **Timestamp:** _fill in at sign-off (UTC)_
- **Known issues:**
  - Several task cards in `workshop/tasks.json` list `allowedFiles` globs that
    don't match this repository's actual test directory layout (e.g. `BE-01`
    lists `test/projects/**`, `UI-02` lists `test/publisher/**`, `OP-07` lists
    `test/sites/**`, but real tests live under `test/unit/`, `test/api/`, and
    `test/browser/`). Verified by running
    `node scripts/check-task-scope.mjs <TASK_ID> <base> <head>` against
    completed implementations of BE-01, UI-02, and OP-07: all three fail the
    trusted scope gate on their test files alone, despite passing every
    listed `npm run test:*` verify command. This does not block the session
    (attendees can still complete tasks and their functional tests pass), but
    it will cause the trusted review harness in `docs/LOCAL_REVIEW.md` to
    reject otherwise-correct PRs on a scope technicality. Recommend
    correcting the affected task cards' `allowedFiles` in `workshop/tasks.json`
    before the next session, or documenting the exception in
    `docs/LOCAL_REVIEW.md` for presenters running the harness.
- **Fallback reference:** [Rollback Plan](#rollback-plan) above; trusted review
  harness setup in [docs/LOCAL_REVIEW.md](../LOCAL_REVIEW.md).
