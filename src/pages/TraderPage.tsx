/** Deriv Trader–style demo trading page — simulated contracts on synthetic markets. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { create } from 'zustand';
import { CandleChart, Sparkline } from '../components/charts/CandleChart';
import { SYMBOLS, SYMBOL_MAP, SymbolId, Tick } from '../market/types';
import { ContractType, PAYOUTS, settleContract } from '../market/engine';
import { requestHistory, useMarketStore } from '../store/marketStore';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { db } from '../db/db';
import { uid } from '../lib/ids';
import { formatSigned } from '../lib/decimal';
import { Tabs, Toggle } from '../components/ui/kit';

interface ManualTrade {
  id: string;
  symbol: SymbolId;
  contractType: ContractType;
  stake: number;
  payoutMultiplier: number;
  entrySpot: number;
  predict?: number;
  durationTicks: number;
  ticksLeft: number;
  openedAt: number;
}

interface TraderState {
  openTrades: ManualTrade[];
  closedTrades: (ManualTrade & { exitSpot: number; won: boolean; profit: number; closedAt: number })[];
  open(t: ManualTrade): void;
  settle(id: string, exitSpot: number): void;
  clearClosed(): void;
}

const useTraderStore = create<TraderState>((set) => ({
  openTrades: [],
  closedTrades: [],
  open: (t) => set((s) => ({ openTrades: [...s.openTrades, t] })),
  settle: (id, exitSpot) =>
    set((s) => {
      const t = s.openTrades.find((x) => x.id === id);
      if (!t) return s;
      const res = settleContract({
        contractType: t.contractType,
        entrySpot: t.entrySpot,
        exitSpot,
        predict: t.predict,
        digits: SYMBOL_MAP[t.symbol].digits,
      });
      const profit = res.won ? t.stake * (res.payout - 1) : -t.stake;
      return {
        openTrades: s.openTrades.filter((x) => x.id !== id),
        closedTrades: [
          { ...t, exitSpot, won: res.won, profit: Number(profit.toFixed(2)), closedAt: Date.now() },
          ...s.closedTrades,
        ].slice(0, 100),
      };
    }),
  clearClosed: () => set({ closedTrades: [] }),
}));

const CONTRACT_LABELS: Record<ContractType, string> = {
  RISE: 'Rise',
  FALL: 'Fall',
  EVEN: 'Even',
  ODD: 'Odd',
  OVER: 'Over',
  UNDER: 'Under',
  MATCHES: 'Matches',
  DIFFERS: 'Differs',
};

export function TraderPage() {
  const [symbol, setSymbol] = useState<SymbolId>('R_100');
  const [contract, setContract] = useState<ContractType>('RISE');
  const [stake, setStake] = useState(10);
  const [duration, setDuration] = useState(5);
  const [predict, setPredict] = useState(5);
  const [tab, setTab] = useState('open');
  const [useTicks, setUseTicks] = useState(true);
  const dark = useUIStore((s) => s.theme === 'dark');
  const toast = useUIStore((s) => s.toast);
  const { balance, bootstrap, setBalance } = useAuthStore();
  const feed = useMarketStore((s) => s.feeds[symbol]);
  const trader = useTraderStore();
  const lastTickT = useRef(0);

  const spec = SYMBOL_MAP[symbol];
  useEffect(() => {
    void requestHistory(symbol, '1m');
  }, [symbol]);
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const needsPredict = contract === 'OVER' || contract === 'UNDER' || contract === 'MATCHES' || contract === 'DIFFERS';
  const payout = PAYOUTS[contract];
  const potentialProfit = stake * (payout - 1);

  // ---- settle expiring trades on every tick ---------------------------------
  useEffect(() => {
    const tick = feed?.tick;
    if (!tick || tick.t === lastTickT.current) return;
    lastTickT.current = tick.t;
    for (const t of trader.openTrades) {
      if (t.symbol !== symbol) continue;
      const ticksLeft = t.ticksLeft - 1;
      if (ticksLeft <= 0) {
        trader.settle(t.id, tick.p);
        void (async () => {
          await db.trades.add({
            id: t.id,
            sessionId: null,
            source: 'manual',
            symbol: t.symbol,
            contractType: t.contractType,
            stake: t.stake,
            payoutMultiplier: t.payoutMultiplier,
            entrySpot: t.entrySpot,
            exitSpot: tick.p,
            predict: t.predict,
            durationUnit: 'ticks',
            durationValue: t.durationTicks,
            openedAt: t.openedAt,
            closedAt: Date.now(),
            status: 'settled',
            won: settleContract({
              contractType: t.contractType,
              entrySpot: t.entrySpot,
              exitSpot: tick.p,
              predict: t.predict,
              digits: spec.digits,
            }).won,
            soldEarly: false,
            profit: 0,
            balanceAfter: 0,
          });
          await bootstrap();
        })();
        toast(
          settleContract({ contractType: t.contractType, entrySpot: t.entrySpot, exitSpot: tick.p, predict: t.predict, digits: spec.digits }).won
            ? 'success'
            : 'error',
          'Trade settled',
          `${CONTRACT_LABELS[t.contractType]} · ${t.stake.toFixed(2)} USD`,
        );
      } else {
        useTraderStore.setState((s) => ({
          openTrades: s.openTrades.map((x) => (x.id === t.id ? { ...x, ticksLeft } : x)),
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed?.tick?.t]);

  // Note: profit written to db above uses computed values
  const buy = () => {
    if (stake > balance) {
      toast('error', 'Insufficient balance', 'Lower your stake or reset the demo balance.');
      return;
    }
    const price = feed?.price ?? spec.basePrice;
    const t: ManualTrade = {
      id: uid('trade'),
      symbol,
      contractType: contract,
      stake,
      payoutMultiplier: payout,
      entrySpot: price,
      predict: needsPredict ? predict : undefined,
      durationTicks: useTicks ? duration : duration * 10,
      ticksLeft: useTicks ? duration : duration * 10,
      openedAt: Date.now(),
    };
    trader.open(t);
    setBalance(Number((balance - stake).toFixed(2)));
    toast('info', 'Trade opened', `${CONTRACT_LABELS[contract]} · ${stake.toFixed(2)} USD @ ${price.toFixed(spec.digits)}`);
  };

  const prices = useMemo(() => (feed?.candles['1m'] ?? []).map((c) => c.c).slice(-40), [feed]);
  const up = (feed?.price ?? 0) >= (feed?.prevPrice ?? 0);

  return (
    <div className="min-h-[calc(100vh-72px)] bg-deriv-band pb-12 dark:bg-deriv-dark">
      {/* Symbol strip */}
      <div className="sticky top-[72px] z-40 border-b border-black/5 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-deriv-dark-2/95">
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 overflow-x-auto px-4 py-2.5">
          <Link to="/bot" className="flex-shrink-0 text-sm font-semibold text-deriv-red hover:underline">← Deriv Bot</Link>
          <div className="h-5 w-px bg-gray-200 dark:bg-white/10" />
          {SYMBOLS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSymbol(s.id)}
              className={`flex flex-shrink-0 items-center gap-2 rounded-btn px-3 py-1.5 transition-colors ${
                symbol === s.id ? 'bg-deriv-red/10 text-deriv-red' : 'text-deriv-body hover:bg-gray-100 dark:text-white/80 dark:hover:bg-white/10'
              }`}
            >
              <div className="text-left">
                <div className="text-xs font-semibold">{s.shortName}</div>
                <div className="font-mono text-[10px] text-deriv-muted">{(useMarketStore.getState().feeds[s.id]?.price ?? s.basePrice).toFixed(s.digits)}</div>
              </div>
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex-shrink-0 rounded-btn border border-gray-200 px-3 py-1.5 text-sm dark:border-white/10">
            <span className="text-deriv-muted">Balance </span>
            <strong className="text-deriv-green">{balance.toFixed(2)} USD</strong>
            <span className="ml-2 rounded bg-deriv-teal/15 px-1.5 py-0.5 text-[10px] font-bold text-deriv-teal-dark">DEMO</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* ------------- Trade panel ------------- */}
          <div className="card h-fit p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-deriv-ink dark:text-white">Trade panel</h2>
              <span className="badge bg-deriv-red/10 text-deriv-red">Simulated</span>
            </div>

            <label className="label mt-5">Contract type</label>
            <select className="input" value={contract} onChange={(e) => setContract(e.target.value as ContractType)}>
              {(Object.keys(PAYOUTS) as ContractType[]).map((c) => (
                <option key={c} value={c}>
                  {CONTRACT_LABELS[c]} · payout ×{PAYOUTS[c]}
                </option>
              ))}
            </select>

            <label className="label mt-4">Stake (USD)</label>
            <div className="flex gap-2">
              <button className="btn-secondary h-10 w-10 text-lg" onClick={() => setStake((s) => Math.max(1, s - 5))}>−</button>
              <input type="number" className="input text-center font-semibold" value={stake} min={1} onChange={(e) => setStake(Math.max(1, Number(e.target.value)))} />
              <button className="btn-secondary h-10 w-10 text-lg" onClick={() => setStake((s) => s + 5)}>+</button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <label className="label mb-0">Duration</label>
              <div className="flex items-center gap-2 text-xs text-deriv-muted">
                ticks
                <Toggle checked={useTicks} onChange={setUseTicks} label="Duration unit" />
                minutes
              </div>
            </div>
            <input type="number" className="input" value={duration} min={1} onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))} />

            {needsPredict && (
              <>
                <label className="label mt-4">Prediction digit (0–9)</label>
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: 10 }).map((_, d) => (
                    <button
                      key={d}
                      onClick={() => setPredict(d)}
                      className={`aspect-square rounded-lg text-sm font-bold transition-all ${
                        predict === d ? 'bg-deriv-red text-white' : 'bg-gray-100 text-deriv-ink hover:bg-gray-200 dark:bg-white/10 dark:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="mt-5 rounded-card bg-deriv-band p-4 dark:bg-white/5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-deriv-muted">Potential payout</span>
                <span className="font-bold text-deriv-ink dark:text-white">{(stake * payout).toFixed(2)} USD</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-deriv-muted">Potential profit</span>
                <span className="font-bold text-deriv-green">+{potentialProfit.toFixed(2)} USD</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-deriv-muted">Max loss</span>
                <span className="font-bold text-loss">−{stake.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={buy} className="btn-green h-14 text-lg shadow-md">
                ▲ {contract === 'FALL' ? 'Fall' : 'Rise'}
              </button>
              <button
                onClick={() => {
                  const flipped = contract === 'RISE' ? 'FALL' : contract === 'FALL' ? 'RISE' : contract;
                  setContract(flipped as ContractType);
                  buy();
                }}
                className="btn h-14 bg-deriv-red text-lg text-white shadow-md hover:bg-deriv-red-hover"
              >
                ▼ {contract === 'RISE' ? 'Fall' : 'Rise'}
              </button>
            </div>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-deriv-muted">
              Educational simulation — no real money, no real execution. Prices come from a local synthetic market engine.
            </p>
          </div>

          {/* ------------- Chart + positions ------------- */}
          <div className="space-y-6">
            <div className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-deriv-ink dark:text-white">{spec.name}</h2>
                  <div className="text-xs text-deriv-muted">Derived ▸ Continuous Indices · simulated instrument</div>
                </div>
                <div className="flex items-center gap-4">
                  <Sparkline values={prices} color={up ? '#22A45D' : '#FF444F'} width={110} height={36} />
                  <div>
                    <div
                      className={`font-mono text-2xl font-bold transition-colors duration-200 ${up ? 'text-deriv-green' : 'text-loss'}`}
                      key={feed?.price}
                    >
                      {feed?.price?.toFixed(spec.digits) ?? '—'}
                    </div>
                    <div className={`text-xs ${up ? 'text-deriv-green' : 'text-loss'}`}>
                      {up ? '▲' : '▼'} last tick {feed?.digit ?? ''}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 overflow-hidden rounded-card border border-black/5 dark:border-white/10">
                <CandleChart candles={feed?.candles['1m'] ?? []} height={420} dark={dark} />
              </div>
            </div>

            <div className="card p-5">
              <Tabs
                tabs={[
                  { id: 'open', label: 'Open positions', badge: trader.openTrades.length },
                  { id: 'closed', label: 'Settled positions', badge: trader.closedTrades.length },
                ]}
                active={tab}
                onChange={setTab}
              />
              <div className="mt-4 overflow-x-auto">
                {tab === 'open' && (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Contract</th><th>Symbol</th><th>Stake</th><th>Entry</th><th>Duration</th><th>Left</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trader.openTrades.map((t) => (
                        <tr key={t.id}>
                          <td><span className="badge bg-deriv-teal/10 text-deriv-teal-dark">{CONTRACT_LABELS[t.contractType]}</span></td>
                          <td>{SYMBOL_MAP[t.symbol].shortName}</td>
                          <td>{t.stake.toFixed(2)}</td>
                          <td className="font-mono">{t.entrySpot}</td>
                          <td>{t.durationTicks} ticks</td>
                          <td className="font-semibold text-deriv-teal">{t.ticksLeft}</td>
                        </tr>
                      ))}
                      {!trader.openTrades.length && (
                        <tr><td colSpan={6} className="py-8 text-center text-deriv-muted">No open positions — place a trade to get started.</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
                {tab === 'closed' && (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Contract</th><th>Stake</th><th>Entry</th><th>Exit</th><th>Result</th><th>P/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trader.closedTrades.map((t) => (
                        <tr key={t.id}>
                          <td><span className={`badge ${t.won ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{CONTRACT_LABELS[t.contractType]}</span></td>
                          <td>{t.stake.toFixed(2)}</td>
                          <td className="font-mono">{t.entrySpot}</td>
                          <td className="font-mono">{t.exitSpot}</td>
                          <td>{t.won ? 'Won' : 'Lost'}</td>
                          <td className={`font-semibold ${t.profit >= 0 ? 'text-deriv-green' : 'text-loss'}`}>{formatSigned(t.profit)}</td>
                        </tr>
                      ))}
                      {!trader.closedTrades.length && (
                        <tr><td colSpan={6} className="py-8 text-center text-deriv-muted">No settled positions yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
