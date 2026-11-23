/** Marketing site header — responsive, animated dropdowns, mobile menu. */
import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { DropdownLink, NavDropdown } from '../ui/kit';

export function DerivLogo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Deriv home">
      <svg viewBox="0 0 32 32" className="h-8 w-8">
        <rect width="32" height="32" rx="7" fill="#FF444F" />
        <path
          d="M9 8h9.2c4 0 6.8 2.6 6.8 6.2 0 2.6-1.4 4.6-3.7 5.5L25 24h-5.2l-3.2-3.8h-3V24H9V8zm4.6 4v4.6h4.2c1.6 0 2.6-1 2.6-2.3 0-1.4-1-2.3-2.6-2.3h-4.2z"
          fill="#fff"
        />
      </svg>
      <span className={`text-2xl font-bold tracking-tight ${light ? 'text-white' : 'text-deriv-ink dark:text-white'}`}>
        deriv
      </span>
    </Link>
  );
}

const MARKET_LINKS = [
  { to: '/markets/forex', title: 'Forex', desc: 'Major, minor, and exotic pairs' },
  { to: '/markets/derived-indices', title: 'Derived Indices', desc: 'Exclusive 24/7 synthetic markets' },
  { to: '/markets/stocks', title: 'Stocks', desc: 'Trade global market leaders' },
  { to: '/markets/commodities', title: 'Commodities', desc: 'Gold, silver, oil, and more' },
  { to: '/markets/crypto', title: 'Cryptocurrencies', desc: 'Bitcoin, Ethereum, and beyond' },
  { to: '/markets/stock-indices', title: 'Stock Indices', desc: 'Track top global indices' },
];

const PLATFORM_LINKS = [
  { to: '/platforms/deriv-trader', title: 'Deriv Trader', desc: 'Optimised payouts, limited downsides' },
  { to: '/platforms/deriv-bot', title: 'Deriv Bot', desc: 'Automate your trades, no coding' },
  { to: '/platforms/deriv-mt5', title: 'Deriv MT5', desc: 'Power of MT5 with exclusive indices' },
  { to: '/platforms/deriv-ctrader', title: 'Deriv cTrader', desc: 'Copy expert traders' },
  { to: '/platforms/tradingview', title: 'TradingView', desc: 'World-class charts, 400+ indicators' },
  { to: '/platforms/deriv-exchange', title: 'Deriv Exchange', desc: 'Crypto spot and futures' },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const signedIn = useAuthStore((s) => s.signedIn);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-[70] border-b border-black/5 bg-white/90 backdrop-blur-md transition-shadow duration-300 dark:border-white/10 dark:bg-deriv-dark/90">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <DerivLogo />

        <nav className="hidden items-center gap-6 lg:flex">
          <NavDropdown label="Markets" wide>
            <div className="grid grid-cols-2 gap-1">
              {MARKET_LINKS.map((l) => (
                <DropdownLink key={l.to} {...l} />
              ))}
            </div>
          </NavDropdown>
          <NavDropdown label="Platforms" wide>
            <div className="grid grid-cols-2 gap-1">
              {PLATFORM_LINKS.map((l) => (
                <DropdownLink key={l.to} {...l} />
              ))}
            </div>
          </NavDropdown>
          <NavLink to="/trader" className={({ isActive }) => `nav-link ${isActive ? 'text-deriv-red' : ''}`}>
            Trade
          </NavLink>
          <NavLink to="/bot" className={({ isActive }) => `nav-link ${isActive ? 'text-deriv-red' : ''}`}>
            Deriv Bot
          </NavLink>
          <NavDropdown label="Learn">
            <DropdownLink to="/learn" title="Trading guide" desc="Learn the basics of trading" />
            <DropdownLink to="/learn#faqs" title="FAQs" desc="Answers to common questions" />
            <DropdownLink to="/bot/tutorials" title="Bot tutorials" desc="Step-by-step bot guides" />
          </NavDropdown>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-lg transition-all duration-300 hover:scale-105 hover:border-deriv-red dark:border-white/15"
            aria-label="Toggle theme"
          >
            <span className="transition-transform duration-500" style={{ transform: theme === 'dark' ? 'rotate(180deg)' : 'none' }}>
              {theme === 'dark' ? '🌙' : '☀️'}
            </span>
          </button>
          {signedIn ? (
            <Link to="/account" className="btn-secondary hidden h-10 px-4 sm:inline-flex">
              My account
            </Link>
          ) : (
            <Link to="/login" className="btn-secondary hidden h-10 px-4 sm:inline-flex">
              Log in
            </Link>
          )}
          <Link to={signedIn ? '/bot' : '/signup'} className="btn-primary hidden h-10 px-5 sm:inline-flex">
            {signedIn ? 'Open Deriv Bot' : 'Open account'}
          </Link>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-btn border border-gray-200 lg:hidden dark:border-white/15"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <div className="space-y-1.5">
              <span className={`block h-0.5 w-5 bg-deriv-ink transition-transform duration-300 dark:bg-white ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`block h-0.5 w-5 bg-deriv-ink transition-opacity duration-300 dark:bg-white ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-5 bg-deriv-ink transition-transform duration-300 dark:bg-white ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden border-t border-gray-100 bg-white transition-[max-height,opacity] duration-400 ease-out lg:hidden dark:border-white/10 dark:bg-deriv-dark ${
          mobileOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="max-h-[75vh] space-y-1 overflow-y-auto px-4 py-4">
          {[
            { to: '/', label: 'Home' },
            { to: '/markets/derived-indices', label: 'Markets' },
            { to: '/platforms/deriv-bot', label: 'Platforms' },
            { to: '/trader', label: 'Trade' },
            { to: '/bot', label: 'Deriv Bot' },
            { to: '/learn', label: 'Learn' },
            { to: '/account', label: 'My account' },
            { to: '/login', label: 'Log in' },
            { to: '/signup', label: 'Open account' },
          ].map((l) => (
            <Link
              key={l.to + l.label}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-btn px-4 py-3 text-base font-semibold transition-colors hover:bg-deriv-red/5 hover:text-deriv-red ${
                location.pathname === l.to ? 'bg-deriv-red/10 text-deriv-red' : 'text-deriv-ink dark:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

const FOOTER_COLS = [
  {
    title: 'About',
    links: [
      { to: '/about', label: 'About this project' },
      { to: '/about#why', label: 'Why Deriv?' },
      { to: '/learn', label: 'Learn' },
    ],
  },
  {
    title: 'Platforms',
    links: [
      { to: '/platforms/deriv-trader', label: 'Deriv Trader' },
      { to: '/platforms/deriv-bot', label: 'Deriv Bot' },
      { to: '/platforms/deriv-mt5', label: 'Deriv MT5' },
      { to: '/platforms/deriv-ctrader', label: 'Deriv cTrader' },
      { to: '/platforms/tradingview', label: 'TradingView' },
      { to: '/platforms/deriv-exchange', label: 'Deriv Exchange' },
    ],
  },
  {
    title: 'Markets',
    links: [
      { to: '/markets/forex', label: 'Forex' },
      { to: '/markets/derived-indices', label: 'Derived Indices' },
      { to: '/markets/stocks', label: 'Stocks' },
      { to: '/markets/commodities', label: 'Commodities' },
      { to: '/markets/crypto', label: 'Crypto' },
      { to: '/markets/stock-indices', label: 'Stock Indices' },
    ],
  },
  {
    title: 'Trading',
    links: [
      { to: '/trader', label: 'Demo trader' },
      { to: '/bot', label: 'Deriv Bot builder' },
      { to: '/signup', label: 'Demo account' },
    ],
  },
  {
    title: 'Support',
    links: [
      { to: '/learn#faqs', label: 'Help centre' },
      { to: '/bot/tutorials', label: 'Bot tutorials' },
      { to: '/about#contact', label: 'Contact' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-deriv-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-6">
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/60">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to + l.label}>
                    <Link to={l.to} className="text-sm text-white/80 transition-colors duration-200 hover:text-deriv-red">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-white/10 pt-10">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row">
            <div className="max-w-xl">
              <div className="mb-4 flex items-center gap-2">
                <svg viewBox="0 0 32 32" className="h-8 w-8">
                  <rect width="32" height="32" rx="7" fill="#FF444F" />
                  <path
                    d="M9 8h9.2c4 0 6.8 2.6 6.8 6.2 0 2.6-1.4 4.6-3.7 5.5L25 24h-5.2l-3.2-3.8h-3V24H9V8zm4.6 4v4.6h4.2c1.6 0 2.6-1 2.6-2.3 0-1.4-1-2.3-2.6-2.3h-4.2z"
                    fill="#fff"
                  />
                </svg>
                <span className="text-2xl font-bold">deriv</span>
              </div>
              <p className="text-sm leading-relaxed text-white/60">
                This site is an <strong className="text-white/90">educational reconstruction</strong> of the Deriv platform
                experience, built as an independent project. It is not affiliated with, endorsed by, or connected to Deriv.
                All markets are simulated, all balances are virtual, and no real money can be deposited, traded, or withdrawn.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {['Visa', 'Mastercard', 'Skrill', 'Neteller', 'Bitcoin', 'USDT', 'Bank transfer'].map((p) => (
                <span key={p} className="rounded-btn border border-white/15 px-3 py-2 text-xs text-white/70">
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/50 md:flex-row">
            <p>© {new Date().getFullYear()} Deriv platform reconstruction — educational demo. Not real trading.</p>
            <div className="flex gap-6">
              <Link to="/about#risk" className="transition-colors hover:text-white">
                Risk disclaimer
              </Link>
              <Link to="/about#terms" className="transition-colors hover:text-white">
                Terms
              </Link>
              <Link to="/about#privacy" className="transition-colors hover:text-white">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
