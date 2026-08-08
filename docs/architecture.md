# System Architecture

## Overview

The system is a single-user, online-only inventory application composed of two separately deployed repositories:

```text
React PWA on Vercel
        |
        | HTTPS REST/JSON + signed JWT
        v
API Gateway HTTP API
        |
        v
Node.js/TypeScript/Express modular monolith in one Lambda application
        |
        | PostgreSQL connection through serverless-compatible access
        v
Neon PostgreSQL
```

The browser is responsible for the product interface and stores the one-day session token locally. The API is the authority for authentication, business rules, relationships, reassignment, and persistence.

## Application Structure

The backend is a modular monolith with one deployable Lambda application. Internally it is separated by product capability:

- Authentication/session access.
- Storage locations and subsections.
- Supplies.
- Inventory projections and filtering.
- Shared validation, errors, and persistence utilities.

These modules share one process and database but keep their domain rules and API handlers separated. Microservices are not justified by the MVP's single-user scope and low operational complexity.

## Request Flow

1. The PWA sends an HTTPS request to the API Gateway HTTP API.
2. The API checks the bearer JWT, except for the session-creation endpoint.
3. The request is routed to the relevant modular-monolith capability.
4. Business validation is applied.
5. PostgreSQL performs the read or transaction.
6. The API returns a consistent JSON response or error envelope.

The frontend origin is restricted through CORS configuration. The API must not trust client-side filtering or relationship selections as a substitute for server-side validation.

## Authentication and Security

### Shared PIN session

The MVP has no user accounts. A shared four-digit household PIN is entered into the PWA and sent only over HTTPS to the session endpoint. The backend compares it with its configured PIN and returns a signed JWT when valid.

The JWT expires after one day. The PWA persists the JWT locally so a refresh does not require re-entry. The PIN is never stored locally. When the JWT expires, the PWA clears it and requires the PIN again.

The shared PIN is an access gate, not a multi-user identity system. Anyone who knows it can access the inventory. PIN rotation requires changing the configured backend PIN; changing the JWT signing secret is a separate operation.

### Required protections

- HTTPS for deployed frontend and API traffic.
- Secure handling of the PIN and JWT signing secret through deployment secrets.
- Rate limiting on the session endpoint to reduce guessing attempts.
- No secrets in frontend build variables; frontend configuration is public.
- CORS restricted to the deployed PWA origin and explicitly configured local development origins.
- Parameterized or safely bound database queries.
- Server-side enforcement of all relationship and uniqueness rules.
- Error responses that do not expose database credentials, SQL, or internal stack traces.

Local storage persistence means an XSS vulnerability could expose the JWT. The frontend must avoid unsafe HTML injection and use dependency/security checks in CI. A future security upgrade can move sessions to secure HTTP-only cookies or introduce a real identity provider.

## Data Architecture

The relational model consists of:

### Storage locations

Stores the location name. A location owns zero or more subsections.

### Storage subsections

Stores the subsection name and its owning location. A subsection cannot change parent location through the product workflow.

### Supplies

Stores the unique supply name and its single quantity unit. The unit is one of `g`, `kg`, `l`, `pack`, or `bottle`.

### Supply assignments

Stores a supply's primary or backup assignment, including:

- Assignment role: primary or backup.
- Location.
- Subsection.
- Latest quantity as a non-negative decimal.

Each supply has exactly one primary assignment and at most one backup assignment. Database and service rules must ensure that the backup assignment differs from the primary assignment and that the subsection belongs to the selected location.

The distinction between a zero quantity and no backup assignment must be preserved. Out-of-stock is derived as primary quantity zero and, when present, backup quantity zero.

## Transactional Operations

The following operations require transactional behavior:

- Creating or editing a supply and its assignments.
- Adding, changing, or removing a backup assignment.
- Reassigning affected assignments during location deletion.
- Reassigning affected assignments during subsection deletion.

Location or subsection deletion must be all-or-nothing. If any replacement is missing or invalid, no reassignment or deletion is committed.

## Deployment Architecture

### Frontend repository

The React PWA repository is connected to Vercel. Pull requests run frontend checks and preview deployments may be generated by the hosting workflow. Approved changes deploy the production PWA.

### API repository

The Node.js API repository runs tests and packaging checks through GitHub-based CI/CD. Approved changes deploy the single Lambda application behind the API Gateway HTTP API in `ap-south-1`.

### Database

Neon is the deployed PostgreSQL provider. Schema migrations live with the API and are applied as a controlled deployment step. Local development uses a developer-managed PostgreSQL instance; it does not share the deployed database.

No custom application backup, restore, archival, or replication workflow is included in the MVP.

## Scalability Boundaries

The architecture is sized for one household and low traffic. Lambda can add concurrent executions and Neon can scale managed database compute as usage grows, but the MVP does not define capacity targets or introduce caching, read replicas, queues, or service decomposition.

If the product later supports many households, account identity, sharing, or higher traffic, tenancy boundaries, authorization, indexing, connection limits, and operational SLOs must be revisited before scaling the current access model.

## Observability and Failure Handling

- Emit structured request and error logs from the API to CloudWatch.
- Capture API Gateway and Lambda invocation/error/duration metrics.
- Return stable client-safe error codes for validation, authentication, conflict, not-found, and internal errors.
- Keep user-entered data in the PWA when a request fails so the user can retry.
- Treat database failures and deployment failures as operational errors; do not silently report them as successful writes.

## Confirmed Architectural Decisions

- Modular monolith rather than microservices.
- Node.js/TypeScript/Express rather than Java/Spring Boot.
- REST/JSON rather than GraphQL or WebSockets.
- Lambda/API Gateway HTTP API rather than an always-running API service.
- Neon PostgreSQL rather than AWS RDS for the MVP.
- Separate frontend and API repositories.
- Online-only PWA behavior; no offline synchronization.
- Shared four-digit PIN with one-day signed JWT sessions; no account system.
