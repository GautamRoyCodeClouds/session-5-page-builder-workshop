# Plan: Project Text and Button Color Options

## Context

The user wants project authors to be able to choose a text color and a button color for their project (the NestJS + Prisma "page builder" workshop app at `ashiscc-session-5-page-builder-workshop/`). Today those colors are two hardcoded literals in `src/publisher/render-project.ts` (`body { color: #1f2933 }`, `.button { background: #176b5b; color: #fff }`) — there is no field on `Project`, no UI control, and no color feature anywhere else in the codebase to reuse.

The user explicitly asked for a **spec file + plan only, no implementation**. A spec has already been written to `ashiscc-session-5-page-builder-workshop/.claude/specs/project-color-options.md`, following this repo's existing doc conventions (`docs/design.md` for the feature description, `docs/implementation-plan.md`'s `### Task N` / **Files** / **Produces** / checklist format for the execution plan). This plan file is a condensed pointer to that spec for approval; the spec is the document of record.

## Recommended approach

Treat this as a **project-level** setting (one text color + one button color per project), not a per-block color, mirroring how `name`/`slug` already work:

- Add two new nullable columns to `Project`: `textColor`, `buttonColor` (hex `#rrggbb`, default `null` = "use today's baseline colors"). Fully backward compatible — existing projects render unchanged.
- Validate with a new `isValidHexColor()` / `HEX_COLOR_PATTERN` in `src/common/validation/color.ts`, mirroring the existing `src/common/validation/slug.ts` pattern.
- Thread the two fields through the existing request/response path: `ProjectInputDto` → `ProjectsService.toEditableProject()` → `ProjectsRepository` → `ProjectEntity`/`EditableProject` → `ProjectResponseDto`. No new routes, no new error types — invalid hex values fail today's global `ValidationPipe` and get the existing normalized 400 envelope.
- `render-project.ts`: replace the two hardcoded literals with `project.textColor ?? "#1f2933"` / `project.buttonColor ?? "#176b5b"`.
- Builder UI (`public/builder/index.html` / `app.js` / `styles.css`): add two native `<input type="color">` fields to the existing "Project" inspector panel (next to name/slug), matching the repo's stated preference for native controls over a custom picker dependency. Wire them into the existing `projectPayload()` / `applyProject()` / `newProject()` functions, and drive the live block preview via two new CSS custom properties on `#canvas`.
- "Button color" = the button's background (label text stays white), matching current behavior — flagged as an assumption in the spec since the request didn't specify further.

## Critical files (see spec for full detail)

- `prisma/schema.prisma` + new migration — add `textColor`/`buttonColor` columns.
- `src/common/validation/color.ts` (new) — hex validator, modeled on `src/common/validation/slug.ts`.
- `src/projects/dto/project-input.dto.ts`, `dto/project-response.dto.ts`, `project.entity.ts`, `projects.repository.ts`, `projects.service.ts` — plumb the two fields through end to end.
- `src/publisher/project-document.ts`, `src/publisher/render-project.ts` — consume the fields (or fallback) in published HTML.
- `public/builder/index.html`, `app.js`, `styles.css` — two labeled color pickers + live preview wiring.
- Tests: extend `test/unit/render-project.spec.ts`, `test/unit/project-input.dto.spec.ts`, `test/api/projects-api.spec.ts`, `test/browser/baseline-flow.spec.ts` (all existing files, no new suites needed).

The full task-by-task breakdown (Task A–E, each with **Files**/**Produces**/checklist, ready for `AGENTS.md`-style execution one task at a time) is written out in `ashiscc-session-5-page-builder-workshop/.claude/specs/project-color-options.md`.

## Verification (once implemented — not part of this turn)

- `npm run lint`, `npm run policy`
- `npm run test:unit` — hex validation + publisher color fallback/override
- `npm run test:api` — create/update round-trip, invalid-hex 400, published HTML reflects colors
- `npm run test:browser` — pickers are labeled/keyboard-reachable, live preview updates, save/reload round-trip, "New project" resets to defaults

## Explicit non-goals

Per-block color overrides, arbitrary CSS/named-color/`rgb()` formats, independently coloring button label vs. background, and any change to the existing block union or `validate-blocks.ts`'s exact-key gate.
