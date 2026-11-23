/** Bot Dashboard — "Load or build your bot" tiles + welcome guide + FAQ + saved bots. */
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Accordion } from '../../components/ui/kit';
import { formatDateTime } from '../../lib/ids';
import { deleteStrategy, duplicateStrategy, importStrategyFile } from '../../db/strategies';
import { useUIStore } from '../../store/uiStore';

export function BotDashboardPage() {
  const navigate = useNavigate();
  const toast = useUIStore((s) => s.toast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [googleOpen, setGoogleOpen] = useState(false);
  const strategies = useLiveQuery(() => db.strategies.orderBy('updatedAt').reverse().toArray(), []);
  const sessions = useLiveQuery(() => db.botSessions.orderBy('startedAt').reverse().limit(6).toArray(), []);

  const tiles = [
    {
      icon: '💻',
      title: 'My computer',
      desc: 'Import a bot file from your device',
      onClick: () => fileRef.current?.click(),
    },
    {
      icon: '☁️',
      title: 'Google Drive',
      desc: 'Load a bot from cloud storage',
      onClick: () => setGoogleOpen(true),
    },
    {
      icon: '🧩',
      title: 'Bot Builder',
      desc: 'Build a strategy with drag-and-drop blocks',
      onClick: () => navigate('/bot/builder'),
    },
    {
      icon: '⚡',
      title: 'Quick strategy',
      desc: 'Start with Martingale, D’Alembert, and more',
      onClick: () => navigate('/bot/builder?quick=1'),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Tiles */}
      <h1 className="text-2xl font-bold text-[var(--text-main)]">Load or build your bot</h1>
      <p className="mt-1.5 text-sm text-deriv-muted">
        Import a bot from your computer or Google Drive, build it from scratch, or start with a quick strategy.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <button
            key={t.title}
            onClick={t.onClick}
            className="group animate-fade-up rounded-card border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-deriv-red/40 hover:shadow-card-hover"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-deriv-red/10 text-2xl transition-transform duration-300 group-hover:scale-110">
              {t.icon}
            </div>
            <div className="mt-4 font-semibold text-[var(--text-main)]">{t.title}</div>
            <div className="mt-1 text-xs leading-relaxed text-deriv-muted">{t.desc}</div>
          </button>
        ))}
      </div>

      {/* Saved bots */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-main)]">Your saved bots</h2>
          <Link to="/bot/builder" className="text-sm font-semibold text-deriv-red hover:underline">Open builder →</Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(strategies ?? []).map((s) => (
            <div key={s.id} className="rounded-card border border-[var(--panel-border)] bg-[var(--panel-bg)] p-5 transition-shadow hover:shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-main)]">{s.name}</div>
                  <div className="mt-1 text-xs text-deriv-muted">Updated {formatDateTime(s.meta.updatedAt)}</div>
                </div>
                <span className="badge bg-deriv-teal/10 text-deriv-teal-dark">Saved</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  className="btn-secondary h-8 flex-1 px-3 text-xs"
                  onClick={async () => {
                    localStorage.setItem('deriv-open-strategy', s.id);
                    navigate('/bot/builder');
                  }}
                >
                  Open
                </button>
                <button
                  className="btn-secondary h-8 px-3 text-xs"
                  title="Duplicate"
                  onClick={async () => {
                    await duplicateStrategy(s.id);
                    toast('success', 'Duplicated', `"${s.name}" copied.`);
                  }}
                >
                  ⧉
                </button>
                <button
                  className="btn-secondary h-8 px-3 text-xs"
                  title="Delete"
                  onClick={async () => {
                    if (confirm(`Delete "${s.name}" and its versions?`)) {
                      await deleteStrategy(s.id);
                      toast('info', 'Deleted', `"${s.name}" removed.`);
                    }
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
          {!strategies?.length && (
            <div className="rounded-card border border-dashed border-[var(--panel-border)] p-8 text-center text-sm text-deriv-muted md:col-span-2 lg:col-span-3">
              No saved bots yet — open the Bot Builder to create your first strategy.
            </div>
          )}
        </div>
      </div>

      {/* Recent runs */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-[var(--text-main)]">Recent bot runs</h2>
        <div className="mt-4 overflow-hidden rounded-card border border-[var(--panel-border)]">
          <table className="data-table">
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Started</th>
                <th>Status</th>
                <th>Trades</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {(sessions ?? []).map((s) => (
                <tr key={s.id}>
                  <td className="font-medium">{s.strategyName}</td>
                  <td className="text-deriv-muted">{formatDateTime(s.startedAt)}</td>
                  <td>
                    <span
                      className={`badge ${
                        s.status === 'running'
                          ? 'bg-green-100 text-green-700'
                          : s.status === 'error'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td>{s.stats?.trades ?? '—'}</td>
                  <td className={s.stats && s.stats.totalProfit >= 0 ? 'text-deriv-green' : 'text-loss'}>
                    {s.stats ? `${s.stats.totalProfit >= 0 ? '+' : ''}${s.stats.totalProfit.toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
              {!sessions?.length && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-deriv-muted">No runs yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Welcome + FAQ */}
      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-main)]">Welcome to Deriv Bot!</h2>
          <p className="mt-2 text-sm leading-relaxed text-deriv-muted">
            Ready to automate your trading strategy without writing any code? You&apos;ve come to the right place. Build
            strategies with drag-and-drop blocks, run them against simulated markets, and track every trade.
          </p>
          <div className="mt-5 space-y-3">
            {[
              { to: '/bot/tutorials', icon: '📘', title: 'Deriv Bot — your automated trading partner', desc: 'Full guide to the builder' },
              { to: '/bot/builder', icon: '🧩', title: 'Open the Bot Builder', desc: 'Drag, drop, and configure blocks' },
              { to: '/learn#faqs', icon: '❓', title: 'FAQs & help centre', desc: 'Answers to common questions' },
            ].map((c) => (
              <Link key={c.title} to={c.to} className="group flex items-center gap-4 rounded-card border border-[var(--panel-border)] bg-[var(--panel-bg)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-deriv-red/40">
                <span className="text-2xl">{c.icon}</span>
                <span>
                  <span className="block text-sm font-semibold text-[var(--text-main)] group-hover:text-deriv-red">{c.title}</span>
                  <span className="block text-xs text-deriv-muted">{c.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-bold text-[var(--text-main)]">FAQs</h2>
          <Accordion
            items={[
              { q: 'What is Deriv Bot?', a: 'A visual strategy builder that lets you automate trading with drag-and-drop blocks. In this demo the bot executes against clearly-labelled simulated markets.' },
              { q: 'Where do I find the blocks I need?', a: 'The toolbox on the left of the Bot Builder groups blocks by category: Trade parameters, Purchase conditions, Sell conditions, Restart trading conditions, Analysis, and Utility.' },
              { q: 'How do I remove blocks from the workspace?', a: 'Drag a block onto the trashcan, right-click → Delete, or select a block and press Delete. You can also use Undo.' },
            ]}
          />
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const outcome = await importStrategyFile(await f.text());
          toast(outcome.ok ? 'success' : 'error', outcome.ok ? 'Imported' : 'Import failed', outcome.message);
          if (outcome.ok) navigate('/bot/builder');
          e.target.value = '';
        }}
      />

      {/* Google Drive simulated dialog */}
      {googleOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4" onClick={() => setGoogleOpen(false)}>
          <div className="card w-full max-w-md animate-scale-in p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[var(--text-main)]">☁️ Google Drive</h3>
            <p className="mt-2 text-sm text-deriv-muted">
              Cloud sync is not available in this local educational demo. Export your bot to a file and keep it on your
              device instead — or use the import option to load a previously exported strategy.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button className="btn-secondary h-10 px-5" onClick={() => setGoogleOpen(false)}>Close</button>
              <button
                className="btn-primary h-10 px-5"
                onClick={() => {
                  setGoogleOpen(false);
                  fileRef.current?.click();
                }}
              >
                Import from device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
