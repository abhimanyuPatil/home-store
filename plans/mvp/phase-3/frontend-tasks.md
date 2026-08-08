# Phase 3 Frontend Tasks - Backup, Reassignment, and Release Hardening

## F1. Add backup assignment controls

**Status: Implemented**

### Objective

Allow users to create, edit, remove, and update the optional backup assignment.

### Inputs

- Backup API behavior from `docs/api.md`.
- Storage hierarchy data from Phase 1.

### Expected Output

- Optional backup section in supply create/edit flow.
- Backup location/subsection selectors.
- Backup quantity update control.

### Acceptance Criteria

- Backup assignment can be enabled or omitted.
- Backup selectors use valid location/subsection combinations.
- The primary and backup assignment cannot be identical.
- Backup quantity can be changed independently.
- Backup assignment can be removed without affecting primary data.
- API failures preserve user input and show actionable feedback.

### Dependencies

- Phase 2 F1 and F4.
- Phase 3 B1.

## F2. Build backup inventory view

**Status: Implemented**

### Objective

Provide the separate backup tab/screen required by the product design.

### Inputs

- `GET /api/v1/inventory/backup`.
- Backup view requirements.

### Expected Output

- Backup inventory screen.
- Backup location filter.
- Loading, empty, no-results, and failure states.

### Acceptance Criteria

- Only supplies with backup assignments are shown.
- Backup location, subsection, quantity, and unit are displayed.
- The backup filter affects backup location only.
- The view updates after backup add, edit, removal, or quantity update.
- No-backup empty state explains that supplies can be configured from supply editing.

### Dependencies

- F1.
- Phase 3 B2.

## F3. Build out-of-stock view

**Status: Implemented**

### Objective

Provide the separate out-of-stock tab/screen based on both available quantities.

### Inputs

- Out-of-stock API/query behavior.
- Out-of-stock definition in `docs/requirements/mvp.md`.

### Expected Output

- Out-of-stock inventory screen.
- Correct empty and populated states.

### Acceptance Criteria

- A supply with no backup appears when primary quantity is zero.
- A supply with a backup appears only when both quantities are zero.
- A non-zero backup excludes a zero-primary supply from the out-of-stock view.
- Quantity updates refresh the view without stale classification.

### Dependencies

- Phase 2 F2 and F4.
- Phase 3 B2.

## F4. Build reassignment deletion workflow

**Status: Implemented**

### Objective

Allow users to delete locations/subsections by assigning valid replacements for affected supply assignments.

### Inputs

- Reassignment API behavior from `docs/api.md`.
- Storage deletion journey in `docs/requirements/mvp.md`.

### Expected Output

- Affected-assignment review step.
- Replacement location/subsection controls per assignment.
- Confirmation and result states.

### Acceptance Criteria

- The user sees all affected primary and backup assignments before deletion.
- Each affected assignment can be mapped to a valid replacement.
- Assignment role and current quantity remain understandable during reassignment.
- The delete action remains unavailable while required mappings are incomplete.
- API rejection preserves the workflow state and explains the failure.
- Successful deletion refreshes storage, supply, primary, backup, and out-of-stock views.

### Dependencies

- Phase 1 F4.
- Phase 3 B3 and B4.

## F5. Complete PWA and release quality

**Status: Implemented**

### Objective

Harden the frontend for the MVP release and verify the complete user experience.

### Inputs

- All prior frontend tasks.
- Frontend deployment and security requirements.

### Expected Output

- Responsive/accessibility polish.
- PWA installability verification.
- Production configuration.
- End-to-end browser tests.
- GitHub CI/CD completion for the frontend repository.

### Acceptance Criteria

- Core journeys work at mobile and desktop widths.
- The PWA can be installed in supported browsers.
- Session expiry returns the user to the unlock flow.
- No passphrase or secret is persisted in frontend configuration or local storage.
- Tests cover storage, primary inventory, backup, out-of-stock, reassignment, and failure paths.
- Pull-request checks and approved Vercel deployment are operational.

### Dependencies

- F1 through F4.
- Phase 3 B5 and B6 for integrated environment verification.
