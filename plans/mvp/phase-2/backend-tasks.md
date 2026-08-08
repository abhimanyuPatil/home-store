# Phase 2 Backend Tasks - Supply Management and Primary Inventory

## B1. Implement supply domain and primary assignment operations

**Status: Implemented**

### Objective

Implement supply creation and editing with exactly one valid primary assignment.

### Inputs

- Supply endpoints and payloads in `docs/api.md`.
- Supply and assignment rules in `docs/requirements/mvp.md`.
- Phase 1 schema and shared API behavior.

### Expected Output

- Supply create/get/update/delete operations.
- Primary assignment persistence and validation.
- Supported-unit handling.

### Acceptance Criteria

- A supply cannot be created without a primary assignment.
- Supply names are unique.
- Units are limited to `g`, `kg`, `l`, `pack`, and `bottle`.
- Primary subsection must belong to the selected primary location.
- The API preserves primary quantity as a non-negative decimal, including zero.
- Supply deletion removes its current assignments.

### Dependencies

- Phase 1 B3, B4, and B6.

## B2. Implement primary quantity updates

**Status: Implemented**

### Objective

Provide independent latest-quantity updates for the primary assignment.

### Inputs

- Primary quantity endpoint in `docs/api.md`.

### Expected Output

- `PATCH /api/v1/supplies/{supplyId}/primary-quantity`.
- Quantity parsing and non-negative decimal validation.

### Acceptance Criteria

- Valid decimal quantities are persisted.
- Zero is accepted.
- Negative values and malformed values are rejected without changing existing data.
- Missing supplies return `404`.
- Successful updates are visible in subsequent supply and inventory reads.

### Dependencies

- B1.

## B3. Implement primary inventory queries

**Status: Implemented**

### Objective

Implement the primary inventory list and all Phase 2 search/filter behavior.

### Inputs

- `GET /api/v1/supplies` contract.
- Primary inventory rules in the MVP requirements.

### Expected Output

- Primary supply list with name, location, subsection, quantity, and unit.
- Supply-name search.
- Primary location, primary subsection, and out-of-stock filters.

### Acceptance Criteria

- The default query returns all supplies' primary assignment details.
- Search matches supply name only.
- Primary subsection filtering uses only the primary subsection.
- Out-of-stock filtering returns zero primary quantity when no backup exists; backup-aware behavior is completed in Phase 3.
- Combined supported filters produce the intersection of their criteria.
- Empty results return a successful empty collection rather than an error.

### Dependencies

- B1.
- B2.

## B4. Add Phase 2 API and domain tests

**Status: Implemented**

### Objective

Verify supply invariants, primary quantity changes, and inventory queries.

### Inputs

- Phase 2 backend tasks and API contract.

### Expected Output

- Unit tests for supply/assignment rules.
- API/integration tests for CRUD, quantity, search, and filters.

### Acceptance Criteria

- Tests cover duplicate names, invalid units, invalid subsection ownership, and missing primary assignments.
- Tests cover decimal, zero, negative, and malformed quantities.
- Tests cover search and each primary inventory filter.
- Tests verify failed writes leave existing data unchanged.
- Phase 1 CI remains green.

### Dependencies

- B1 through B3.
