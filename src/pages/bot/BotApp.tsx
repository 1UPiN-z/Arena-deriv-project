/** Deriv Bot app shell — top bar + left icon rail (Dashboard / Builder / Charts / Tutorials). */
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../lib/decimal';

const RAIL_ITEMS = [
  { to: '/bot', icon: '🏠', label: 'Dashboard', end: true },
  { to: '/bot/builder', icon: '🧩', label: 'Bot Builder' },
  { to: '/bot/charts', icon: '📈', label: 'Charts' },
  { to: '/bot/tutorials', icon: '🎓', label: 'Tutorials' },
];

export function BotApp() {
  const location = useLocation();
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const { signedIn, profile, bootstrap, balance } = useAuthStore();
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const prefs = useLiveQuery(() => db.preferences.get('main'), []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--app-bg)]">
      {/* Top bar */}
      <header className="z-40 flex h-14 flex-shrink-0 items-center justify-between border-b border-[var(--panel-border)] bg-[var(--panel-bg)] px-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80" title="Home">
            <svg viewBox="0 0 32 32" className="h-7 w-7">
              <rect width="32" height="32" rx="7" fill="#FF444F" />
              <path d="M9 8h9.2c4 0 6.8 2.6 6.8 6.2 0 2.6-1.4 4.6-3.7 5.5L25 24h-5.2l-3.2-3.8h-3V24H9V8zm4.6 4v4.6h4.2c1.6 0 2.6-1 2.6-2.3 0-1.4-1-2.3-2.6-2.3h-4.2z" fill="#fff" />
            </svg>
            <span className="text-lg font-bold text-[var(--text-main)]">deriv</span>
          </Link>
          <span className="hidden rounded-full bg-deriv-red/10 px-3 py-1 text-xs font-semibold text-deriv-red sm:inline">
            Deriv Bot · simulated demo
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language */}
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex h-9 items-center gap-1.5 rounded-btn border border-[var(--panel-border)] px-3 text-sm font-medium text-[var(--text-main)] transition-colors hover:border-deriv-red"
            >
              🌐 EN
            </button>
            {langOpen && (
              <div className="absolute right-0 top-11 z-50 w-40 animate-fade-down rounded-card border border-[var(--panel-border)] bg-[var(--panel-bg)] p-2 shadow-dropdown">
                {['EN', 'ES', 'PT', 'FR', 'RU'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLangOpen(false)}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-deriv-red/10 ${
                      l === 'EN' ? 'font-semibold text-deriv-red' : 'text-[var(--text-main)]'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-btn border border-[var(--panel-border)] transition-transform hover:scale-105"
            title="Theme"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>

          {/* Account */}
          <Link
            to="/account"
            className="flex h-9 items-center gap-2 rounded-btn border border-[var(--panel-border)] px-3 text-sm transition-colors hover:border-deriv-red"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-deriv-red text-[10px] font-bold text-white">
              {signedIn && profile ? profile.firstName[0]?.toUpperCase() : 'D'}
            </span>
            <span className="hidden font-medium text-[var(--text-main)] sm:inline">
              {signedIn && profile ? `${profile.firstName}` : 'Demo'}
            </span>
            <span className="font-semibold text-deriv-green">{formatMoney(balance)}</span>
            <span className="rounded bg-deriv-teal/15 px-1.5 py-0.5 text-[10px] font-bold text-deriv-teal-dark">USD</span>
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left icon rail */}
        <nav className="z-30 flex w-[68px] flex-shrink-0 flex-col items-center gap-1 border-r border-[var(--panel-border)] bg-[var(--panel-bg)] py-3">
          {RAIL_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              className={({ isActive }) =>
                `group flex w-14 flex-col items-center gap-1 rounded-xl px-1 py-2.5 transition-all duration-200 ${
                  isActive
                    ? 'bg-deriv-red/12 text-deriv-red'
                    : 'text-[var(--text-sub)] hover:bg-gray-100 hover:text-[var(--text-main)] dark:hover:bg-white/10'
                }`
              }
            >
              <span className="text-xl transition-transform duration-200 group-hover:scale-110">{item.icon}</span>
              <span className="text-[9px] font-semibold leading-tight">{item.label}</span>
            </NavLink>
          ))}
          <div className="mt-auto pb-1">
            <Link
              to="/trader"
              title="Demo trader"
              className="flex w-14 flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[var(--text-sub)] transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <span className="text-xl">💹</span>
              <span className="text-[9px] font-semibold">Trader</span>
            </Link>
          </div>
        </nav>

        {/* Content */}
        <main key={location.pathname} className="min-w-0 flex-1 overflow-y-auto animate-fade-in">
          <Outlet context={{ prefs }} />
        </main>
      </div>
    </div>
  );
}
