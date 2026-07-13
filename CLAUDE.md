# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm ci                        # install pinned dependencies
cp .env.example .env          # first-time env setup
docker compose up -d --wait postgres
npm run prisma:deploy         # apply migrations to the running DB
npm run start:dev             # watch mode (NestJS + hot reload)

# Verification
npm run build                 # tsc via nest build (also runs prisma generate)
npm run lint                  # ESLint, zero warnings allowed
npm run policy                # custom policy checks (generated output, secrets, dependency changes)
npm run test:unit             # Jest unit suite (no DB needed)
npm run test:api              # Jest API suite (requires Docker Postgres)
npm run test:browser          # Playwright suite (requires running app)

# Filtered runs — pass a substring after --
npm run test:unit -- publisher         # runs tests matching "publisher"
npm run test:api  -- projects          # runs tests matching "projects"
npm run test:browser -- baseline-flow  # runs tests matching "baseline-flow"
# An unknown filter that matches zero tests exits nonzero — this is intentional and tested.
```

## Workshop task scope

This repo is a workshop baseline (see `README.md`): attendees pick one task from `workshop/tasks.json` / `workshop/TASKS.md` and submit a focused PR. When working on a selected task:

- Edit only the paths listed in that task's `allowedFiles` in `workshop/tasks.json`. `scripts/check-task-scope.mjs <task-id>` enforces this against the diff and is run in CI/review.
- Do not add or update dependencies, lockfiles, GitHub workflows, Docker files, `AGENTS.md`, or `review/` infra.
- Do not refactor unrelated code or change public contracts beyond what the task requires.
- One task per branch/PR; run the exact commands listed on the task card as evidence.

## Architecture

**Module graph** (import direction):

```
AppModule
  ├── ConfigModule (global — provides AppConfigService everywhere)
  ├── DatabaseModule  → ConfigModule     (provides + exports PrismaService)
  ├── PublisherModule → ConfigModule     (provides + exports PublisherService)
  ├── HealthModule
  ├── ProjectsModule  → DatabaseModule, PublisherModule  (exports ProjectsRepository)
  └── SitesModule     → ConfigModule, ProjectsModule
```

**Request flow for publish:**
`POST /api/projects/:id/publish` → `ProjectsService.publish()` → `ProjectsRepository.findById()` → `PublisherService.publish()` (writes `PUBLISH_DIR/{id}.html` atomically) → `ProjectsRepository.markPublished()`.

**Key invariants to preserve:**

1. **`validateBlocks()` is called twice** — in `ProjectsService.toEditableProject()` on input, and in `ProjectsRepository.toEntity()` on every row read from the database. Do not remove either call.

2. **`publishedAt` resets to `null` on PUT** — `ProjectsRepository.update()` explicitly sets `publishedAt: null`. This means `GET /sites/:slug` returns 404 after any edit until the project is republished. `SitesService` checks `project.publishedAt !== null` before serving.

3. **The 20-block limit is browser-only** — `public/app.js` enforces it; the API does not. This is an intentional attendee task (`OP-03`). Do not add the limit to `validate-blocks.ts` unless working on that task.

4. **`ProjectsRepository` manually types the Prisma client** — Prisma 7's generated client uses `@ts-nocheck`, so `projects.repository.ts` defines its own `ProjectRow / ProjectData / ProjectDelegate` types and casts the client exactly once via `this.prisma as unknown as { project: ProjectDelegate }`. Keep all Prisma interaction inside this file.

5. **Slug conflict uses double-checked locking** — `ProjectsService` does a `findBySlug` pre-check, then catches Prisma error code `P2002` on the actual write. Both paths throw the same `SLUG_CONFLICT` ApiException.

6. **`ApiExceptionFilter` overrides content-type** — `SitesController` sets `text/html` at the route level, so the global filter must explicitly reset it to `application/json` before writing error JSON. Do not remove this `setHeader` call.

7. **Publishing is atomic and path-contained** — `PublisherService` validates the project ID against the UUID v4 pattern and asserts the resolved output path's `dirname` equals `PUBLISH_DIR` before any I/O. It writes to a temp file (`.{id}.{uuid}.tmp`) and renames. The same ID validation runs in `SitesService` on the value read from the database.

## Error contract

All errors normalize to `{ statusCode, code, message, details? }` via `normalizeException()` in `src/common/errors/api-exception.ts`. Application errors use `ApiException`; framework validation errors and NestJS HTTP exceptions are also normalized by `ApiExceptionFilter`. When adding a new error condition, use `ApiException` with a specific `code` string rather than a bare NestJS exception.

## Block types

The block union is the central domain type (`src/projects/types/blocks.ts`). It drives: the DTO class hierarchy, `validateBlocks()`, `renderProject()`, and the browser builder. Any new block type requires changes in all four places. `validateBlocks()` uses an `allowedKeys` map to enforce exact-key matching per type — extra fields are rejected.

## Test structure

- `test/unit/` — no DB, no HTTP, pure logic. Mock `PrismaService` where needed.
- `test/api/` — full NestJS app + real Postgres. Each test cleans `prisma.project.deleteMany()` and `rm(config.publishDir)` in `beforeEach`. Single worker, 30 s timeout.
- `test/browser/` — Playwright against the running app; API routes mocked via `installBaselineRoutes(context)` fixture.
- Each suite has a `filter-contract.spec.ts` sentinel that must remain to verify filter forwarding.
