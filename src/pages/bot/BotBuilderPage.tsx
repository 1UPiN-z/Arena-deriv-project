/** Bot Builder — Blockly workspace + run controls + dashboard drawer. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import type { WorkspaceSvg } from 'blockly';
import { BlocklyWorkspace, type BlocklyWorkspaceHandle } from '../../components/blockly/BlocklyWorkspace';
import { CandleChart } from '../../components/charts/CandleChart';
import { Modal, Spinner, Tabs, Toggle } from '../../components/ui/kit';
import { compileStrategy } from '../../bot/interpreter';
import type { ValidationIssue, WorkspaceState } from '../../bot/types';
import { SYMBOLS, SYMBOL_MAP, SymbolId, Timeframe, CANDLE_INTERVALS } from '../../market/types';
import { requestHistory, useMarketStore } from '../../store/marketStore';
import { useBotStore } from '../../store/botStore';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../db/db';
import {
  createStrategy,
  deleteStrategy,
  duplicateStrategy,
  ensureDefaultStrategy,
  exportStrategyFile,
  importStrategyFile,
  listVersions,
  renameStrategy,
  restoreVersion,
  saveStrategy,
} from '../../db/strategies';
import { formatDateTime, formatTime } from '../../lib/ids';
import { formatSigned } from '../../lib/decimal';
import { TOOLBOX_BLOCK_TYPES } from '../../bot/blocks/toolbox';
import { QuickStrategyModal } from './QuickStrategyModal';

interface OutletCtx {
  prefs?: { defaultSpeed?: number; soundEnabled?: boolean } | undefined;
}

export function BotBuilderPage() {
  const { prefs } = useOutletContext<OutletCtx>();
  const wsRef = useRef<BlocklyWorkspaceHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [docName, setDocName] = useState('Unnamed bot');
  const [docId, setDocId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [drawerTab, setDrawerTab] = useState('summary');
  const [quickOpen, setQuickOpen] = useState(searchParams.get('quick') === '1');
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [importIssues, setImportIssues] = useState<{ ok: boolean; message: string; issues: { severity: string; message: string }[] } | null>(null);
  const [validation, setValidation] = useState<ValidationIssue[] | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [chartTf, setChartTf] = useState<Timeframe>('1m');
  const [initialWs, setInitialWs] = useState<WorkspaceState | null>(null);

  const bot = useBotStore();
  const toast = useUIStore((s) => s.toast);
  const dark = useUIStore((s) => s.theme === 'dark');
  const { balance, bootstrap } = useAuthStore();

  // ---- load current strategy -------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await bootstrap();
      const doc = await ensureDefaultStrategy();
      if (cancelled) return;
      setDocId(doc.id);
      setDocName(doc.name);
      setInitialWs(doc.workspace);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- autosave head workspace ----------------------------------------------
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onWorkspaceChange = useCallback(
    (state: WorkspaceState) => {
      setDirty(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        if (!docId) return;
        const current = await db.strategies.get(docId);
        if (!current) return;
        await saveStrategy(current, state);
        setSavedAt(Date.now());
        setDirty(false);
      }, 900);
    },
    [docId],
  );

  // ---- chart data -----------------------------------------------------------
  const selectedSymbol = useMemo(() => {
    try {
      const ws = wsRef.current?.save();
      const compiled = ws ? compileStrategy(ws) : null;
      return compiled?.tradeDef.market ?? 'R_100';
    } catch {
      return 'R_100';
    }
    // recompute when workspace changes (dirty flag) or on load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, dirty, docId]);

  const feed = useMarketStore((s) => s.feeds[selectedSymbol]);
  useEffect(() => {
    void requestHistory(selectedSymbol, chartTf);
  }, [selectedSymbol, chartTf]);
  const candles = feed?.candles[chartTf] ?? [];
  const symbolSpec = SYMBOL_MAP[selectedSymbol];

  // ---- run controls ---------------------------------------------------------
  const handleRun = async () => {
    const ws = wsRef.current?.save();
    if (!ws || !docId) return;
    const compiled = compileStrategy(ws);
    const errors = compiled.issues.filter((i) => i.severity === 'error');
    if (errors.length) {
      setValidation(compiled.issues);
      return;
    }
    const current = await db.strategies.get(docId);
    if (current) {
      const { doc, newVersion } = await saveStrategy(current, ws, { note: 'Snapshot before run', forceVersion: true });
      const versionId = (await listVersions(doc.id)).find((v) => v.version === newVersion)?.id ?? null;
      await bot.start(ws, doc.id, versionId, doc.name, balance || 10_000);
    } else {
      await bot.start(ws, null, null, docName, balance || 10_000);
    }
  };

  const handleStop = () => bot.stop();
  const handlePauseResume = () => (bot.status === 'paused' ? bot.resume() : bot.pause());

  const handleExport = async () => {
    if (!docId) return;
    const text = await exportStrategyFile(docId);
    if (!text) return;
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docName.replace(/\s+/g, '-').toLowerCase()}.derivbot.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('success', 'Exported', 'Strategy file downloaded.');
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const outcome = await importStrategyFile(text);
    setImportIssues(outcome);
    if (outcome.ok && outcome.doc) {
      setDocId(outcome.doc.id);
      setDocName(outcome.doc.name);
      wsRef.current?.load(outcome.doc.workspace);
      toast('success', 'Strategy imported', outcome.message);
    }
  };

  const handleQuickStrategy = async (workspace: WorkspaceState, name: string) => {
    if (docId) {
      const current = await db.strategies.get(docId);
      if (current) {
        const { doc } = await saveStrategy(current, workspace, { note: 'Quick strategy applied', forceVersion: true });
        setDocName(name);
        await renameStrategy(doc.id, name);
        setDocName(name);
      }
    } else {
      const doc = await createStrategy(name, workspace);
      setDocId(doc.id);
    }
    wsRef.current?.load(workspace);
    setQuickOpen(false);
    toast('success', 'Quick strategy loaded', `${name} blocks are on the workspace.`);
  };

  // ---- add-block search -----------------------------------------------------
  const searchResults = TOOLBOX_BLOCK_TYPES.filter(
    (b) => b.type.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase()),
  ).slice(0, 10);

  const running = bot.status === 'running' || bot.status === 'paused';

  return (
    <div className="flex h-full flex-col">
      {/* ---------------- Toolbar ---------------- */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2">
        {/* Bot name */}
        <input
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
          onBlur={async () => {
            if (docId) {
              await renameStrategy(docId, docName);
              toast('info', 'Renamed', `Strategy is now "${docName}".`);
            }
          }}
          className="h-9 w-44 rounded-btn border border-transparent bg-transparent px-2 text-sm font-semibold text-[var(--text-main)] transition-colors hover:border-[var(--panel-border)] focus:border-deriv-red focus:outline-none"
          title="Bot name"
        />
        <span className={`text-xs ${dirty ? 'text-deriv-amber' : 'text-deriv-muted'}`}>
          {dirty ? 'Unsaved changes…' : savedAt ? `Saved ${formatTime(savedAt)}` : 'Ready'}
        </span>

        <div className="mx-1 h-6 w-px bg-[var(--panel-border)]" />

        {/* File ops */}
        <ToolBtn title="Save now" onClick={async () => {
          const ws = wsRef.current?.save();
          if (ws && docId) {
            const current = await db.strategies.get(docId);
            if (current) {
              await saveStrategy(current, ws);
              setSavedAt(Date.now());
              setDirty(false);
              toast('success', 'Saved', 'Workspace saved locally.');
            }
          }
        }}>💾</ToolBtn>
        <ToolBtn title="Undo" onClick={() => wsRef.current?.undo()}>↩️</ToolBtn>
        <ToolBtn title="Redo" onClick={() => wsRef.current?.redo()}>↪️</ToolBtn>
        <ToolBtn title="Import strategy" onClick={() => fileInputRef.current?.click()}>📤</ToolBtn>
        <ToolBtn title="Export strategy" onClick={handleExport}>📥</ToolBtn>
        <ToolBtn title="Version history" onClick={() => setVersionsOpen(true)}>🕘</ToolBtn>
        <ToolBtn title="Centre view" onClick={() => wsRef.current?.center()}>🎯</ToolBtn>
        <ToolBtn title="Delete all blocks" onClick={() => {
          if (confirm('Remove all blocks from the workspace?')) wsRef.current?.clear();
        }}>🗑️</ToolBtn>

        <div className="mx-1 h-6 w-px bg-[var(--panel-border)]" />

        {/* Block search */}
        <div className="relative">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-9 items-center gap-2 rounded-btn border border-[var(--panel-border)] px-3 text-sm text-[var(--text-sub)] transition-colors hover:border-deriv-red hover:text-deriv-red"
          >
            🔍 <span className="hidden md:inline">Add block</span>
          </button>
          {searchOpen && (
            <div className="absolute left-0 top-11 z-50 w-72 animate-fade-down rounded-card border border-[var(--panel-border)] bg-[var(--panel-bg)] p-2 shadow-dropdown">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search blocks…"
                className="input h-9 text-sm"
              />
              <div className="mt-2 max-h-64 overflow-y-auto">
                {searchResults.map((b) => (
                  <button
                    key={b.type}
                    onClick={() => {
                      wsRef.current?.addBlock(b.type);
                      setSearchOpen(false);
                      setSearch('');
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-deriv-red/10"
                  >
                    <span className="font-medium text-[var(--text-main)]">{b.type.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-deriv-muted">{b.category}</span>
                  </button>
                ))}
                {!searchResults.length && <div className="px-3 py-4 text-center text-sm text-deriv-muted">No blocks found</div>}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setQuickOpen(true)}
          className="flex h-9 items-center gap-2 rounded-btn border border-deriv-red/40 bg-deriv-red/10 px-3 text-sm font-semibold text-deriv-red transition-colors hover:bg-deriv-red/20"
        >
          ⚡ <span className="hidden md:inline">Quick strategy</span>
        </button>

        <div className="flex-1" />

        {/* Run controls */}
        <div className="flex items-center gap-2">
          <select
            value={bot.speed}
            onChange={(e) => bot.setSpeed(Number(e.target.value))}
            className="h-9 rounded-btn border border-[var(--panel-border)] bg-transparent px-2 text-xs font-semibold text-[var(--text-main)]"
            title="Simulation speed"
          >
            {[1, 2, 5, 10].map((s) => (
              <option key={s} value={s}>{s}× speed</option>
            ))}
          </select>

          {bot.status === 'running' && (
            <button onClick={handlePauseResume} className="btn h-9 bg-deriv-amber px-4 text-sm text-white hover:opacity-90">
              ⏸ Pause
            </button>
          )}
          {bot.status === 'paused' && (
            <button onClick={handlePauseResume} className="btn-green h-9 px-4 text-sm">▶ Resume</button>
          )}
          {running && (
            <button onClick={handleStop} className="btn h-9 bg-deriv-ink px-4 text-sm text-white hover:bg-black">■ Stop</button>
          )}
          {!running && (
            <button onClick={handleRun} className="btn-green h-9 px-6 text-sm shadow-sm" disabled={bot.starting}>
              {bot.starting ? <Spinner size={16} /> : <>▶ Run</>}
            </button>
          )}
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            className={`flex h-9 w-9 items-center justify-center rounded-btn border transition-colors ${
              drawerOpen ? 'border-deriv-red text-deriv-red' : 'border-[var(--panel-border)] text-[var(--text-sub)]'
            }`}
            title="Toggle dashboard"
          >
            🗂
          </button>
        </div>
      </div>

      {/* ---------------- Status strip ---------------- */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--panel-border)] bg-[var(--panel-bg)] px-4 py-1.5 text-xs">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${
            bot.status === 'running'
              ? 'bg-green-100 text-green-700'
              : bot.status === 'paused'
                ? 'bg-amber-100 text-amber-700'
                : bot.status === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${bot.status === 'running' ? 'animate-pulse-dot bg-green-500' : bot.status === 'paused' ? 'bg-amber-500' : bot.status === 'error' ? 'bg-red-500' : 'bg-gray-400'}`} />
          {bot.status === 'running' ? 'Bot is running' : bot.status === 'paused' ? 'Bot is paused' : bot.status === 'error' ? 'Bot error' : 'Bot is not running'}
        </span>
        <span className="text-deriv-muted">
          Market: <strong className="text-[var(--text-main)]">{symbolSpec.name}</strong> (simulated)
        </span>
        <span className="text-deriv-muted">
          Price: <strong className="font-mono text-[var(--text-main)]">{feed?.price?.toFixed(symbolSpec.digits) ?? '—'}</strong>
        </span>
        <span className="text-deriv-muted">
          Balance: <strong className="text-deriv-green">{bot.stats.balance ? bot.stats.balance.toFixed(2) : balance.toFixed(2)} USD</strong>
        </span>
        {bot.error && <span className="text-loss">⚠ {bot.error}</span>}
      </div>

      {/* ---------------- Main area ---------------- */}
      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          {!initialWs ? (
            <div className="flex h-full items-center justify-center"><Spinner size={30} /></div>
          ) : (
            <BlocklyWorkspace ref={wsRef} initialWorkspace={initialWs} onChange={onWorkspaceChange} dark={dark} />
          )}
        </div>

        {/* Right drawer */}
        {drawerOpen && (
          <aside className="flex w-[360px] flex-shrink-0 flex-col border-l border-[var(--panel-border)] bg-[var(--panel-bg)] animate-slide-in-right">
            <div className="border-b border-[var(--panel-border)] px-2 pt-2">
              <Tabs
                tabs={[
                  { id: 'summary', label: 'Summary' },
                  { id: 'transactions', label: 'Transactions' },
                  { id: 'charts', label: 'Charts' },
                  { id: 'journal', label: 'Journal' },
                ]}
                active={drawerTab}
                onChange={setDrawerTab}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {drawerTab === 'summary' && <SummaryTab symbol={selectedSymbol} />}
              {drawerTab === 'transactions' && <TransactionsTab />}
              {drawerTab === 'charts' && (
                <div>
                  <div className="mb-3 flex gap-1">
                    {CANDLE_INTERVALS.map((tf) => (
                      <button
                        key={tf.value}
                        onClick={() => setChartTf(tf.value as Timeframe)}
                        className={`rounded-btn px-2.5 py-1 text-xs font-semibold transition-colors ${
                          chartTf === tf.value ? 'bg-deriv-red text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-white/70'
                        }`}
                      >
                        {tf.value}
                      </button>
                    ))}
                  </div>
                  <div className="overflow-hidden rounded-card border border-[var(--panel-border)]">
                    <CandleChart candles={candles} height={280} dark={dark} />
                  </div>
                  <p className="mt-2 text-xs text-deriv-muted">
                    {symbolSpec.name} · simulated candles · updates live from the synthetic market engine.
                  </p>
                </div>
              )}
              {drawerTab === 'journal' && <JournalTab />}
            </div>
          </aside>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleImportFile(f);
          e.target.value = '';
        }}
      />

      {/* Modals */}
      <QuickStrategyModal
        open={quickOpen}
        onClose={() => {
          setQuickOpen(false);
          if (searchParams.get('quick')) setSearchParams({}, { replace: true });
        }}
        onApply={handleQuickStrategy}
      />

      <Modal open={!!validation} onClose={() => setValidation(null)} title="Strategy validation">
        <p className="mb-3 text-sm text-deriv-muted">Fix these issues before running the bot:</p>
        <ul className="space-y-2">
          {(validation ?? []).map((v, i) => (
            <li
              key={i}
              className={`rounded-btn px-3 py-2 text-sm ${
                v.severity === 'error' ? 'bg-loss/10 text-loss' : 'bg-amber-50 text-amber-700'
              }`}
            >
              <strong>{v.severity}:</strong> {v.message}
            </li>
          ))}
        </ul>
      </Modal>

      <Modal open={!!importIssues} onClose={() => setImportIssues(null)} title={importIssues?.ok ? 'Import result' : 'Import failed'}>
        <p className="text-sm text-deriv-ink dark:text-white">{importIssues?.message}</p>
        {!!importIssues?.issues.length && (
          <ul className="mt-3 space-y-2">
            {importIssues.issues.map((v, i) => (
              <li key={i} className={`rounded-btn px-3 py-2 text-sm ${v.severity === 'error' ? 'bg-loss/10 text-loss' : 'bg-amber-50 text-amber-700'}`}>
                <strong>{v.severity}:</strong> {v.message}
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <VersionsModal
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        strategyId={docId}
        onRestore={async (versionId) => {
          if (!docId) return;
          const restored = await restoreVersion(docId, versionId);
          if (restored) {
            wsRef.current?.load(restored.workspace);
            setVersionsOpen(false);
            toast('success', 'Version restored', 'Workspace updated — a new version was recorded.');
          }
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

function ToolBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-btn text-base transition-all duration-200 hover:scale-105 hover:bg-gray-100 dark:hover:bg-white/10"
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Drawer tabs
// ---------------------------------------------------------------------------

function SummaryTab({ symbol }: { symbol: string }) {
  const bot = useBotStore();
  const feed = useMarketStore((s) => s.feeds[symbol as SymbolId]);
  const spec = SYMBOL_MAP[symbol as SymbolId];
  const stats = bot.stats;
  const winRate = stats.trades > 0 ? Math.round((stats.wins / stats.trades) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-[var(--panel-border)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-deriv-muted">{spec?.name ?? symbol} · simulated</div>
            <div className="font-mono text-2xl font-bold text-[var(--text-main)]">{feed?.price?.toFixed(spec?.digits ?? 3) ?? '—'}</div>
          </div>
          <div className="flex gap-1">
            {(feed?.candles?.['1m'] ?? []).slice(-24).map((c: { o: number; c: number; t: number }, i: number) => (
              <div
                key={i}
                className={`w-1.5 rounded-sm ${c.c >= c.o ? 'bg-deriv-green' : 'bg-deriv-red'}`}
                style={{ height: 8 + Math.min(18, Math.abs(c.c - c.o) * 40) }}
                title={`O:${c.o} C:${c.c}`}
              />
            ))}
          </div>
        </div>
        <div className="mt-3 text-xs text-deriv-muted">
          Tick stream: {bot.lastTicks.slice(-8).map((t) => t.digit).join(' · ') || 'waiting…'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total runs" value={String(stats.trades)} />
        <Stat label="Win rate" value={`${winRate}%`} tone={winRate >= 50 ? 'good' : 'bad'} />
        <Stat label="Wins" value={String(stats.wins)} tone="good" />
        <Stat label="Losses" value={String(stats.losses)} tone="bad" />
        <Stat label="Total profit" value={formatSigned(stats.totalProfit)} tone={stats.totalProfit >= 0 ? 'good' : 'bad'} />
        <Stat label="Balance" value={stats.balance ? stats.balance.toFixed(2) : '—'} />
      </div>

      <div className="rounded-card border border-[var(--panel-border)] p-4 text-sm">
        <div className="font-semibold text-[var(--text-main)]">Run state</div>
        <div className="mt-2 space-y-1.5 text-deriv-muted">
          <div className="flex justify-between"><span>Status</span><span className="font-medium text-[var(--text-main)]">{bot.status}</span></div>
          <div className="flex justify-between"><span>Session</span><span className="font-mono text-xs">{bot.sessionId ?? '—'}</span></div>
          <div className="flex justify-between"><span>Open positions</span><span className="font-medium text-[var(--text-main)]">{bot.openTrades.length}</span></div>
          <div className="flex justify-between"><span>Speed</span><span className="font-medium text-[var(--text-main)]">{bot.speed}×</span></div>
        </div>
      </div>

      {bot.openTrades.map((t) => (
        <div key={t.id} className="rounded-card border border-deriv-green/40 bg-deriv-green/5 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-deriv-green">Open: {t.contractType}</span>
            <span className="font-mono">{t.entrySpot}</span>
          </div>
          <div className="mt-1 text-xs text-deriv-muted">Stake {t.stake.toFixed(2)} · {t.durationValue} {t.durationUnit}</div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="rounded-card border border-[var(--panel-border)] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-deriv-muted">{label}</div>
      <div className={`mt-1 text-lg font-bold ${tone === 'good' ? 'text-deriv-green' : tone === 'bad' ? 'text-loss' : 'text-[var(--text-main)]'}`}>{value}</div>
    </div>
  );
}

function TransactionsTab() {
  const bot = useBotStore();
  const history = useLiveQuery(() => db.trades.orderBy('openedAt').reverse().limit(100).toArray(), []);
  const rows = useMemo(() => {
    const map = new Map<string, (typeof history extends undefined ? never : NonNullable<typeof history>)[number] | (typeof bot.recentTrades)[number]>();
    for (const t of bot.recentTrades) map.set(t.id, t as never);
    for (const t of bot.openTrades) map.set(t.id, t as never);
    for (const t of history ?? []) if (!map.has(t.id)) map.set(t.id, t);
    return Array.from(map.values()).sort((a, b) => b.openedAt - a.openedAt);
  }, [history, bot.recentTrades, bot.openTrades]);

  return (
    <div>
      {!rows.length && <p className="py-8 text-center text-sm text-deriv-muted">No transactions yet. Run the bot to see trades here.</p>}
      <div className="space-y-2">
        {rows.map((t) => (
          <div
            key={t.id}
            className={`rounded-card border p-3 text-xs ${
              t.status === 'open'
                ? 'border-deriv-teal/40 bg-deriv-teal/5'
                : t.won
                  ? 'border-deriv-green/30'
                  : 'border-loss/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--text-main)]">
                {t.contractType} · {t.source === 'bot' ? 'Bot' : 'Manual'}
              </span>
              <span
                className={`badge ${
                  t.status === 'open' ? 'bg-teal-100 text-teal-700' : t.won ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}
              >
                {t.status === 'open' ? 'Open' : t.won ? `+${t.profit.toFixed(2)}` : t.profit.toFixed(2)}
              </span>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1 text-deriv-muted">
              <span>Stake: {t.stake.toFixed(2)}</span>
              <span>Entry: {t.entrySpot}</span>
              <span>Exit: {t.exitSpot ?? '—'}</span>
              <span>{formatTime(t.openedAt)}</span>
            </div>
            {t.soldEarly && <div className="mt-1 text-deriv-amber">Sold at market before expiry</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function JournalTab() {
  const logs = useBotStore((s) => s.logs);
  const clearLogs = useBotStore((s) => s.clearLogs);
  const levelColor: Record<string, string> = {
    info: 'text-deriv-muted',
    success: 'text-deriv-green',
    warn: 'text-deriv-amber',
    error: 'text-loss',
    debug: 'text-deriv-teal',
  };
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-deriv-muted">Execution journal</span>
        <button onClick={clearLogs} className="rounded-btn border border-[var(--panel-border)] px-2.5 py-1 text-xs text-deriv-muted transition-colors hover:border-loss hover:text-loss">
          Clear
        </button>
      </div>
      {!logs.length && <p className="py-8 text-center text-sm text-deriv-muted">Journal is empty. Run the bot to see logs.</p>}
      <div className="space-y-1.5">
        {logs.map((l, i) => (
          <div key={i} className="rounded-lg bg-gray-50 px-3 py-2 font-mono text-[11px] leading-relaxed dark:bg-white/5">
            <span className="text-deriv-muted">{formatTime(l.ts)}</span>{' '}
            <span className={`font-semibold ${levelColor[l.level] ?? ''}`}>[{l.level}]</span>{' '}
            <span className="text-[var(--text-main)]">{l.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VersionsModal({
  open,
  onClose,
  strategyId,
  onRestore,
}: {
  open: boolean;
  onClose: () => void;
  strategyId: string | null;
  onRestore: (versionId: string) => void;
}) {
  const versions = useLiveQuery(
    async () => (strategyId && open ? listVersions(strategyId) : []),
    [strategyId, open],
  );
  return (
    <Modal open={open} onClose={onClose} title="Version history">
      <p className="mb-4 text-sm text-deriv-muted">Versions are immutable. Restoring creates a new version on top.</p>
      <div className="space-y-2">
        {(versions ?? []).map((v) => (
          <div key={v.id} className="flex items-center justify-between rounded-card border border-[var(--panel-border)] px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-[var(--text-main)]">
                v{v.version} · {v.name}
              </div>
              <div className="text-xs text-deriv-muted">
                {formatDateTime(v.createdAt)} · hash {v.contentHash}
                {v.note ? ` · ${v.note}` : ''}
              </div>
            </div>
            <button onClick={() => onRestore(v.id)} className="btn-secondary h-8 px-3 text-xs">
              Restore
            </button>
          </div>
        ))}
        {!versions?.length && <p className="py-6 text-center text-sm text-deriv-muted">No versions yet.</p>}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-card bg-deriv-band p-4 text-xs text-deriv-muted dark:bg-white/5">
        <span>Manage strategies</span>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              if (!strategyId) return;
              const copy = await duplicateStrategy(strategyId);
              if (copy) onClose();
            }}
            className="btn-secondary h-8 px-3 text-xs"
          >
            Duplicate
          </button>
          <button
            onClick={async () => {
              if (!strategyId) return;
              if (confirm('Delete this strategy and all its versions?')) {
                await deleteStrategy(strategyId);
                onClose();
                window.location.reload();
              }
            }}
            className="btn h-8 bg-loss px-3 text-xs text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
