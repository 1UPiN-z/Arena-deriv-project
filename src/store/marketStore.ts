/** Market feed store — bridges the market worker into React state. */
import { create } from 'zustand';
import type { Candle, SymbolId, Tick, Timeframe } from '../market/types';

export interface SymbolFeed {
  price: number;
  prevPrice: number;
  digit: number;
  tick: Tick | null;
  candles: Record<Timeframe, Candle[]>;
  historyLoaded: boolean;
}

interface MarketState {
  feeds: Partial<Record<SymbolId, SymbolFeed>>;
  connected: boolean;
  applyUpdate(ticks: { symbol: SymbolId; tick: Tick }[], candles: { symbol: SymbolId; interval: Timeframe; candle: Candle }[]): void;
  setHistory(symbol: SymbolId, interval: Timeframe, candles: Candle[], price: number): void;
  setConnected(v: boolean): void;
}

export const useMarketStore = create<MarketState>((set) => ({
  feeds: {},
  connected: false,
  applyUpdate: (ticks, candles) =>
    set((state) => {
      const feeds = { ...state.feeds };
      for (const { symbol, tick } of ticks) {
        const prev = feeds[symbol] ?? emptyFeed();
        feeds[symbol] = {
          ...prev,
          prevPrice: prev.price || tick.p,
          price: tick.p,
          digit: tick.digit,
          tick,
        };
      }
      for (const { symbol, interval, candle } of candles) {
        const feed = feeds[symbol] ?? emptyFeed();
        const list = feed.candles[interval];
        const updated = list.slice();
        const last = updated[updated.length - 1];
        if (last && last.t === candle.t) {
          updated[updated.length - 1] = candle;
        } else {
          if (last && !last.closed) updated[updated.length - 1] = { ...last, closed: true };
          updated.push(candle);
          if (updated.length > 600) updated.splice(0, updated.length - 600);
        }
        feed.candles[interval] = updated;
        feeds[symbol] = feed;
      }
      return { feeds };
    }),
  setHistory: (symbol, interval, candles, price) =>
    set((state) => {
      const prev = state.feeds[symbol] ?? emptyFeed();
      return {
        feeds: {
          ...state.feeds,
          [symbol]: {
            ...prev,
            price,
            prevPrice: prev.price || price,
            candles: { ...prev.candles, [interval]: candles },
            historyLoaded: true,
          },
        },
      };
    }),
  setConnected: (v) => set({ connected: v }),
}));

function emptyFeed(): SymbolFeed {
  return {
    price: 0,
    prevPrice: 0,
    digit: 0,
    tick: null,
    candles: { '1m': [], '5m': [], '15m': [], '1h': [] },
    historyLoaded: false,
  };
}

// ---------------------------------------------------------------------------
// Worker singleton
// ---------------------------------------------------------------------------

let worker: Worker | null = null;
let requestSeq = 0;
const pending = new Map<number, (msg: Record<string, unknown>) => void>();

export function getMarketWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('../workers/market.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent) => {
    const msg = e.data as Record<string, unknown> & { type: string };
    if (msg.type === 'update') {
      useMarketStore
        .getState()
        .applyUpdate(msg.ticks as never, msg.candles as never);
    } else if (msg.requestId && pending.has(msg.requestId as number)) {
      pending.get(msg.requestId as number)!(msg);
      pending.delete(msg.requestId as number);
    }
    if (msg.type === 'ready') useMarketStore.getState().setConnected(true);
  };
  worker.postMessage({ type: 'init', requestId: ++requestSeq });
  return worker;
}

export function requestHistory(symbol: SymbolId, interval: Timeframe): Promise<Candle[]> {
  const w = getMarketWorker();
  const requestId = ++requestSeq;
  return new Promise((resolve) => {
    pending.set(requestId, (msg) => {
      useMarketStore.getState().setHistory(symbol, interval, msg.candles as Candle[], msg.price as number);
      resolve(msg.candles as Candle[]);
    });
    w.postMessage({ type: 'history', requestId, symbol, interval });
  });
}

export function setMarketRate(rate: number): void {
  getMarketWorker().postMessage({ type: 'set_rate', rate });
}
