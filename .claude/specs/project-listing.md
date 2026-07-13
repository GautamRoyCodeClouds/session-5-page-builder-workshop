# Spec: Project Listing (Browse All Projects)

Date: 2026-07-13
Status: Draft — not yet implemented

## Goal

Add a button in the builder UI that opens a list of every project stored in the database, so a user can browse and reopen any existing project instead of only reloading the single project remembered in local storage (today's "Load project" button).

## Scope

- New read-only endpoint: `GET /api/projects` → an array of lightweight project summaries (`id`, `name`, `slug`, `publishedAt`, `updatedAt`), ordered newest-updated-first.
- New "All projects" button in the builder topbar that opens a native `<dialog>` listing every project with its name, slug, Published/Draft status, and last-updated time. Selecting an entry loads that project into the builder via the existing `GET /api/projects/:id` + `applyProject()` path.
- No pagination — the endpoint returns every project. (Flagged below since this occupies the same route as workshop task `BE-03`.)

## Assumptions to confirm

1. **No pagination/limit.** The request is "show all the projects" — fine for a workshop-scale dataset. If `BE-03` ("bounded pagination") is implemented for real on this repo later, it will need to reconcile with this same `GET /api/projects` route rather than adding a duplicate one. Flagging the collision now rather than building something that would need rework.
2. **Ordering: `updatedAt` descending** (most recently touched project first), not `createdAt` — more useful for "continue where I left off." Flag if creation order is actually wanted instead.
3. **List payload omits `blocks`, `textColor`, `buttonColor`.** Those are only needed once a specific project is opened (existing `GET /api/projects/:id`), so the list stays light. Flag if the picker should preview colors too.
4. **Selecting a project replaces the current in-memory project**, the same way the existing "Load project" button behaves today — no unsaved-changes warning, since this baseline has no dirty-state tracking yet.

## API contract

`GET /api/projects` → `200 OK`, body: `ProjectSummaryDto[]`

```ts
class ProjectSummaryDto {
  id: string;
  name: string;
  slug: string;
  publishedAt: string | null;
  updatedAt: string;
}
```

No new error codes. An empty database returns `[]`, not a 404.

## Backend plumbing

- `src/projects/dto/project-summary.dto.ts` (new) — `ProjectSummaryDto`, mirroring `ProjectResponseDto`'s `@ApiProperty` style.
- `src/projects/projects.repository.ts`:
  - New `ProjectSummaryRow` type (`id`, `name`, `slug`, `publishedAt`, `updatedAt`).
  - Extend `ProjectDelegate` with `findMany(args: { select: {...}; orderBy: { updatedAt: "desc" } }): Promise<ProjectSummaryRow[]>`.
  - New `findAll(): Promise<ProjectSummaryRow[]>`, calling `this.projects.findMany(...)` with an explicit `select` so `blocks` never leaves the database for this query.
- `src/projects/projects.service.ts`: new `list(): Promise<ProjectSummaryRow[]>`, a thin passthrough to `repository.findAll()` — no business logic needed.
- `src/projects/projects.controller.ts`: new `@Get()` handler (`GET /api/projects`) calling `this.projects.list()`, documented with `@ApiOkResponse({ type: [ProjectSummaryDto] })`.

## Builder UI

`public/builder/index.html`:
- Add `<button id="browse-projects" class="button button-secondary" type="button">All projects</button>` to the topbar `<nav class="actions">`, after "Load project".
- Add a `<dialog id="project-list-dialog">` (native dialog, consistent with this repo's existing preference for native controls over custom widgets) containing a status line, a `<ul id="project-list">`, and a "Close" button.

`public/builder/app.js`:
- `elements` additions: `browseProjects`, `projectListDialog`, `projectList`, `projectListStatus`, `closeProjectList`.
- `renderProjectList(items)`: clears and repopulates `#project-list` with one `<li>` per project (name, slug, Published/Draft badge derived from `publishedAt`, formatted `updatedAt`), each with an "Open" button.
- `openProjectList()`: sets status to "Loading projects…", calls `requestJson("/api/projects")`, renders the list (or an empty-state message), then opens the dialog with `.showModal()`. On failure, the error is shown inside the dialog rather than closing it.
- Selecting "Open": `requestJson(\`/api/projects/${id}\`)` → `applyProject(project)` → close the dialog → `setStatus("Project loaded.")`.
- Wire `elements.browseProjects` click → `openProjectList()`; `elements.closeProjectList` click → `elements.projectListDialog.close()`.

`public/builder/styles.css`: dialog/list/badge styling, matching the existing `.button-secondary` / `.panel-section` visual language.

## Test plan

- `test/unit/openapi.spec.ts`: `GET /api/projects` documents a `200` response with an array of `ProjectSummaryDto`.
- `test/api/projects-api.spec.ts`: empty database returns `[]`; returns every created project; items are ordered `updatedAt` descending; list items omit `blocks`.
- `test/browser/baseline-flow-fixture.ts`: add a `GET /api/projects` mock route returning all in-memory projects as summaries.
- `test/browser/baseline-flow.spec.ts` (or a new focused spec): "All projects" opens the dialog and lists the saved project; selecting an entry loads it into the builder; the empty state renders when no projects exist yet.

## Out of scope (explicit non-goals)

- Pagination, filtering, or search (that's workshop task `BE-03`, flagged as a future collision above).
- Deleting or renaming projects from the list view.
- Warning about unsaved changes before switching projects.
- Any change to the four existing block types or `validate-blocks.ts`.

---

## Implementation plan (task breakdown)

Following this repo's `docs/implementation-plan.md` task format, for later execution.

### Task A: Backend list endpoint

**Files:** `src/projects/dto/project-summary.dto.ts` (new), `src/projects/projects.repository.ts`, `src/projects/projects.service.ts`, `src/projects/projects.controller.ts`, `test/api/projects-api.spec.ts`, `test/unit/openapi.spec.ts`.

**Produces:** `GET /api/projects` returning ordered, lightweight project summaries.

- [ ] Write failing API tests: empty list, multiple projects ordered by `updatedAt` desc, summaries omit `blocks`.
- [ ] Write a failing OpenAPI test asserting the new route and schema.
- [ ] Add `ProjectSummaryDto`, extend the repository's `ProjectDelegate`/`findAll()`, add `ProjectsService.list()`, and the controller route.

### Task B: Builder UI

**Files:** `public/builder/index.html`, `public/builder/app.js`, `public/builder/styles.css`, `test/browser/baseline-flow-fixture.ts`, `test/browser/*`.

**Produces:** "All projects" button that opens a dialog listing every saved project; selecting one loads it into the builder.

- [ ] Add the `GET /api/projects` mock route to the browser-test fixture.
- [ ] Write failing Playwright assertions: opening the dialog lists the saved project; selecting it loads the project into the builder; an empty-state message shows when no projects are saved.
- [ ] Add the button, dialog markup, and styles.
- [ ] Wire `openProjectList()`, `renderProjectList()`, and the "Open" action in `app.js`.

### Task C: Full verification

- [ ] `npm run lint`
- [ ] `npm run policy`
- [ ] `npm run test:unit`
- [ ] `npm run test:api`
- [ ] `npm run test:browser`
