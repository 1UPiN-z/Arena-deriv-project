/**
 * Synthetic market engine — pure, deterministic (seeded), shared by workers,
 * the UI and tests. Produces realistic-looking random-walk price series for
 * clearly-labelled SIMULATED volatility instruments. Not a real market feed.
 */
import {
  Candle,
  SymbolId,
  SymbolSpec,
  SYMBOLS,
  SYMBOL_MAP,
  TIMEFRAME_MS,
  Timeframe,
  Tick,
  lastDigitOf,
} from './types';

/** mulberry32 seeded PRNG */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller gaussian from a uniform rng. */
export function gaussian(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface SymbolState {
  spec: SymbolSpec;
  price: number;
  t: number;
  rng: () => number;
  /** candles per timeframe, ascending by t, last one may be open */
  candles: Record<Timeframe, Candle[]>;
  ticks: Tick[];
}

export interface EngineState {
  symbols: Map<SymbolId, SymbolState>;
  seed: number;
}

function roundDigits(p: number, digits: number): number {
  return Number(p.toFixed(digits));
}

export function bucketStart(t: number, tf: Timeframe): number {
  const ms = TIMEFRAME_MS[tf];
  return Math.floor(t / ms) * ms;
}

export function createEngine(seed = 20261123, startTime = Date.now()): EngineState {
  const symbols = new Map<SymbolId, SymbolState>();
  for (const spec of SYMBOLS) {
    const rng = makeRng(seed + spec.basePrice * 1000);
    symbols.set(spec.id, {
      spec,
      price: spec.basePrice,
      t: startTime,
      rng,
      candles: { '1m': [], '5m': [], '15m': [], '1h': [] },
      ticks: [],
    });
  }
  return { symbols, seed };
}

/**
 * Advance one symbol by a single tick at simulated time `t`.
 * Geometric random walk with mild mean reversion toward the base price.
 */
export function stepSymbol(state: SymbolState, t: number): Tick {
  const { spec, rng } = state;
  const dt = Math.max(1, t - state.t) / 1000; // seconds
  const sigma = spec.vol * Math.sqrt(dt / 200);
  const z = gaussian(rng);
  const drift = ((spec.basePrice - state.price) / spec.basePrice) * 0.0008;
  const next = state.price * (1 + drift + sigma * z * 0.09);
  const price = roundDigits(Math.max(next, spec.basePrice * 0.5), spec.digits);
  state.price = price;
  state.t = t;
  const tick: Tick = { t, p: price, digit: lastDigitOf(price, spec.digits) };
  state.ticks.push(tick);
  if (state.ticks.length > 2000) state.ticks.splice(0, state.ticks.length - 2000);
  updateCandles(state, tick);
  return tick;
}

function updateCandles(state: SymbolState, tick: Tick): void {
  for (const tf of ['1m', '5m', '15m', '1h'] as Timeframe[]) {
    const list = state.candles[tf];
    const bStart = bucketStart(tick.t, tf);
    const last = list[list.length - 1];
    if (last && last.t === bStart) {
      last.h = Math.max(last.h, tick.p);
      last.l = Math.min(last.l, tick.p);
      last.c = tick.p;
      last.v += 1;
    } else {
      if (last && !last.closed) {
        last.closed = true;
      }
      list.push({ t: bStart, o: tick.p, h: tick.p, l: tick.p, c: tick.p, v: 1, closed: false });
      if (list.length > 1500) list.splice(0, list.length - 1500);
    }
  }
}

/** Pre-generate historical candles so charts open with content. */
export function warmupHistory(state: SymbolState, tf: Timeframe, count: number, endTime = Date.now()): void {
  const ms = TIMEFRAME_MS[tf];
  const start = bucketStart(endTime, tf) - (count - 1) * ms;
  const list = state.candles[tf];
  list.length = 0;
  let price = state.spec.basePrice * (1 + (state.rng() - 0.5) * 0.01);
  for (let i = 0; i < count; i++) {
    const t = start + i * ms;
    // ~24 ticks per candle worth of movement
    let o = price;
    let h = price;
    let l = price;
    let c = price;
    for (let k = 0; k < 24; k++) {
      const sigma = state.spec.vol * 0.09 * Math.sqrt(ms / 24 / 200_000);
      c = c * (1 + sigma * gaussian(state.rng));
      h = Math.max(h, c);
      l = Math.min(l, c);
    }
    const digits = state.spec.digits;
    o = roundDigits(o, digits);
    h = roundDigits(h, digits);
    l = roundDigits(l, digits);
    c = roundDigits(c, digits);
    list.push({ t, o, h, l, c, v: 48 + Math.floor(state.rng() * 40), closed: i < count - 1 });
    price = c;
  }
  // settle current price near the last close so live ticks continue the series
  state.price = list[list.length - 1].c;
}

export function warmupAll(engine: EngineState, count = 300): void {
  for (const state of engine.symbols.values()) {
    for (const tf of ['1m', '5m', '15m', '1h'] as Timeframe[]) {
      warmupHistory(state, tf, tf === '1h' ? Math.min(count, 200) : count);
    }
  }
}

export function getClosedCandles(state: SymbolState, tf: Timeframe): Candle[] {
  return state.candles[tf].filter((c) => c.closed);
}

export function getLastPrice(state: SymbolState): number {
  return state.price;
}

/** Extract an OHLC series for indicator maths. */
export function candleSeries(state: SymbolState, tf: Timeframe, source: 'open' | 'high' | 'low' | 'close' = 'close'): number[] {
  const key = ({ open: 'o', high: 'h', low: 'l', close: 'c' } as const)[source];
  return getClosedCandles(state, tf).map((c) => c[key]);
}

/** Theoretical payout multiplier for a contract type (simulated, educational). */
export const PAYOUTS: Record<string, number> = {
  RISE: 1.95,
  FALL: 1.95,
  EVEN: 1.9,
  ODD: 1.9,
  OVER: 1.9,
  UNDER: 1.9,
  MATCHES: 9.5,
  DIFFERS: 1.06,
};

export type ContractType = keyof typeof PAYOUTS;

export interface SettlementInput {
  contractType: ContractType;
  entrySpot: number;
  exitSpot: number;
  predict?: number;
  digits: number;
}

export interface SettlementResult {
  won: boolean;
  payout: number; // multiplier applied to stake (0 when lost)
  exitDigit: number;
}

/** Deterministic contract settlement used by bot + trader simulators. */
export function settleContract(input: SettlementInput): SettlementResult {
  const { contractType, entrySpot, exitSpot, digits } = input;
  const exitDigit = lastDigitOf(exitSpot, digits);
  let won = false;
  switch (contractType) {
    case 'RISE':
      won = exitSpot > entrySpot;
      break;
    case 'FALL':
      won = exitSpot < entrySpot;
      break;
    case 'EVEN':
      won = exitDigit % 2 === 0;
      break;
    case 'ODD':
      won = exitDigit % 2 === 1;
      break;
    case 'OVER':
      won = exitDigit > (input.predict ?? 5);
      break;
    case 'UNDER':
      won = exitDigit < (input.predict ?? 4);
      break;
    case 'MATCHES':
      won = exitDigit === (input.predict ?? 0);
      break;
    case 'DIFFERS':
      won = exitDigit !== (input.predict ?? 0);
      break;
  }
  return { won, payout: won ? PAYOUTS[contractType] : 0, exitDigit };
}

export function symbolSpec(id: SymbolId): SymbolSpec {
  return SYMBOL_MAP[id];
}
