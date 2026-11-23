/** Bot Charts page — full-width simulated market charts with symbol + timeframe switching. */
import { useEffect, useState } from 'react';
import { CandleChart } from '../../components/charts/CandleChart';
import { SYMBOLS, SYMBOL_MAP, SymbolId, Timeframe } from '../../market/types';
import { requestHistory, useMarketStore } from '../../store/marketStore';
import { useUIStore } from '../../store/uiStore';
import { formatSigned } from '../../lib/decimal';

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h'];

export function BotChartsPage() {
  const [symbol, setSymbol] = useState<SymbolId>('R_100');
  const [tf, setTf] = useState<Timeframe>('1m');
  const dark = useUIStore((s) => s.theme === 'dark');
  const feed = useMarketStore((s) => s.feeds[symbol]);
  const spec = SYMBOL_MAP[symbol];

  useEffect(() => {
    void requestHistory(symbol, tf);
  }, [symbol, tf]);

  const candles = feed?.candles[tf] ?? [];
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const change = last && prev ? last.c - prev.c : 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">Charts</h1>
          <p className="mt-1 text-sm text-deriv-muted">
            Live simulated market data from the synthetic engine — clearly labelled, never real market feeds.
          </p>
        </div>
        <div className="flex gap-1 rounded-btn bg-gray-100 p-1 dark:bg-white/10">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={`rounded-btn px-3.5 py-1.5 text-sm font-semibold transition-all ${
                tf === t ? 'bg-white text-deriv-ink shadow-sm dark:bg-deriv-dark-3 dark:text-white' : 'text-gray-500 hover:text-deriv-ink dark:hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Watchlist */}
        <div className="rounded-card border border-[var(--panel-border)] bg-[var(--panel-bg)]">
          <div className="border-b border-[var(--panel-border)] px-4 py-3 text-sm font-semibold text-[var(--text-main)]">
            Markets <span className="ml-1 text-xs font-normal text-deriv-muted">(simulated)</span>
          </div>
          <div className="p-2">
            {SYMBOLS.map((s) => {
              const f = useMarketStore.getState().feeds[s.id];
              const price = f?.price ?? s.basePrice;
              return (
                <button
                  key={s.id}
                  onClick={() => setSymbol(s.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                    symbol === s.id ? 'bg-deriv-red/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div>
                    <div className={`text-sm font-semibold ${symbol === s.id ? 'text-deriv-red' : 'text-[var(--text-main)]'}`}>{s.shortName}</div>
                    <div className="text-[10px] text-deriv-muted">{s.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs font-semibold text-[var(--text-main)]">{price.toFixed(s.digits)}</div>
                    <div className={`text-[10px] ${(f?.price ?? 0) >= s.basePrice ? 'text-deriv-green' : 'text-loss'}`}>
                      {(f?.price ?? 0) >= s.basePrice ? '▲' : '▼'} {(((f?.price ?? s.basePrice) / s.basePrice - 1) * 100).toFixed(2)}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-card border border-[var(--panel-border)] bg-[var(--panel-bg)] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-bold text-[var(--text-main)]">{spec?.name}</div>
              <div className="text-xs text-deriv-muted">Continuous Indices · simulated 24/7</div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-deriv-muted">Last</div>
                <div className="font-mono text-xl font-bold text-[var(--text-main)]">{last?.c.toFixed(spec?.digits ?? 3) ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-deriv-muted">Change</div>
                <div className={`font-mono text-xl font-bold ${change >= 0 ? 'text-deriv-green' : 'text-loss'}`}>
                  {formatSigned(change, spec?.digits ?? 3)}
                </div>
              </div>
            </div>
          </div>
          <CandleChart candles={candles} height={480} dark={dark} />
        </div>
      </div>
    </div>
  );
}
