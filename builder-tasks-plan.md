# Builder Tasks Completion Plan

A process for completing every **Builder / frontend (`UI-*`)** task in the Session 5
catalogue against the workshop baseline
[`GautamRoyCodeClouds/session-5-page-builder-workshop`](https://github.com/GautamRoyCodeClouds/session-5-page-builder-workshop).

## Scope and status

The catalogue has **16 builder tasks**. As of this plan:

- **Done (5):** UI-02, UI-03, UI-07, UI-12, UI-16 — merged to `main` and marked in the deck.
- **Remaining (11):** UI-01, UI-04, UI-05, UI-06, UI-08, UI-09, UI-10, UI-11, UI-13, UI-14, UI-15.

Estimated remaining effort: ~**3–3.5 focused hours** of implementation (15–25 min each), plus
review/merge overhead.

## The central constraint: shared files

Nine of the eleven remaining tasks change the **same three files** —
`public/builder/app.js`, `public/builder/index.html`, `public/builder/styles.css` — plus
`test/browser/**`. Two more (UI-01, UI-04) additionally change the block model
(`src/projects/dto/**`, `src/publisher/**`). Independent branches will therefore conflict.

**Strategy:** land tasks **one at a time**, serialise merges to `main`, and **rebase the next
branch after each merge**. Do not run these as parallel long-lived branches.

## Prerequisites (once)

1. Baseline green from a clean checkout:
   ```bash
   npm ci && cp .env.example .env
   docker compose up -d --wait postgres && npm run prisma:deploy
   npm run build && npm run lint && npm run policy
   npm run test:unit && npm run test:api && npm run test:browser
   ```
2. `npx playwright install chromium` (browser suite needs it).
3. Read `AGENTS.md`, `CONTRIBUTING.md`, and skim `public/builder/app.js` so you know the existing
   block state model, selection handling, save/publish flow, and palette structure.

## Per-task workflow (the loop)

Repeat for each task in the order below.

1. **Sync & branch:** `git checkout main && git pull`, then `git checkout -b task/UI-XX-<slug>`.
2. **Brief:** open the deck task catalogue (`T`), find the card, and **Copy task** — that prompt
   already encodes the scope, allowed files, and exact checks. Use it verbatim as the agent brief.
3. **Red (test first):** add or adjust the Playwright test named by the card's `verify` filter so it
   encodes the acceptance criteria and fails.
4. **Green (implement):** change only files matching the card's `allowedFiles`. Prefer **additive**
   DOM hooks (`data-*` attributes, new elements) over restructuring existing markup — this keeps
   later tasks' diffs conflict-free.
5. **Verify:** run the card's exact `verify` commands **and** `npm run lint`. For block-model tasks
   also run the full `npm run test:browser` to catch cross-task regressions.
6. **PR:** open a focused PR titled `feat(UI-XX): …` with the acceptance evidence and command output.
7. **Local review + merge:** run the trusted local review (`docs/LOCAL_REVIEW.md`) in the hardened
   Docker reviewer, then human-confirmed **squash merge**.
8. **Mark done:** add `"UI-XX"` to `completedTaskIds` in the deck's `src/tasks.js`, run
   `node tools/build.mjs`, and re-verify with `node tools/check-content.mjs`.

## Execution order (waves)

Ordered to land model-changing work first, then layer UX on a stable block model, and to reduce
churn on `app.js`. Do the tasks **within a wave sequentially**, rebasing after each merge.

### Wave 1 — Block model (also touches DTO + publisher)
These change the persisted block set, so land them first and run the full suite each time.
1. **UI-01** — Spacer block with three fixed sizes
2. **UI-04** — Primary/secondary Button styles

> Cross-impact: new/changed block types interact with publisher escaping and QA-03/QA-15. Keep
> publisher fixtures byte-stable except where a criterion requires a change.

### Wave 2 — Block commands (selection/state in `app.js`)
3. **UI-05** — Duplicate selected block
4. **UI-06** — Delete-selected-block keyboard command

### Wave 3 — Canvas & palette UX
5. **UI-08** — Useful empty-canvas state
6. **UI-11** — Visible block count with configured limit
7. **UI-14** — Keyboard navigation for the block palette

### Wave 4 — Preview modes
8. **UI-09** — Desktop/mobile preview modes
9. **UI-13** — Edit/preview mode toggle

### Wave 5 — Header & inspector
10. **UI-10** — Unsaved-changes indicator
11. **UI-15** — Collapsible block inspector (without losing form state)

## Remaining task detail cards

Each card lists difficulty · estimate, scope, acceptance criteria, allowed files, and the exact
verification commands.

### UI-01 — Add a Spacer block with three fixed sizes  ·  starter · 15–20 min
**Scope:** Add a nontext Spacer block whose inspector offers exactly three supported size choices.
**Acceptance:**
- The palette exposes one Spacer option.
- The inspector offers exactly small, medium, and large sizes.
- Saved and reloaded spacers retain their selected size.
- Preview and published output use the selected fixed size.

**Allowed files:** `public/builder/**`, `src/projects/dto/**`, `src/publisher/**`, `test/browser/**`, `test/publisher/**`
**Verify:** `npm run test:unit -- publisher` · `npm run test:browser -- builder`

### UI-04 — Add primary and secondary styles to Button blocks  ·  starter · 15–20 min
**Scope:** Add a two-option visual style field to existing Button blocks without changing link behavior.
**Acceptance:**
- The Button inspector offers exactly primary and secondary styles.
- New buttons default to primary.
- Save and load preserve the selected style.
- Preview and published output apply distinct classes for both styles.

**Allowed files:** `public/builder/**`, `src/projects/dto/**`, `src/publisher/**`, `test/browser/**`, `test/publisher/**`
**Verify:** `npm run test:unit -- publisher` · `npm run test:browser -- builder`

### UI-05 — Add a duplicate-selected-block command  ·  standard · 15–20 min
**Scope:** Duplicate the selected block directly after its source with a fresh client-side identity.
**Acceptance:**
- The command is disabled when no block is selected.
- A duplicate is inserted immediately after the selected block.
- The copy preserves editable values but receives a distinct ID.
- The new copy becomes selected and marks the project unsaved.

**Allowed files:** `public/builder/**`, `test/browser/**`
**Verify:** `npm run lint` · `npm run test:browser -- builder`

### UI-06 — Add a delete-selected-block keyboard command  ·  standard · 15–20 min
**Scope:** Add a Delete-key command that removes the selected block immediately while protecting editable fields.
**Acceptance:**
- Pressing Delete removes the selected block without a confirmation step.
- Backspace does not trigger the command.
- Delete does not remove a block while focus is in an input, textarea, or editable field.
- Focus moves to the next block, previous block, or canvas after deletion.

**Allowed files:** `public/builder/**`, `test/browser/**`
**Verify:** `npm run lint` · `npm run test:browser -- keyboard`

### UI-08 — Add a useful empty-canvas state  ·  starter · 10–15 min
**Scope:** Replace the blank canvas with a concise empty state whose action moves focus to the block palette.
**Acceptance:**
- The empty state appears only when the page has zero blocks.
- Its action moves keyboard focus to the first enabled palette item without adding a block.
- Adding a block removes the empty state without a page reload.
- The state and its action have meaningful accessible names.

**Allowed files:** `public/builder/**`, `test/browser/**`
**Verify:** `npm run lint` · `npm run test:browser -- builder`

### UI-09 — Add desktop and mobile preview modes  ·  standard · 20–25 min
**Scope:** Add a two-mode preview control that changes the preview viewport without altering project data.
**Acceptance:**
- A segmented control exposes exactly desktop and mobile modes.
- The selected mode changes preview width using stable CSS constraints.
- Switching modes does not mutate blocks or mark the project unsaved.
- The active mode is conveyed visually and with `aria-pressed` or equivalent state.

**Allowed files:** `public/builder/**`, `test/browser/**`
**Verify:** `npm run lint` · `npm run test:browser -- preview`

### UI-10 — Add an unsaved-changes indicator  ·  standard · 15–20 min
**Scope:** Track local edits against the last successful save and show a compact status in the builder header.
**Acceptance:**
- Editing project metadata or blocks changes the status to Unsaved.
- A successful save changes the status to Saved.
- A failed save leaves the status Unsaved.
- Loading a project starts in the Saved state.

**Allowed files:** `public/builder/**`, `test/browser/**`
**Verify:** `npm run lint` · `npm run test:browser -- unsaved`

### UI-11 — Add a visible block count with the configured limit  ·  starter · 10–15 min
**Scope:** Show current block count against the existing configured maximum and disable additions at the limit.
**Acceptance:**
- The builder displays count in `current/limit` form.
- The count updates immediately after the baseline add and remove actions.
- Palette add controls are disabled at the configured limit.
- Removing a block below the limit re-enables additions.

**Allowed files:** `public/builder/**`, `test/browser/**`
**Verify:** `npm run lint` · `npm run test:browser -- builder`

### UI-13 — Add an edit/preview mode toggle  ·  standard · 15–20 min
**Scope:** Add an explicit mode switch that hides editing chrome in preview while preserving in-memory state.
**Acceptance:**
- The control exposes exactly Edit and Preview modes.
- Preview hides palette, selection handles, and inspector controls.
- Returning to Edit restores the same selection and form values.
- Switching mode does not save or mutate project content.

**Allowed files:** `public/builder/**`, `test/browser/**`
**Verify:** `npm run lint` · `npm run test:browser -- preview`

### UI-14 — Add keyboard navigation to the block palette  ·  standard · 20–25 min
**Scope:** Implement predictable arrow-key and activation behavior for palette items using an established composite-widget pattern.
**Acceptance:**
- Tab enters the palette at one active item.
- Arrow keys move focus among all palette items without leaving the palette.
- Enter and Space add the focused block.
- Visible focus and accessible names identify every item.

**Allowed files:** `public/builder/**`, `test/browser/**`
**Verify:** `npm run lint` · `npm run test:browser -- keyboard`

### UI-15 — Make the block inspector collapsible without losing form state  ·  standard · 15–20 min
**Scope:** Add an accessible collapse control that changes inspector visibility without remounting or resetting its form.
**Acceptance:**
- The inspector control exposes expanded and collapsed state to assistive technology.
- Collapsing hides inspector fields from view and tab order.
- Expanding restores unsaved field values and the selected block.
- The canvas layout remains usable in both states.

**Allowed files:** `public/builder/**`, `test/browser/**`
**Verify:** `npm run lint` · `npm run test:browser -- inspector`

## Definition of done

**Per task:** every acceptance criterion demonstrably met; the card's exact `verify` commands pass;
`npm run lint` clean; changes confined to `allowedFiles`; PR reviewed locally and squash-merged;
`UI-XX` added to the deck's `completedTaskIds` and `Session 5.html` rebuilt.

**Overall (all builder tasks):** all 16 `UI-*` IDs in `completedTaskIds`; the deck's task explorer
reads **16 done** in the Builder category; `node tools/check-content.mjs` and the full
`npm run test:browser` suite pass.

## Progress tracker

| ID | Title | Wave | Difficulty | Est | Status |
| --- | --- | :---: | --- | --- | :---: |
| UI-01 | Spacer block (3 fixed sizes) | 1 | starter | 15–20m | ☐ |
| UI-04 | Button primary/secondary styles | 1 | starter | 15–20m | ☐ |
| UI-05 | Duplicate selected block | 2 | standard | 15–20m | ☐ |
| UI-06 | Delete-block keyboard command | 2 | standard | 15–20m | ☐ |
| UI-08 | Empty-canvas state | 3 | starter | 10–15m | ☐ |
| UI-11 | Block count with limit | 3 | starter | 10–15m | ☐ |
| UI-14 | Palette keyboard navigation | 3 | standard | 20–25m | ☐ |
| UI-09 | Desktop/mobile preview modes | 4 | standard | 20–25m | ☐ |
| UI-13 | Edit/preview mode toggle | 4 | standard | 15–20m | ☐ |
| UI-10 | Unsaved-changes indicator | 5 | standard | 15–20m | ☐ |
| UI-15 | Collapsible inspector | 5 | standard | 15–20m | ☐ |
| UI-02 | Quote block | — | standard | — | ☑ done (#8) |
| UI-03 | Image block + alt text | — | standard | — | ☑ done (#40) |
| UI-07 | Move Up/Down controls | — | starter | — | ☑ done (#9) |
| UI-12 | Edit title in header | — | starter | — | ☑ done (#37) |
| UI-16 | Inline rename via endpoint | — | standard | — | ☑ done (#39) |
