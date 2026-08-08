import { Edit3, FolderPlus, MapPin, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '../api';
import { useApi } from '../hooks';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
} from '../components/Feedback';
import { Modal } from '../components/Modal';
import type { AffectedAssignment, Location } from '../types';

type EditTarget = {
  kind: 'location' | 'subsection';
  id: string;
  name: string;
} | null;
type DeleteTarget = {
  kind: 'location' | 'subsection';
  id: string;
  name: string;
  affected: AffectedAssignment[];
} | null;

export const StoragePage = () => {
  const api = useApi();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [locationName, setLocationName] = useState('');
  const [subsectionNames, setSubsectionNames] = useState<
    Record<string, string>
  >({});
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [replacements, setReplacements] = useState<
    Record<string, { locationId: string; subsectionId: string }>
  >({});
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setLocations(await api.listLocations());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load storage.',
      );
    } finally {
      setLoading(false);
    }
  }, [api]);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createLocation = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.createLocation(locationName);
      setLocationName('');
      setNotice('Location created.');
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to create location.',
      );
    }
  };
  const createSubsection = async (
    event: React.FormEvent,
    locationId: string,
  ) => {
    event.preventDefault();
    const name = subsectionNames[locationId] ?? '';
    try {
      await api.createSubsection(locationId, name);
      setSubsectionNames((current) => ({ ...current, [locationId]: '' }));
      setNotice('Subsection created.');
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to create subsection.',
      );
    }
  };
  const saveRename = async () => {
    if (!editTarget) return;
    try {
      if (editTarget.kind === 'location')
        await api.renameLocation(editTarget.id, editName);
      else await api.renameSubsection(editTarget.id, editName);
      setEditTarget(null);
      setNotice('Name updated.');
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to update name.',
      );
    }
  };

  const beginDelete = async (target: {
    kind: 'location' | 'subsection';
    id: string;
    name: string;
  }) => {
    setError('');
    try {
      if (target.kind === 'location') await api.deleteLocation(target.id, []);
      else await api.deleteSubsection(target.id, []);
      setNotice(`${target.name} deleted.`);
      await refresh();
    } catch (requestError) {
      if (
        requestError instanceof ApiError &&
        requestError.status === 409 &&
        requestError.error.details?.affectedAssignments
      ) {
        setDeleteTarget({
          ...target,
          affected: requestError.error.details.affectedAssignments,
        });
        setReplacements({});
      } else
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to delete storage.',
        );
    }
  };
  const completeDelete = async () => {
    if (!deleteTarget) return;
    const reassignments = deleteTarget.affected.map((assignment) => ({
      assignmentId: assignment.assignmentId,
      replacementLocationId: replacements[assignment.assignmentId]?.locationId,
      replacementSubsectionId:
        replacements[assignment.assignmentId]?.subsectionId,
    }));
    if (
      reassignments.some(
        (entry) =>
          !entry.replacementLocationId || !entry.replacementSubsectionId,
      )
    )
      return;
    setSaving(true);
    try {
      if (deleteTarget.kind === 'location')
        await api.deleteLocation(deleteTarget.id, reassignments);
      else await api.deleteSubsection(deleteTarget.id, reassignments);
      setDeleteTarget(null);
      setNotice(`${deleteTarget.name} deleted and assignments reassigned.`);
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to complete reassignment.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="muted">Organize the places where supplies live.</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          Storage setup
        </h2>
      </div>
      {notice && <Notice>{notice}</Notice>}
      {error && <ErrorState message={error} onRetry={() => void refresh()} />}
      <section className="card">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-accent p-2 text-ink">
            <MapPin size={20} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-ink">
              Add a storage location
            </h3>
            <p className="muted mt-1">
              Start with places like Cabinet, Fridge, or Drawer.
            </p>
          </div>
        </div>
        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={createLocation}
        >
          <label className="sr-only" htmlFor="location-name">
            Location name
          </label>
          <input
            id="location-name"
            className="field mt-0 flex-1"
            placeholder="Location name"
            value={locationName}
            onChange={(event) => setLocationName(event.target.value)}
            required
          />
          <button className="button-primary" type="submit">
            <FolderPlus size={17} /> Add location
          </button>
        </form>
      </section>
      {loading ? (
        <LoadingState label="Loading storage…" />
      ) : locations.length === 0 ? (
        <EmptyState
          title="No storage locations"
          description="Create your first location to start mapping supplies."
        />
      ) : (
        <div className="space-y-4">
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              subsectionName={subsectionNames[location.id] ?? ''}
              onSubsectionNameChange={(value) =>
                setSubsectionNames((current) => ({
                  ...current,
                  [location.id]: value,
                }))
              }
              onCreateSubsection={(event) =>
                void createSubsection(event, location.id)
              }
              onRename={(target) => {
                setEditTarget(target);
                setEditName(target.name);
              }}
              onDelete={(target) => void beginDelete(target)}
            />
          ))}
        </div>
      )}
      {editTarget && (
        <Modal
          title={`Rename ${editTarget.kind}`}
          onClose={() => setEditTarget(null)}
        >
          <label className="label" htmlFor="edit-name">
            Name
          </label>
          <input
            id="edit-name"
            className="field"
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            autoFocus
          />
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="button-secondary"
              onClick={() => setEditTarget(null)}
            >
              Cancel
            </button>
            <button
              className="button-primary"
              onClick={() => void saveRename()}
            >
              Save name
            </button>
          </div>
        </Modal>
      )}
      {deleteTarget && (
        <ReassignmentModal
          target={deleteTarget}
          locations={locations}
          replacements={replacements}
          setReplacements={setReplacements}
          saving={saving}
          onClose={() => setDeleteTarget(null)}
          onComplete={() => void completeDelete()}
        />
      )}
    </div>
  );
};

const LocationCard = ({
  location,
  subsectionName,
  onSubsectionNameChange,
  onCreateSubsection,
  onRename,
  onDelete,
}: {
  location: Location;
  subsectionName: string;
  onSubsectionNameChange: (value: string) => void;
  onCreateSubsection: (event: React.FormEvent) => void;
  onRename: (target: {
    kind: 'location' | 'subsection';
    id: string;
    name: string;
  }) => void;
  onDelete: (target: {
    kind: 'location' | 'subsection';
    id: string;
    name: string;
  }) => void;
}) => (
  <article className="card">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-canvas p-2 text-slate">
          <MapPin size={19} />
        </div>
        <h3 className="text-xl font-semibold text-ink">{location.name}</h3>
      </div>
      <div className="flex gap-1">
        <button
          className="button-ghost"
          onClick={() =>
            onRename({ kind: 'location', id: location.id, name: location.name })
          }
          aria-label={`Rename ${location.name}`}
        >
          <Edit3 size={17} />
        </button>
        <button
          className="button-ghost text-red-600 hover:bg-red-50"
          onClick={() =>
            onDelete({ kind: 'location', id: location.id, name: location.name })
          }
          aria-label={`Delete ${location.name}`}
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
    <div className="mt-5 border-l-2 border-accent pl-5">
      {location.subsections.length === 0 ? (
        <p className="muted">No subsections yet.</p>
      ) : (
        <ul className="space-y-3">
          {location.subsections.map((subsection) => (
            <li
              className="flex items-center justify-between gap-3 text-sm"
              key={subsection.id}
            >
              <span className="font-medium text-ink">{subsection.name}</span>
              <span className="flex gap-1">
                <button
                  className="button-ghost px-2"
                  onClick={() =>
                    onRename({
                      kind: 'subsection',
                      id: subsection.id,
                      name: subsection.name,
                    })
                  }
                  aria-label={`Rename ${subsection.name}`}
                >
                  <Edit3 size={15} />
                </button>
                <button
                  className="button-ghost px-2 text-red-600 hover:bg-red-50"
                  onClick={() =>
                    onDelete({
                      kind: 'subsection',
                      id: subsection.id,
                      name: subsection.name,
                    })
                  }
                  aria-label={`Delete ${subsection.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <form
        className="mt-5 flex flex-col gap-2 sm:flex-row"
        onSubmit={onCreateSubsection}
      >
        <label className="sr-only" htmlFor={`subsection-${location.id}`}>
          New subsection
        </label>
        <input
          id={`subsection-${location.id}`}
          className="field mt-0 flex-1"
          placeholder="New subsection"
          value={subsectionName}
          onChange={(event) => onSubsectionNameChange(event.target.value)}
          required
        />
        <button className="button-secondary" type="submit">
          <Plus size={16} /> Add subsection
        </button>
      </form>
    </div>
  </article>
);

const ReassignmentModal = ({
  target,
  locations,
  replacements,
  setReplacements,
  saving,
  onClose,
  onComplete,
}: {
  target: NonNullable<DeleteTarget>;
  locations: Location[];
  replacements: Record<string, { locationId: string; subsectionId: string }>;
  setReplacements: React.Dispatch<
    React.SetStateAction<
      Record<string, { locationId: string; subsectionId: string }>
    >
  >;
  saving: boolean;
  onClose: () => void;
  onComplete: () => void;
}) => (
  <Modal title={`Reassign before deleting ${target.name}`} onClose={onClose}>
    <p className="text-sm leading-6 text-slate">
      Every affected assignment needs a replacement location and subsection.
      Quantities and primary/backup roles will be preserved.
    </p>
    <div className="mt-5 space-y-4">
      {target.affected.map((assignment) => {
        const replacement = replacements[assignment.assignmentId] ?? {
          locationId: '',
          subsectionId: '',
        };
        const selected = locations.find(
          (location) => location.id === replacement.locationId,
        );
        return (
          <div
            className="rounded-xl border border-line p-4"
            key={assignment.assignmentId}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">
                  {assignment.supplyName}
                </p>
                <p className="text-xs uppercase tracking-wide text-slate">
                  {assignment.role} · {assignment.quantity}
                </p>
              </div>
              <span className="badge">Required</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select
                className="field mt-0"
                aria-label={`Replacement location for ${assignment.supplyName}`}
                value={replacement.locationId}
                onChange={(event) =>
                  setReplacements((current) => ({
                    ...current,
                    [assignment.assignmentId]: {
                      locationId: event.target.value,
                      subsectionId: '',
                    },
                  }))
                }
              >
                <option value="">Select location</option>
                {locations
                  .filter((location) => location.id !== target.id)
                  .map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
              </select>
              <select
                className="field mt-0"
                aria-label={`Replacement subsection for ${assignment.supplyName}`}
                value={replacement.subsectionId}
                onChange={(event) =>
                  setReplacements((current) => ({
                    ...current,
                    [assignment.assignmentId]: {
                      ...replacement,
                      subsectionId: event.target.value,
                    },
                  }))
                }
              >
                <option value="">Select subsection</option>
                {selected?.subsections
                  .filter((subsection) => subsection.id !== target.id)
                  .map((subsection) => (
                    <option key={subsection.id} value={subsection.id}>
                      {subsection.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
    <div className="mt-6 flex justify-end gap-3">
      <button className="button-secondary" onClick={onClose}>
        Cancel
      </button>
      <button
        className="button-danger"
        disabled={
          saving ||
          target.affected.some(
            (assignment) =>
              !replacements[assignment.assignmentId]?.locationId ||
              !replacements[assignment.assignmentId]?.subsectionId,
          )
        }
        onClick={onComplete}
      >
        <Trash2 size={16} /> {saving ? 'Deleting…' : 'Reassign and delete'}
      </button>
    </div>
  </Modal>
);
