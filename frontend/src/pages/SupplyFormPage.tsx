import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useApi } from '../hooks';
import { ErrorState, LoadingState } from '../components/Feedback';
import { FieldError } from '../components/FieldError';
import type { Location, Unit } from '../types';
import { units } from '../types';

const quantity = z
  .string()
  .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/, 'Enter a non-negative decimal.');
const schema = z.object({
  name: z.string().min(1, 'Enter a supply name.'),
  unit: z.enum(['g', 'kg', 'l', 'pack', 'bottle']),
  primary: z.object({
    locationId: z.string().min(1, 'Select a primary location.'),
    subsectionId: z.string().min(1, 'Select a primary subsection.'),
    quantity,
  }),
  backupEnabled: z.boolean(),
  backup: z
    .object({ locationId: z.string(), subsectionId: z.string(), quantity })
    .optional(),
});

type FormValues = z.infer<typeof schema>;

export const SupplyFormPage = () => {
  const api = useApi();
  const navigate = useNavigate();
  const { supplyId } = useParams();
  const editing = Boolean(supplyId);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [currentBackup, setCurrentBackup] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      unit: 'g',
      primary: { locationId: '', subsectionId: '', quantity: '0' },
      backupEnabled: false,
      backup: { locationId: '', subsectionId: '', quantity: '0' },
    },
  });
  const primaryLocationId = watch('primary.locationId');
  const backupEnabled = watch('backupEnabled');
  const backupLocationId = watch('backup.locationId');
  const primarySubsections =
    locations.find((location) => location.id === primaryLocationId)
      ?.subsections ?? [];
  const backupSubsections =
    locations.find((location) => location.id === backupLocationId)
      ?.subsections ?? [];

  useEffect(() => {
    const load = async () => {
      try {
        const storage = await api.listLocations();
        setLocations(storage);
        if (supplyId) {
          const supply = await api.getSupply(supplyId);
          setCurrentBackup(Boolean(supply.backup));
          reset({
            name: supply.name,
            unit: supply.unit,
            primary: {
              locationId: supply.primary.locationId,
              subsectionId: supply.primary.subsectionId,
              quantity: supply.primary.quantity,
            },
            backupEnabled: Boolean(supply.backup),
            backup: supply.backup
              ? {
                  locationId: supply.backup.locationId,
                  subsectionId: supply.backup.subsectionId,
                  quantity: supply.backup.quantity,
                }
              : { locationId: '', subsectionId: '', quantity: '0' },
          });
        }
      } catch (requestError) {
        setLoadError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load the supply.',
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [api, reset, supplyId]);

  const submit: SubmitHandler<FormValues> = async (values) => {
    setSubmitError('');
    const payload = {
      name: values.name,
      unit: values.unit,
      primary: values.primary,
      ...(values.backupEnabled ? { backup: values.backup } : {}),
    };
    try {
      if (supplyId) {
        await api.updateSupply(supplyId, payload);
        if (currentBackup && !values.backupEnabled)
          await api.deleteBackup(supplyId);
      } else await api.createSupply(payload);
      navigate('/');
    } catch (requestError) {
      setSubmitError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to save the supply.',
      );
    }
  };

  if (loading) return <LoadingState label="Loading supply…" />;
  if (loadError) return <ErrorState message={loadError} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link className="button-ghost -ml-3" to="/">
          <ArrowLeft size={17} /> Back to inventory
        </Link>
        <p className="muted mt-5">
          {editing
            ? 'Update your inventory record.'
            : 'Add a new item to your household inventory.'}
        </p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          {editing ? 'Edit supply' : 'Add supply'}
        </h2>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit(submit)}>
        <section className="card space-y-5">
          <div>
            <h3 className="text-xl font-semibold text-ink">Supply details</h3>
            <p className="muted mt-1">
              Use one consistent unit for this supply.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="name">
              Supply name
            </label>
            <input
              id="name"
              className="field"
              {...register('name')}
              autoFocus
            />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <label className="label" htmlFor="unit">
              Unit
            </label>
            <select id="unit" className="field" {...register('unit')}>
              {units.map((unit: Unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            <FieldError message={errors.unit?.message} />
          </div>
        </section>
        <AssignmentSection
          title="Primary storage"
          prefix="primary"
          locations={locations}
          subsections={primarySubsections}
          register={register}
          setValue={setValue}
          errors={errors.primary}
        />
        <section className="card space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-ink">Backup storage</h3>
              <p className="muted mt-1">
                Optional reserve stock in a different location.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                className="h-4 w-4 accent-ink"
                {...register('backupEnabled')}
              />{' '}
              Add backup
            </label>
          </div>
          {backupEnabled && (
            <AssignmentFields
              prefix="backup"
              locations={locations}
              subsections={backupSubsections}
              register={register}
              setValue={setValue}
              errors={errors.backup}
            />
          )}
        </section>
        {submitError && (
          <p
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {submitError}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Link className="button-secondary" to="/">
            Cancel
          </Link>
          <button className="button-primary" disabled={isSubmitting}>
            <Save size={17} /> {isSubmitting ? 'Saving…' : 'Save supply'}
          </button>
        </div>
      </form>
    </div>
  );
};

type SectionProps = {
  title: string;
  prefix: 'primary' | 'backup';
  locations: Location[];
  subsections: Location['subsections'];
  register: ReturnType<typeof useForm<FormValues>>['register'];
  setValue: ReturnType<typeof useForm<FormValues>>['setValue'];
  errors?: {
    locationId?: { message?: string };
    subsectionId?: { message?: string };
    quantity?: { message?: string };
  };
};

const AssignmentSection = (props: SectionProps) => (
  <section className="card space-y-5">
    <div>
      <h3 className="text-xl font-semibold text-ink">{props.title}</h3>
      <p className="muted mt-1">Choose the exact place and latest quantity.</p>
    </div>
    <AssignmentFields {...props} />
  </section>
);

const AssignmentFields = ({
  prefix,
  locations,
  subsections,
  register,
  setValue,
  errors,
}: Omit<SectionProps, 'title'>) => (
  <div className="grid gap-5 sm:grid-cols-2">
    <div>
      <label className="label" htmlFor={`${prefix}-location`}>
        Location
      </label>
      <select
        id={`${prefix}-location`}
        className="field"
        {...register(
          `${prefix}.locationId` as 'primary.locationId' | 'backup.locationId',
        )}
        onChange={(event) => {
          setValue(
            `${prefix}.locationId` as
              'primary.locationId' | 'backup.locationId',
            event.target.value,
          );
          setValue(
            `${prefix}.subsectionId` as
              'primary.subsectionId' | 'backup.subsectionId',
            '',
          );
        }}
      >
        <option value="">Select location</option>
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
      <FieldError message={errors?.locationId?.message} />
    </div>
    <div>
      <label className="label" htmlFor={`${prefix}-subsection`}>
        Subsection
      </label>
      <select
        id={`${prefix}-subsection`}
        className="field"
        {...register(
          `${prefix}.subsectionId` as
            'primary.subsectionId' | 'backup.subsectionId',
        )}
      >
        <option value="">Select subsection</option>
        {subsections.map((subsection) => (
          <option key={subsection.id} value={subsection.id}>
            {subsection.name}
          </option>
        ))}
      </select>
      <FieldError message={errors?.subsectionId?.message} />
    </div>
    <div>
      <label className="label" htmlFor={`${prefix}-quantity`}>
        Quantity
      </label>
      <input
        id={`${prefix}-quantity`}
        className="field"
        inputMode="decimal"
        {...register(
          `${prefix}.quantity` as 'primary.quantity' | 'backup.quantity',
        )}
      />
      <FieldError message={errors?.quantity?.message} />
    </div>
  </div>
);
