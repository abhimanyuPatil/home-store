import { LockKeyhole, PackageOpen } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '../auth';

export const UnlockPage = () => {
  const { signIn } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(pin);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to unlock Home Store.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-5">
      <section className="card w-full max-w-md p-8 sm:p-10">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-accent p-3 text-ink">
            <PackageOpen size={26} />
          </div>
          <div>
            <p className="text-xl font-semibold text-ink">Home Store</p>
            <p className="text-sm text-slate">Your household inventory</p>
          </div>
        </div>
        <div className="mt-10">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Unlock your store
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate">
            Enter the four-digit household PIN to continue.
          </p>
        </div>
        <form className="mt-7 space-y-5" onSubmit={submit}>
          <div>
            <label className="label" htmlFor="pin">
              PIN
            </label>
            <input
              id="pin"
              className="field"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              autoComplete="one-time-code"
              required
              autoFocus
            />
          </div>
          {error && (
            <p
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}
          <button className="button-primary w-full" disabled={loading}>
            {loading ? (
              'Unlocking…'
            ) : (
              <>
                <LockKeyhole size={17} /> Unlock app
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
};
