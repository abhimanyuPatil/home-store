import { Filter, PackagePlus, Pencil, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useApi } from '../hooks';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
} from '../components/Feedback';
import { Modal } from '../components/Modal';
import type { InventoryItem, Location } from '../types';

type Mode = 'primary' | 'backup' | 'outOfStock';

export const InventoryPage = ({ mode }: { mode: Mode }) => {
  const api = useApi();
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [locationId, setLocationId] = useState('');
  const [subsectionId, setSubsectionId] = useState('');
  const [quantityItem, setQuantityItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState('');
  const [notice, setNotice] = useState('');
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (locationId && mode === 'backup')
        params.set('backupLocationId', locationId);
      if (locationId && mode !== 'backup')
        params.set('primaryLocationId', locationId);
      if (subsectionId && mode === 'primary')
        params.set('primarySubsectionId', subsectionId);
      if (mode === 'outOfStock') params.set('outOfStock', 'true');
      const inventory =
        mode === 'backup'
          ? (await api.listBackupInventory(params)).map((item) => ({
              ...item,
              primary: item.backup,
            }))
          : await api.listSupplies(params);
      const storage = await api.listLocations();
      setItems(inventory);
      setLocations(storage);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load inventory.',
      );
    } finally {
      setLoading(false);
    }
  }, [api, locationId, mode, search, subsectionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedLocation = locations.find(
    (location) => location.id === locationId,
  );
  const clearFilters = () => {
    setSearch('');
    setLocationId('');
    setSubsectionId('');
    void refresh();
  };
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    void refresh();
  };

  const updateQuantity = async () => {
    if (!quantityItem) return;
    try {
      if (mode === 'backup')
        await api.updateBackupQuantity(quantityItem.id, quantity);
      else await api.updatePrimaryQuantity(quantityItem.id, quantity);
      setQuantityItem(null);
      setNotice('Quantity updated.');
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to update quantity.',
      );
    }
  };

  const deleteSupply = async () => {
    if (!deleteItem) return;
    try {
      await api.deleteSupply(deleteItem.id);
      setDeleteItem(null);
      setNotice('Supply deleted.');
      await refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to delete supply.',
      );
    }
  };

  const pageCopy =
    mode === 'backup'
      ? {
          title: 'Backup inventory',
          description: 'Keep a clear view of your reserve storage.',
        }
      : mode === 'outOfStock'
        ? {
            title: 'Out of stock',
            description:
              'Supplies with no quantity available in either assignment.',
          }
        : {
            title: 'Primary inventory',
            description: 'Your everyday view of what is stored at home.',
          };
  const subsections = selectedLocation?.subsections ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="muted">{pageCopy.description}</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
            {pageCopy.title}
          </h2>
        </div>
        <Link className="button-primary" to="/supplies/new">
          <PackagePlus size={18} /> Add supply
        </Link>
      </div>
      {notice && <Notice>{notice}</Notice>}
      <section className="card p-4 sm:p-5">
        <form
          className="flex flex-col gap-3 lg:flex-row"
          onSubmit={submitSearch}
        >
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-3 text-slate"
              size={18}
              aria-hidden="true"
            />
            <label className="sr-only" htmlFor="inventory-search">
              Search supply names
            </label>
            <input
              id="inventory-search"
              className="field mt-0 pl-10"
              placeholder="Search supply names"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {mode !== 'outOfStock' && (
            <div className="min-w-48">
              <label className="sr-only" htmlFor="location-filter">
                {mode === 'backup' ? 'Backup location' : 'Primary location'}
              </label>
              <select
                id="location-filter"
                className="field mt-0"
                value={locationId}
                onChange={(event) => {
                  setLocationId(event.target.value);
                  setSubsectionId('');
                }}
              >
                <option value="">
                  All {mode === 'backup' ? 'backup' : 'primary'} locations
                </option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {mode === 'primary' && (
            <div className="min-w-48">
              <label className="sr-only" htmlFor="primary-subsection-filter">
                Primary subsection
              </label>
              <select
                id="primary-subsection-filter"
                className="field mt-0"
                value={subsectionId}
                onChange={(event) => setSubsectionId(event.target.value)}
              >
                <option value="">All primary subsections</option>
                {subsections.map((subsection) => (
                  <option key={subsection.id} value={subsection.id}>
                    {subsection.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button className="button-primary" type="submit">
            <Filter size={17} /> Apply
          </button>
          <button className="button-ghost" type="button" onClick={clearFilters}>
            Clear
          </button>
        </form>
      </section>
      {loading ? (
        <LoadingState label="Loading inventory…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refresh()} />
      ) : items.length === 0 ? (
        <EmptyState
          title={
            mode === 'backup'
              ? 'No backup supplies yet'
              : mode === 'outOfStock'
                ? 'Everything is stocked'
                : 'Your inventory is empty'
          }
          description={
            mode === 'backup'
              ? 'Add a backup assignment while editing a supply.'
              : mode === 'outOfStock'
                ? 'Supplies with zero available quantity will appear here.'
                : 'Start by adding your first household supply.'
          }
          action={
            <Link className="button-primary" to="/supplies/new">
              <PackagePlus size={17} /> Add supply
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              mode={mode}
              onEdit={() => navigate(`/supplies/${item.id}/edit`)}
              onQuantity={() => {
                setQuantityItem(item);
                setQuantity(item.primary.quantity);
              }}
              onDelete={() => setDeleteItem(item)}
            />
          ))}
        </div>
      )}
      {quantityItem && (
        <Modal
          title={`Update ${quantityItem.name}`}
          onClose={() => setQuantityItem(null)}
        >
          <div>
            <label className="label" htmlFor="quantity">
              {mode === 'backup' ? 'Backup' : 'Primary'} quantity (
              {quantityItem.unit})
            </label>
            <input
              id="quantity"
              className="field"
              inputMode="decimal"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              autoFocus
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="button-secondary"
              onClick={() => setQuantityItem(null)}
            >
              Cancel
            </button>
            <button
              className="button-primary"
              onClick={() => void updateQuantity()}
            >
              Save quantity
            </button>
          </div>
        </Modal>
      )}
      {deleteItem && (
        <Modal
          title={`Delete ${deleteItem.name}?`}
          onClose={() => setDeleteItem(null)}
        >
          <p className="text-sm leading-6 text-slate">
            This removes the supply and its current assignments. Quantity
            history is not retained in the MVP.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="button-secondary"
              onClick={() => setDeleteItem(null)}
            >
              Cancel
            </button>
            <button
              className="button-danger"
              onClick={() => void deleteSupply()}
            >
              <Trash2 size={16} /> Delete supply
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const InventoryCard = ({
  item,
  mode,
  onEdit,
  onQuantity,
  onDelete,
}: {
  item: InventoryItem;
  mode: Mode;
  onEdit: () => void;
  onQuantity: () => void;
  onDelete: () => void;
}) => (
  <article className="card flex flex-col justify-between gap-5">
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-ink">{item.name}</h3>
          <span className="badge mt-2">{item.unit}</span>
        </div>
        <div className="rounded-lg bg-canvas p-2 text-slate">
          <PackagePlus size={20} />
        </div>
      </div>
      <div className="mt-5 space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">
            {mode === 'backup' ? 'Backup storage' : 'Primary storage'}
          </p>
          <p className="mt-1 font-medium text-ink">
            {item.primary.locationName}{' '}
            <span className="text-slate">/ {item.primary.subsectionName}</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">
            {mode === 'backup' ? 'Backup quantity' : 'Quantity'}
          </p>
          <p
            className={`mt-1 text-2xl font-semibold ${item.primary.quantity === '0' ? 'text-red-600' : 'text-ink'}`}
          >
            {item.primary.quantity}{' '}
            <span className="text-sm font-medium text-slate">{item.unit}</span>
          </p>
        </div>
      </div>
    </div>
    <div className="flex flex-wrap gap-2 border-t border-line pt-4">
      <button className="button-secondary flex-1" onClick={onQuantity}>
        {mode === 'outOfStock'
          ? 'Restock'
          : mode === 'backup'
            ? 'Update backup'
            : 'Update quantity'}
      </button>
      <button
        className="button-ghost"
        onClick={onEdit}
        aria-label={`Edit ${item.name}`}
      >
        <Pencil size={17} />
      </button>
      <button
        className="button-ghost text-red-600 hover:bg-red-50"
        onClick={onDelete}
        aria-label={`Delete ${item.name}`}
      >
        <Trash2 size={17} />
      </button>
    </div>
  </article>
);
