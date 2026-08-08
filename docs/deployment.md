# MVP Deployment Plan

## 1. Purpose and deployment target

This document defines the deployment approach for the Home Store MVP. It covers the separately deployed frontend and backend repositories, the managed Neon PostgreSQL database, release sequencing, configuration, security, observability, rollback, and operational runbooks.

The target architecture is:

```text
User browser
    |
    | HTTPS
    v
React PWA on Vercel
    |
    | HTTPS REST/JSON + bearer JWT
    v
API Gateway HTTP API
    |
    v
Node.js 20 Lambda application in ap-south-1
    |
    | TLS PostgreSQL connection
    v
Neon PostgreSQL
```

The backend remains one modular monolith and one Lambda function. The frontend remains a client-rendered React PWA with online API access; no offline data synchronization is introduced.

## 2. Confirmed deployment decisions


| Area                           | Decision                                                 |
| ------------------------------ | -------------------------------------------------------- |
| Frontend hosting               | Vercel                                                   |
| Frontend build                 | React/TypeScript Vite build with `dist` output           |
| Backend compute                | AWS Lambda, Node.js 20 runtime                           |
| API entry point                | API Gateway HTTP API                                     |
| AWS region                     | `ap-south-1`                                             |
| Infrastructure/deployment tool | Serverless Framework v4                                  |
| Database                       | Neon PostgreSQL                                          |
| Backend repository             | Separate repository from the frontend                    |
| Authentication                 | Shared four-digit PIN producing a one-day signed JWT    |
| Frontend API configuration     | Public `VITE_API_BASE_URL` build variable                |
| Database migrations            | Versioned SQL migrations owned by the backend repository |
| CI/CD                          | GitHub-based; pipeline implementation is a follow-up     |


Serverless Framework v4 is pinned by `frameworkVersion: '4'` and the backend dependency. Deployments should use the repository-local CLI through `npx serverless` or the npm scripts, rather than an unpinned global CLI. Serverless documents `serverless deploy` for CloudFormation-backed service deployment and `serverless deploy function` for a code-only function update; infrastructure changes must use the full service deployment.

References: [Serverless setup and v4 workflow](https://wb.serverless.com/framework/docs-getting-started), [Serverless AWS deploy](https://wb.serverless.com/framework/docs-providers-aws-cli-reference-deploy).

## 3. Environment model

The MVP starts with local development and one deployed production environment. A separate production-like staging environment is recommended before enabling automatic production deployment, but it is not required to launch the first household deployment.


| Environment    | Frontend                     | API                                                                                | Database                                | Purpose                     |
| -------------- | ---------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------- | --------------------------- |
| Local          | Vite dev server              | Local Express or Serverless Offline                                                | Developer-managed PostgreSQL            | Development and debugging   |
| Preview/review | Vercel Preview Deployment    | A deliberately selected API target; do not point previews at production by default | No automatic production database access | UI review and smoke testing |
| Production     | Vercel Production Deployment | Lambda/API Gateway in `ap-south-1`                                                 | Neon production project/branch          | Real household usage        |


Recommended preview policy: keep Vercel previews connected to a non-production API/database only once a staging environment exists. Until then, use local validation and a production deployment smoke test; never put production database credentials into the frontend or Vercel.

## 4. Prerequisites and ownership

Before the first deployment, the following must exist:

### Accounts and access

- GitHub repositories for the frontend and backend.
- A Vercel project linked to the frontend repository.
- An AWS account with billing enabled and deployment access in `ap-south-1`.
- A Neon project and production database/branch.
- A Serverless Framework v4 account/license configuration suitable for the deployment workflow.
- A deployment identity that can use CloudFormation, Lambda, API Gateway, IAM pass-role, CloudWatch Logs, and the Serverless deployment bucket. Prefer GitHub Actions OIDC over long-lived AWS access keys.



### Repository readiness

- Committed lockfiles in both repositories.
- Backend `serverless.yml` configured for the production region and HTTP API.
- Frontend build verified with `npm run build`.
- Backend build, lint, format, and tests passing.
- A production API domain or the API Gateway execute-api URL selected for `VITE_API_BASE_URL`.
- A frontend production origin selected for backend CORS, for example `https://app.example.com`.



### Domain plan

The MVP can launch with Vercel's assigned domain and API Gateway's assigned HTTPS URL. For a stable public deployment, use a custom frontend domain and retain the API Gateway URL behind a documented API hostname strategy. CORS must contain the exact browser origin, including scheme and hostname and excluding a trailing path.

## 5. Neon PostgreSQL deployment



### 5.1 Create and configure the database

1. Create a Neon project in a region reasonably close to the AWS workload and household users.
2. Create or select the production branch/database.
3. Create a restricted application role with only the permissions required by the application schema and migrations.
4. Obtain the pooled PostgreSQL connection string for the Lambda workload. Use TLS and keep the connection string private.
5. Store the connection string in the backend deployment secret store, not in GitHub source, Vercel, or frontend variables.
6. Record the Neon project, branch, database, role, and connection ownership in the deployment inventory.

The backend uses `pg` and creates a small connection pool. A Neon pooled endpoint is preferred for a Lambda workload because it reduces the chance of exhausting database connections during concurrent or bursty invocations. Production SSL is enabled by the backend connection configuration.

### 5.2 First schema creation

PostgreSQL database creation and schema migration are separate operations:

1. Create the Neon database/branch using the Neon console or provider tooling.
2. Configure the backend migration environment with the Neon connection string.
3. Run the migration job from the backend repository.
4. Confirm that the expected tables, indexes, constraints, and `schema_migrations` record exist.
5. Only then deploy the Lambda API.

Do not run schema creation from Lambda startup. Lambda can have concurrent cold starts, and deployment should not depend on a request-triggered migration.

### 5.3 Required migration hardening before pipelines

The current migration implementation is an MVP foundation and needs two changes before automated deployment:

- The migration runner currently reads only `migrations/001_initial.sql`. Change it to discover ordered migration files such as `001_initial.sql`, `002_add_index.sql`, and apply only versions absent from `schema_migrations`.
- The `npm run migrate` script currently invokes `tsx` directly and does not load `.env` automatically. Make local migration execution explicitly load `.env`, or require `DATABASE_URL` to be exported by the caller. CI and production migration jobs should inject environment variables directly.

The migration runner should:

1. Discover migration files in lexical/version order.
2. Validate the filename and derive a unique version.
3. Acquire a PostgreSQL advisory lock so two migration jobs cannot run concurrently.
4. Run each pending migration in its own transaction where supported.
5. Record the version only after successful completion.
6. Fail closed on a partially applied migration or duplicate version.
7. Emit the applied versions without logging credentials.

Migrations should be forward-compatible with the currently deployed application. For a breaking schema change, deploy additive schema support first, deploy application code second, and remove obsolete schema only in a later release.

## 6. AWS Lambda and API Gateway deployment



### 6.1 AWS resources

Serverless Framework should manage the following resources in `ap-south-1`:

- One Lambda function for the compiled backend handler.
- One API Gateway HTTP API with routes forwarding to the Lambda function.
- Lambda execution role with minimum permissions.
- CloudWatch log group with an explicit retention period.
- Deployment artifacts and the Serverless deployment bucket.
- Optional alarms and notification integrations added as operational maturity increases.

The current backend configuration uses Node.js 20, API Gateway HTTP API, CORS, and the compiled handler at `dist/src/handler.handler`.

### 6.2 Backend production configuration

The Lambda environment must contain:


| Variable                    | Source                        | Sensitive                  |
| --------------------------- | ----------------------------- | -------------------------- |
| `NODE_ENV`                  | Deployment configuration      | No                         |
| `DATABASE_URL`              | Neon pooled connection secret | Yes                        |
| `JWT_SECRET`                | Secret manager                | Yes                        |
| `HOUSEHOLD_PIN`             | GitHub production secret     | Yes                        |
| `ALLOWED_ORIGINS`           | Deployment configuration      | No, but security-sensitive |
| `FRONTEND_ORIGIN`           | Deployment configuration      | No                         |


Use a managed secret store or encrypted parameter store for sensitive values. The deployment role should read only the parameters needed for this service. The four-digit PIN is held as an encrypted GitHub secret and deployed only to Lambda. Never print it or expose it to Vercel. Do not put the PIN, JWT secret, or Neon connection string in logs or command-line arguments captured by CI.

The existing `serverless.yml` resolves values from deployment environment variables. Before pipeline implementation, choose one controlled injection method—GitHub Actions environment injection from a protected secret store, or Serverless/CloudFormation references to encrypted AWS parameters—and use it consistently for every production deployment.

### 6.3 AWS deployment sequence

For an infrastructure or application release:

1. Check out the exact approved backend commit.
2. Install with `npm ci`.
3. Run build, lint, formatting checks, unit/API tests, and package validation.
4. Run the migration job against Neon if the release contains pending migrations.
5. Package the compiled Lambda and migrations with `npx serverless package --stage production --region ap-south-1`.
6. Inspect the generated artifact and resolved configuration for accidental secrets or missing variables.
7. Deploy with `npx serverless deploy --stage production --region ap-south-1 --conceal`.
8. Capture the API Gateway URL and CloudFormation stack outputs.
9. Run authenticated and unauthenticated smoke tests.
10. Monitor CloudWatch and API Gateway metrics before declaring success.

Use a full `serverless deploy` when changing API Gateway, IAM, environment, packaging, or other infrastructure. Use `serverless deploy function --function api` only for a code-only change after confirming the infrastructure is unchanged.

### 6.4 API Gateway and CORS verification

Verify all of the following after deployment:

- `POST /api/v1/session` is reachable without a bearer token.
- Protected endpoints return `401` without a token.
- A valid session token can call a protected read endpoint.
- The production frontend origin receives the correct CORS headers.
- The API does not allow arbitrary origins.
- `OPTIONS` requests succeed for browser preflight.
- API Gateway and Lambda error responses retain the documented JSON error envelope.



## 7. Vercel frontend deployment



### 7.1 Project configuration

Create a Vercel project linked to the frontend repository with:

- Root directory: `frontend` when both repository directories are present in one source repository; use repository root if the frontend repository is split out.
- Framework preset: Vite or Other.
- Install command: `npm ci`.
- Build command: `npm run build`.
- Output directory: `dist`.
- Production branch: `main`.
- Node.js version aligned with the repository CI, preferably Node 20.

Vercel Git integration provides preview deployments for branch/PR changes and production deployments from the configured production branch. [Vercel Git deployments](https://vercel.com/docs/git) and [Vercel deployment overview](https://vercel.com/docs/deployments/overview) describe this behavior.

### 7.2 Vercel environment variables

The only required frontend deployment variable is:

```text
VITE_API_BASE_URL=https://<api-gateway-domain>/api/v1
```

Configure it separately for Development, Preview, and Production. Vite variables prefixed with `VITE_` are embedded into the browser bundle and must be treated as public. Never add database URLs, JWT secrets, PINs, AWS credentials, or private deployment tokens to Vercel frontend variables.

Vercel environment variable changes apply to new deployments, so trigger a new deployment after changing the API URL. See [Vercel environment variables](https://vercel.com/docs/environment-variables).

### 7.3 SPA/PWA verification

After deployment, verify:

- The root route loads directly and after refresh.
- `/backup`, `/out-of-stock`, `/storage`, and supply routes do not produce a hosting 404.
- The manifest is served with the expected content type.
- The service worker registers in a production browser context.
- The PWA is installable in a supported browser.
- API calls use HTTPS and the production API URL.
- No API secrets or PIN values appear in the generated bundle.

If direct route refreshes fail, configure Vercel's SPA fallback/rewrite to serve `index.html` for application routes while preserving static asset paths.

## 8. Release process

The deployment pipeline to implement later should follow this order:

```text
Pull request
  -> frontend/backend checks
  -> review and approval
  -> build immutable artifacts
  -> apply compatible database migrations
  -> deploy backend
  -> verify API
  -> deploy frontend
  -> verify critical user journeys
  -> monitor and close release
```

Database migrations must be backward-compatible with the old application before the backend rollout. The frontend should be deployed after the API because it depends on the API base URL and contract. For a frontend-only change, backend and migration steps can be skipped after the normal compatibility checks.

### Release gates

- Lockfiles are present and `npm ci` succeeds.
- Build, lint, formatting, and tests pass for the changed repository.
- Backend package contains the compiled handler and migrations.
- No secrets are present in artifacts or logs.
- Migration plan is reviewed when SQL changes are present.
- Production CORS and API URL values are confirmed.
- Smoke test credentials are available without exposing the real PIN in logs.
- Rollback target and owner are identified before deployment.



## 9. Rollback strategy



### Frontend rollback

Vercel provides deployment history and rollback/redeployment of a previously successful deployment. Roll back the frontend when the issue is isolated to browser behavior, styling, routing, or a client release. Keep the API backward-compatible until the rollback decision is complete.

### Backend rollback

Redeploy the last known-good backend commit or packaged artifact with Serverless Framework. Verify the API Gateway URL and environment configuration after rollback. Do not delete the CloudFormation stack as a rollback mechanism.

### Database rollback

Database changes are forward-only by default. Do not automatically run a destructive down migration in production. Prefer a compensating migration. If data restoration is required, use Neon's supported restore/branch workflow with an explicit incident decision and data-loss assessment.

### Compatibility rule

When a release includes frontend, backend, and schema changes, the schema must support both the old and new backend during the rollout window. This makes frontend/backend rollback possible without immediately rolling back the database.

## 10. Security and access controls

- Use separate AWS deployment and runtime identities.
- Prefer GitHub Actions OIDC with a narrowly scoped trust policy instead of static AWS keys.
- Restrict deployment permissions to the `home-store` service and `ap-south-1` where practical.
- Restrict Lambda runtime permissions to logs and required secret reads.
- Rotate `JWT_SECRET`, the configured PIN, and the Neon database credential through a controlled release.
- After JWT secret rotation, expect all existing sessions to become invalid.
- Keep the shared PIN out of frontend, Vercel, and CloudWatch logs; store it only as a protected GitHub secret.
- Restrict CORS to known frontend origins.
- Keep dependency and secret scanning in CI.
- Use HTTPS for Vercel, API Gateway, and Neon connections.
- Do not expose database errors, SQL, credentials, or stack traces to clients.



## 11. Observability and alerts



### Logs

The API already emits structured request logs containing request ID, method, path, status, and duration. CloudWatch should retain these logs for a defined period and avoid logging request bodies for session or credential-bearing endpoints.

### Metrics and initial alarms

Monitor:

- API Gateway 4xx rate, especially authentication failures and throttling.
- API Gateway 5xx rate.
- Lambda invocation errors.
- Lambda duration and timeout count.
- Lambda throttles and concurrency.
- Neon connection errors, compute usage, storage, and database health.
- Vercel deployment failures and frontend build failures.

Initial user-impact alarms should cover sustained API 5xx errors, Lambda errors/timeouts, and database connection failures. A later iteration can add latency SLOs and notification routing.

### Operational identifiers

Every incident investigation should record:

- Release commit SHA.
- Serverless/CloudFormation stack and stage.
- API Gateway URL.
- Lambda log group and request ID.
- Neon project/branch and migration version.
- Vercel deployment URL and deployment ID.



## 12. Runbooks



### API returns 5xx after deployment

1. Check the API Gateway 5xx and Lambda error metrics.
2. Search CloudWatch logs by the `X-Request-Id` returned to the client.
3. Confirm required Lambda environment variables are present without printing values.
4. Confirm the Neon connection string and pooled endpoint are valid.
5. Check whether a migration completed and whether `schema_migrations` is at the expected version.
6. If the release is the likely cause, redeploy the previous backend artifact.
7. Re-run the session and authenticated read smoke tests.



### Frontend cannot call the API

1. Confirm the deployed `VITE_API_BASE_URL` is the production API URL and includes `/api/v1` exactly once.
2. Inspect browser network and console output for CORS or mixed-content failures.
3. Confirm API Gateway responds to `OPTIONS` from the exact Vercel origin.
4. Confirm `ALLOWED_ORIGINS` and `FRONTEND_ORIGIN` match the production origin.
5. Trigger a new Vercel deployment after changing an environment variable.



### Migration failure

1. Stop the release before deploying a dependent backend change.
2. Inspect the failed migration without exposing `DATABASE_URL`.
3. Confirm the migration is safe to retry and whether its transaction rolled back.
4. If needed, repair with a reviewed forward migration; do not edit an already-applied migration file.
5. Verify `schema_migrations` and the affected constraints/indexes.
6. Resume deployment only after the migration and application compatibility are confirmed.



### Suspected credential compromise

1. Rotate the affected Neon credential, JWT secret, or configured PIN.
2. Redeploy the backend with the new secret.
3. Confirm old JWTs are rejected when the signing secret changes.
4. Review CloudWatch, GitHub, Vercel, and Neon access logs.
5. Remove the exposed value from any logs or artifacts where possible and document the incident.



## 13. Cost and scaling controls

- Keep Lambda memory, timeout, and API Gateway configuration sized for the small MVP workload; measure before tuning.
- Use the Neon pooled connection and a small application pool to avoid connection-related scale costs.
- Monitor Neon compute-hours, storage, and branch usage against the selected plan.
- Monitor Vercel build/deployment usage and retain only the deployment history needed for rollback.
- Do not add a cache, queue, NAT gateway, VPC, read replica, or always-on service until measurements justify it.
- Revisit the architecture if usage grows beyond a single household, if many concurrent connections appear, or if privacy/compliance requires private networking.



## 14. Pipeline follow-up scope

This document intentionally does not add or modify deployment pipelines. The next implementation step should create:

- Backend CI/CD with test, package, migration gate, Serverless v4 deploy, smoke test, and rollback controls.
- Frontend Vercel project configuration with Preview/Production variables and deployment checks.
- GitHub OIDC or another approved AWS authentication method.
- Secret-store setup and environment ownership.
- Migration discovery/advisory-lock support before migrations are automated.
- CloudWatch log retention and baseline alarms.



## 15. First-deployment checklist

- [x] Neon production project and database created.
- [x] Neon pooled connection string tested from the migration runner.
- [x] Initial schema migration applied successfully.
- [ ] Migration runner hardened for multiple versions.
- [ ] AWS deployment identity configured for Serverless Framework v4.
- [x] AWS secret values configured.
- [ ] Backend deployed in `ap-south-1`.
- [ ] API Gateway URL recorded.
- [ ] Session endpoint smoke-tested.
- [ ] Authenticated read endpoint smoke-tested.
- [ ] Vercel project linked to the frontend repository.
- [ ] `VITE_API_BASE_URL` configured separately for the target environment.
- [ ] Production CORS verified from the deployed frontend origin.
- [ ] PWA installability and direct route refresh verified.
- [ ] CloudWatch logs and initial alarms confirmed.
- [ ] Previous backend and frontend deployments identified for rollback.

### Authentication configuration note

The MVP uses a four-digit `HOUSEHOLD_PIN`. GitHub Actions passes this protected secret to the backend deployment, and the Lambda environment receives the same value as `HOUSEHOLD_PIN`. The session request field is `pin`; no passphrase hash generation is required.
