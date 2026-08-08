import { Router } from 'express';

import {
  asyncRoute,
  badRequest,
  conflict,
  notFound,
} from '../shared/errors.js';
import { mapDatabaseError } from '../shared/database-error.js';
import { database } from '../persistence/database.js';
import { parseUuid, requiredString } from '../shared/validation.js';

type LocationRow = {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
};
type SubsectionRow = {
  id: string;
  location_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
};
type LocationListRow = LocationRow & {
  subsection_id: string | null;
  subsection_location_id: string | null;
  subsection_name: string | null;
  subsection_created_at: Date | null;
  subsection_updated_at: Date | null;
};

const toSubsection = (row: SubsectionRow) => ({
  id: row.id,
  locationId: row.location_id,
  name: row.name,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

const toLocation = (row: LocationRow, subsections: SubsectionRow[] = []) => ({
  id: row.id,
  name: row.name,
  subsections: subsections.map(toSubsection),
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export const storageRouter = Router();

type AffectedAssignment = {
  id: string;
  supply_id: string;
  supply_name: string;
  role: 'primary' | 'backup';
  location_id: string;
  subsection_id: string;
  quantity: string;
};

type Reassignment = {
  assignmentId: string;
  replacementLocationId: string;
  replacementSubsectionId: string;
};

const parseReassignments = (value: unknown): Reassignment[] => {
  if (!Array.isArray(value))
    throw badRequest('reassignments must be an array.');
  return value.map((item, index) => {
    if (!item || typeof item !== 'object')
      throw badRequest(`reassignments[${index}] must be an object.`);
    const entry = item as Partial<Reassignment>;
    return {
      assignmentId: parseUuid(
        entry.assignmentId,
        `reassignments[${index}].assignmentId`,
      ),
      replacementLocationId: parseUuid(
        entry.replacementLocationId,
        `reassignments[${index}].replacementLocationId`,
      ),
      replacementSubsectionId: parseUuid(
        entry.replacementSubsectionId,
        `reassignments[${index}].replacementSubsectionId`,
      ),
    };
  });
};

const applyReassignmentDelete = async (
  targetType: 'location' | 'subsection',
  targetId: string,
  reassignments: Reassignment[],
) => {
  await database.transaction(async (client) => {
    const affectedResult = await client.query<AffectedAssignment>(
      `SELECT a.id, a.supply_id, s.name AS supply_name, a.role,
              a.location_id, a.subsection_id, a.quantity::text
         FROM supply_assignments a
         JOIN supplies s ON s.id = a.supply_id
        WHERE a.${targetType === 'location' ? 'location_id' : 'subsection_id'} = $1
        ORDER BY s.name, a.role`,
      [targetId],
    );
    const affected = affectedResult.rows;
    const affectedIds = new Set(affected.map((assignment) => assignment.id));
    const suppliedIds = new Set(
      reassignments.map((assignment) => assignment.assignmentId),
    );
    const missing = affected.filter(
      (assignment) => !suppliedIds.has(assignment.id),
    );
    const extra = reassignments.filter(
      (assignment) => !affectedIds.has(assignment.assignmentId),
    );
    if (
      missing.length > 0 ||
      extra.length > 0 ||
      suppliedIds.size !== reassignments.length
    ) {
      throw conflict(
        'Every affected assignment requires exactly one replacement.',
        {
          affectedAssignments: affected.map((assignment) => ({
            assignmentId: assignment.id,
            supplyId: assignment.supply_id,
            supplyName: assignment.supply_name,
            role: assignment.role,
            locationId: assignment.location_id,
            subsectionId: assignment.subsection_id,
            quantity: assignment.quantity,
          })),
        },
      );
    }

    for (const replacement of reassignments) {
      const affectedAssignment = affected.find(
        (assignment) => assignment.id === replacement.assignmentId,
      );
      if (!affectedAssignment) continue;
      if (
        replacement.replacementLocationId === targetId ||
        replacement.replacementSubsectionId === targetId
      ) {
        throw badRequest(
          'An assignment cannot be reassigned to the resource being deleted.',
        );
      }
      const subsection = await client.query<{ id: string }>(
        'SELECT id FROM storage_subsections WHERE id = $1 AND location_id = $2',
        [
          replacement.replacementSubsectionId,
          replacement.replacementLocationId,
        ],
      );
      if (!subsection.rows[0])
        throw badRequest(
          'A replacement subsection must belong to its replacement location.',
        );
      await client.query(
        `UPDATE supply_assignments
            SET location_id = $1, subsection_id = $2, updated_at = NOW()
          WHERE id = $3`,
        [
          replacement.replacementLocationId,
          replacement.replacementSubsectionId,
          replacement.assignmentId,
        ],
      );
    }

    if (targetType === 'location') {
      await client.query(
        'DELETE FROM storage_subsections WHERE location_id = $1',
        [targetId],
      );
      const deleted = await client.query(
        'DELETE FROM storage_locations WHERE id = $1',
        [targetId],
      );
      if (deleted.rowCount !== 1)
        throw notFound('The storage location was not found.');
    } else {
      const deleted = await client.query(
        'DELETE FROM storage_subsections WHERE id = $1',
        [targetId],
      );
      if (deleted.rowCount !== 1)
        throw notFound('The storage subsection was not found.');
    }
  });
};

storageRouter.get(
  '/locations',
  asyncRoute(async (_request, response) => {
    const result = await database.query<LocationListRow>(
      `SELECT l.id, l.name, l.created_at, l.updated_at,
              s.id AS subsection_id, s.location_id AS subsection_location_id,
              s.name AS subsection_name, s.created_at AS subsection_created_at,
              s.updated_at AS subsection_updated_at
         FROM storage_locations l
         LEFT JOIN storage_subsections s ON s.location_id = l.id
        ORDER BY l.name, s.name`,
    );
    const locations = new Map<string, ReturnType<typeof toLocation>>();
    for (const row of result.rows) {
      const location = locations.get(row.id) ?? toLocation(row, []);
      if (
        row.subsection_id &&
        row.subsection_location_id &&
        row.subsection_name &&
        row.subsection_created_at &&
        row.subsection_updated_at
      ) {
        location.subsections.push(
          toSubsection({
            id: row.subsection_id,
            location_id: row.subsection_location_id,
            name: row.subsection_name,
            created_at: row.subsection_created_at,
            updated_at: row.subsection_updated_at,
          }),
        );
      }
      locations.set(row.id, location);
    }
    response.json([...locations.values()]);
  }),
);

storageRouter.post(
  '/locations',
  asyncRoute(async (request, response) => {
    const name = requiredString(request.body?.name, 'name');
    try {
      const result = await database.query<LocationRow>(
        'INSERT INTO storage_locations(name) VALUES ($1) RETURNING id, name, created_at, updated_at',
        [name],
      );
      const location = result.rows[0];
      if (!location)
        throw new Error('Location insert did not return an identifier.');
      response.status(201).json(toLocation(location));
    } catch (error) {
      throw mapDatabaseError(error) ?? error;
    }
  }),
);

storageRouter.patch(
  '/locations/:locationId',
  asyncRoute(async (request, response) => {
    const locationId = parseUuid(request.params.locationId, 'locationId');
    const name = requiredString(request.body?.name, 'name');
    const result = await database.query<LocationRow>(
      `UPDATE storage_locations SET name = $1, updated_at = NOW()
        WHERE id = $2 RETURNING id, name, created_at, updated_at`,
      [name, locationId],
    );
    if (!result.rows[0]) throw notFound('The storage location was not found.');
    response.json(toLocation(result.rows[0]));
  }),
);

storageRouter.post(
  '/locations/:locationId/delete',
  asyncRoute(async (request, response) => {
    const locationId = parseUuid(request.params.locationId, 'locationId');
    await applyReassignmentDelete(
      'location',
      locationId,
      parseReassignments(request.body?.reassignments),
    );
    response.status(204).send();
  }),
);

storageRouter.post(
  '/locations/:locationId/subsections',
  asyncRoute(async (request, response) => {
    const locationId = parseUuid(request.params.locationId, 'locationId');
    const name = requiredString(request.body?.name, 'name');
    try {
      const result = await database.query<SubsectionRow>(
        `INSERT INTO storage_subsections(location_id, name)
         SELECT id, $2 FROM storage_locations WHERE id = $1
         RETURNING id, location_id, name, created_at, updated_at`,
        [locationId, name],
      );
      if (!result.rows[0])
        throw notFound('The storage location was not found.');
      response.status(201).json(toSubsection(result.rows[0]));
    } catch (error) {
      throw mapDatabaseError(error) ?? error;
    }
  }),
);

storageRouter.patch(
  '/subsections/:subsectionId',
  asyncRoute(async (request, response) => {
    const subsectionId = parseUuid(request.params.subsectionId, 'subsectionId');
    const name = requiredString(request.body?.name, 'name');
    const result = await database.query<SubsectionRow>(
      `UPDATE storage_subsections SET name = $1, updated_at = NOW()
        WHERE id = $2 RETURNING id, location_id, name, created_at, updated_at`,
      [name, subsectionId],
    );
    if (!result.rows[0])
      throw notFound('The storage subsection was not found.');
    response.json(toSubsection(result.rows[0]));
  }),
);

storageRouter.post(
  '/subsections/:subsectionId/delete',
  asyncRoute(async (request, response) => {
    const subsectionId = parseUuid(request.params.subsectionId, 'subsectionId');
    await applyReassignmentDelete(
      'subsection',
      subsectionId,
      parseReassignments(request.body?.reassignments),
    );
    response.status(204).send();
  }),
);
