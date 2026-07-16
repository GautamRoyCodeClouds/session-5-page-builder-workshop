# User Story: Delete a Project with Explicit Confirmation

## Story

As a page builder user, I want to confirm my intention before deleting a project so that I don't accidentally lose important content.

## Acceptance Criteria

### Criterion 1: Missing Confirmation is Rejected
**Given** I have a project I want to delete
**When** I send a DELETE request with no confirmation in the request body
**Then** the API responds with 400 Bad Request and the project remains intact and loadable

**Verification Evidence:** Test calls DELETE without request body, asserts 400 response code, then verifies project still loads with GET.

### Criterion 2: False Confirmation is Rejected
**Given** I have a project I want to delete
**When** I send a DELETE request with `confirm: false`
**Then** the API responds with 400 Bad Request and the project remains intact and loadable

**Verification Evidence:** Test calls DELETE with `{ confirm: false }`, asserts 400 response code, then verifies project still loads with GET.

### Criterion 3: True Confirmation Deletes Project
**Given** I have a project I want to delete
**When** I send a DELETE request with `confirm: true`
**Then** the API responds with 204 No Content and subsequent GET requests for that project return 404

**Verification Evidence:** Test calls DELETE with `{ confirm: true }`, asserts 204 response code, then verifies GET returns 404.

### Criterion 4: Unknown Project Returns Not Found (Error Boundary)
**Given** I attempt to delete a non-existent project
**When** I send a DELETE request with a valid UUID and `confirm: true`
**Then** the API responds with 404 Not Found without modifying any existing projects

**Verification Evidence:** Test calls DELETE on a random UUID with valid confirmation, asserts 404 response code, then verifies other projects are unaffected by GET.

### Criterion 5: Deleted Project Cannot Be Published
**Given** I have deleted a project
**When** I attempt to publish what was that project's identifier
**Then** the publish operation returns 404 Not Found, confirming the project record was truly removed from the database

**Verification Evidence:** Test deletes a project, then attempts to publish using the same project ID, asserts 404 response code.
