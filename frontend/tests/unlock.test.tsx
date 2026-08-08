import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '../src/auth';
import { UnlockPage } from '../src/pages/UnlockPage';

const token = (expiry: number) => {
  const payload = btoa(JSON.stringify({ exp: expiry })).replace(/=/g, '');
  return `header.${payload}.signature`;
};

describe('unlock flow', () => {
  it('persists a successful session without persisting the passphrase', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ token: token(Date.now() / 1000 + 86400) }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <UnlockPage />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText('Passphrase'), 'family-secret');
    await user.click(screen.getByRole('button', { name: /unlock app/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/session'),
      expect.objectContaining({
        body: JSON.stringify({ passphrase: 'family-secret' }),
      }),
    );
    expect(localStorage.getItem('home-store-session-token')).toContain(
      'header.',
    );
    expect(localStorage.getItem('family-secret')).toBeNull();
    fetchMock.mockRestore();
  });

  it('shows an API error and keeps the user on the unlock screen', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ error: { message: 'Too many unlock attempts.' } }),
          { status: 429, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <UnlockPage />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText('Passphrase'), 'wrong-secret');
    await user.click(screen.getByRole('button', { name: /unlock app/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many unlock attempts.',
    );
    expect(localStorage.getItem('home-store-session-token')).toBeNull();
    fetchMock.mockRestore();
  });

  it('does not restore an expired local session', () => {
    localStorage.setItem(
      'home-store-session-token',
      token(Date.now() / 1000 - 60),
    );

    render(
      <AuthProvider>
        <UnlockPage />
      </AuthProvider>,
    );

    expect(
      screen.getByRole('heading', { name: /unlock your store/i }),
    ).toBeInTheDocument();
    expect(localStorage.getItem('home-store-session-token')).toBeNull();
  });
});
