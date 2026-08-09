# Technology Specification

## Decision Summary

The MVP uses a separate React PWA repository and Node.js API repository. The API is a modular monolith deployed as one AWS Lambda application behind an API Gateway HTTP API. The deployed database is managed PostgreSQL on Neon.

## Technology Stack

| Area | Decision | Reasoning |
| --- | --- | --- |
| Frontend | React with TypeScript | Matches the product's interactive CRUD and filtered inventory experience while providing a shared type-safe language with the API. |
| PWA | Web app manifest and service-worker-based installability | Provides installability and responsive application behavior. Offline synchronization is not an MVP requirement. |
| Frontend hosting | Vercel | Suits a static/client-rendered React PWA and provides simple repository-based deployments. |
| Backend | Node.js with TypeScript and Express 4 | Low operational overhead, good fit for the small REST API, and consistent language/tooling with the frontend. Express 4 is retained for compatibility with the `serverless-http` adapter. |
| Compute | AWS Lambda | API usage is intermittent and speed is not a primary MVP concern; pay-per-use execution avoids an always-running server. |
| API gateway | AWS API Gateway HTTP API | Provides an HTTP entry point for the Lambda API with a lower-complexity, usage-based gateway model. |
| API style | Versioned REST/JSON | The domain consists of conventional CRUD resources and filtered inventory queries; REST keeps the client/server boundary straightforward. |
| Database | PostgreSQL on Neon | Relational constraints fit the location/subsection and primary/backup assignment model. Neon provides usage-based compute, scale-to-zero behavior, and serverless connection support. |
| Local database | PostgreSQL on the developer machine | Local development uses serverless-offline for Lambda behavior and local PostgreSQL for persistence. No separate development Neon database is maintained. |
| Database access | Typed relational data-access layer and migrations in the API repository | Keeps relationships, constraints, and schema changes explicit without coupling the product design to a particular ORM. |
| Authentication | Shared four-digit household PIN producing a signed JWT | Provides a lightweight MVP access gate without introducing accounts, users, roles, or password recovery. |
| Token lifetime | One day | Avoids repeated entry during normal household use while limiting the lifetime of a leaked token. |
| Token persistence | Frontend local storage | Persists the session across browser refreshes as requested. The PIN is never persisted. |
| Cache | None | MVP data volume and query patterns do not justify a separate cache. |
| Queue/background jobs | None | The MVP has no asynchronous workflows, notifications, or scheduled processing. |
| Search | PostgreSQL supply-name search | Search is limited to supply names and does not require a separate search engine. |
| Object storage | None | The MVP has no images, attachments, imports, or exports. |
| Deployment region | AWS `ap-south-1` for AWS resources | Confirmed MVP deployment region. |
| CI/CD | GitHub-based workflows for both repositories | Runs checks and deploys the frontend and API through their respective deployment targets. |
| Observability | CloudWatch logs and basic metrics | Sufficient for Lambda/API Gateway operations at MVP scale. |
| Testing | Unit, API/integration, frontend, and end-to-end tests | Covers domain invariants, request behavior, UI flows, and the critical inventory journeys. |

## Environment Model

- Local development uses the local PostgreSQL instance and serverless-offline.
- The deployed environment uses Neon PostgreSQL.
- Production secrets are configured in deployment environments, not committed to either repository.
- The frontend receives the API base URL and public configuration only.
- The backend receives the database URL, four-digit PIN, JWT signing secret, allowed frontend origin, and operational configuration.

## Cost and Hosting Rationale

Neon is selected for the MVP because the workload is small and intermittent. Its current Free plan includes 100 CU-hours and 0.5 GB per project, while its Launch plan is usage-based. AWS RDS remains a future alternative if AWS consolidation, private networking, IAM integration, compliance, or predictable provisioned capacity becomes more important than minimizing MVP operations.

The compute and API layers remain on AWS because Lambda and API Gateway match the desired pay-per-use backend model. Vercel remains the frontend deployment target because the PWA is a separate React application.

## Explicit Non-decisions

The MVP does not introduce a second database for development, offline synchronization, account identity provider, RBAC, GraphQL, WebSockets, queues, cache infrastructure, a dedicated search service, or object storage.
