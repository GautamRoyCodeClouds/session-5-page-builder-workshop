# Plan: Project Listing (Browse All Projects)

## Context

The user wants a button in the page-builder UI (`ashiscc-session-5-page-builder-workshop/`) that shows every project stored in the database, so they can browse and reopen any saved project. Today the builder only supports reopening the *single* project remembered in local storage/URL (`state.projectId`, the "Load project" button) — there is no route or UI that lists more than one project at a time.

The user explicitly asked for a **spec file + plan only, no implementation** this turn. A full spec has been written to `ashiscc-session-5-page-builder-workshop/.claude/specs/project-listing.md`, following this repo's existing documentation conventions (`docs/design.md` for the feature description, `docs/implementation-plan.md`'s `### Task N` / **Files** / **Produces** / checklist format for the execution breakdown) and mirroring the structure of the prior `project-color-options` spec/plan pair. This plan file is a condensed pointer for approval; the spec is the document of record.

## Recommended approach

- **Backend:** add `GET /api/projects`, returning a plain array of lightweight `ProjectSummaryDto` (`id`, `name`, `slug`, `publishedAt`, `updatedAt`) ordered `updatedAt` descending. No `blocks`/colors in the payload — those stay on the existing `GET /api/projects/:id`. No pagination, matching "show all the projects" as asked.
- **Backend plumbing:** thread it through the existing layered pattern — `ProjectsController` (`@Get()`) → `ProjectsService.list()` → `ProjectsRepository.findAll()` (a new `findMany` with an explicit `select`, keeping the manually-typed-Prisma-client convention this repo already follows in `projects.repository.ts`).
- **Builder UI:** add an "All projects" button to the topbar, opening a native `<dialog>` (matching this repo's established preference for native controls) that lists every project with its name, slug, Published/Draft badge, and last-updated time. Selecting an entry reuses the existing `GET /api/projects/:id` → `applyProject()` path, exactly like the current "Load project" flow.
- **Flagged risk:** this claims the `GET /api/projects` route ahead of workshop task `BE-03` ("bounded pagination" on the same route). If `BE-03` is done for real later, it will need to extend this implementation rather than add a duplicate route — called out explicitly in the spec's assumptions so it isn't a silent collision later.

## Critical files (see spec for full detail)

- `src/projects/dto/project-summary.dto.ts` (new) — lightweight list-item DTO.
- `src/projects/projects.repository.ts` — new `ProjectSummaryRow` type, extended `ProjectDelegate.findMany`, new `findAll()`.
- `src/projects/projects.service.ts`, `src/projects/projects.controller.ts` — `list()` passthrough and the new `GET` route.
- `public/builder/index.html`, `app.js`, `styles.css` — "All projects" button, list dialog, and its wiring into the existing load path.
- Tests: extend `test/api/projects-api.spec.ts`, `test/unit/openapi.spec.ts`, `test/browser/baseline-flow-fixture.ts`, `test/browser/baseline-flow.spec.ts` (all existing files; no new suites required).

The full task-by-task breakdown (Task A–C, each with **Files**/**Produces**/checklist) is written out in `ashiscc-session-5-page-builder-workshop/.claude/specs/project-listing.md`.

## Verification (once implemented — not part of this turn)

- `npm run lint`, `npm run policy`
- `npm run test:unit` — OpenAPI doc covers the new route/schema
- `npm run test:api` — empty list, multi-project ordering, `blocks` omitted from summaries
- `npm run test:browser` — dialog opens and lists saved projects, selecting one loads it, empty state with none saved

## Explicit non-goals

Pagination/filtering/search (`BE-03`'s territory), deleting or renaming projects from the list view, and any unsaved-changes warning before switching projects (this baseline has no dirty-state tracking yet).
