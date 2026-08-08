import { Router } from 'express';

import { asyncRoute } from '../shared/errors.js';
import { database } from '../persistence/database.js';
import { parseUuid } from '../shared/validation.js';
import { supplyAssignmentQuery } from '../supplies/routes.js';

type SupplyRow = {
  id: string;
  name: string;
  unit: string;
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

const primaryItem = (row: SupplyRow) => ({
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
});

const backupItem = (row: SupplyRow) => ({
  id: row.id,
  name: row.name,
  unit: row.unit,
  backup: {
    assignmentId: row.backup_id,
    locationId: row.backup_location_id,
    locationName: row.backup_location_name,
    subsectionId: row.backup_subsection_id,
    subsectionName: row.backup_subsection_name,
    quantity: row.backup_quantity,
  },
});

export const inventoryRouter = Router();

inventoryRouter.get(
  '/supplies',
  asyncRoute(async (request, response) => {
    const conditions: string[] = ["p.role = 'primary'"];
    const values: unknown[] = [];
    const add = (condition: string, value: unknown) => {
      values.push(value);
      conditions.push(`${condition} $${values.length}`);
    };

    if (
      typeof request.query.search === 'string' &&
      request.query.search.length > 0
    ) {
      add('LOWER(s.name) LIKE LOWER(', `%${request.query.search}%`);
      conditions[conditions.length - 1] += ')';
    }
    if (typeof request.query.primaryLocationId === 'string') {
      add(
        'p.location_id =',
        parseUuid(request.query.primaryLocationId, 'primaryLocationId'),
      );
    }
    if (typeof request.query.primarySubsectionId === 'string') {
      add(
        'p.subsection_id =',
        parseUuid(request.query.primarySubsectionId, 'primarySubsectionId'),
      );
    }
    if (request.query.outOfStock === 'true') {
      conditions.push('p.quantity = 0 AND (b.id IS NULL OR b.quantity = 0)');
    }

    const result = await database.query<SupplyRow>(
      `${supplyAssignmentQuery} WHERE ${conditions.join(' AND ')} ORDER BY LOWER(s.name)`,
      values,
    );
    response.json(result.rows.map(primaryItem));
  }),
);

inventoryRouter.get(
  '/inventory/backup',
  asyncRoute(async (request, response) => {
    const conditions = ["b.role = 'backup'"];
    const values: unknown[] = [];
    if (typeof request.query.backupLocationId === 'string') {
      values.push(
        parseUuid(request.query.backupLocationId, 'backupLocationId'),
      );
      conditions.push(`b.location_id = $${values.length}`);
    }
    if (
      typeof request.query.search === 'string' &&
      request.query.search.length > 0
    ) {
      values.push(`%${request.query.search}%`);
      conditions.push(`LOWER(s.name) LIKE LOWER($${values.length})`);
    }
    const result = await database.query<SupplyRow>(
      `${supplyAssignmentQuery} WHERE ${conditions.join(' AND ')} ORDER BY LOWER(s.name)`,
      values,
    );
    response.json(result.rows.map(backupItem));
  }),
);
