/**
 * Synthetic market worker — owns the live simulated price feed for UI charts
 * and the trader page. Clearly labelled simulated data (educational demo).
 */
import {
  Candle,
  SymbolId,
  Timeframe,
  SYMBOLS,
  Tick,
} from '../market/types';
import { EngineState, createEngine, stepSymbol, warmupAll } from '../market/engine';

interface InMsg {
  type: 'init' | 'history' | 'set_rate';
  requestId?: number;
  symbol?: SymbolId;
  interval?: Timeframe;
  rate?: number;
}

const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<InMsg>) => void) | null;
  postMessage(msg: unknown): void;
  close(): void;
};

const engine: EngineState = createEngine(20261123, Date.now());
warmupAll(engine, 260);

let simTime = Date.now();
let rate = 1; // speed multiplier
let timer: ReturnType<typeof setInterval> | null = null;

function broadcast(): void {
  const payload: { ticks: { symbol: SymbolId; tick: Tick }[]; candles: { symbol: SymbolId; interval: Timeframe; candle: Candle }[] } = {
    ticks: [],
    candles: [],
  };
  for (const spec of SYMBOLS) {
    const st = engine.symbols.get(spec.id)!;
    const tick = stepSymbol(st, simTime);
    payload.ticks.push({ symbol: spec.id, tick });
    for (const tf of ['1m', '5m', '15m', '1h'] as Timeframe[]) {
      const list = st.candles[tf];
      const cur = list[list.length - 1];
      if (cur) payload.candles.push({ symbol: spec.id, interval: tf, candle: { ...cur } });
    }
  }
  ctx.postMessage({ type: 'update', ...payload });
}

function startTimer(): void {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    simTime += 500;
    broadcast();
  }, Math.max(60, 500 / rate));
}

startTimer();

ctx.onmessage = (e: MessageEvent<InMsg>) => {
  const msg = e.data;
  switch (msg.type) {
    case 'init':
      ctx.postMessage({ type: 'ready', requestId: msg.requestId, simTime });
      break;
    case 'history': {
      const st = engine.symbols.get(msg.symbol!);
      if (st) {
        ctx.postMessage({
          type: 'history',
          requestId: msg.requestId,
          symbol: msg.symbol,
          interval: msg.interval,
          candles: st.candles[msg.interval as Timeframe].map((c) => ({ ...c })),
          price: st.price,
        });
      }
      break;
    }
    case 'set_rate':
      rate = Math.max(0.25, Math.min(10, msg.rate ?? 1));
      startTimer();
      break;
  }
};
