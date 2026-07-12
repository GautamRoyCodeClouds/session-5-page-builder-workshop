# Session 5 Page Builder Baseline Design

Date: 2026-07-12

## Goal

Provide a public, workshop-ready baseline application that attendees can fork and extend with a single bounded pull request. The application is deliberately small but complete: a browser page builder stores typed block JSON through a NestJS API, PostgreSQL persists projects, and a publisher generates safe static HTML.

The approved Session 5 presentation specification is the product authority. This document carries the complete application-facing portion of that specification into the standalone repository.

## Stack

- Node.js 22 or newer.
- NestJS 11 with Express and `@nestjs/swagger`.
- Prisma ORM 7 using the `pg` driver adapter.
- PostgreSQL 17 in Docker Compose.
- Vanilla HTML, CSS, and JavaScript served by NestJS.
- Jest for unit and API suites; Playwright for real-browser tests.
- ESLint and TypeScript for deterministic static checks.

Dependencies are pinned in `package-lock.json`. No frontend bundler is needed.

## Product Contract

The baseline palette contains exactly four block types:

```ts
type Block =
  | { id: string; type: "heading"; text: string; level: 1 | 2 | 3 }
  | { id: string; type: "text"; text: string }
  | { id: string; type: "button"; label: string; url: string }
  | { id: string; type: "section"; title: string };
```

Users can add blocks by click or drag, remove the selected block, reorder with pointer drag-and-drop, edit labeled inspector fields, save, reload, publish, and open the static result. The builder supports at most 20 blocks and stores the last project ID locally for convenience. It does not include any attendee task feature such as Divider, Image, Duplicate, device preview, visible dirty state, or keyboard-reorder controls.

## Data Model

```text
Project
  id          UUID primary key
  name        1..120 characters
  slug        unique lowercase ASCII slug, 1..80 characters
  blocks      validated ordered JSON array, maximum 20
  publishedAt nullable timestamp
  createdAt   timestamp
  updatedAt   timestamp
```

The committed migration must create the complete schema from an empty database. Prisma CLI uses `DIRECT_URL` when present; the runtime client uses `DATABASE_URL`.

## HTTP Contract

| Method | Route | Result |
| --- | --- | --- |
| `GET` | `/health` | Liveness payload. |
| `POST` | `/api/projects` | Create a validated project. |
| `GET` | `/api/projects/:id` | Load one project. |
| `PUT` | `/api/projects/:id` | Replace editable metadata and ordered blocks. |
| `POST` | `/api/projects/:id/publish` | Validate, atomically generate HTML, and record publish time. |
| `GET` | `/sites/:slug` | Serve one published HTML document. |
| `GET` | `/api/docs` | Swagger UI. |

Errors use `{ statusCode, code, message, details? }`. Invalid requests return 400, missing projects return 404, and conflicting slugs return 409.

## Publishing Boundary

Only known block renderers produce markup. Text and attribute values are escaped. Unsafe Button protocols are neutralized in published output, while a future attendee task can move strict protocol rejection to the persistence boundary. Output paths derive only from validated slugs and are checked to remain under `PUBLISH_DIR`. Publishing writes a temporary file and renames it atomically.

Generated pages include a nonempty title, configured language, responsive metadata, semantic elements in saved order, and no scripts.

## Repository Boundaries

- `src/projects`: controller, DTOs, types, repository, service.
- `src/publisher`: deterministic rendering and atomic file output.
- `src/sites`: serving published pages.
- `src/common`: configuration, errors, and validation helpers.
- `public`: static builder UI only.
- `test/unit`, `test/api`, `test/browser`: isolated verification levels.
- `workshop/tasks.json`: the exact 67-card catalogue shared by the deck.
- `review`: image and entrypoint built from trusted `main` before PRs arrive.
- `scripts`: policy, task-scope, and host-side review orchestration.

## Test Contract

The package exposes `build`, `lint`, `policy`, `test:unit`, `test:api`, and `test:browser`. Each test runner accepts a positional filter after `--`, runs at least one reserved `filter-contract` test for that filter, and exits nonzero for an unknown filter.

Unit tests cover block validation and publisher escaping. API tests cover create/save/load, slug validation/conflict, error envelopes, publish/re-publish, and output isolation against the Docker database. Browser tests cover palette accessibility, add/edit/remove, pointer reorder, save/reload, and publish.

## Local Review Boundary

The host uses `gh` only for metadata, diff, comments, and the final human-confirmed merge. A trusted host script verifies the PR head SHA and allowed paths, then mounts the PR checkout read-only into a prebuilt review image. The image starts its own loopback-only PostgreSQL instance and runs with no external network, credentials, Docker socket, or writable host mount.

The host builds a sanitized `review-input.txt` containing the SHA, diff, task criteria, and exact container results. Claude may read that file using safe mode with tools disabled. Codex is optional only inside a separate OS sandbox that hides the checkout, host home, and reusable credentials. An agent verdict is advisory.

## Explicit Non-goals

Authentication, authorization, multi-tenancy, arbitrary HTML, arbitrary CSS, third-party deployment credentials, GitHub-hosted AI review, automatic merge, and production-grade container hardening are outside this workshop baseline.
