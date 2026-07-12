# Session 5 Page Builder Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` where available; otherwise execute these tasks in order. Every behavior change follows a red-green-refactor cycle.

**Goal:** Build, verify, and publish the complete workshop baseline described in `docs/design.md`.

**Architecture:** NestJS owns HTTP, validation, persistence orchestration, static publishing, and static UI delivery. Prisma 7 talks to Docker PostgreSQL through the `pg` adapter. Browser state remains a typed block array and crosses the backend boundary only through validated DTOs.

**Tech Stack:** NestJS 11, Prisma 7, PostgreSQL 17, Jest 29, Playwright 1.61, TypeScript 5.9, vanilla browser JavaScript, Docker Compose.

## Global Constraints

- No Divider or attendee-catalogue feature in the baseline.
- No arbitrary executable HTML is accepted or stored.
- No runtime secret is committed.
- No GitHub Actions or automatic merge configuration.
- Test filters must be forwarded and unknown filters must fail.
- The public repository is created only after all local release checks pass.

---

### Task 1: Project and Tooling Skeleton

**Files:** `package.json`, lockfile, TypeScript/Nest/ESLint/Jest/Playwright configs, `.gitignore`, `.env.example`, `Dockerfile`, `compose.yaml`.

**Produces:** pinned install, deterministic static checks, six required scripts, PostgreSQL health check, production image target.

- [ ] Add configuration files and install pinned dependencies.
- [ ] Add one failing filter-contract test to each runner and confirm the runner is selected but implementation imports are missing.
- [ ] Add the minimum Nest bootstrap and test setup needed for those sentinels to pass.
- [ ] Confirm `npm run test:unit -- __session5_no_such_test__` exits nonzero; repeat for API and browser after those runners exist.

### Task 2: Configuration and Error Boundary

**Files:** `src/common/config/*`, `src/common/errors/*`, `src/main.ts`, focused unit tests.

**Produces:** `loadConfig()`, `ApiExceptionFilter`, global validation, Swagger bootstrap, JSON body limit, static asset delivery.

- [ ] Write failing unit tests for defaults, invalid numeric settings, and normalized 400/404/409 envelopes.
- [ ] Implement configuration parsing and the exception filter.
- [ ] Start a minimal Nest app and verify `/health` plus `/api/docs`.

### Task 3: Typed Blocks and Publisher

**Files:** `src/projects/types/*`, `src/projects/validation/*`, `src/publisher/*`, `test/unit/*`.

**Produces:** `validateBlocks(value, limit): Block[]`, `renderProject(project): string`, atomic `PublisherService.publish()`.

- [ ] Write failing cases for every valid block and invalid type/shape/limit/duplicate ID.
- [ ] Implement the smallest exhaustive block validator.
- [ ] Write failing publisher tests for HTML characters, attribute breakout, unsafe protocols, semantic order, title, and language.
- [ ] Implement escaping, known renderers, output containment, and atomic rename.

### Task 4: Prisma Project Persistence

**Files:** `prisma.config.ts`, `prisma/schema.prisma`, migration SQL, generated client, `src/database/*`, `src/projects/projects.repository.ts`.

**Produces:** empty-database migration, injectable Prisma client, repository CRUD and slug lookup.

- [ ] Start Docker PostgreSQL and write an API test that fails because the Project table does not exist.
- [ ] Add the schema and generate/apply the initial migration.
- [ ] Implement repository operations and database cleanup helpers.
- [ ] Prove the migration applies to a newly created empty test database.

### Task 5: Project API

**Files:** project DTOs/controller/service/module and `test/api/projects/*`.

**Produces:** create, load, replace, and publish routes with documented schemas and common errors.

- [ ] Write failing create/save/load, invalid metadata/block, slug conflict, and not-found API scenarios.
- [ ] Implement DTOs, service orchestration, repository calls, and OpenAPI decorators.
- [ ] Write failing publish, repeat-publish, and cross-project isolation scenarios.
- [ ] Connect the publisher and sites route, then run the full API suite twice.

### Task 6: Builder UI

**Files:** `public/index.html`, `public/styles.css`, `public/app.js`, `test/browser/*`.

**Produces:** responsive accessible builder with native palette controls, canvas, labeled inspector, click/drag insertion, pointer reorder, removal, save/load/publish, and visible feedback.

- [ ] Write failing Playwright tests for initial landmarks, control names, and keyboard reachability.
- [ ] Implement the application shell and responsive layout.
- [ ] Write failing tests for add/edit/remove and pointer reorder.
- [ ] Implement deterministic block state and drag/drop behavior.
- [ ] Write failing save/reload/publish tests and implement API integration.
- [ ] Capture desktop and mobile screenshots and inspect for overlap.

### Task 7: Workshop Contribution Contract

**Files:** `AGENTS.md`, `CONTRIBUTING.md`, `README.md`, `.github/pull_request_template.md`, `workshop/tasks.json`, `scripts/policy.mjs`, `scripts/check-task-scope.mjs`.

**Produces:** complete attendee workflow, exact 67 tasks, protected paths, and task-specific scope validation.

- [ ] Export the approved deck task catalogue and verify counts, IDs, titles, allowed paths, and 40 unique commands.
- [ ] Write policy tests that fail on generated output, secrets, dependencies, workflows, or paths outside a selected task.
- [ ] Implement policy and scope scripts and document browser-based GitHub fallbacks.

### Task 8: Trusted Local Review Harness

**Files:** `review/Dockerfile`, `review/run-trusted-checks.sh`, `scripts/review-pr.sh`, `scripts/agent-review-claude.sh`, `docs/LOCAL_REVIEW.md`.

**Produces:** exact-SHA disposable review, path gate, no-network container tests, evidence bundle, advisory agent verdict, no automatic merge.

- [ ] Add shell/static tests for missing SHA, path violations, and absent credentials/socket mounts.
- [ ] Build the trusted image with dependencies, Chromium, and loopback PostgreSQL.
- [ ] Run a clean-main review inside the hardened container.
- [ ] Generate and inspect `review-input.txt`; parse installed Claude/Codex flag compositions without invoking a model.

### Task 9: Release Verification and GitHub Publication

**Files:** release evidence under `docs/release/` and Git metadata.

**Produces:** public `GautamRoyCodeClouds/session-5-page-builder-workshop` repository at a verified commit.

- [ ] Run build, lint, policy, and all unfiltered test suites twice.
- [ ] Prove `filter-contract` selects one test and an unknown filter fails in each runner.
- [ ] Run Docker full-app smoke, API round trip, published-page check, and browser screenshots.
- [ ] Initialize Git and commit only source/config/docs; confirm no secret or generated output is tracked.
- [ ] Create the public repository, push `main`, set the description/topics, and disable force pushes/deletion without enabling automatic merge.
- [ ] Verify the remote SHA, visibility, default branch, clone URL, and repository settings.
