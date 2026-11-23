/**
 * Local-first persistence layer (IndexedDB via Dexie).
 *
 * Migrations are declared with Dexie's versioned schema; v2 adds the
 * `runMetrics` table and a compound index used by the analytics view.
 */
import Dexie, { type Table } from 'dexie';
import type {
  BotLogEntry,
  RunStats,
  StrategyDoc,
  StrategyVersionRecord,
  TradeRecord,
  WorkspaceState,
} from '../bot/types';
import type { SymbolId, Timeframe } from '../market/types';

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  phone: string;
  city?: string;
  address?: string;
  postcode?: string;
  currency: string;
  createdAt: number;
  /** demo password hash (local, non-sensitive) */
  passwordHash?: string;
}

export interface AuthSession {
  id?: number;
  profileId: string;
  startedAt: number;
  lastSeenAt: number;
  userAgent: string;
  active: boolean;
}

export interface Preferences {
  id: string;
  theme: 'light' | 'dark';
  language: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  chartType: 'candles' | 'line';
  defaultSpeed: number;
  confirmDestructive: boolean;
}

export interface AccountNotification {
  id?: number;
  ts: number;
  title: string;
  body: string;
  read: boolean;
  kind: 'info' | 'success' | 'warning' | 'error';
}

export interface AuditEvent {
  id?: number;
  ts: number;
  action: string;
  detail: string;
}

export interface BotSession {
  id: string;
  strategyId: string | null;
  strategyVersionId: string | null;
  strategyName: string;
  status: 'running' | 'paused' | 'stopped' | 'finished' | 'error';
  startedAt: number;
  endedAt: number | null;
  startingBalance: number;
  endingBalance: number | null;
  seed: number;
  speed: number;
  stats: RunStats | null;
}

export interface ExecutionEvent {
  id?: number;
  sessionId: string;
  ts: number;
  type: string;
  payload: unknown;
}

export interface BotLogRecord {
  id?: number;
  sessionId: string;
  ts: number;
  level: BotLogEntry['level'];
  message: string;
}

export interface RunMetric {
  id?: number;
  sessionId: string;
  ts: number;
  trades: number;
  wins: number;
  totalProfit: number;
  balance: number;
}

export interface MarketCandleRow {
  id?: number;
  symbol: SymbolId;
  interval: Timeframe;
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface HistoryMeta {
  id: string;
  updatedAt: number;
}

export class DerivDemoDB extends Dexie {
  profiles!: Table<Profile, string>;
  authSessions!: Table<AuthSession, number>;
  preferences!: Table<Preferences, string>;
  strategies!: Table<StrategyDoc, string>;
  strategyVersions!: Table<StrategyVersionRecord, string>;
  botSessions!: Table<BotSession, string>;
  executionEvents!: Table<ExecutionEvent, number>;
  botLogs!: Table<BotLogRecord, number>;
  trades!: Table<TradeRecord, string>;
  runMetrics!: Table<RunMetric, number>;
  notifications!: Table<AccountNotification, number>;
  auditEvents!: Table<AuditEvent, number>;
  marketCandles!: Table<MarketCandleRow, number>;
  historyMeta!: Table<HistoryMeta, string>;

  constructor() {
    super('deriv_demo_platform');
    this.version(1).stores({
      profiles: 'id, email, createdAt',
      authSessions: '++id, profileId, startedAt, active',
      preferences: 'id',
      strategies: 'id, name, updatedAt, createdAt',
      strategyVersions: 'id, strategyId, version, createdAt, [strategyId+version]',
      botSessions: 'id, strategyId, status, startedAt, endedAt',
      executionEvents: '++id, sessionId, ts, type',
      botLogs: '++id, sessionId, ts, level',
      trades: '++id, sessionId, symbol, status, openedAt, closedAt, source',
      notifications: '++id, ts, read, kind',
      auditEvents: '++id, ts, action',
      marketCandles: '++id, [symbol+interval+t], symbol, interval',
      historyMeta: 'id',
    });
    // v2 migration: analytics table + richer trade index
    this.version(2)
      .stores({
        runMetrics: '++id, sessionId, ts',
        trades: '++id, sessionId, symbol, status, openedAt, closedAt, source, won',
      })
      .upgrade(async (tx) => {
        // Backfill runMetrics snapshots from any existing sessions so old data
        // remains queryable after the migration.
        const sessions = await tx.table('botSessions').toArray();
        for (const s of sessions as BotSession[]) {
          if (s.stats) {
            await tx.table('runMetrics').add({
              sessionId: s.id,
              ts: s.endedAt ?? s.startedAt,
              trades: s.stats.trades,
              wins: s.stats.wins,
              totalProfit: s.stats.totalProfit,
              balance: s.stats.balance,
            });
          }
        }
      });
  }
}

export const db = new DerivDemoDB();

export const DEFAULT_PREFERENCES: Preferences = {
  id: 'main',
  theme: 'light',
  language: 'en',
  notificationsEnabled: true,
  soundEnabled: true,
  chartType: 'candles',
  defaultSpeed: 1,
  confirmDestructive: true,
};

/** Ensure a default profile + preferences exist. */
export async function ensureBootstrap(): Promise<void> {
  const prefs = await db.preferences.get('main');
  if (!prefs) await db.preferences.put(DEFAULT_PREFERENCES);
}

export async function audit(action: string, detail: string): Promise<void> {
  await db.auditEvents.add({ ts: Date.now(), action, detail });
}

export async function notify(kind: AccountNotification['kind'], title: string, body: string): Promise<void> {
  await db.notifications.add({ ts: Date.now(), title, body, read: false, kind });
}

// ---------------------------------------------------------------------------
// Export / restore
// ---------------------------------------------------------------------------

export interface ExportBundle {
  magic: 'deriv-demo-export';
  formatVersion: 1;
  exportedAt: string;
  data: {
    profiles: Profile[];
    preferences: Preferences[];
    strategies: StrategyDoc[];
    strategyVersions: StrategyVersionRecord[];
    botSessions: BotSession[];
    executionEvents: ExecutionEvent[];
    botLogs: BotLogRecord[];
    trades: TradeRecord[];
    runMetrics: RunMetric[];
    notifications: AccountNotification[];
    auditEvents: AuditEvent[];
  };
}

export async function exportAll(): Promise<ExportBundle> {
  return {
    magic: 'deriv-demo-export',
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    data: {
      profiles: await db.profiles.toArray(),
      preferences: await db.preferences.toArray(),
      strategies: await db.strategies.toArray(),
      strategyVersions: await db.strategyVersions.toArray(),
      botSessions: await db.botSessions.toArray(),
      executionEvents: await db.executionEvents.toArray(),
      botLogs: await db.botLogs.toArray(),
      trades: await db.trades.toArray(),
      runMetrics: await db.runMetrics.toArray(),
      notifications: await db.notifications.toArray(),
      auditEvents: await db.auditEvents.toArray(),
    },
  };
}

export async function restoreAll(bundle: unknown): Promise<{ ok: boolean; message: string }> {
  const b = bundle as ExportBundle;
  if (!b || b.magic !== 'deriv-demo-export' || !b.data) {
    return { ok: false, message: 'Not a valid export bundle.' };
  }
  await db.transaction(
    'rw',
    [
      db.profiles,
      db.preferences,
      db.strategies,
      db.strategyVersions,
      db.botSessions,
      db.executionEvents,
      db.botLogs,
      db.trades,
      db.runMetrics,
      db.notifications,
      db.auditEvents,
    ],
    async () => {
      await db.profiles.clear();
      await db.preferences.clear();
      await db.strategies.clear();
      await db.strategyVersions.clear();
      await db.botSessions.clear();
      await db.executionEvents.clear();
      await db.botLogs.clear();
      await db.trades.clear();
      await db.runMetrics.clear();
      await db.notifications.clear();
      await db.auditEvents.clear();
      await db.profiles.bulkAdd(b.data.profiles ?? []);
      await db.preferences.bulkAdd(b.data.preferences ?? [DEFAULT_PREFERENCES]);
      await db.strategies.bulkAdd(b.data.strategies ?? []);
      await db.strategyVersions.bulkAdd(b.data.strategyVersions ?? []);
      await db.botSessions.bulkAdd(b.data.botSessions ?? []);
      await db.executionEvents.bulkAdd(b.data.executionEvents ?? []);
      await db.botLogs.bulkAdd(b.data.botLogs ?? []);
      await db.trades.bulkAdd(b.data.trades ?? []);
      await db.runMetrics.bulkAdd(b.data.runMetrics ?? []);
      await db.notifications.bulkAdd(b.data.notifications ?? []);
      await db.auditEvents.bulkAdd(b.data.auditEvents ?? []);
    },
  );
  await audit('data.restore', 'Export bundle restored');
  return { ok: true, message: 'Data restored successfully.' };
}

export type { StrategyDoc, StrategyVersionRecord, WorkspaceState, TradeRecord, RunStats };
