/** Strategy document + bot runtime types. */
import type { SymbolId, Timeframe } from '../market/types';
import type { ContractType } from '../market/engine';

/** Blockly workspace serialization (v1) — structural subset we consume. */
export interface BlockNode {
  id?: string;
  type: string;
  fields?: Record<string, unknown>;
  inputs?: Record<string, { block?: BlockNode; shadow?: BlockNode }>;
  next?: { block?: BlockNode };
  extraState?: unknown;
}

export interface WorkspaceState {
  blocks?: { languageVersion?: number; blocks?: BlockNode[] };
  variables?: { id: string; name: string }[];
  [key: string]: unknown;
}

export interface StrategyMeta {
  createdAt: number;
  updatedAt: number;
  description?: string;
}

/** Persisted strategy (mutable head). */
export interface StrategyDoc {
  id: string;
  name: string;
  schemaVersion: 1;
  workspace: WorkspaceState;
  meta: StrategyMeta;
}

/** Immutable snapshot of a strategy. */
export interface StrategyVersionRecord {
  id: string;
  strategyId: string;
  version: number;
  name: string;
  workspace: WorkspaceState;
  createdAt: number;
  note?: string;
  contentHash: string;
}

export interface TradeDefinition {
  market: SymbolId;
  tradeType: 'UPDOWN' | 'DIGITS';
  candleInterval: Timeframe;
  durationUnit: 'ticks' | 'minutes';
  durationValue: number;
  currency: string;
  amount: number;
  restartLastOnError: boolean;
  restartBuySellOnError: boolean;
}

export interface TradeRecord {
  id: string;
  sessionId: string | null;
  source: 'bot' | 'manual';
  symbol: SymbolId;
  contractType: ContractType;
  stake: number;
  payoutMultiplier: number;
  entrySpot: number;
  exitSpot: number | null;
  predict?: number;
  durationUnit: 'ticks' | 'minutes';
  durationValue: number;
  openedAt: number;
  closedAt: number | null;
  status: 'open' | 'settled';
  won: boolean | null;
  soldEarly: boolean;
  profit: number;
  balanceAfter: number;
}

export interface RunStats {
  trades: number;
  wins: number;
  losses: number;
  totalProfit: number;
  lastProfit: number;
  lastWin: boolean | null;
  consecutiveLosses: number;
  balance: number;
  startedAt: number;
  ticks: number;
}

export type BotStatus = 'idle' | 'running' | 'paused' | 'stopping' | 'stopped' | 'finished' | 'error';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';

export interface BotLogEntry {
  ts: number;
  level: LogLevel;
  message: string;
}

export type BotEvent =
  | { type: 'status'; status: BotStatus; message?: string }
  | { type: 'log'; entry: BotLogEntry }
  | { type: 'tick'; symbol: SymbolId; price: number; digit: number; t: number }
  | { type: 'trade_opened'; trade: TradeRecord }
  | { type: 'trade_settled'; trade: TradeRecord; stats: RunStats }
  | { type: 'stats'; stats: RunStats }
  | { type: 'error'; message: string; recoverable: boolean };

export interface RunConfig {
  sessionId: string;
  workspace: WorkspaceState;
  startingBalance: number;
  currency: string;
  /** simulation speed multiplier (1 = one tick per engine tick) */
  speed: number;
  seed: number;
  /** session start wall-clock */
  startedAt: number;
}

export interface ValidationIssue {
  severity: 'error' | 'warning';
  message: string;
  blockType?: string;
}

export interface CompiledStrategy {
  tradeDef: TradeDefinition;
  runOnce: BlockNode[];
  purchases: BlockNode[];
  sells: BlockNode[];
  restarts: BlockNode[];
  procedures: Map<string, BlockNode>;
  issues: ValidationIssue[];
}
