# API Specification

## API Conventions

- Protocol: HTTPS.
- Style: versioned REST/JSON.
- Base path: `/api/v1`.
- Authentication: bearer JWT on every endpoint except session creation.
- Content type: `application/json`.
- IDs: opaque resource identifiers returned by the API.
- Quantity: non-negative decimal value plus the supply's selected unit.
- Pagination: not required for the MVP.
- CORS: allow only configured PWA and local development origins.

## Authentication

### Create a session

`POST /api/v1/session`

Request:

```json
{
  "passphrase": "shared-household-passphrase"
}
```

Response `200`:

```json
{
  "token": "<signed-jwt>",
  "expiresAt": "2026-08-08T12:00:00Z"
}
```

The backend validates the passphrase against its configured verifier and issues a signed JWT with a one-day expiry. The passphrase must not be logged. Failed attempts receive a generic authentication error and are subject to rate limiting.

### Authenticated request

```http
Authorization: Bearer <signed-jwt>
```

An expired, malformed, or invalid token returns `401`.

## Storage Locations

### List locations

`GET /api/v1/locations`

Returns locations with their subsections.

### Create a location

`POST /api/v1/locations`

Request:

```json
{
  "name": "Cabinet"
}
```

### Rename a location

`PATCH /api/v1/locations/{locationId}`

Request:

```json
{
  "name": "Kitchen Cabinet"
}
```

### Delete a location with reassignment

`POST /api/v1/locations/{locationId}/delete`

Request:

```json
{
  "reassignments": [
    {
      "assignmentId": "assignment-id",
      "replacementLocationId": "replacement-location-id",
      "replacementSubsectionId": "replacement-subsection-id"
    }
  ]
}
```

The API validates every affected primary and backup assignment, applies all replacements, and deletes the location in one transaction. If any affected assignment is missing or invalid, the operation makes no changes.

## Storage Subsections

### Create a subsection

`POST /api/v1/locations/{locationId}/subsections`

Request:

```json
{
  "name": "Top Shelf"
}
```

### Rename a subsection

`PATCH /api/v1/subsections/{subsectionId}`

Request:

```json
{
  "name": "Upper Shelf"
}
```

The parent location cannot be changed through this endpoint.

### Delete a subsection with reassignment

`POST /api/v1/subsections/{subsectionId}/delete`

Request:

```json
{
  "reassignments": [
    {
      "assignmentId": "assignment-id",
      "replacementLocationId": "replacement-location-id",
      "replacementSubsectionId": "replacement-subsection-id"
    }
  ]
}
```

The API applies all replacements and deletes the subsection atomically.

## Supplies

### List supplies

`GET /api/v1/supplies`

Query parameters:

- `search`: supply-name search text.
- `primaryLocationId`: primary location filter.
- `primarySubsectionId`: primary subsection filter.
- `outOfStock`: `true` to return out-of-stock supplies.

The response contains primary assignment details. Backup details may be included as an explicit optional field for supply editing, but the primary inventory presentation is driven by primary assignment data.

### Get a supply

`GET /api/v1/supplies/{supplyId}`

Returns the supply, unit, primary assignment, and optional backup assignment.

### Create a supply

`POST /api/v1/supplies`

Request:

```json
{
  "name": "Oats",
  "unit": "g",
  "primary": {
    "locationId": "location-id",
    "subsectionId": "subsection-id",
    "quantity": "400"
  },
  "backup": {
    "locationId": "backup-location-id",
    "subsectionId": "backup-subsection-id",
    "quantity": "1000"
  }
}
```

`backup` is optional. The API rejects duplicate supply names, unsupported units, negative quantities, subsection/location mismatches, and identical primary/backup assignments.

### Update a supply

`PATCH /api/v1/supplies/{supplyId}`

Accepts any supported editable combination of `name`, `unit`, `primary`, and `backup`. Omitting `backup` leaves it unchanged; an explicit removal operation is used to remove it.

### Remove a backup assignment

`DELETE /api/v1/supplies/{supplyId}/backup`

Removes the optional backup assignment while retaining the primary assignment.

### Delete a supply

`DELETE /api/v1/supplies/{supplyId}`

Deletes the supply and its current assignments. The frontend must request confirmation before sending this operation.

### Update primary quantity

`PATCH /api/v1/supplies/{supplyId}/primary-quantity`

Request:

```json
{
  "quantity": "250"
}
```

### Update backup quantity

`PATCH /api/v1/supplies/{supplyId}/backup-quantity`

Request:

```json
{
  "quantity": "500"
}
```

Returns `409` if the supply has no backup assignment.

## Backup Inventory

### List backup assignments

`GET /api/v1/inventory/backup`

Query parameters:

- `backupLocationId`: backup location filter.
- `search`: supply-name search text, if search is used from the backup view.

Returns supplies with backup assignments and their backup location, subsection, quantity, and unit.

## Error Contract

Errors use a stable envelope:

```json
{
  "error": {
    "code": "SUPPLY_NAME_CONFLICT",
    "message": "A supply with this name already exists.",
    "details": {}
  }
}
```

Expected status categories:

- `400`: malformed request or invalid field values.
- `401`: missing, expired, or invalid JWT, or invalid passphrase.
- `404`: referenced resource does not exist.
- `409`: uniqueness conflict, invalid reassignment conflict, or missing backup assignment.
- `429`: session endpoint rate limit exceeded.
- `500`: unexpected server or database failure.

Internal SQL, credentials, stack traces, and passphrase comparison details must never be returned to the client.

## API Invariants

The API must enforce these rules independently of frontend behavior:

- Every supply has exactly one primary assignment.
- A supply has at most one backup assignment.
- Primary and backup assignments must differ.
- An assignment's subsection belongs to its assignment location.
- Supply names are unique.
- Units are limited to `g`, `kg`, `l`, `pack`, and `bottle`.
- Quantities are non-negative decimals; zero is valid.
- Location and subsection deletion with affected assignments is atomic and requires complete replacement mappings.
