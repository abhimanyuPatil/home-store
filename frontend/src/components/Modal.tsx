import { X } from 'lucide-react';

export const Modal = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:max-w-2xl sm:rounded-2xl">
      <div className="flex items-center justify-between gap-4">
        <h2 id="modal-title" className="text-xl font-semibold text-ink">
          {title}
        </h2>
        <button
          className="button-ghost"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  </div>
);
