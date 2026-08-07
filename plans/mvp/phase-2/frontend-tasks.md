# Phase 2 Frontend Tasks - Supply Management and Primary Inventory

## F1. Build supply create/edit workflows

### Objective

Allow users to create and edit supplies with a primary assignment.

### Inputs

- Supply API contract in `docs/api.md`.
- Storage hierarchy UI/data from Phase 1.

### Expected Output

- Supply form for name, unit, primary location, primary subsection, and quantity.
- API-backed create and edit flows.

### Acceptance Criteria

- The form offers exactly the supported units.
- Subsection options correspond to the selected primary location.
- Decimal and zero quantities can be entered.
- Duplicate-name and API validation errors are shown without losing form input.
- Successful create/edit returns the user to a useful inventory or detail state.

### Dependencies

- Phase 1 F2, F3, and F4.
- Phase 2 B1.

## F2. Build primary inventory view

### Objective

Display all supplies using their primary assignment and latest quantity.

### Inputs

- Primary inventory endpoint in `docs/api.md`.
- Primary inventory design in `docs/design.md`.

### Expected Output

- Default primary inventory screen.
- Rows/cards showing supply name, primary location, subsection, quantity, and unit.
- Loading, empty, no-results, and request-failure states.

### Acceptance Criteria

- All returned supplies are displayed with the required primary fields.
- Zero quantities remain visible.
- The view refreshes after a successful create, edit, or delete.
- No backup details are presented as primary assignment data.

### Dependencies

- Phase 1 F2 and F3.
- Phase 2 B3.

## F3. Add primary search and filters

### Objective

Provide the primary inventory discovery behavior.

### Inputs

- Query parameters in `docs/api.md`.
- Search/filter rules in `docs/requirements/mvp.md`.

### Expected Output

- Supply-name search control.
- Primary location, primary subsection, and out-of-stock filters.
- Clear-search/clear-filter behavior.

### Acceptance Criteria

- Search matches supply names only.
- The subsection filter lists/apply primary subsections only.
- Filters can be combined and cleared.
- Empty results are communicated clearly.
- Query state is reflected consistently when the user refreshes or navigates within the inventory flow.

### Dependencies

- F2.
- Phase 2 B3.

## F4. Add quantity update and supply deletion flows

### Objective

Make the common stock update and supply deletion journeys available from the primary inventory experience.

### Inputs

- Quantity and delete endpoints in `docs/api.md`.

### Expected Output

- Primary quantity edit control.
- Supply deletion confirmation flow.
- Success/failure feedback and refresh behavior.

### Acceptance Criteria

- The latest primary quantity can be changed without re-entering unrelated fields.
- Zero is accepted and immediately affects out-of-stock state.
- Negative or malformed quantity responses are displayed without overwriting valid data.
- Delete requires confirmation.
- A deleted supply no longer appears in inventory after refresh.

### Dependencies

- F2.
- Phase 2 B2.

## F5. Add Phase 2 frontend tests

### Objective

Verify the primary inventory value loop in the frontend repository.

### Inputs

- Phase 2 frontend behavior.

### Expected Output

- Component/flow tests for forms, selectors, list, search, filters, quantity updates, and deletion.

### Acceptance Criteria

- Tests cover valid create/edit and duplicate-name feedback.
- Tests cover parent-location/subsection selection behavior.
- Tests cover search, filters, clear actions, zero quantity, and no-results states.
- Tests cover update and delete success/failure states.
- Phase 1 frontend CI remains green.

### Dependencies

- F1 through F4.
