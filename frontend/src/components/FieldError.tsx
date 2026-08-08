export const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1 text-xs text-red-600" role="alert">
      {message}
    </p>
  ) : null;
