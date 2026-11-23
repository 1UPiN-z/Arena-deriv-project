/** Shared market types for the synthetic market engine. */

export type SymbolId = 'R_10' | 'R_25' | 'R_50' | 'R_75' | 'R_100';

export type Timeframe = '1m' | '5m' | '15m' | '1h';

export const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h'];

export const TIMEFRAME_MS: Record<Timeframe, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '1h': 3_600_000,
};

/** Map DBot-style "Default Candle Interval" values onto chart timeframes. */
export const CANDLE_INTERVALS: { value: string; label: string; ms: number }[] = [
  { value: '1m', label: '1 minute', ms: 60_000 },
  { value: '5m', label: '5 minutes', ms: 300_000 },
  { value: '15m', label: '15 minutes', ms: 900_000 },
  { value: '1h', label: '1 hour', ms: 3_600_000 },
];

export interface Tick {
  /** epoch ms */
  t: number;
  p: number;
  /** 0-9 last fractional digit, for digit contracts */
  digit: number;
}

export interface Candle {
  /** bucket start, epoch ms */
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  closed: boolean;
}

export interface SymbolSpec {
  id: SymbolId;
  name: string;
  shortName: string;
  basePrice: number;
  /** annualised-ish vol factor used by the simulator */
  vol: number;
  /** price decimals */
  digits: number;
  /** simulated tick period (the engine can run faster than wall clock) */
  tickMs: number;
}

export const SYMBOLS: SymbolSpec[] = [
  { id: 'R_10', name: 'Volatility 10 Index', shortName: 'Vol 10', basePrice: 6132.45, vol: 0.01, digits: 3, tickMs: 2000 },
  { id: 'R_25', name: 'Volatility 25 Index', shortName: 'Vol 25', basePrice: 2841.12, vol: 0.025, digits: 3, tickMs: 2000 },
  { id: 'R_50', name: 'Volatility 50 Index', shortName: 'Vol 50', basePrice: 193750.62, vol: 0.05, digits: 4, tickMs: 1000 },
  { id: 'R_75', name: 'Volatility 75 Index', shortName: 'Vol 75', basePrice: 92431.18, vol: 0.075, digits: 4, tickMs: 1000 },
  { id: 'R_100', name: 'Volatility 100 Index', shortName: 'Vol 100', basePrice: 1257.382, vol: 0.1, digits: 3, tickMs: 500 },
];

export const SYMBOL_MAP: Record<SymbolId, SymbolSpec> = SYMBOLS.reduce((acc, s) => {
  acc[s.id] = s;
  return acc;
}, {} as Record<SymbolId, SymbolSpec>);

export function lastDigitOf(price: number, digits: number): number {
  const fixed = price.toFixed(digits);
  const ch = fixed[fixed.length - 1];
  return ch === '.' ? 0 : Number(ch);
}
