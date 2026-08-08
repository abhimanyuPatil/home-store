import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react';

export const LoadingState = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="flex items-center gap-2 py-12 text-slate" role="status">
    <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <div
    className="card flex items-start gap-3 border-red-200 bg-red-50 text-red-800"
    role="alert"
  >
    <AlertCircle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
    <div className="flex-1">
      <p className="font-semibold">Something went wrong</p>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry && (
        <button
          className="button-secondary mt-4 border-red-300 text-red-800"
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  </div>
);

export const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="card border-dashed text-center">
    <p className="text-lg font-semibold text-ink">{title}</p>
    <p className="mx-auto mt-2 max-w-md text-sm text-slate">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const Notice = ({ children }: { children: React.ReactNode }) => (
  <div
    className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
    role="status"
  >
    <CheckCircle2 size={17} aria-hidden="true" />
    {children}
  </div>
);
