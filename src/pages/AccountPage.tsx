/** Account area — profile, personal info, settings, security, sessions, data. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, exportAll, restoreAll, type AuthSession } from '../db/db';
import { useAuthStore, DEMO_BASE_BALANCE } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { formatDateTime, uid } from '../lib/ids';
import { COUNTRIES } from '../lib/validation';
import { EmptyState, Modal, Spinner, Tabs, Toggle } from '../components/ui/kit';
import { formatMoney } from '../lib/decimal';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'personal', label: 'Personal info' },
  { id: 'contact', label: 'Contact info' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'sessions', label: 'Sessions & activity' },
  { id: 'data', label: 'Data' },
];

export function AccountPage() {
  const { profile, signedIn, balance, bootstrap, updateProfile, changePassword, logout, sessions, endSession } = useAuthStore();
  const toast = useUIStore((s) => s.toast);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void bootstrap().finally(() => setLoading(false));
  }, [bootstrap]);

  const prefs = useLiveQuery(() => db.preferences.get('main'), []);
  const notifications = useLiveQuery(() => db.notifications.orderBy('ts').reverse().limit(50).toArray(), []);
  const auditEvents = useLiveQuery(() => db.auditEvents.orderBy('ts').reverse().limit(50).toArray(), []);
  const trades = useLiveQuery(() => db.trades.orderBy('openedAt').reverse().limit(50).toArray(), []);
  const strategies = useLiveQuery(() => db.strategies.toArray(), []);
  const sessionsList = useLiveQuery(() => db.authSessions.orderBy('startedAt').reverse().limit(30).toArray(), []);
  const botSessions = useLiveQuery(() => db.botSessions.orderBy('startedAt').reverse().limit(20).toArray(), []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (!signedIn || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24">
        <EmptyState
          icon="🔐"
          title="Sign in to your demo account"
          body="Create a local demo account to manage your profile, preferences, and data. Everything stays in your browser."
          action={
            <div className="flex gap-3">
              <Link to="/login" className="btn-primary h-11 px-6">Log in</Link>
              <Link to="/signup" className="btn-secondary h-11 px-6">Sign up</Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-deriv-band pb-20 dark:bg-deriv-dark">
      {/* Profile header */}
      <div className="bg-deriv-ink py-10 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-deriv-red text-3xl font-bold">
              {profile.firstName[0]?.toUpperCase() ?? 'D'}
              {profile.lastName[0]?.toUpperCase() ?? ''}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="mt-1 text-white/60">{profile.email} · Demo account</p>
            </div>
            <div className="rounded-card border border-white/15 bg-white/5 px-6 py-4">
              <div className="text-xs uppercase tracking-wide text-white/50">Virtual balance</div>
              <div className="mt-1 text-2xl font-bold text-deriv-teal">{formatMoney(balance)}</div>
              <div className="text-xs text-white/50">Started with {formatMoney(DEMO_BASE_BALANCE)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="-mt-0 overflow-x-auto">
          <div className="pt-4">
            <Tabs tabs={TABS} active={tab} onChange={setTab} />
          </div>
        </div>

        <div className="mt-8">
          {tab === 'overview' && (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="card p-6">
                <h3 className="font-semibold text-deriv-ink dark:text-white">Account summary</h3>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-deriv-muted">Name</dt><dd className="font-medium dark:text-white">{profile.firstName} {profile.lastName}</dd></div>
                  <div className="flex justify-between"><dt className="text-deriv-muted">Country</dt><dd className="font-medium dark:text-white">{profile.country}</dd></div>
                  <div className="flex justify-between"><dt className="text-deriv-muted">Currency</dt><dd className="font-medium dark:text-white">{profile.currency}</dd></div>
                  <div className="flex justify-between"><dt className="text-deriv-muted">Member since</dt><dd className="font-medium dark:text-white">{formatDateTime(profile.createdAt)}</dd></div>
                </dl>
              </div>
              <div className="card p-6">
                <h3 className="font-semibold text-deriv-ink dark:text-white">Trading activity</h3>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-deriv-muted">Strategies saved</dt><dd className="font-medium dark:text-white">{strategies?.length ?? 0}</dd></div>
                  <div className="flex justify-between"><dt className="text-deriv-muted">Bot runs</dt><dd className="font-medium dark:text-white">{botSessions?.length ?? 0}</dd></div>
                  <div className="flex justify-between"><dt className="text-deriv-muted">Total trades</dt><dd className="font-medium dark:text-white">{trades?.length ?? 0}</dd></div>
                  <div className="flex justify-between"><dt className="text-deriv-muted">Virtual balance</dt><dd className="font-medium text-deriv-teal">{formatMoney(balance)}</dd></div>
                </dl>
              </div>
              <div className="card p-6">
                <h3 className="font-semibold text-deriv-ink dark:text-white">Quick links</h3>
                <div className="mt-4 space-y-2">
                  <Link to="/bot" className="block rounded-btn border border-gray-200 px-4 py-3 text-sm font-medium transition-colors hover:border-deriv-red hover:text-deriv-red dark:border-white/10 dark:text-white">🤖 Open Deriv Bot</Link>
                  <Link to="/trader" className="block rounded-btn border border-gray-200 px-4 py-3 text-sm font-medium transition-colors hover:border-deriv-red hover:text-deriv-red dark:border-white/10 dark:text-white">📈 Open demo trader</Link>
                  <button onClick={() => void logout()} className="block w-full rounded-btn border border-gray-200 px-4 py-3 text-left text-sm font-medium transition-colors hover:border-loss hover:text-loss dark:border-white/10 dark:text-white">🚪 Log out</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'personal' && (
            <ProfileForm
              title="Personal information"
              fields={[
                { key: 'firstName', label: 'First name', value: profile.firstName },
                { key: 'lastName', label: 'Last name', value: profile.lastName },
                { key: 'country', label: 'Country/region', value: profile.country, select: COUNTRIES },
              ]}
              onSave={(patch) => updateProfile(patch).then(() => toast('success', 'Saved', 'Personal information updated.'))}
            />
          )}

          {tab === 'contact' && (
            <ProfileForm
              title="Contact information"
              fields={[
                { key: 'email', label: 'Email', value: profile.email },
                { key: 'phone', label: 'Phone', value: profile.phone },
                { key: 'city', label: 'City', value: profile.city ?? '' },
                { key: 'address', label: 'Address', value: profile.address ?? '' },
                { key: 'postcode', label: 'Postcode', value: profile.postcode ?? '' },
              ]}
              onSave={(patch) => updateProfile(patch).then(() => toast('success', 'Saved', 'Contact information updated.'))}
            />
          )}

          {tab === 'preferences' && prefs && (
            <div className="card max-w-2xl p-6">
              <h3 className="font-semibold text-deriv-ink dark:text-white">Preferences</h3>
              <div className="mt-6 space-y-5">
                <PrefRow label="Dark theme" desc="Switch the whole app between light and dark.">
                  <Toggle checked={prefs.theme === 'dark'} onChange={async (v) => {
                    await db.preferences.put({ ...prefs, theme: v ? 'dark' : 'light' });
                    useUIStore.getState().setTheme(v ? 'dark' : 'light');
                  }} />
                </PrefRow>
                <PrefRow label="Notifications" desc="Show in-app notifications for bot runs and account events.">
                  <Toggle checked={prefs.notificationsEnabled} onChange={(v) => void db.preferences.put({ ...prefs, notificationsEnabled: v })} />
                </PrefRow>
                <PrefRow label="Sound effects" desc="Play sounds for the bot's notification blocks.">
                  <Toggle checked={prefs.soundEnabled} onChange={(v) => void db.preferences.put({ ...prefs, soundEnabled: v })} />
                </PrefRow>
                <PrefRow label="Confirm destructive actions" desc="Ask before deleting strategies or clearing data.">
                  <Toggle checked={prefs.confirmDestructive} onChange={(v) => void db.preferences.put({ ...prefs, confirmDestructive: v })} />
                </PrefRow>
                <div>
                  <label className="label">Default chart type</label>
                  <select
                    className="input max-w-xs"
                    value={prefs.chartType}
                    onChange={(e) => void db.preferences.put({ ...prefs, chartType: e.target.value as 'candles' | 'line' })}
                  >
                    <option value="candles">Candlesticks</option>
                    <option value="line">Line</option>
                  </select>
                </div>
                <div>
                  <label className="label">Default bot speed</label>
                  <select
                    className="input max-w-xs"
                    value={prefs.defaultSpeed}
                    onChange={(e) => void db.preferences.put({ ...prefs, defaultSpeed: Number(e.target.value) })}
                  >
                    {[1, 2, 5, 10].map((s) => (
                      <option key={s} value={s}>{s}× (simulation speed)</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {tab === 'security' && <SecuritySection onChangePassword={changePassword} />}

          {tab === 'notifications' && (
            <div className="card max-w-3xl p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-deriv-ink dark:text-white">Notifications</h3>
                <button
                  className="btn-secondary h-9 px-4 text-sm"
                  onClick={async () => {
                    await db.notifications.clear();
                    toast('info', 'Cleared', 'All notifications removed.');
                  }}
                >
                  Clear all
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {(notifications ?? []).length === 0 && <EmptyState icon="🔔" title="No notifications yet" />}
                {(notifications ?? []).map((n) => (
                  <div key={n.id} className={`rounded-btn border px-4 py-3 ${n.read ? 'border-gray-100 opacity-70 dark:border-white/10' : 'border-deriv-red/30 bg-deriv-red/5'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-deriv-ink dark:text-white">{n.title}</span>
                      <span className="text-xs text-deriv-muted">{formatDateTime(n.ts)}</span>
                    </div>
                    <p className="mt-1 text-sm text-deriv-body/80 dark:text-white/70">{n.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'sessions' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card p-6">
                <h3 className="font-semibold text-deriv-ink dark:text-white">Login sessions</h3>
                <div className="mt-4 overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr><th>Started</th><th>Device</th><th>Status</th><th /></tr>
                    </thead>
                    <tbody>
                      {(sessionsList ?? []).map((s) => (
                        <tr key={s.id}>
                          <td className="whitespace-nowrap">{formatDateTime(s.startedAt)}</td>
                          <td className="max-w-[180px] truncate text-xs text-deriv-muted">{s.userAgent.slice(0, 40)}…</td>
                          <td>
                            <span className={`badge ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {s.active ? 'Active' : 'Ended'}
                            </span>
                          </td>
                          <td>
                            {s.active && (
                              <button className="text-xs font-semibold text-loss hover:underline" onClick={() => void endSession(s.id!)}>
                                End
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-semibold text-deriv-ink dark:text-white">Account activity</h3>
                <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
                  {(auditEvents ?? []).map((a) => (
                    <div key={a.id} className="flex items-start justify-between gap-4 rounded-btn bg-deriv-band px-4 py-2.5 dark:bg-white/5">
                      <div>
                        <div className="text-sm font-medium text-deriv-ink dark:text-white">{a.action}</div>
                        <div className="text-xs text-deriv-muted">{a.detail}</div>
                      </div>
                      <div className="whitespace-nowrap text-xs text-deriv-muted">{formatDateTime(a.ts)}</div>
                    </div>
                  ))}
                  {(auditEvents ?? []).length === 0 && <EmptyState icon="📜" title="No activity yet" />}
                </div>
              </div>
            </div>
          )}

          {tab === 'data' && <DataSection />}
        </div>
      </div>
    </div>
  );
}

function PrefRow({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-semibold text-deriv-ink dark:text-white">{label}</div>
        <div className="text-xs text-deriv-muted">{desc}</div>
      </div>
      {children}
    </div>
  );
}

function ProfileForm({
  title,
  fields,
  onSave,
}: {
  title: string;
  fields: { key: string; label: string; value: string; select?: string[] }[];
  onSave: (patch: Record<string, string>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.value])),
  );
  const [busy, setBusy] = useState(false);
  return (
    <div className="card max-w-2xl p-6">
      <h3 className="font-semibold text-deriv-ink dark:text-white">{title}</h3>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            {f.select ? (
              <select className="input" value={values[f.key]} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}>
                {f.select.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input className="input" value={values[f.key]} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
            )}
          </div>
        ))}
      </div>
      <button
        className="btn-primary mt-6 h-11 px-6"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await onSave(values);
          setBusy(false);
        }}
      >
        {busy ? <Spinner size={18} /> : 'Save changes'}
      </button>
    </div>
  );
}

function SecuritySection({ onChangePassword }: { onChangePassword: (cur: string, next: string) => Promise<{ ok: boolean; message: string }> }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="card max-w-2xl p-6">
      <h3 className="font-semibold text-deriv-ink dark:text-white">Change password</h3>
      <p className="mt-1 text-sm text-deriv-muted">Local demo credentials — stored only in your browser.</p>
      <div className="mt-6 space-y-4">
        <div>
          <label className="label">Current password</label>
          <input type="password" className="input" value={cur} onChange={(e) => setCur(e.target.value)} />
        </div>
        <div>
          <label className="label">New password</label>
          <input type="password" className="input" value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <div>
          <label className="label">Confirm new password</label>
          <input type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {msg && (
          <p className={`rounded-btn px-3 py-2 text-sm ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-loss/10 text-loss'}`}>{msg.message}</p>
        )}
        <button
          className="btn-primary h-11 px-6"
          disabled={busy}
          onClick={async () => {
            if (next !== confirm) {
              setMsg({ ok: false, message: 'Passwords do not match.' });
              return;
            }
            setBusy(true);
            const res = await onChangePassword(cur, next);
            setMsg(res);
            if (res.ok) {
              setCur('');
              setNext('');
              setConfirm('');
            }
            setBusy(false);
          }}
        >
          {busy ? <Spinner size={18} /> : 'Update password'}
        </button>
      </div>
    </div>
  );
}

function DataSection() {
  const toast = useUIStore((s) => s.toast);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid max-w-4xl gap-6 md:grid-cols-2">
      <div className="card p-6">
        <h3 className="font-semibold text-deriv-ink dark:text-white">Export data</h3>
        <p className="mt-2 text-sm text-deriv-muted">
          Download the entire local database (profiles, strategies, versions, bot sessions, trades, logs) as a JSON
          backup file.
        </p>
        <button
          className="btn-primary mt-5 h-11 px-6"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const bundle = await exportAll();
              const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `deriv-demo-backup-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast('success', 'Export ready', 'Your backup file was downloaded.');
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Spinner size={18} /> : 'Download backup'}
        </button>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-deriv-ink dark:text-white">Restore data</h3>
        <p className="mt-2 text-sm text-deriv-muted">
          Restore from a previously exported backup file. This replaces the current local database.
        </p>
        <button className="btn-secondary mt-5 h-11 px-6" onClick={() => setRestoreOpen(true)}>Restore from file</button>
      </div>

      <Modal open={restoreOpen} onClose={() => setRestoreOpen(false)} title="Restore backup">
        <p className="text-sm text-deriv-muted">
          Select a <code className="rounded bg-gray-100 px-1 dark:bg-white/10">deriv-demo-export</code> JSON file. The
          current local data will be replaced.
        </p>
        <input
          type="file"
          accept="application/json"
          className="mt-4 block w-full text-sm"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const text = await file.text();
              const res = await restoreAll(JSON.parse(text));
              toast(res.ok ? 'success' : 'error', res.ok ? 'Restored' : 'Restore failed', res.message);
              setRestoreOpen(false);
            } catch {
              toast('error', 'Restore failed', 'The file could not be parsed.');
            }
          }}
        />
        <p className="mt-3 text-xs text-deriv-muted">Tip: exports include a unique magic field so invalid files are rejected.</p>
      </Modal>
    </div>
  );
}
