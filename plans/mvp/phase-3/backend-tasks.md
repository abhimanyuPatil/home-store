# Phase 3 Backend Tasks - Backup, Reassignment, and Release Hardening

## B1. Implement optional backup assignments

**Status: Implemented**

### Objective

Support one optional backup assignment with an independent latest quantity.

### Inputs

- Backup assignment endpoints in `docs/api.md`.
- Backup rules in `docs/requirements/mvp.md`.

### Expected Output

- Backup create/edit/remove behavior as part of supply updates.
- Backup quantity update endpoint.
- Primary/backup distinction and assignment validation.

### Acceptance Criteria

- A supply can have at most one backup assignment.
- Backup location and subsection are valid and differ from the primary assignment.
- Backup quantity is independent from primary quantity.
- Zero and valid decimal backup quantities persist.
- Negative or malformed backup quantities are rejected without changing existing data.
- A backup can be removed without removing the primary assignment.

### Dependencies

- Phase 2 B1 and B2.
- Phase 1 B3 and B4.

## B2. Implement backup and out-of-stock inventory queries

**Status: Implemented**

### Objective

Complete separate backup and out-of-stock inventory behavior.

### Inputs

- Backup inventory endpoint in `docs/api.md`.
- Out-of-stock rule in `docs/requirements/mvp.md`.

### Expected Output

- Backup assignment list with backup-location filter.
- Correct primary inventory out-of-stock query.

### Acceptance Criteria

- Backup view returns only supplies with a backup assignment.
- Backup location filtering works independently of primary subsection filtering.
- Out-of-stock requires both primary and backup quantities to be zero when backup exists.
- Out-of-stock requires primary quantity zero when no backup exists.
- Changes to either quantity update subsequent out-of-stock results.

### Dependencies

- B1.
- Phase 2 B3.

## B3. Implement affected-assignment discovery

**Status: Implemented**

### Objective

Provide the data needed for the frontend reassignment workflow before a location or subsection is deleted.

### Inputs

- Reassignment deletion contracts in `docs/api.md`.
- Storage deletion requirements in `docs/requirements/mvp.md`.

### Expected Output

- A way for deletion handlers to identify every affected primary and backup assignment.
- Stable assignment identifiers and role information for replacement mapping.

### Acceptance Criteria

- Location deletion finds assignments referencing the location.
- Subsection deletion finds assignments referencing the subsection.
- Affected assignments include supply identity, role, current location, and current subsection.
- Unaffected assignments are not included.

### Dependencies

- Phase 2 B1.
- B1.

## B4. Implement atomic reassignment-and-delete workflows

**Status: Implemented**

### Objective

Complete location and subsection deletion only when all affected assignments have valid replacements.

### Inputs

- Reassignment request contracts in `docs/api.md`.
- Affected-assignment behavior from B3.

### Expected Output

- `POST /api/v1/locations/{locationId}/delete`.
- `POST /api/v1/subsections/{subsectionId}/delete`.
- Transactional replacement and deletion behavior.

### Acceptance Criteria

- Every affected assignment requires a replacement.
- Replacement location/subsection relationships are validated.
- Replacement mappings preserve primary versus backup role and quantity.
- Any invalid or missing mapping rolls back every change.
- Successful location deletion removes the location and its subsections.
- Successful subsection deletion removes only the selected subsection.
- Deleted resources and their former assignments no longer appear in reads.

### Dependencies

- B3.
- Phase 1 B6.

## B5. Add release hardening and observability

**Status: Implemented**

### Objective

Make the API operationally ready for the MVP deployment.

### Inputs

- Observability and security requirements in `docs/architecture.md`.
- CI/CD decisions in `docs/technology.md`.

### Expected Output

- Structured CloudWatch-compatible logs.
- Basic API/Lambda error and duration metrics.
- Production deployment configuration and secret checks.
- CORS and rate-limit verification.

### Acceptance Criteria

- Requests can be correlated without logging passphrases or JWTs.
- Authentication, validation, conflict, not-found, and internal errors are distinguishable.
- Production deployment fails safely when required secrets/configuration are absent.
- Allowed-origin behavior is verified for production and local development.
- Session rate limiting is active in the deployed API.

### Dependencies

- Phase 1 B2, B4, and B5.
- Phase 3 B1 through B4.

## B6. Complete backend integration and end-to-end tests

**Status: Implemented**

### Objective

Verify all backend MVP journeys and failure paths against the deployed architecture.

### Inputs

- All Phase 1 through Phase 3 backend behavior.

### Expected Output

- Full API integration suite.
- Transaction rollback coverage.
- Deployment smoke checks.

### Acceptance Criteria

- Tests cover storage setup, supply CRUD, quantity updates, backup behavior, views, filters, and deletion reassignment.
- Tests verify out-of-stock rules with and without backup assignments.
- Tests verify atomic rollback for invalid reassignment.
- Tests verify JWT expiry and session rate limiting.
- Production smoke checks confirm API Gateway, Lambda, Neon, and secrets are connected.

### Dependencies

- B1 through B5.
