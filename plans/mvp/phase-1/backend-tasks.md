# Phase 1 Backend Tasks - Platform Foundation and Storage Hierarchy

## B1. Create the API repository foundation

**Status: Implemented**

### Objective

Create the Node.js/TypeScript/Express modular-monolith foundation for one Lambda-deployed API application.

### Inputs

- `docs/technology.md`
- `docs/architecture.md`
- `docs/api.md`

### Expected Output

- Runnable local API process.
- Lambda-compatible application entry point.
- Capability-oriented module boundaries for auth, storage, supplies, inventory, persistence, and shared errors.

### Acceptance Criteria

- The API starts locally with documented commands.
- A health-oriented internal/runtime check can confirm the application is running without adding an undocumented product API.
- Type checking and lint/test commands are available.
- No production secret is committed.

### Dependencies

None.

## B2. Configure local and deployed execution

**Status: Implemented**

### Objective

Make the API runnable with local PostgreSQL and serverless-offline, and packageable for AWS Lambda behind an API Gateway HTTP API.

### Inputs

- Confirmed AWS region `ap-south-1`.
- Local PostgreSQL requirement.
- Lambda/API Gateway deployment decision.

### Expected Output

- Local environment configuration.
- Serverless-offline configuration.
- Deployment configuration for one Lambda application and HTTP API.
- Environment-variable documentation for local and deployed environments.

### Acceptance Criteria

- Local requests reach the Express application through serverless-offline.
- The API can connect to local PostgreSQL using local-only configuration.
- Deployment configuration targets `ap-south-1`.
- Production secrets are referenced through deployment configuration rather than source files.

### Dependencies

- B1.

## B3. Implement PostgreSQL schema and migrations

**Status: Implemented**

### Objective

Create the relational persistence model required by the finalized product and future phases.

### Inputs

- Storage hierarchy rules in `docs/requirements/mvp.md`.
- Data architecture in `docs/architecture.md`.

### Expected Output

- Tables for locations, subsections, supplies, and primary/backup assignments.
- Foreign keys and uniqueness constraints.
- Migration and rollback conventions.
- Local schema initialized from migrations.

### Acceptance Criteria

- A subsection references one valid location.
- A supply name is unique.
- An assignment references a valid supply, location, and subsection.
- Assignment role supports one primary and at most one backup per supply.
- Assignment location and subsection ownership can be enforced.
- Quantity supports non-negative decimal values, including zero.
- Migrations apply cleanly to a new local database and are repeatable in deployment workflows.

### Dependencies

- B1.
- B2.

## B4. Add shared API behavior

**Status: Implemented**

### Objective

Establish consistent request parsing, validation errors, authentication errors, conflict errors, not-found errors, and unexpected-error handling.

### Inputs

- API conventions and error envelope in `docs/api.md`.

### Expected Output

- Shared error types and response serializer.
- Request correlation/log context where appropriate.
- JSON parsing and safe error handling.

### Acceptance Criteria

- Errors use the documented `{ error: { code, message, details } }` envelope.
- Expected status categories map to stable error codes.
- Internal SQL, credentials, and stack traces are not returned.
- Malformed JSON and unknown resources receive actionable client-safe responses.

### Dependencies

- B1.

## B5. Implement shared-passphrase JWT sessions

**Status: Implemented**

### Objective

Protect the API with the confirmed shared-passphrase access gate and one-day signed JWT sessions.

### Inputs

- Session endpoint in `docs/api.md`.
- Security decisions in `docs/architecture.md`.

### Expected Output

- `POST /api/v1/session`.
- Passphrase verification using deployment-held configuration.
- JWT issuance and bearer-token middleware.
- Rate limiting for failed/session requests.

### Acceptance Criteria

- A valid passphrase receives a signed JWT with a one-day expiry.
- The passphrase is never logged or returned.
- Missing, malformed, expired, and invalid tokens receive `401`.
- Protected endpoints reject requests without a valid token.
- Repeated failed session attempts are rate limited with `429`.
- JWT and passphrase configuration is absent from source control.

### Dependencies

- B1.
- B4.
- B2 for environment configuration.

## B6. Implement storage location and subsection APIs

**Status: Implemented**

### Objective

Implement storage hierarchy CRUD needed by the Phase 1 UI.

### Inputs

- Storage endpoints in `docs/api.md`.
- Storage requirements in `docs/requirements/mvp.md`.

### Expected Output

- Location list/create/rename operations.
- Subsection create/rename operations.
- Authenticated JSON responses and errors.

### Acceptance Criteria

- Authenticated users can list locations with subsections.
- Users can create and rename locations.
- Users can create and rename subsections beneath a selected location.
- Subsection rename cannot change its parent location.
- Subsection/location relationships are validated server-side.
- No deletion operation is exposed until reassignment behavior is implemented in Phase 3.

### Dependencies

- B3.
- B4.
- B5.

## B7. Add Phase 1 tests and CI checks

**Status: Implemented**

### Objective

Verify the API foundation, schema, sessions, and storage hierarchy automatically.

### Inputs

- Phase 1 backend behavior and acceptance criteria.

### Expected Output

- Unit tests for shared errors and session logic.
- API/integration tests for migrations and storage endpoints.
- GitHub pull-request checks for the API repository.

### Acceptance Criteria

- Tests cover valid/invalid session behavior and expiry handling.
- Tests cover location/subsection create, list, rename, and relationship failures.
- Tests verify migration setup against local PostgreSQL.
- CI runs type checking, linting, and tests on pull requests.

### Dependencies

- B1 through B6.
