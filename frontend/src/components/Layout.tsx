import {
  Boxes,
  Home,
  LogOut,
  MapPin,
  PackageOpen,
  ShieldAlert,
} from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../auth';

const links = [
  { to: '/', label: 'Primary inventory', icon: Home, end: true },
  { to: '/backup', label: 'Backup inventory', icon: Boxes },
  { to: '/out-of-stock', label: 'Out of stock', icon: ShieldAlert },
  { to: '/storage', label: 'Storage setup', icon: MapPin },
];

export const Layout = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const current =
    links.find((link) => link.to === location.pathname)?.label ?? 'Home Store';

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <aside className="bg-ink text-white lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex items-center justify-between px-5 py-5 lg:block lg:px-7 lg:py-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent p-2 text-ink">
              <PackageOpen size={23} />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Home Store</p>
              <p className="text-xs text-white/60">Household inventory</p>
            </div>
          </div>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:flex-1 lg:space-y-2 lg:px-4 lg:py-4"
          aria-label="Primary navigation"
        >
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-accent text-ink' : 'text-white/75 hover:bg-white/10 hover:text-white'}`
              }
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          className="button-ghost mx-4 mb-5 hidden justify-start text-white/75 hover:bg-white/10 hover:text-white lg:flex"
          onClick={signOut}
        >
          <LogOut size={17} /> Lock app
        </button>
      </aside>
      <main className="min-w-0 flex-1 lg:ml-72">
        <header className="border-b border-line bg-white px-5 py-5 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm text-slate">Home Store</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              {current}
            </h1>
          </div>
        </header>
        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
