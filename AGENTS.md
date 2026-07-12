# Agent Instructions

## Start Here

1. Read the selected task in `workshop/tasks.json`.
2. Inspect the relevant implementation, tests, OpenAPI contract, and Prisma schema before editing.
3. Restate the acceptance criteria and propose the smallest plan. Do not edit until the plan is approved.
4. Change only paths listed in the selected task's `allowedFiles`.

## Architecture

- `src/projects`: typed project boundary and persistence orchestration.
- `src/publisher`: deterministic static HTML generation.
- `src/sites`: published page serving.
- `public/builder`: browser builder.
- `prisma`: schema and committed migration history.
- `test`: unit, API, and browser evidence.

Project content is a discriminated JSON block union. Never introduce arbitrary HTML or execute saved content.

## Constraints

- One task per branch.
- Do not add or update dependencies, lockfiles, GitHub workflows, Docker files, agent instructions, or review infrastructure.
- Do not refactor unrelated code or change public contracts unless the task explicitly requires it.
- Never add secret values. Configuration tasks may document variable names and safe placeholders in `.env.example` only.
- Do not add generated Prisma client files, build output, coverage, screenshots, or test artifacts.
- If the task cannot be completed within its allowed paths, stop and report the blocker.

## Required Evidence

Run every exact command on the selected task card. A filtered command must select at least one focused test at the PR head. Report changed files, acceptance evidence, command results, and residual risk.
