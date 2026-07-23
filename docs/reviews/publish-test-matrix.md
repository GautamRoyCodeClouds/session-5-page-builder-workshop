# Risk-Based Test Matrix — Publish Path

This matrix ranks the risks on the **publish path** — the flow that turns a saved project into a
live static document at `/sites/{slug}` — and maps each risk to **deterministic evidence** (a
concrete, repeatable test). It exists so testing effort tracks risk instead of spreading evenly,
and so the publish path's safety controls are auditable on one page.

Scope note: this is the workshop baseline described in [docs/design.md](../design.md). It has
**no authentication, authorization, or multi-tenancy** — those are explicit non-goals, not gaps,
so they are out of scope for this matrix. See the [deferred risk](#explicitly-deferred-risk) for
the one publish-path risk consciously left for a later task.

## Publish path under review

`POST /api/projects/:id/publish` → validate persisted blocks → `renderProject()` escapes text and
attributes ([src/publisher/render-project.ts](../../src/publisher/render-project.ts)) → atomic
temp-write + rename inside `PUBLISH_DIR`
([src/publisher/publisher.service.ts](../../src/publisher/publisher.service.ts)) → record
`publishedAt` ([src/projects/projects.repository.ts](../../src/projects/projects.repository.ts))
→ served by `GET /sites/:slug`
([src/sites/sites.controller.ts](../../src/sites/sites.controller.ts),
[src/sites/sites.service.ts](../../src/sites/sites.service.ts)).

## How to read this matrix

- **Likelihood / Impact** — Low / Medium / High.
- **Priority** — derived from likelihood × impact: **High** rows get a named test scenario and are
  the required regression floor; Medium/Low rows are covered but not gated on a bespoke scenario.
- **Test level** — where the evidence runs:
  - **Unit** — Jest, `test/unit/**` (`npm run test:unit`), pure functions, no database.
  - **API** — Jest, `test/api/**` (`npm run test:api`), full Nest app against the Docker
    PostgreSQL.
  - **Browser** — Playwright, `test/browser/**` (`npm run test:browser`).

## Matrix

| # | Area | Risk | Likelihood | Impact | Priority | Test level | Concrete test scenario → evidence |
|---|------|------|:---:|:---:|:---:|:---:|------|
| 1 | Validation | Malformed/duplicate-ID/unknown-type blocks are persisted and then published into broken or unexpected markup | Medium | High | **High** | Unit + API | PUT `/api/projects/:id` with an unknown block `type`, a duplicate block `id`, and a block missing required fields each return the `400` common envelope and persist nothing (re-GET is unchanged). → `test/unit/block-validation.spec.ts`, `test/api/projects-api.spec.ts` |
| 2 | Validation | An invalid, oversized, or traversal-shaped slug reaches the publish/serve path | Low | Medium | Medium | Unit + API | Uppercase / whitespace / `../` / >80-char slugs are rejected at create (`400`) and never resolve when served (`404`). → `test/unit/projects-slug-availability.spec.ts`, `test/api/projects-api.spec.ts` |
| 3 | Escaping | Stored HTML/script injection via text-bearing blocks (heading, text, section, quote) executes in the published page | Medium | High | **High** | Unit | Publish a project whose block text contains `<script>`, `&`, `<`, `>`, `"`, `'`; assert the rendered HTML escapes all five characters and contains no live `<script>`, across every text-bearing block type. → `test/unit/render-project.spec.ts` |
| 4 | Escaping | Button URL breakout or unsafe protocol (`javascript:`, `data:`) becomes a live link in published output | Medium | High | **High** | Unit | A Button with `url = "javascript:alert(1)"` renders as an inert `<span class="button…" aria-disabled="true">` (never an `<a href>`); a valid `https://` URL is preserved with its `href` attribute-escaped so it cannot break out of the attribute. → `test/unit/publisher-button.spec.ts`, `test/unit/render-project.spec.ts` |
| 5 | Filesystem boundaries | Published output escapes `PUBLISH_DIR` via a crafted identifier (path traversal / absolute path) | Low | High | **High** | Unit | Publishing with an identifier that fails `isValidProjectId`, or that resolves outside the configured root, throws `Published output must remain inside PUBLISH_DIR` and writes no file outside the directory. → `test/unit/publisher.service.spec.ts` |
| 6 | Filesystem boundaries | An interrupted write leaves a partial or corrupt `.html` that is then served | Low | Medium | Medium | Unit | Publish writes a `.tmp` file with the exclusive `wx` flag then atomically `rename`s it into place; a re-publish replaces the prior file atomically and leaves no leftover `.tmp`. → `test/unit/publisher.service.spec.ts` ("atomically replaces a prior version without leaving temporary files") |
| 7 | Persistence | Concurrent edits cause a lost update / stale overwrite before publish | Low | Medium | Medium | Unit + API | Two updates carrying the same `version` — the second is rejected by the optimistic-concurrency guard rather than silently overwriting. → `test/unit/projects.service.spec.ts` |
| 8 | Persistence | Cross-project leakage: one project's HTML is served under another project's slug | Low | High | **High** | API | Publish two projects, then re-publish the first; the second project's page content and its distinct `/sites/{slug}` URL remain unchanged (no bleed-through). → `test/api/projects-api.spec.ts` (output isolation), `test/api/sites-api.spec.ts` |
| 9 | Serving | An unpublished or deleted project remains reachable, or stale content is cached | Medium | Medium | Medium | API | `GET /sites/:slug` for a project with `publishedAt === null` or a missing output file returns `404` with `cache-control: no-store`; a published project returns `200` with `cache-control: public, max-age=60`. → `test/api/sites-api.spec.ts` |
| 10 | Serving | Content-type sniffing lets a served document be interpreted as an unintended type | Low | Medium | Low | API | Served responses carry `content-type: text/html; charset=utf-8` and `x-content-type-options: nosniff`. → `test/api/sites-api.spec.ts` |

All five required areas are covered — **validation** (1–2), **escaping** (3–4), **filesystem
boundaries** (5–6), **persistence** (7–8), and **serving** (9–10) — and every **High** row names a
concrete, executable scenario.

## Explicitly deferred risk

**Strict URL-protocol rejection at the persistence boundary** — deferred to task **OP-02**
("Reject unsafe URL protocols in Button links").

- **What is deferred:** rejecting an unsafe Button protocol (e.g. `javascript:`, `data:`) with a
  `400` at save time, instead of accepting it and neutralizing it only when rendering.
- **Rationale:** the published artifact is the actual attack surface, and it is already safe —
  `isSafeUrl` in [render-project.ts](../../src/publisher/render-project.ts) downgrades any
  non-`http(s)` Button URL to an inert `<span>` (row 4), which
  [docs/design.md](../design.md) records as the intended publishing boundary. Moving strict
  rejection to persistence is **defense-in-depth plus earlier builder feedback**, not a
  publish-path exposure. Pulling it into this review would also widen scope beyond RV-02's single
  allowed file, so it is tracked as OP-02 and re-evaluated there.

## References

- Trusted PR review harness: [docs/LOCAL_REVIEW.md](../LOCAL_REVIEW.md)
- Baseline release checklist: [docs/reviews/release-readiness.md](./release-readiness.md)
- Publishing boundary specification: [docs/design.md](../design.md#publishing-boundary)
