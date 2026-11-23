/** Shared UI kit — animated, accessible, Tailwind-based. */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';

// ---------------------------------------------------------------------------
// Scroll reveal
// ---------------------------------------------------------------------------

export function ScrollReveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTimeout(() => el.classList.add('is-visible'), delay);
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Count-up stat
// ---------------------------------------------------------------------------

export function CountUp({ to, suffix = '', prefix = '', decimals = 0, duration = 1600 }: { to: number; suffix?: string; prefix?: string; decimals?: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          obs.disconnect();
          const start = performance.now();
          const step = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(to * eased);
            if (p < 1) raf = requestAnimationFrame(step);
          };
          raf = requestAnimationFrame(step);
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);
  return (
    <span ref={ref}>
      {prefix}
      {value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className={`relative w-full ${width} card shadow-dialog animate-scale-in max-h-[88vh] flex flex-col`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/10">
          <h3 className="text-lg font-bold text-deriv-ink dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-gray-100 px-6 py-4 dark:border-white/10">{footer}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

const TOAST_STYLES: Record<string, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-green-200 bg-green-50 text-green-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-900',
};
const TOAST_ICONS: Record<string, string> = { info: 'ℹ️', success: '✓', warning: '⚠', error: '✕' };

export function ToastHost() {
  const toasts = useUIStore((s) => s.toasts);
  const dismiss = useUIStore((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-enter pointer-events-auto flex items-start gap-3 rounded-card border px-4 py-3 shadow-dropdown ${TOAST_STYLES[t.kind]}`}
        >
          <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/70 text-sm font-bold">
            {TOAST_ICONS[t.kind]}
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold">{t.title}</div>
            {t.body && <div className="mt-0.5 text-xs opacity-80">{t.body}</div>}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-xs opacity-50 transition-opacity hover:opacity-100">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Accordion
// ---------------------------------------------------------------------------

export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-gray-200 rounded-card border border-gray-200 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-deriv-dark-2">
      {items.map((item, i) => (
        <div key={item.q}>
          <button
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-semibold text-deriv-ink dark:text-white">{item.q}</span>
            <span
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-transform duration-300 dark:border-white/20 ${
                open === i ? 'rotate-45' : ''
              }`}
            >
              +
            </span>
          </button>
          <div className={`accordion-body ${open === i ? 'open' : ''}`}>
            <div>
              <p className="px-5 pb-5 text-sm leading-relaxed text-deriv-body/80 dark:text-white/70">{item.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

export function Tabs({
  tabs,
  active,
  onChange,
  variant = 'underline',
}: {
  tabs: { id: string; label: string; badge?: number }[];
  active: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pill';
}) {
  return (
    <div className={variant === 'pill' ? 'inline-flex rounded-btn bg-gray-100 p-1 dark:bg-white/10' : 'flex gap-1 border-b border-gray-200 dark:border-white/10'}>
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={
              variant === 'pill'
                ? `rounded-btn px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    isActive ? 'bg-white text-deriv-ink shadow-sm dark:bg-deriv-dark-3 dark:text-white' : 'text-gray-500 hover:text-deriv-ink dark:hover:text-white'
                  }`
                : `relative px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                    isActive ? 'text-deriv-red' : 'text-gray-500 hover:text-deriv-ink dark:hover:text-white'
                  }`
            }
          >
            {t.label}
            {typeof t.badge === 'number' && t.badge > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-deriv-red px-1 text-[10px] text-white">{t.badge}</span>
            )}
            {variant === 'underline' && isActive && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-deriv-red" />}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deriv-red/40 ${
        checked ? 'bg-deriv-green' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Spinner / empty state / stars
// ---------------------------------------------------------------------------

export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-gray-300 border-t-deriv-red ${className}`}
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}

export function EmptyState({ icon = '📭', title, body, action }: { icon?: string; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-gray-300 px-6 py-12 text-center dark:border-white/15">
      <div className="text-4xl">{icon}</div>
      <div className="font-semibold text-deriv-ink dark:text-white">{title}</div>
      {body && <div className="max-w-sm text-sm text-deriv-muted">{body}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Stars({ count = 5, filled = 5 }: { count?: number; filled?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${filled} out of ${count} stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className={`h-4 w-4 ${i < filled ? 'fill-[#00B67A]' : 'fill-gray-300'}`}>
          <path d="M10 1.5l2.47 5.32 5.83.68-4.3 3.97 1.15 5.76L10 14.4l-5.15 2.83 1.15-5.76-4.3-3.97 5.83-.68z" />
        </svg>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Nav dropdown (hover on desktop, click on mobile)
// ---------------------------------------------------------------------------

export function NavDropdown({
  label,
  children,
  wide = false,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className={`nav-link flex items-center gap-1 py-2 ${open ? 'text-deriv-red' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <svg viewBox="0 0 12 12" className={`h-3 w-3 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      <div
        className={`absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 transition-all duration-250 ${
          open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
        }`}
      >
        <div className={`animate-fade-down rounded-card border border-black/5 bg-white p-2 shadow-dropdown dark:border-white/10 dark:bg-deriv-dark-2 ${wide ? 'w-[520px]' : 'w-64'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function DropdownLink({ to, title, desc, onClick }: { to?: string; title: string; desc?: string; onClick?: () => void }) {
  const inner = (
    <div className="group flex flex-col gap-0.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-deriv-red/5 dark:hover:bg-white/5">
      <span className="text-sm font-semibold text-deriv-ink transition-colors group-hover:text-deriv-red dark:text-white">{title}</span>
      {desc && <span className="text-xs text-deriv-muted">{desc}</span>}
    </div>
  );
  return to ? (
    <Link to={to} onClick={onClick} className="block">
      {inner}
    </Link>
  ) : (
    <button onClick={onClick} className="block w-full text-left">
      {inner}
    </button>
  );
}
