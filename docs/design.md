# Product Design

## Product Purpose

The Home Supplies Inventory App helps one household user know what supplies they have, where each supply is stored, and how much is available.

## MVP Information Model

The product is organized around three concepts:

- Storage locations, each containing subsections.
- Supplies, each with a unique name and one quantity unit.
- Storage assignments, with one primary assignment and an optional backup assignment per supply.

Primary and backup assignments have independent latest quantities. The product retains the latest value only; it does not present quantity history in the MVP.

## MVP Navigation and Views

### Primary inventory

The primary inventory view is the default all-supplies view. It shows each supply's name, primary location, primary subsection, and primary quantity with unit.

It supports supply-name search and filters for primary location, primary subsection, and out-of-stock status. The primary subsection filter applies only to the primary assignment.

### Backup inventory

The backup view is separate from the primary inventory view. It shows supplies that have an optional backup assignment, including backup location, backup subsection, and backup quantity with unit. It supports filtering by backup location.

### Out-of-stock inventory

The out-of-stock view is separate from the backup view. It shows supplies with zero quantity at both available assignments, or zero primary quantity when no backup assignment exists.

### Storage management

The storage-management experience allows the user to create, rename, and delete locations and subsections. Subsections can be renamed but cannot be moved between locations.

Deleting a location or subsection opens a reassignment flow for all affected assignments. Deletion completes only after replacement assignments have been supplied.

### Supply management

The supply-management experience allows the user to create, edit, update, and delete supplies. A supply has one supported unit, one primary assignment, and an optional different backup assignment. Primary and backup quantities can be updated independently.

## Product Rules

- Supply names are unique.
- Supported units are `g`, `kg`, `l`, `pack`, and `bottle`.
- Decimal and zero quantities are allowed.
- A supply is out of stock only when both quantities are zero, treating a missing backup as having no backup stock.
- A storage subsection belongs to one location and cannot be moved through editing.
- Location or subsection deletion requires reassignment of affected supply assignments.

The complete MVP requirements, acceptance criteria, and Architect handoff are maintained in [requirements/mvp.md](requirements/mvp.md).

## Explicitly Deferred

The MVP does not define accounts or sharing, quantity history, unit conversion, import/export, notifications, low-stock thresholds, expiration dates, images, or additional quantity units.
