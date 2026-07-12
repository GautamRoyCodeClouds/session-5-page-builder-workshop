# Workshop Task Catalogue

The interactive deck is the easiest way to search and copy complete task prompts. This table makes the same 67 task IDs visible on GitHub. The machine-readable acceptance criteria, allowed files, exact checks, and prompts are in [tasks.json](tasks.json).

| ID | Lane | Task | Difficulty | Estimate |
| --- | --- | --- | --- | --- |
| `BE-01` | backend | Add a project rename endpoint | starter | 15-20 min |
| `BE-02` | backend | Add a duplicate-project endpoint | standard | 20-25 min |
| `BE-03` | backend | Add a project-list endpoint with bounded pagination | standard | 20-25 min |
| `BE-04` | backend | Add optional page-description metadata to published HTML | standard | 20-25 min |
| `BE-05` | backend | Add a delete-project operation with an explicit confirmation contract | standard | 20-25 min |
| `BE-06` | backend | Add a slug-availability endpoint | starter | 15-20 min |
| `BE-07` | backend | Record and return the last successful publish time | standard | 20-25 min |
| `BE-08` | backend | Add an unpublish operation that removes generated output safely | stretch | 20-25 min |
| `BE-09` | backend | Add a read-only project-status endpoint | starter | 15-20 min |
| `BE-10` | backend | Add a database-aware readiness endpoint | standard | 15-20 min |
| `BE-11` | backend | Add optimistic concurrency with a project version field | stretch | 20-25 min |
| `BE-12` | backend | Make one endpoint use the common error envelope consistently | starter | 15-20 min |
| `UI-01` | frontend | Add a Spacer block with three fixed sizes | starter | 15-20 min |
| `UI-02` | frontend | Add a Quote block with quote and attribution fields | standard | 20-25 min |
| `UI-03` | frontend | Add an Image block with URL and required alt text | standard | 20-25 min |
| `UI-04` | frontend | Add primary and secondary styles to Button blocks | starter | 15-20 min |
| `UI-05` | frontend | Add a duplicate-selected-block command | standard | 15-20 min |
| `UI-06` | frontend | Add a delete-selected-block keyboard command | standard | 15-20 min |
| `UI-07` | frontend | Add explicit Move Up and Move Down controls | starter | 10-15 min |
| `UI-08` | frontend | Add a useful empty-canvas state | starter | 10-15 min |
| `UI-09` | frontend | Add desktop and mobile preview modes | standard | 20-25 min |
| `UI-10` | frontend | Add an unsaved-changes indicator | standard | 15-20 min |
| `UI-11` | frontend | Add a visible block count with the configured limit | starter | 10-15 min |
| `UI-12` | frontend | Allow the project title to be edited from the builder header | starter | 15-20 min |
| `UI-13` | frontend | Add an edit/preview mode toggle | standard | 15-20 min |
| `UI-14` | frontend | Add keyboard navigation to the block palette | standard | 20-25 min |
| `UI-15` | frontend | Make the block inspector collapsible without losing form state | standard | 15-20 min |
| `OP-01` | quality | Reject unsafe or malformed slugs | starter | 15-20 min |
| `OP-02` | quality | Reject unsafe URL protocols in Button links | standard | 15-20 min |
| `OP-03` | quality | Enforce a maximum number of page blocks | starter | 15-20 min |
| `OP-04` | quality | Prevent duplicate saves while a request is in flight | standard | 20-25 min |
| `OP-05` | quality | Enforce a bounded request-body size | standard | 15-20 min |
| `OP-06` | quality | Add a clean-database migration smoke test | standard | 20-25 min |
| `OP-07` | quality | Add safe cache headers to published static pages | starter | 15-20 min |
| `OP-08` | quality | Add structured logs for publish attempts without logging page content | standard | 20-25 min |
| `OP-09` | quality | Add a request correlation ID to errors and logs | stretch | 20-25 min |
| `OP-10` | quality | Skip regeneration when project content has not changed | stretch | 20-25 min |
| `OP-11` | quality | Improve accessible names and focus indicators in the builder | starter | 15-20 min |
| `OP-12` | quality | Preserve selection after drag-and-drop reordering | standard | 15-20 min |
| `OP-13` | quality | Replace one ad hoc error response with the common error envelope | starter | 15-20 min |
| `OP-14` | quality | Refactor publisher block rendering into a typed renderer map | stretch | 20-25 min |
| `OP-15` | quality | Validate configuration at application startup | standard | 20-25 min |
| `QA-01` | qa | Test the create-save-load round trip | starter | 15-20 min |
| `QA-02` | qa | Test valid, invalid, and conflicting slug cases | starter | 15-20 min |
| `QA-03` | qa | Test HTML text escaping during publish | standard | 15-20 min |
| `QA-04` | qa | Test Button URL escaping during publish | starter | 15-20 min |
| `QA-05` | qa | Test publishing an unknown project | starter | 10-15 min |
| `QA-06` | qa | Test block-order persistence through save and load | standard | 15-20 min |
| `QA-07` | qa | Test baseline project-validation boundaries | standard | 15-20 min |
| `QA-08` | qa | Test repeat publishing of the same project | starter | 10-15 min |
| `QA-09` | qa | Test published-output isolation between projects | standard | 15-20 min |
| `QA-10` | qa | Add an OpenAPI contract snapshot test for one endpoint | standard | 15-20 min |
| `QA-11` | qa | Add a browser smoke test for save and publish | stretch | 20-25 min |
| `QA-12` | qa | Test drag-and-drop block reordering | standard | 15-20 min |
| `QA-13` | qa | Test save and reload in the builder | starter | 10-15 min |
| `QA-14` | qa | Add an accessibility check for the palette and canvas | standard | 20-25 min |
| `QA-15` | qa | Verify published HTML document structure and block order | standard | 15-20 min |
| `RV-01` | review | Turn a builder feature into a user story with measurable acceptance criteria | starter | 10-15 min |
| `RV-02` | review | Create a risk-based test matrix for publishing | standard | 15-20 min |
| `RV-03` | review | Review a PR for intent-versus-implementation gaps | standard | 15-20 min |
| `RV-04` | review | Improve one task specification without expanding its scope | starter | 10-15 min |
| `RV-05` | review | Write a publish-path threat model with mitigations | stretch | 20-25 min |
| `RV-06` | review | Write a rollback plan for a schema-changing PR | standard | 15-20 min |
| `RV-07` | review | Assess whether one proposed API change is backward compatible | standard | 15-20 min |
| `RV-08` | review | Define an accessibility acceptance checklist for a new block | starter | 10-15 min |
| `RV-09` | review | Define a small performance budget for save and publish operations | standard | 15-20 min |
| `RV-10` | review | Produce a release-readiness checklist for the workshop baseline | standard | 15-20 min |

Divider is reserved for the presenter demonstration and is intentionally absent. Duplicate task selections are allowed.
