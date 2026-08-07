# Home Supplies Inventory App - MVP Implementation Plan

## Objective

Deliver the finalized single-user, online-only inventory PWA with storage management, primary supply inventory, optional backup inventory, out-of-stock views, and reassignment-based storage deletion.

The implementation uses separate frontend and API repositories:

- React/TypeScript PWA hosted on Vercel.
- Node.js/TypeScript/Express modular monolith deployed as one AWS Lambda application behind an API Gateway HTTP API in `ap-south-1`.
- Neon PostgreSQL for the deployed database.
- Local PostgreSQL plus serverless-offline for development.

## Phase sequence

### Phase 1: Platform foundation and storage hierarchy

Build the repositories' execution foundations, database schema and migrations, shared API behavior, shared-passphrase JWT sessions, and storage location/subsection management.

Milestone: the user can unlock the application, create and rename locations and subsections, and retrieve the persisted hierarchy.

### Phase 2: Supply management and primary inventory

Build supply CRUD, primary assignments, quantity updates, the primary inventory view, name search, and primary inventory filters.

Milestone: the user can manage supplies from creation through primary inventory search and quantity updates.

### Phase 3: Backup inventory, reassignment, and release hardening

Build optional backup assignments and quantities, the separate backup and out-of-stock views, atomic reassignment deletion workflows, and release-quality verification and observability.

Milestone: all MVP acceptance criteria pass in the deployed online application.

## Rationale for phase boundaries

Phase 1 establishes the boundaries every later feature depends on: deployment, authentication, persistence, API errors, and valid storage relationships.

Phase 2 delivers the smallest complete inventory value loop using only the primary assignment. It can be tested independently while the more complex backup and reassignment behavior remains isolated.

Phase 3 contains workflows that require the complete assignment model and transactional multi-record changes. It also provides a focused hardening stage before declaring the MVP ready.

## Critical path

```text
Repository/runtime foundation
        -> database schema and migrations
        -> authentication and API client
        -> storage hierarchy
        -> supply and primary assignment
        -> primary inventory/search/filters
        -> backup and reassignment workflows
        -> end-to-end verification and release
```

Frontend shell work can proceed alongside backend foundation work once the API contract and environment conventions are agreed. Storage UI work depends on the storage endpoints. Supply forms depend on storage data being available. Backup and reassignment UI work depends on the Phase 3 API behavior.

## Cross-repository dependencies

- The API repository defines the deployed API base URL, authentication contract, resource shapes, error envelope, and CORS origin.
- The frontend repository consumes the API contract and must not duplicate server-side business rules as its authority.
- Both repositories require independent GitHub checks.
- Frontend production deployment depends on the API production URL and frontend origin being configured consistently.
- API production deployment depends on Neon credentials and JWT/passphrase secrets being configured outside source control.

## Milestones and quality gates

### Phase 1 gate

- Local API and frontend run using the documented local services.
- Deployed API can issue and validate sessions.
- Storage hierarchy CRUD and persistence work through the API and UI.
- Database migrations apply cleanly.
- Pull-request checks run in both repositories.

### Phase 2 gate

- Supply-name uniqueness and assignment invariants are enforced by the API.
- Primary inventory, search, filters, and quantity updates work end to end.
- API and frontend tests cover the primary inventory journeys.

### Phase 3 gate

- Backup and out-of-stock views match the MVP rules.
- Location/subsection deletion is atomic and requires complete reassignment.
- Authentication, error, rate-limit, and transaction failure paths are tested.
- Production logs and basic metrics are available.
- All MVP acceptance criteria are verified in the deployed environment.

## Risks and mitigations

- **Lambda/PostgreSQL connections:** use the selected serverless-compatible PostgreSQL access approach and verify connection behavior under concurrent invocations early.
- **JWT in local storage:** treat the shared passphrase as an access gate, avoid unsafe HTML injection, keep token lifetime to one day, and apply dependency/security checks.
- **Reassignment complexity:** implement and test the operation as one transaction with explicit affected-assignment mappings.
- **Contract drift between repositories:** keep API types/examples and frontend client expectations aligned through contract-focused tests or generated checks where practical.
- **Environment mismatch:** use local PostgreSQL for development and Neon only for deployed environments, with repeatable migrations applied to both.
- **Unspecified inventory scale:** begin without pagination, caching, or a dedicated search service; revisit only when real usage requires it.

## Definition of done

The MVP is complete when the three phase gates pass, the deployed PWA can complete all critical user journeys against the deployed API and Neon database, and no MVP requirement remains unimplemented or knowingly unverified.
