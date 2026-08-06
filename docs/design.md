# Home Supplies Inventory — Feature Design

## Problem

People need a fast, reliable way to answer two questions about household supplies: “Where is this item?” and “How much is left?” The v0 requirements define a hierarchy of storage locations and subsections, a catalog of supplies, one primary placement per supply, an optional backup placement, and editable quantities.

This design is for a greenfield application; `home-store` currently contains requirements only.

## Goals

- Maintain storage locations and their subsections.
- Maintain a reusable supply catalog.
- Assign each supply a primary placement and an optional backup placement.
- Track quantity as a numeric value plus a unit, rather than an ambiguous free-form string.
- Make the full inventory searchable and scannable on a phone or desktop.
- Make common updates—especially quantity changes—quick and low-risk.

## Non-goals

- Multi-user accounts, sharing, roles, or household collaboration.
- Shopping lists, purchase reminders, expiry tracking, recipes, or barcode scanning.
- Quantity history, audit logs, or consumption analytics in v1.
- Splitting one supply across multiple simultaneously active quantities.
- Automatic unit conversion (for example, kg to g).

## Product decisions and assumptions

- The v1 is a responsive single-household web application with persistent storage.
- A supply has one primary placement and may have one backup placement. Each placement consists of a location and subsection; the subsection must belong to that location.
- A supply’s quantity is represented by `amount` and `unit`. Supported units should initially be `g`, `kg`, `ml`, `l`, and `count`; the model should permit adding units later.
- A quantity may be zero but may not be negative. Amounts can be fractional where useful (for example, `0.5 kg`).
- Names are trimmed and case-insensitively unique within their parent scope: location names globally, subsection names within a location, and supply names globally.
- Deleting a location or subsection is blocked while it is referenced by a primary or backup placement. The user must reassign affected supplies first. This avoids silent inventory loss.
- Deleting a supply removes its placements and current quantity because v1 has no history; the UI must require confirmation.

## Proposed solution

### Core domain model

```text
StorageLocation
- id
- name
- createdAt
- updatedAt

StorageSubsection
- id
- locationId -> StorageLocation
- name
- createdAt
- updatedAt

Supply
- id
- name
- primaryPlacementId -> Placement (required)
- backupPlacementId -> Placement (optional)
- amount (decimal, >= 0)
- unit (enum/string)
- createdAt
- updatedAt

Placement
- id
- locationId -> StorageLocation
- subsectionId -> StorageSubsection
```

The implementation may model placements as embedded fields on `Supply` instead of a separate table, but the domain must enforce the same rules. If a backup placement is present, it must differ from the primary placement.

The database should enforce uniqueness and foreign keys where supported. Decimal quantities should not use binary floating-point storage; use a fixed-precision decimal or integer minor-unit representation appropriate to the chosen backend.

### Main user flows

1. **Set up storage**
   - User opens Storage Settings.
   - Creates a location such as “Cabinet”.
   - Adds subsections such as “Top Shelf” and “Bottom Shelf”.
   - Edits names inline or from a detail form.

2. **Add a supply**
   - User selects Add Supply.
   - Enters a name, amount, and unit.
   - Selects a primary location, then sees only subsections belonging to it.
   - Optionally enables and fills a backup location/subsection.
   - Saves and returns to the inventory list.

3. **Find an item**
   - Inventory is the default screen.
   - Each row/card shows supply name, quantity, primary placement, and backup placement when present.
   - Search filters by supply, location, or subsection; optional filters group by location or show low/zero quantities if those concepts are later added.

4. **Update quantity**
   - User uses a prominent quantity control from the inventory row or supply detail screen.
   - The current amount and unit are prefilled.
   - Save validates non-negative input and updates `updatedAt`.
   - A successful update is immediately reflected in the list.

5. **Move or delete data**
   - Editing a supply permits changing either placement.
   - Deleting a supply requires confirmation.
   - Deleting a referenced location/subsection shows the referencing supplies and offers a reassign path; it cannot proceed until references are removed.

### Screens

- **Inventory**: default, searchable list; add-supply action; quantity quick edit; empty state with setup guidance.
- **Supply form/detail**: create and edit name, quantity, primary placement, and optional backup placement.
- **Storage settings**: locations with nested subsections; create/edit/delete actions; reference-aware deletion errors.
- **Confirmation and validation states**: duplicate names, missing subsections, invalid amounts, and failed saves must be shown next to the relevant field and preserve entered data.

### API/service boundary

Use a conventional CRUD service boundary regardless of framework:

```text
GET    /inventory?query=&locationId=&subsectionId=
POST   /supplies
GET    /supplies/:id
PATCH  /supplies/:id
DELETE /supplies/:id
PATCH  /supplies/:id/quantity

GET    /locations
POST   /locations
PATCH  /locations/:id
DELETE /locations/:id

POST   /locations/:locationId/subsections
PATCH  /subsections/:id
DELETE /subsections/:id
```

The service should validate relationships server-side even when the UI filters subsection choices. Quantity-only updates may use a dedicated endpoint so the common action has a small payload and a clear concurrency boundary.

### Error and consistency behavior

- Return a validation error for invalid quantity, duplicate names, missing required placement, or a subsection/location mismatch.
- Return a conflict/reference error when deleting a referenced location or subsection.
- On concurrent edits, use an `updatedAt`/version check and ask the user to reload rather than silently overwriting a newer change.
- Keep delete operations transactional: a rejected delete must leave all records unchanged.

## Alternatives

### Free-form quantity text

Rejected for the primary model. It is easy to enter but makes validation, sorting, filtering, and future conversion unreliable. The UI can still render `400 g` as a friendly combined value.

### Multiple inventory records per supply

Rejected for v1. It would represent distributed stock more accurately, but conflicts with the requirement that a supply has one active placement and adds aggregation and editing complexity. The backup placement covers the immediate fallback use case.

### Hard-delete locations and null out placements

Rejected because it would make supplies appear misplaced without an explicit user decision. Blocking deletion is safer and easier to understand.

### Event-sourced quantity changes

Deferred. It would enable history and analytics, but the current requirements only need the current quantity. Add a quantity-change ledger when auditability or usage trends become a real goal.

## Risks and open questions

- **Unit semantics:** Is “count” enough for all non-weight items, or are units such as packs, bottles, and boxes needed? Start with the small enum and make it extensible.
- **Zero quantity:** Should zero-quantity supplies remain in inventory, or should the app support an “out of stock” archive/filter? Keep them visible in v1 so users do not lose the item definition.
- **Placement requirement:** The requirements imply a mapped supply, but do not explicitly say whether an unplaced supply is allowed. This design requires a primary placement when saving.
- **Backup quantity:** The v0 requirements specify a backup storage location but not a separate backup quantity. This design gives the supply one total quantity and treats backup as location metadata only. If stock can physically be split, this needs a separate inventory-record model.
- **Data portability:** Decide whether export/import is needed before selecting a production storage strategy. It is not required for the first release.
- **Authentication/deployment:** No hosting, privacy, or multi-device sync requirements are stated; these should be decided before implementation hardens the persistence layer.

## Decisions

- **Unit semantics:** Is “count” enough for all non-weight items, or are units such as packs, bottles, and boxes needed? Start with the small enum and make it extensible. - count is enough
- **Zero quantity:** Should zero-quantity supplies remain in inventory, or should the app support an “out of stock” archive/filter? Keep them visible in v1 so users do not lose the item definition. - 
- **Placement requirement:** The requirements imply a mapped supply, but do not explicitly say whether an unplaced supply is allowed. This design requires a primary placement when saving.
- **Backup quantity:** The v0 requirements specify a backup storage location but not a separate backup quantity. This design gives the supply one total quantity and treats backup as location metadata only. If stock can physically be split, this needs a separate inventory-record model.
- **Data portability:** Decide whether export/import is needed before selecting a production storage strategy. It is not required for the first release.
- **Authentication/deployment:** No hosting, privacy, or multi-device sync requirements are stated; these should be decided before implementation hardens the persistence layer.

## Testing and rollout plan

### Phase 1 — Domain and persistence

- Implement the four domain concepts and relationship constraints.
- Add migrations/schema validation and seed data for the example Cabinet, Fridge, and Drawer hierarchy.
- Unit-test quantity validation, uniqueness, subsection ownership, duplicate primary/backup placement, and reference-aware deletes.

### Phase 2 — Core experience

- Build Inventory, Supply form/detail, and Storage Settings screens.
- Add service/API integration tests for every CRUD operation and validation/error path.
- Add end-to-end coverage for: create storage, add supply, search inventory, update quantity, reassign, and delete.

### Phase 3 — Hardening

- Test responsive layouts and keyboard navigation.
- Test empty states, slow/error responses, reload persistence, and concurrent update behavior.
- Seed a realistic larger dataset and verify inventory search remains responsive.
- Roll out behind a simple feature flag or staging environment; validate the data model with real household examples before adding secondary features.

## Acceptance criteria

- A user can create, rename, and delete storage locations and subsections, with deletion blocked and explained when references exist.
- A user can create, edit, and delete supplies.
- A supply cannot be saved without a valid primary location and subsection.
- A supply can have at most one backup placement, and primary and backup placements cannot be identical.
- Subsection selectors only permit subsections belonging to the selected location.
- Quantity accepts valid decimal values and supported units, rejects negative or malformed values, and persists after reload.
- Inventory displays every supply with name, current quantity, primary location, and primary subsection; backup placement is displayed when present.
- Users can update quantity from the inventory workflow without re-entering unrelated supply data.
- Search/filter results identify supplies by name and storage hierarchy.
- Validation, conflict, and persistence errors are actionable and do not discard user input.
- Automated tests cover the domain invariants and all critical user flows listed above.

## Recommended implementation order

1. Confirm the open product decisions, especially backup quantity and whether placement is mandatory.
2. Implement schema/domain validation.
3. Implement location and subsection management.
4. Implement supply CRUD and placement mapping.
5. Build the inventory view and quantity quick edit.
6. Add search, responsive polish, accessibility, and end-to-end coverage.
