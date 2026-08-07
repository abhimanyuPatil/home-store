# Phase 1 Frontend Tasks - Platform Foundation and Storage Hierarchy

## F1. Create the React/TypeScript PWA foundation

### Objective

Create the separate frontend repository and establish the responsive, installable React application shell.

### Inputs

- `docs/technology.md`
- `docs/design.md`

### Expected Output

- React/TypeScript application.
- Responsive layout foundation.
- Web app manifest and service-worker installability configuration.
- Local and production API base URL configuration.

### Acceptance Criteria

- The app runs locally with documented commands.
- The app is installable in a supported browser configuration.
- The layout works at mobile and desktop widths.
- No offline data synchronization is presented or implied.
- Public frontend configuration contains no secrets.

### Dependencies

None; coordinate API base URL with B2.

## F2. Implement API client and session state

### Objective

Provide a single frontend boundary for authenticated REST calls and the shared-passphrase session lifecycle.

### Inputs

- Session contract in `docs/api.md`.
- JWT persistence decision in `docs/architecture.md`.

### Expected Output

- API client with bearer-token support.
- Unlock screen and session creation flow.
- Local JWT persistence, expiry handling, logout, and session clearing.

### Acceptance Criteria

- The passphrase is sent only over the configured HTTPS API in deployed use.
- A successful session is persisted locally and survives refresh.
- The passphrase is not persisted.
- Expired/invalid sessions clear local state and return the user to unlock.
- `401`, `429`, network, and generic API errors are rendered appropriately.

### Dependencies

- F1.
- B5 and the session API contract.

## F3. Build shared application states and navigation

### Objective

Create the authenticated application shell and reusable loading, empty, error, confirmation, and form-feedback states.

### Inputs

- Product views in `docs/design.md`.
- Error contract in `docs/api.md`.

### Expected Output

- Authenticated navigation structure.
- Primary, backup, out-of-stock, and storage destinations represented in the shell.
- Shared user feedback components.

### Acceptance Criteria

- Locked users cannot access authenticated screens.
- Authenticated users can navigate to storage management.
- Loading, no-results, request-failure, and successful-save states are distinguishable.
- The shell remains usable on mobile widths.

### Dependencies

- F1.
- F2.

## F4. Implement storage management UI

### Objective

Allow the user to create, view, and rename locations and subsections.

### Inputs

- Storage API contract in `docs/api.md`.
- Storage requirements in `docs/requirements/mvp.md`.

### Expected Output

- Location hierarchy screen.
- Create/rename location flow.
- Create/rename subsection flow.
- API-backed refresh and feedback behavior.

### Acceptance Criteria

- Locations and nested subsections are displayed from API data.
- A location can be created and renamed.
- A subsection can be created beneath a location and renamed.
- The UI does not offer moving a subsection to another location.
- Failed saves preserve entered values and display the API error.
- Successful changes refresh the hierarchy.

### Dependencies

- F2.
- F3.
- B6.

## F5. Add frontend checks and CI

### Objective

Make Phase 1 frontend quality checks repeatable in the frontend repository.

### Inputs

- F1 through F4.

### Expected Output

- Component/unit tests for session and storage UI behavior.
- GitHub pull-request checks.
- Vercel preview/production deployment linkage.

### Acceptance Criteria

- CI runs type checking, linting, and tests.
- Tests cover token persistence/expiry handling and storage CRUD feedback.
- Production configuration is separate from local configuration.
- A successful approved build can deploy through Vercel.

### Dependencies

- F1 through F4.
