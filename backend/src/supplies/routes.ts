import { Router } from 'express';
import type { PoolClient } from 'pg';

import {
  asyncRoute,
  badRequest,
  conflict,
  notFound,
} from '../shared/errors.js';
import { mapDatabaseError } from '../shared/database-error.js';
import { database } from '../persistence/database.js';
import {
  optionalString,
  parseQuantity,
  parseUnit,
  parseUuid,
  requiredString,
  type SupplyUnit,
} from '../shared/validation.js';

type AssignmentInput = {
  locationId: string;
  subsectionId: string;
  quantity: unknown;
};
type SupplyRow = {
  id: string;
  name: string;
  unit: SupplyUnit;
  created_at: Date;
  updated_at: Date;
  primary_id: string;
  primary_location_id: string;
  primary_location_name: string;
  primary_subsection_id: string;
  primary_subsection_name: string;
  primary_quantity: string;
  backup_id: string | null;
  backup_location_id: string | null;
  backup_location_name: string | null;
  backup_subsection_id: string | null;
  backup_subsection_name: string | null;
  backup_quantity: string | null;
};

const assignmentQuery = `
  SELECT s.id, s.name, s.unit, s.created_at, s.updated_at,
         p.id AS primary_id, p.location_id AS primary_location_id,
         pl.name AS primary_location_name, p.subsection_id AS primary_subsection_id,
         ps.name AS primary_subsection_name, p.quantity::text AS primary_quantity,
         b.id AS backup_id, b.location_id AS backup_location_id,
         bl.name AS backup_location_name, b.subsection_id AS backup_subsection_id,
         bs.name AS backup_subsection_name, b.quantity::text AS backup_quantity
    FROM supplies s
    JOIN supply_assignments p ON p.supply_id = s.id AND p.role = 'primary'
    JOIN storage_locations pl ON pl.id = p.location_id
    JOIN storage_subsections ps ON ps.id = p.subsection_id
    LEFT JOIN supply_assignments b ON b.supply_id = s.id AND b.role = 'backup'
    LEFT JOIN storage_locations bl ON bl.id = b.location_id
    LEFT JOIN storage_subsections bs ON bs.id = b.subsection_id`;

const toSupply = (row: SupplyRow) => ({
  id: row.id,
  name: row.name,
  unit: row.unit,
  primary: {
    assignmentId: row.primary_id,
    locationId: row.primary_location_id,
    locationName: row.primary_location_name,
    subsectionId: row.primary_subsection_id,
    subsectionName: row.primary_subsection_name,
    quantity: row.primary_quantity,
  },
  backup: row.backup_id
    ? {
        assignmentId: row.backup_id,
        locationId: row.backup_location_id,
        locationName: row.backup_location_name,
        subsectionId: row.backup_subsection_id,
        subsectionName: row.backup_subsection_name,
        quantity: row.backup_quantity,
      }
    : null,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

const parseAssignment = (
  value: unknown,
  field: string,
): { locationId: string; subsectionId: string; quantity: string } => {
  if (!value || typeof value !== 'object')
    throw badRequest(`${field} is required.`);
  const assignment = value as Partial<AssignmentInput>;
  return {
    locationId: parseUuid(assignment.locationId, `${field}.locationId`),
    subsectionId: parseUuid(assignment.subsectionId, `${field}.subsectionId`),
    quantity: parseQuantity(assignment.quantity),
  };
};

const assertAssignment = async (
  client: PoolClient,
  assignment: AssignmentInput,
) => {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM storage_subsections WHERE id = $1 AND location_id = $2`,
    [assignment.subsectionId, assignment.locationId],
  );
  if (!result.rows[0])
    throw badRequest('The subsection must belong to the selected location.');
};

const insertAssignment = async (
  client: PoolClient,
  supplyId: string,
  role: 'primary' | 'backup',
  assignment: AssignmentInput,
) => {
  await assertAssignment(client, assignment);
  await client.query(
    `INSERT INTO supply_assignments(supply_id, role, location_id, subsection_id, quantity)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      supplyId,
      role,
      assignment.locationId,
      assignment.subsectionId,
      assignment.quantity,
    ],
  );
};

export const suppliesRouter = Router();

suppliesRouter.get(
  '/supplies/:supplyId',
  asyncRoute(async (request, response) => {
    const supplyId = parseUuid(request.params.supplyId, 'supplyId');
    const result = await database.query<SupplyRow>(
      `${assignmentQuery} WHERE s.id = $1`,
      [supplyId],
    );
    if (!result.rows[0]) throw notFound('The supply was not found.');
    response.json(toSupply(result.rows[0]));
  }),
);

suppliesRouter.post(
  '/supplies',
  asyncRoute(async (request, response) => {
    const name = requiredString(request.body?.name, 'name');
    const unit = parseUnit(request.body?.unit);
    const primary = parseAssignment(request.body?.primary, 'primary');
    const backup =
      request.body?.backup === undefined
        ? undefined
        : parseAssignment(request.body.backup, 'backup');
    if (
      backup &&
      backup.locationId === primary.locationId &&
      backup.subsectionId === primary.subsectionId
    ) {
      throw badRequest(
        'The backup assignment must differ from the primary assignment.',
      );
    }

    try {
      const result = await database.transaction(async (client) => {
        const inserted = await client.query<{ id: string }>(
          'INSERT INTO supplies(name, unit) VALUES ($1, $2) RETURNING id',
          [name, unit],
        );
        const supplyId = inserted.rows[0]?.id;
        if (!supplyId)
          throw new Error('Supply insert did not return an identifier.');
        await insertAssignment(client, supplyId, 'primary', primary);
        if (backup) await insertAssignment(client, supplyId, 'backup', backup);
        return client.query<SupplyRow>(`${assignmentQuery} WHERE s.id = $1`, [
          supplyId,
        ]);
      });
      const supply = result.rows[0];
      if (!supply)
        throw new Error('Supply insert did not return an identifier.');
      response.status(201).json(toSupply(supply));
    } catch (error) {
      throw mapDatabaseError(error) ?? error;
    }
  }),
);

suppliesRouter.patch(
  '/supplies/:supplyId',
  asyncRoute(async (request, response) => {
    const supplyId = parseUuid(request.params.supplyId, 'supplyId');
    const requestedName = optionalString(request.body?.name, 'name');
    const requestedUnit =
      request.body?.unit === undefined
        ? undefined
        : parseUnit(request.body.unit);
    const primary =
      request.body?.primary === undefined
        ? undefined
        : parseAssignment(request.body.primary, 'primary');
    const backup =
      request.body?.backup === undefined
        ? undefined
        : parseAssignment(request.body.backup, 'backup');

    try {
      const result = await database.transaction(async (client) => {
        const existing = await client.query<{
          name: string;
          unit: SupplyUnit;
          location_id: string;
          subsection_id: string;
          quantity: string;
          backup_location_id: string | null;
          backup_subsection_id: string | null;
          backup_quantity: string | null;
        }>(
          `SELECT s.name, s.unit, p.location_id, p.subsection_id, p.quantity::text,
                  b.location_id AS backup_location_id, b.subsection_id AS backup_subsection_id,
                  b.quantity::text AS backup_quantity
             FROM supplies s
             JOIN supply_assignments p ON p.supply_id = s.id AND p.role = 'primary'
             LEFT JOIN supply_assignments b ON b.supply_id = s.id AND b.role = 'backup'
            WHERE s.id = $1`,
          [supplyId],
        );
        const current = existing.rows[0];
        if (!current) throw notFound('The supply was not found.');
        const nextPrimary = primary ?? {
          locationId: current.location_id,
          subsectionId: current.subsection_id,
          quantity: current.quantity,
        };
        const nextBackup =
          backup ??
          (current.backup_location_id
            ? {
                locationId: current.backup_location_id,
                subsectionId: current.backup_subsection_id as string,
                quantity: current.backup_quantity as string,
              }
            : undefined);
        if (
          nextBackup &&
          nextBackup.locationId === nextPrimary.locationId &&
          nextBackup.subsectionId === nextPrimary.subsectionId
        ) {
          throw badRequest(
            'The backup assignment must differ from the primary assignment.',
          );
        }
        await assertAssignment(client, nextPrimary);
        if (nextBackup) await assertAssignment(client, nextBackup);
        await client.query(
          'UPDATE supplies SET name = COALESCE($1, name), unit = COALESCE($2, unit), updated_at = NOW() WHERE id = $3',
          [requestedName, requestedUnit, supplyId],
        );
        await client.query(
          "UPDATE supply_assignments SET location_id = $1, subsection_id = $2, quantity = $3, updated_at = NOW() WHERE supply_id = $4 AND role = 'primary'",
          [
            nextPrimary.locationId,
            nextPrimary.subsectionId,
            nextPrimary.quantity,
            supplyId,
          ],
        );
        if (backup) {
          await client.query(
            `INSERT INTO supply_assignments(supply_id, role, location_id, subsection_id, quantity)
                              VALUES ($1, 'backup', $2, $3, $4)
                              ON CONFLICT (supply_id, role) DO UPDATE SET location_id = EXCLUDED.location_id, subsection_id = EXCLUDED.subsection_id, quantity = EXCLUDED.quantity, updated_at = NOW()`,
            [supplyId, backup.locationId, backup.subsectionId, backup.quantity],
          );
        }
        return client.query<SupplyRow>(`${assignmentQuery} WHERE s.id = $1`, [
          supplyId,
        ]);
      });
      const supply = result.rows[0];
      if (!supply)
        throw new Error('Supply update did not return an identifier.');
      response.json(toSupply(supply));
    } catch (error) {
      throw mapDatabaseError(error) ?? error;
    }
  }),
);

suppliesRouter.delete(
  '/supplies/:supplyId',
  asyncRoute(async (request, response) => {
    const supplyId = parseUuid(request.params.supplyId, 'supplyId');
    const result = await database.query<{ id: string }>(
      'DELETE FROM supplies WHERE id = $1 RETURNING id',
      [supplyId],
    );
    if (!result.rows[0]) throw notFound('The supply was not found.');
    response.status(204).send();
  }),
);

suppliesRouter.patch(
  '/supplies/:supplyId/primary-quantity',
  asyncRoute(async (request, response) => {
    const supplyId = parseUuid(request.params.supplyId, 'supplyId');
    const quantity = parseQuantity(request.body?.quantity);
    const result = await database.query<{ id: string }>(
      `UPDATE supply_assignments SET quantity = $1, updated_at = NOW()
        WHERE supply_id = $2 AND role = 'primary' RETURNING id`,
      [quantity, supplyId],
    );
    if (!result.rows[0]) throw notFound('The supply was not found.');
    const supply = await database.query<SupplyRow>(
      `${assignmentQuery} WHERE s.id = $1`,
      [supplyId],
    );
    const updatedSupply = supply.rows[0];
    if (!updatedSupply)
      throw new Error('Quantity update did not return an identifier.');
    response.json(toSupply(updatedSupply));
  }),
);

suppliesRouter.patch(
  '/supplies/:supplyId/backup-quantity',
  asyncRoute(async (request, response) => {
    const supplyId = parseUuid(request.params.supplyId, 'supplyId');
    const quantity = parseQuantity(request.body?.quantity);
    const result = await database.query<{ id: string }>(
      `UPDATE supply_assignments SET quantity = $1, updated_at = NOW()
        WHERE supply_id = $2 AND role = 'backup' RETURNING id`,
      [quantity, supplyId],
    );
    if (!result.rows[0]) throw conflict('The supply has no backup assignment.');
    const supply = await database.query<SupplyRow>(
      `${assignmentQuery} WHERE s.id = $1`,
      [supplyId],
    );
    const updatedSupply = supply.rows[0];
    if (!updatedSupply)
      throw new Error('Quantity update did not return an identifier.');
    response.json(toSupply(updatedSupply));
  }),
);

suppliesRouter.delete(
  '/supplies/:supplyId/backup',
  asyncRoute(async (request, response) => {
    const supplyId = parseUuid(request.params.supplyId, 'supplyId');
    const result = await database.query<{ id: string }>(
      `DELETE FROM supply_assignments WHERE supply_id = $1 AND role = 'backup' RETURNING id`,
      [supplyId],
    );
    if (!result.rows[0]) throw notFound('The backup assignment was not found.');
    const supply = await database.query<SupplyRow>(
      `${assignmentQuery} WHERE s.id = $1`,
      [supplyId],
    );
    if (!supply.rows[0]) throw notFound('The supply was not found.');
    const updatedSupply = supply.rows[0];
    if (!updatedSupply)
      throw new Error('Backup removal did not return an identifier.');
    response.json(toSupply(updatedSupply));
  }),
);

export const supplyAssignmentQuery = assignmentQuery;
