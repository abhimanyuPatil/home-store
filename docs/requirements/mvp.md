# Home Supplies Inventory App - MVP Requirements

## Goals

The MVP helps a single household user keep track of where household supplies are stored and how much is available.

The MVP must allow the user to:

- Define the storage structure of the home.
- Maintain a unique list of household supplies.
- Record one primary and, optionally, one backup storage assignment for each supply.
- Record the latest quantity at each assigned location.
- Find supplies through name search and inventory filters.

The MVP is for one user and does not require sign-in.

## Scope

### Storage structure

The user can create, edit, and delete storage locations. Each location can contain subsections.

The user can create, rename, and delete subsections under a storage location. A subsection remains associated with its original storage location; its parent location cannot be changed through subsection editing.

### Supplies

The user can add, edit, and delete supplies. Supply names must be unique.

Each supply has one quantity unit selected from:

- `g`
- `kg`
- `l`
- `pack`
- `bottle`

Each supply uses one unit. Decimal quantities are allowed. The latest quantity can be updated when the supply is consumed or replenished. Quantity history is not retained in the MVP.

### Storage assignments

Each supply has exactly one primary storage assignment, consisting of:

- A storage location.
- A subsection within that location.
- A quantity using the supply's unit.

A supply may also have one optional backup storage assignment, with its own location, subsection, and quantity. The backup assignment must differ from the primary assignment.

The primary assignment is shown in the main inventory view. Backup assignments are shown in a separate backup view.

### Inventory views

The user can view all supplies in the primary inventory view. Each row displays:

- Supply name.
- Primary storage location.
- Primary subsection.
- Primary latest quantity and unit.

The primary inventory view includes:

- Search by supply name only.
- Filtering by primary storage location.
- Filtering by primary subsection.
- Filtering by out-of-stock status.

The primary subsection filter applies only to the primary assignment. Backup assignments are accessed through the separate backup view.

The backup view displays supplies that have backup assignments, including their backup location, backup subsection, and backup quantity and unit. It supports filtering by backup storage location.

The out-of-stock view displays supplies whose primary and backup quantities are both zero. A supply with no backup assignment is out of stock when its primary quantity is zero.

## Functional Requirements

### FR-1: Manage storage locations

1. The user can create a storage location with a name.
2. The user can view existing storage locations and their subsections.
3. The user can edit a storage location name.
4. The user can delete a storage location through a reassignment flow.
5. Deleting a location requires replacement assignments for all affected supply assignments and subsections before deletion completes.

### FR-2: Manage storage subsections

1. The user can create a subsection under a storage location.
2. The user can edit a subsection's name.
3. The user cannot change a subsection's parent location through editing.
4. The user can delete a subsection through a reassignment flow.
5. Deleting a subsection requires replacement assignments for all affected supply assignments before deletion completes.

### FR-3: Manage supplies

1. The user can add a supply with a unique name, quantity unit, and primary storage assignment.
2. The user can edit a supply's name, unit, primary assignment, and quantities.
3. The user can add, edit, or remove the optional backup assignment.
4. The user can delete a supply.
5. The user can update the latest primary or backup quantity independently.

### FR-4: View and find inventory

1. The user can view all supplies with their primary assignment and latest quantity.
2. The user can view supplies with backup assignments in the backup view.
3. The user can view out-of-stock supplies in the out-of-stock view.
4. The user can search by supply name.
5. The user can apply the supported primary-location, primary-subsection, and out-of-stock filters in the primary view, and the backup-location filter in the backup view.
6. The user can clear an applied search or filter and return to the unfiltered view.

## Business Rules

- A supply name is unique.
- A supply has one primary assignment and at most one backup assignment.
- A backup assignment is optional and must differ from the primary assignment.
- Primary and backup quantities are independent.
- Quantities use the supply's single selected unit.
- The supported units are `g`, `kg`, `l`, `pack`, and `bottle`.
- Decimal quantities are allowed.
- Zero quantity is allowed and is treated as a valid stored value.
- A supply is out of stock only when both primary and backup quantities are zero. If no backup exists, its effective backup quantity is not applicable, so primary quantity zero makes it out of stock.
- The MVP shows and manages the latest quantity only; it does not record quantity changes as history.
- A subsection cannot be moved to another location.
- A location or subsection deletion cannot complete until the reassignment flow has supplied replacements for all affected assignments.
- No additional name or quantity-format validation rules are defined for the MVP beyond the product rules above.

## User Journeys

### Set up storage

1. The user creates a storage location.
2. The user creates one or more subsections under it.
3. The user repeats this for other storage locations as needed.

### Add a supply

1. The user enters a unique supply name.
2. The user selects its unit.
3. The user selects a primary location and subsection.
4. The user enters the primary quantity.
5. The user optionally selects a different backup location and subsection and enters its quantity.
6. The supply appears in the primary inventory view and, if configured, the backup view.

### Update stock

1. The user opens a supply from an inventory view.
2. The user changes the latest primary or backup quantity.
3. The updated quantity is reflected in the relevant inventory and out-of-stock views.

### Reorganize storage

1. The user starts deleting a location or subsection.
2. The app identifies all affected supply assignments.
3. The user assigns replacements for each affected assignment.
4. The deletion completes only after all required replacements are provided.

## Validation and Error Handling

- The app must prevent creation or renaming of a supply when the name conflicts with an existing supply name.
- The app must prevent a backup assignment from being the same as the primary assignment.
- The app must prevent assignment of a supply to a subsection that is not under the selected location.
- The app must prevent completion of a location or subsection deletion while affected assignments lack replacement assignments.
- The app must communicate when a search or filter returns no matching supplies.
- The app must preserve the existing valid data if an add, edit, reassignment, or deletion action is cancelled or cannot be completed.

No further validation rules for names or quantity formatting are part of the MVP.

## Permissions

The MVP has one user context with no sign-in, roles, or sharing permissions.

## Acceptance Criteria

### Storage

- A user can create a location and subsections beneath it.
- A user can rename a location or subsection.
- A subsection cannot be moved to a different parent location.
- A location or subsection with affected assignments can be deleted only after the reassignment flow is completed.

### Supplies and quantities

- A user can create a supply with a unique name, one supported unit, and a primary assignment.
- A user can optionally add a different backup assignment.
- Primary and backup quantities can be changed independently.
- Decimal and zero quantities are retained and displayed with the selected unit.
- The MVP presents the latest quantity without quantity history.

### Views and discovery

- The primary view displays every supply's name, primary location, primary subsection, and primary quantity.
- The backup view displays supplies with backup assignments and their backup details.
- The out-of-stock view contains supplies with zero quantity at both available assignments, or zero primary quantity when no backup exists.
- Name search matches supply names only.
- Primary location and primary subsection filters affect the primary inventory view.
- Backup location filtering is available for the backup view.
- The user can clear search and filters.

## Out of Scope

The MVP does not include:

- Multiple users, accounts, sign-in, roles, or sharing.
- Multiple primary or backup locations beyond one of each.
- Quantity history, consumption logs, replenishment logs, undo, or audit history.
- Unit conversion.
- Import, export, or backup workflows.
- Notifications, low-stock thresholds, or expiration dates.
- Images or attachments.
- Additional quantity units beyond the defined MVP list.

## Architecture Considerations

This section is a handoff to the Architect. It records product impacts and open considerations without selecting technologies or implementation approaches.

### Data impacts

- Represent storage locations and their subsections as a parent-child hierarchy.
- Represent each supply's unique name and single unit.
- Represent primary and optional backup assignments separately, each with a location, subsection, and latest quantity.
- Preserve the distinction between zero quantity and no backup assignment.
- Support reassignment of affected assignments as part of location and subsection deletion.

### API and interaction impacts

- Operations are needed for location and subsection management, supply management, quantity updates, inventory views, search, and filters.
- The deletion flow must identify affected assignments and accept replacement assignments before completing deletion.
- Inventory responses need to support primary, backup, and out-of-stock views without losing the primary/backup distinction.
- Supply-name uniqueness and valid location/subsection relationships must be enforced consistently.

### Security and privacy considerations

- The MVP has no sign-in or sharing model.
- The Architect should determine the appropriate protection for the single-user household inventory data within the chosen product environment.

### Performance considerations

- The primary inventory view, backup view, and out-of-stock view should remain usable as the number of household supplies and storage entries grows.
- Search and the defined filters should provide timely results for the expected MVP inventory size.

### Unknowns for architecture follow-up

- The persistence and recovery expectations for the user's inventory data are not defined by the MVP.
- The expected maximum number of locations, subsections, and supplies is not defined.
- The product does not define behavior for concurrent edits because the MVP has one user and no sign-in.
