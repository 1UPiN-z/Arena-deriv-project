/** Runtime context type — kept separate to avoid circular imports. */
import type { ContractType } from '../market/engine';
import { Candle, Timeframe } from '../market/types';
import type { BlockNode, TradeDefinition, RunStats } from './types';

export interface MarketFacade {
  lastPrice(): number;
  lastDigit(): number;
  digits(): number;
  closedCandles(tf: Timeframe): Candle[];
}

export interface OpenContract {
  id: string;
  contractType: ContractType;
  stake: number;
  entrySpot: number;
  openedAt: number;
  predict?: number;
  durationUnit: 'ticks' | 'minutes';
  durationValue: number;
  /** ticks remaining (when durationUnit='ticks') */
  ticksLeft: number;
  /** settle time (when durationUnit='minutes') */
  settleAt: number;
}

export interface RunContext {
  depth: number;
  callStack: string[];
  loopVars: number[];
  variables: Map<string, unknown>;
  varNames: Map<string, string>;
  procedures: Map<string, BlockNode>;
  tradeDef: TradeDefinition;
  openContract: OpenContract | null;
  stats: RunStats;
  market: MarketFacade;
  rng: () => number;
  log(level: 'info' | 'warn' | 'error' | 'debug' | 'success', message: string): void;
  purchase(contractType: ContractType, stake: number, predict?: number): void;
  sellAtMarket(reason: string): void;
  playSound(sound: string): void;
  now(): number;
}

export type { BlockNode, TradeDefinition, RunStats, Candle, Timeframe };
