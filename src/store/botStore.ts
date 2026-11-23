/**
 * Bot run store — bridges the bot worker into React state and persists
 * sessions, events, logs and trades to IndexedDB.
 */
import { create } from 'zustand';
import { db, notify } from '../db/db';
import type {
  BotEvent,
  BotLogEntry,
  BotStatus,
  RunStats,
  TradeRecord,
  WorkspaceState,
} from '../bot/types';
import { uid } from '../lib/ids';

export interface BotState {
  status: BotStatus;
  statusMessage?: string;
  stats: RunStats;
  logs: BotLogEntry[];
  openTrades: TradeRecord[];
  recentTrades: TradeRecord[];
  lastTicks: { price: number; digit: number; t: number }[];
  sessionId: string | null;
  speed: number;
  error: string | null;
  starting: boolean;

  start(workspace: WorkspaceState, strategyId: string | null, strategyVersionId: string | null, strategyName: string, startingBalance: number): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  setSpeed(speed: number): void;
  clearLogs(): void;
  reset(): void;
}

const emptyStats = (): RunStats => ({
  trades: 0,
  wins: 0,
  losses: 0,
  totalProfit: 0,
  lastProfit: 0,
  lastWin: null,
  consecutiveLosses: 0,
  balance: 0,
  startedAt: 0,
  ticks: 0,
});

let worker: Worker | null = null;
let logBuffer: { sessionId: string; entry: BotLogEntry }[] = [];

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('../workers/bot.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent) => {
    const msg = e.data as { type: string; event?: BotEvent };
    if (msg.type === 'event' && msg.event) handleEvent(msg.event);
  };
  worker.onerror = (e) => {
    useBotStore.setState({ status: 'error', error: e.message ?? 'Worker error' });
  };
  return worker;
}

async function flushLogs(sessionId: string): Promise<void> {
  if (!logBuffer.length) return;
  const batch = logBuffer.splice(0, logBuffer.length);
  await db.botLogs.bulkAdd(
    batch.map((b) => ({ sessionId, ts: b.entry.ts, level: b.entry.level, message: b.entry.message })),
  );
}

function handleEvent(event: BotEvent): void {
  void handleEventAsync(event);
}

async function handleEventAsync(event: BotEvent): Promise<void> {
  const state = useBotStore.getState();
  switch (event.type) {
    case 'status':
      useBotStore.setState({ status: event.status, statusMessage: event.message, starting: false });
      if (state.sessionId) {
        const final = event.status === 'stopped' || event.status === 'finished' || event.status === 'error';
        const dbStatus = event.status === 'idle' || event.status === 'stopping' ? 'running' : event.status;
        await db.botSessions.update(state.sessionId, {
          status: dbStatus,
          ...(final ? { endedAt: Date.now(), stats: state.stats } : {}),
        });
        if (final) {
          notify(event.status === 'error' ? 'error' : 'info', 'Bot run ended', event.message ?? `Session ${event.status}`);
        }
      }
      break;
    case 'log':
      useBotStore.setState((s) => ({ logs: [...s.logs.slice(-499), event.entry] }));
      if (state.sessionId) {
        logBuffer.push({ sessionId: state.sessionId, entry: event.entry });
        if (logBuffer.length >= 10) void flushLogs(state.sessionId);
      }
      break;
    case 'tick':
      useBotStore.setState((s) => ({
        lastTicks: [...s.lastTicks.slice(-59), { price: event.price, digit: event.digit, t: event.t }],
      }));
      break;
    case 'trade_opened':
      useBotStore.setState((s) => ({ openTrades: [...s.openTrades, event.trade] }));
      if (state.sessionId) {
        db.trades.add(event.trade).catch(() => undefined);
        db.executionEvents.add({ sessionId: state.sessionId, ts: Date.now(), type: 'trade_opened', payload: event.trade });
      }
      break;
    case 'trade_settled': {
      const settled = event.trade;
      useBotStore.setState((s) => ({
        openTrades: s.openTrades.filter((t) => t.id !== settled.id),
        recentTrades: [settled, ...s.recentTrades].slice(0, 200),
        stats: event.stats,
      }));
      if (state.sessionId) {
        db.trades.put(settled).catch(() => undefined);
        db.executionEvents.add({ sessionId: state.sessionId, ts: Date.now(), type: 'trade_settled', payload: settled });
        db.runMetrics.add({
          sessionId: state.sessionId,
          ts: Date.now(),
          trades: event.stats.trades,
          wins: event.stats.wins,
          totalProfit: event.stats.totalProfit,
          balance: event.stats.balance,
        });
        db.botSessions.update(state.sessionId, { stats: event.stats, endingBalance: event.stats.balance });
      }
      break;
    }
    case 'stats':
      useBotStore.setState({ stats: event.stats });
      break;
    case 'error':
      useBotStore.setState({ error: event.message });
      if (state.sessionId) {
        db.executionEvents.add({ sessionId: state.sessionId, ts: Date.now(), type: 'error', payload: event.message });
      }
      break;
  }
}

export const useBotStore = create<BotState>((set, get) => ({
  status: 'idle',
  stats: emptyStats(),
  logs: [],
  openTrades: [],
  recentTrades: [],
  lastTicks: [],
  sessionId: null,
  speed: 1,
  error: null,
  starting: false,

  async start(workspace, strategyId, strategyVersionId, strategyName, startingBalance) {
    const w = ensureWorker();
    const sessionId = uid('run');
    const seed = Math.floor(Math.random() * 2 ** 31);
    set({
      status: 'idle',
      starting: true,
      error: null,
      logs: [],
      openTrades: [],
      lastTicks: [],
      stats: { ...emptyStats(), balance: startingBalance, startedAt: Date.now() },
      sessionId,
    });
    await db.botSessions.add({
      id: sessionId,
      strategyId,
      strategyVersionId,
      strategyName,
      status: 'running',
      startedAt: Date.now(),
      endedAt: null,
      startingBalance,
      endingBalance: null,
      seed,
      speed: get().speed,
      stats: null,
    });
    await notify('info', 'Bot started', `${strategyName} is running (session ${sessionId}).`);
    w.postMessage({
      type: 'start',
      config: {
        sessionId,
        workspace,
        startingBalance,
        currency: 'USD',
        speed: get().speed,
        seed,
        startedAt: Date.now(),
      },
    });
  },

  pause() {
    worker?.postMessage({ type: 'pause' });
  },
  resume() {
    worker?.postMessage({ type: 'resume' });
  },
  stop() {
    worker?.postMessage({ type: 'stop' });
    const sid = get().sessionId;
    if (sid) void flushLogs(sid);
  },
  setSpeed(speed) {
    set({ speed });
    worker?.postMessage({ type: 'set_speed', speed });
  },
  clearLogs() {
    set({ logs: [] });
  },
  reset() {
    set({
      status: 'idle',
      stats: emptyStats(),
      logs: [],
      openTrades: [],
      recentTrades: [],
      lastTicks: [],
      sessionId: null,
      error: null,
      starting: false,
    });
  },
}));

/** Compute the current virtual account balance from persisted trades. */
export async function computeBalance(base = 10_000): Promise<number> {
  const trades = await db.trades.toArray();
  const sum = trades.reduce((acc, t) => acc + (t.status === 'settled' ? t.profit : 0), 0);
  return Number((base + sum).toFixed(2));
}
