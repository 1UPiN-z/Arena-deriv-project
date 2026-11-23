import { describe, expect, it } from 'vitest';
import {
  createEngine,
  makeRng,
  gaussian,
  stepSymbol,
  warmupAll,
  warmupHistory,
  settleContract,
  PAYOUTS,
  bucketStart,
} from '../../src/market/engine';
import { lastDigitOf } from '../../src/market/types';

describe('synthetic market engine', () => {
  it('produces deterministic ticks for the same seed', () => {
    const a = createEngine(42, 1000);
    const b = createEngine(42, 1000);
    const ta = stepSymbol(a.symbols.get('R_100')!, 2000);
    const tb = stepSymbol(b.symbols.get('R_100')!, 2000);
    expect(ta.p).toBe(tb.p);
    expect(ta.digit).toBe(tb.digit);
  });

  it('produces different ticks for different seeds', () => {
    const a = createEngine(1, 1000);
    const b = createEngine(2, 1000);
    const ta = stepSymbol(a.symbols.get('R_100')!, 2000);
    const tb = stepSymbol(b.symbols.get('R_100')!, 2000);
    expect(ta.p).not.toBe(tb.p);
  });

  it('rng is seeded and gaussian returns finite values', () => {
    const rng = makeRng(7);
    const values = Array.from({ length: 100 }, () => rng());
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    const g = gaussian(makeRng(9));
    expect(Number.isFinite(g)).toBe(true);
  });

  it('warmup produces closed candles with consistent OHLC', () => {
    const engine = createEngine(5, Date.now());
    const st = engine.symbols.get('R_50')!;
    warmupHistory(st, '1m', 100);
    const candles = st.candles['1m'];
    expect(candles.length).toBe(100);
    for (const c of candles) {
      expect(c.h).toBeGreaterThanOrEqual(c.l);
      expect(c.h).toBeGreaterThanOrEqual(Math.max(c.o, c.c));
      expect(c.l).toBeLessThanOrEqual(Math.min(c.o, c.c));
    }
  });

  it('live ticks aggregate into candles by bucket', () => {
    const engine = createEngine(11, 60_000);
    warmupAll(engine, 10);
    const st = engine.symbols.get('R_10')!;
    for (let i = 1; i <= 30; i++) {
      stepSymbol(st, 60_000 + i * 100);
    }
    const last = st.candles['1m'][st.candles['1m'].length - 1];
    expect(last.v).toBeGreaterThan(0);
    expect(bucketStart(last.t, '1m')).toBe(last.t);
  });

  it('lastDigitOf extracts the last fractional digit', () => {
    expect(lastDigitOf(1257.382, 3)).toBe(2);
    expect(lastDigitOf(100.505, 3)).toBe(5);
    expect(lastDigitOf(100.5, 3)).toBe(0); // "100.500"
    expect(lastDigitOf(10, 0)).toBe(0);
  });
});

describe('contract settlement', () => {
  it('settles Rise/Fall on price movement', () => {
    const rise = settleContract({ contractType: 'RISE', entrySpot: 100, exitSpot: 101, digits: 3 });
    expect(rise.won).toBe(true);
    expect(rise.payout).toBe(PAYOUTS.RISE);

    const fall = settleContract({ contractType: 'FALL', entrySpot: 100, exitSpot: 99, digits: 3 });
    expect(fall.won).toBe(true);

    const flat = settleContract({ contractType: 'RISE', entrySpot: 100, exitSpot: 100, digits: 3 });
    expect(flat.won).toBe(false);
    expect(flat.payout).toBe(0);
  });

  it('settles digit contracts on the exit digit', () => {
    // 1257.382 -> digit 2
    expect(settleContract({ contractType: 'EVEN', entrySpot: 1, exitSpot: 1257.382, digits: 3 }).won).toBe(true);
    expect(settleContract({ contractType: 'ODD', entrySpot: 1, exitSpot: 1257.382, digits: 3 }).won).toBe(false);
    expect(settleContract({ contractType: 'MATCHES', entrySpot: 1, exitSpot: 1257.382, predict: 2, digits: 3 }).won).toBe(true);
    expect(settleContract({ contractType: 'DIFFERS', entrySpot: 1, exitSpot: 1257.382, predict: 2, digits: 3 }).won).toBe(false);
    expect(settleContract({ contractType: 'OVER', entrySpot: 1, exitSpot: 1257.382, predict: 5, digits: 3 }).won).toBe(false);
    expect(settleContract({ contractType: 'UNDER', entrySpot: 1, exitSpot: 1257.382, predict: 5, digits: 3 }).won).toBe(true);
  });
});
