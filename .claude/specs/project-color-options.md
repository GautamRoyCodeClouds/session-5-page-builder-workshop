# Spec: Project Text and Button Color Options

Date: 2026-07-13
Status: Draft — not yet implemented

## Goal

Let a project author choose a text color and a button color for their project, so published pages and the in-builder preview no longer use the two hardcoded colors baked into `render-project.ts`.

## Scope

- **Project-level**, not per-block: one text color and one button color apply to the whole project, the same way `name` and `slug` do today. (A per-block color would touch every block type's `allowedKeys` gate in `validate-blocks.ts`; nothing in the request suggests that granularity, so it is out of scope. Flag if per-block is actually what's wanted.)
- Two new optional fields on `Project`: `textColor`, `buttonColor`. Both are hex strings (`#rrggbb`), nullable, default to `null` (meaning "use the current baseline colors").
- Applies to: the published static HTML (`render-project.ts`) and the builder's live block preview (`app.js`).

## Assumptions to confirm

1. **"Button color" = the button's background**, matching the existing `.button { background: #176b5b; color: #fff; }` rule. The label stays white for contrast rather than becoming independently colorable. If the label text should also be user-colorable, that's a third field, not covered here.
2. Color input is a native `<input type="color">` (hex only, browser-native swatch UI) — consistent with the repo's existing preference for native controls (`docs/implementation-plan.md` Task 6: "native palette controls") and avoids adding any picker dependency.
3. Existing projects (`textColor`/`buttonColor` both `null`) render identically to today — this is additive and backward compatible, no data migration/backfill needed.

## Data model

`prisma/schema.prisma`:

```prisma
model Project {
  id          String    @id @default(uuid()) @db.Uuid
  name        String    @db.VarChar(120)
  slug        String    @unique @db.VarChar(80)
  blocks      Json
  textColor   String?   @db.VarChar(7)
  buttonColor String?   @db.VarChar(7)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

New committed migration adds the two nullable columns (no default backfill required since existing rows stay `NULL`).

## Validation

New `src/common/validation/color.ts`, mirroring `src/common/validation/slug.ts`:

```ts
export const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}
```

`ProjectInputDto` (`src/projects/dto/project-input.dto.ts`) gets:

```ts
@ApiProperty({ example: "#1f2933", required: false, nullable: true })
@IsOptional()
@Matches(HEX_COLOR_PATTERN, { message: "textColor must be a #rrggbb hex color" })
textColor?: string;

@ApiProperty({ example: "#176b5b", required: false, nullable: true })
@IsOptional()
@Matches(HEX_COLOR_PATTERN, { message: "buttonColor must be a #rrggbb hex color" })
buttonColor?: string;
```

An invalid value (not `#rrggbb`) fails the global `ValidationPipe` and returns the existing normalized 400 envelope — no new error-handling code needed.

## API contract changes

`POST /api/projects`, `PUT /api/projects/:id`: request body accepts optional `textColor` / `buttonColor`.
`ProjectResponseDto`: adds `textColor: string | null`, `buttonColor: string | null`.

No route, method, or status code changes. `test/unit/openapi.spec.ts` uses `toMatchObject`, so new DTO properties won't break it.

## Backend plumbing

- `ProjectEntity` (`src/projects/project.entity.ts`) and `EditableProject` (currently `Pick<ProjectEntity, "name" | "slug" | "blocks">`) both extend to include `textColor: string | null` and `buttonColor: string | null`.
- `ProjectsRepository` (`src/projects/projects.repository.ts`): `ProjectRow`/`ProjectData` types, `toEntity()`, `create()`, and `update()` all pass `textColor`/`buttonColor` through (`?? null` on read).
- `ProjectsService.toEditableProject()`: pass `input.textColor ?? null` / `input.buttonColor ?? null` through unchanged otherwise.
- `ProjectDocument` (`src/publisher/project-document.ts`): add the same two nullable fields (currently only `id | name | slug | blocks`).
- `render-project.ts`: use `project.textColor ?? "#1f2933"` for `body { color: ... }` and `project.buttonColor ?? "#176b5b"` for `.button { background: ... }`, in place of the current hardcoded literals.

## Builder UI

`public/builder/index.html` — add two fields to the existing "Project" panel section (`#project-title`), after the slug field:

```html
<div class="field-stack">
  <label for="project-text-color">Text color</label>
  <input id="project-text-color" name="project-text-color" type="color" value="#1f2933">
</div>
<div class="field-stack">
  <label for="project-button-color">Button color</label>
  <input id="project-button-color" name="project-button-color" type="color" value="#176b5b">
</div>
```

`public/builder/app.js`:
- Add `elements.projectTextColor` / `elements.projectButtonColor` lookups.
- `projectPayload()`: include `textColor: elements.projectTextColor.value`, `buttonColor: elements.projectButtonColor.value`.
- `applyProject()`: set input values from `project.textColor ?? "#1f2933"` / `project.buttonColor ?? "#176b5b"`.
- `newProject()`: reset both inputs to the same two defaults.
- On `input` events for both color pickers, set two CSS custom properties on `#canvas` (e.g. `--project-text-color`, `--project-button-color`) so the live preview updates without re-rendering every block; call the same update once in `applyProject()`/`newProject()`.

`public/builder/styles.css`:
- Declare the two custom properties with today's colors as defaults on `.canvas`.
- Point the existing preview text elements and `.preview-link` background at `var(--project-text-color)` / `var(--project-button-color)` instead of hardcoded values (styles.css currently has no such per-block color rule to conflict with — confirm at implementation time).

## Test plan

- `test/unit/render-project.spec.ts`: published HTML uses custom `textColor`/`buttonColor` when set, and falls back to today's two literals when both are `null`.
- `test/unit/project-input.dto.spec.ts`: accepts `#1f2933`-style values; rejects non-hex, short, and non-string values with a 400-shaped validation error.
- `test/api/projects-api.spec.ts`: create/update round-trip persists and returns both fields; invalid hex returns 400; publishing a project with custom colors serves them in `/sites/:slug` HTML.
- `test/browser/baseline-flow.spec.ts` (or a new focused spec): setting both color pickers updates the live block preview; save + reload restores the chosen colors; a fresh "New project" resets to the baseline defaults.

## Out of scope (explicit non-goals)

- Per-block color overrides.
- Arbitrary CSS or non-hex color formats (named colors, `rgb()`, gradients).
- Independently coloring button label text vs. background.
- Any change to the four existing block types or `validate-blocks.ts`'s exact-key gate.

---

## Implementation plan (task breakdown)

Following this repo's `docs/implementation-plan.md` task format, for later execution.

### Task A: Data model and validation

**Files:** `prisma/schema.prisma`, new migration SQL, `src/common/validation/color.ts`, `test/unit/` (new validation test).

**Produces:** `textColor`/`buttonColor` nullable columns, `isValidHexColor()`/`HEX_COLOR_PATTERN`.

- [ ] Write a failing unit test for `isValidHexColor()` covering valid `#rrggbb`, missing `#`, short/long hex, and non-hex characters.
- [ ] Implement `src/common/validation/color.ts`.
- [ ] Add the two nullable columns to `prisma/schema.prisma` and generate/apply the migration against the running Docker Postgres.

### Task B: DTOs, entity, and repository plumbing

**Files:** `src/projects/dto/project-input.dto.ts`, `src/projects/dto/project-response.dto.ts`, `src/projects/project.entity.ts`, `src/projects/projects.repository.ts`, `src/projects/projects.service.ts`, `test/unit/project-input.dto.spec.ts`, `test/api/projects-api.spec.ts`.

**Produces:** end-to-end persistence of both fields through create/get/update.

- [ ] Write failing DTO validation tests (valid hex accepted, invalid hex rejected with 400).
- [ ] Write failing API tests: create/update round-trip returns and persists `textColor`/`buttonColor`; omitted fields persist as `null`.
- [ ] Add the DTO properties, extend `ProjectEntity`/`EditableProject`, and thread the fields through `ProjectsRepository` and `ProjectsService`.
- [ ] Confirm `test/unit/openapi.spec.ts` still passes unmodified.

### Task C: Publisher output

**Files:** `src/publisher/project-document.ts`, `src/publisher/render-project.ts`, `test/unit/render-project.spec.ts`, `test/api/projects-api.spec.ts` (publish assertions).

**Produces:** published HTML reflects the project's chosen colors, or today's defaults when unset.

- [ ] Write failing render tests for custom colors and for the `null`-fallback case.
- [ ] Extend `ProjectDocument` and update `renderProject()`'s inline `<style>` block.
- [ ] Write/extend a failing API test that publishes a project with custom colors and asserts the served `/sites/:slug` HTML contains them.

### Task D: Builder UI

**Files:** `public/builder/index.html`, `public/builder/app.js`, `public/builder/styles.css`, `test/browser/*`.

**Produces:** two labeled native color pickers in the Project panel, live preview updates, save/load/new-project round-trip.

- [ ] Write failing Playwright tests: pickers are labeled and reachable by keyboard/Tab; changing a picker updates the visible preview; save-then-reload restores chosen colors; "New project" resets to defaults.
- [ ] Add the two `<input type="color">` fields and CSS custom properties.
- [ ] Wire `projectPayload()`, `applyProject()`, and `newProject()` to read/write the new fields and update the preview's CSS custom properties on input.
- [ ] Run `npm run test:browser -- baseline` (or the new spec's filter) and capture desktop/mobile screenshots per the repo's screenshot-inspection convention.

### Task E: Full verification

- [ ] `npm run lint`
- [ ] `npm run policy`
- [ ] `npm run test:unit`
- [ ] `npm run test:api`
- [ ] `npm run test:browser`
