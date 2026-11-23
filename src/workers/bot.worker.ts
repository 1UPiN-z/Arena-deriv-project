/**
 * Bot execution worker — runs the strategy interpreter against a private,
 * seeded synthetic market. The UI stays responsive; all strategy evaluation is
 * allowlisted (see bot/interpreter.ts). No arbitrary code ever executes here.
 */
import {
  createEngine,
  stepSymbol,
  warmupAll,
  EngineState,
  SymbolState,
  PAYOUTS,
} from '../market/engine';
import { Candle, Timeframe, lastDigitOf } from '../market/types';
import { makeRng } from '../market/engine';
import {
  compileStrategy,
  createRunContext,
  evaluatePurchases,
  evaluateRestart,
  evaluateSells,
  executeRestartSideEffects,
  runStart,
  settleOpenContract,
} from '../bot/interpreter';
import type {
  BotEvent,
  BotStatus,
  RunConfig,
  TradeRecord,
} from '../bot/types';
import type { MarketFacade, OpenContract } from '../bot/runtimeTypes';
import { uid } from '../lib/ids';

const ctxSelf = self as unknown as {
  onmessage: ((e: MessageEvent) => void) | null;
  postMessage(msg: unknown): void;
};

function emit(event: BotEvent): void {
  ctxSelf.postMessage({ type: 'event', event });
}

function log(level: 'info' | 'warn' | 'error' | 'debug' | 'success', message: string): void {
  emit({ type: 'log', entry: { ts: Date.now(), level, message } });
}

let config: RunConfig | null = null;
let engine: EngineState | null = null;
let state: SymbolState | null = null;
let runCtx: ReturnType<typeof createRunContext> | null = null;
let status: BotStatus = 'idle';
let timer: ReturnType<typeof setInterval> | null = null;
let simTime = 0;
let phase: 'awaiting' | 'holding' = 'awaiting';
let rng: () => number = Math.random;

function setStatus(s: BotStatus, message?: string): void {
  status = s;
  emit({ type: 'status', status: s, message });
}

function facade(): MarketFacade {
  return {
    lastPrice: () => state!.price,
    lastDigit: () => lastDigitOf(state!.price, state!.spec.digits),
    digits: () => state!.spec.digits,
    closedCandles: (tf: Timeframe): Candle[] => state!.candles[tf].filter((c) => c.closed),
  };
}

function openTrade(c: OpenContract): void {
  const trade: TradeRecord = {
    id: uid('trade'),
    sessionId: config!.sessionId,
    source: 'bot',
    symbol: runCtx!.tradeDef.market,
    contractType: c.contractType,
    stake: c.stake,
    payoutMultiplier: PAYOUTS[c.contractType],
    entrySpot: c.entrySpot,
    exitSpot: null,
    predict: c.predict,
    durationUnit: c.durationUnit,
    durationValue: c.durationValue,
    openedAt: Date.now(),
    closedAt: null,
    status: 'open',
    won: null,
    soldEarly: false,
    profit: 0,
    balanceAfter: runCtx!.stats.balance,
  };
  (c as OpenContract & { tradeId?: string }).tradeId = trade.id;
  emit({ type: 'trade_opened', trade });
  log('info', `Purchased ${c.contractType} — stake ${c.stake.toFixed(2)} ${runCtx!.tradeDef.currency} @ ${c.entrySpot}`);
}

function settleTrade(c: OpenContract, reason: string, soldEarly: boolean): void {
  const exitSpot = state!.price;
  const { won, profit, payout } = settleOpenContract(runCtx!, exitSpot, soldEarly);
  const tradeId = (c as OpenContract & { tradeId?: string }).tradeId ?? uid('trade');
  const trade: TradeRecord = {
    id: tradeId,
    sessionId: config!.sessionId,
    source: 'bot',
    symbol: runCtx!.tradeDef.market,
    contractType: c.contractType,
    stake: c.stake,
    payoutMultiplier: payout,
    entrySpot: c.entrySpot,
    exitSpot,
    predict: c.predict,
    durationUnit: c.durationUnit,
    durationValue: c.durationValue,
    openedAt: c.openedAt,
    closedAt: Date.now(),
    status: 'settled',
    won,
    soldEarly,
    profit: Number(profit.toFixed(2)),
    balanceAfter: Number(runCtx!.stats.balance.toFixed(2)),
  };
  runCtx!.openContract = null;
  phase = 'awaiting';
  emit({ type: 'trade_settled', trade, stats: { ...runCtx!.stats } });
  log(won ? 'success' : 'warn', `${reason} — ${won ? 'won' : 'lost'} ${profit >= 0 ? '+' : ''}${profit.toFixed(2)} ${runCtx!.tradeDef.currency} (balance ${runCtx!.stats.balance.toFixed(2)})`);
}

function tickLoop(): void {
  if (!runCtx || !state || status !== 'running') return;
  try {
    simTime += state.spec.tickMs;
    const tick = stepSymbol(state, simTime);
    runCtx.stats.ticks += 1;
    emit({ type: 'tick', symbol: runCtx.tradeDef.market, price: tick.p, digit: tick.digit, t: simTime });

    const c = runCtx.openContract;
    if (c && phase === 'holding') {
      // 1) early sell conditions
      const sellReason = evaluateSells(compiledStrategy!, runCtx);
      if (sellReason) {
        settleTrade(c, sellReason, true);
        decideRestart();
        return;
      }
      // 2) expiry
      if (c.durationUnit === 'ticks') {
        c.ticksLeft -= 1;
        if (c.ticksLeft <= 0) {
          settleTrade(c, 'Contract expired', false);
          decideRestart();
          return;
        }
      } else if (simTime >= c.settleAt) {
        settleTrade(c, 'Contract expired', false);
        decideRestart();
        return;
      }
    } else if (phase === 'awaiting') {
      const decision = evaluatePurchases(compiledStrategy!, runCtx);
      if (decision) {
        const td = runCtx.tradeDef;
        const contract: OpenContract = {
          id: uid('contract'),
          contractType: decision.contractType,
          stake: decision.stake,
          entrySpot: state.price,
          openedAt: simTime,
          predict: decision.predict,
          durationUnit: td.durationUnit,
          durationValue: td.durationValue,
          ticksLeft: td.durationUnit === 'ticks' ? td.durationValue : 0,
          settleAt: td.durationUnit === 'minutes' ? simTime + td.durationValue * 60_000 : Number.MAX_SAFE_INTEGER,
        };
        runCtx.openContract = contract;
        phase = 'holding';
        openTrade(contract);
      }
    }
    // periodic stats heartbeat
    if (runCtx.stats.ticks % 10 === 0) emit({ type: 'stats', stats: { ...runCtx.stats } });
  } catch (e) {
    const message = (e as Error).message ?? String(e);
    emit({ type: 'error', message, recoverable: true });
    log('error', `Execution error: ${message}`);
    const c = runCtx.openContract;
    if (c && runCtx.tradeDef.restartLastOnError) {
      // ignore the unsuccessful trade and continue
      runCtx.openContract = null;
      phase = 'awaiting';
      log('warn', 'Restart last trade on error — failed trade ignored');
    } else if (!runCtx.tradeDef.restartBuySellOnError) {
      stopAll('Stopped after error');
    }
  }
}

function decideRestart(): void {
  if (!runCtx) return;
  executeRestartSideEffects(compiledStrategy!, runCtx);
  const decision = evaluateRestart(compiledStrategy!, runCtx);
  emit({ type: 'stats', stats: { ...runCtx.stats } });
  if (decision.action === 'stop') {
    log('info', `Bot finished: ${decision.reason}`);
    finishAll(decision.reason);
  }
}

function finishAll(reason: string): void {
  if (timer) clearInterval(timer);
  timer = null;
  setStatus('finished', reason);
}

function stopAll(reason: string): void {
  if (timer) clearInterval(timer);
  timer = null;
  const c = runCtx?.openContract;
  if (c && runCtx) {
    settleTrade(c, 'Stopped — position sold at market', true);
  }
  emit({ type: 'stats', stats: runCtx ? { ...runCtx.stats } : ({} as never) });
  setStatus('stopped', reason);
  log('info', `Bot stopped: ${reason}`);
}

let compiledStrategy: ReturnType<typeof compileStrategy> | null = null;

function startRun(cfg: RunConfig): void {
  config = cfg;
  rng = makeRng(cfg.seed);
  engine = createEngine(cfg.seed, cfg.startedAt);
  warmupAll(engine, 260);
  simTime = cfg.startedAt;
  const td = compileStrategy(cfg.workspace).tradeDef;
  state = engine.symbols.get(td.market)!;
  compiledStrategy = compileStrategy(cfg.workspace);

  const errors = compiledStrategy.issues.filter((i) => i.severity === 'error');
  if (errors.length) {
    for (const err of errors) log('error', err.message);
    setStatus('error', errors[0].message);
    return;
  }
  for (const warn of compiledStrategy.issues.filter((i) => i.severity === 'warning')) {
    log('warn', warn.message);
  }

  runCtx = createRunContext({
    compiled: compiledStrategy,
    varNames: new Map((cfg.workspace.variables ?? []).map((v) => [v.id, v.name])),
    market: facade(),
    rng,
    startingBalance: cfg.startingBalance,
    log,
    purchase: (contractType, stake, predict) => {
      if (!runCtx || !state) return;
      const td2 = runCtx.tradeDef;
      const contract: OpenContract = {
        id: uid('contract'),
        contractType,
        stake,
        entrySpot: state.price,
        openedAt: simTime,
        predict,
        durationUnit: td2.durationUnit,
        durationValue: td2.durationValue,
        ticksLeft: td2.durationUnit === 'ticks' ? td2.durationValue : 0,
        settleAt: td2.durationUnit === 'minutes' ? simTime + td2.durationValue * 60_000 : Number.MAX_SAFE_INTEGER,
      };
      runCtx.openContract = contract;
      phase = 'holding';
      openTrade(contract);
    },
    sellAtMarket: (reason) => {
      const c = runCtx?.openContract;
      if (c) settleTrade(c, reason, true);
    },
    playSound: (sound) => {
      emit({ type: 'log', entry: { ts: Date.now(), level: 'info', message: `Sound: ${sound}` } });
    },
    now: () => Date.now(),
  });

  try {
    runStart(compiledStrategy, runCtx);
    log('success', `Bot started — ${compiledStrategy.tradeDef.market}, seed ${cfg.seed}`);
    setStatus('running');
    phase = 'awaiting';
    if (timer) clearInterval(timer);
    timer = setInterval(tickLoop, Math.max(40, 250 / cfg.speed));
  } catch (e) {
    setStatus('error', (e as Error).message);
    log('error', `Failed to start: ${(e as Error).message}`);
  }
}

ctxSelf.onmessage = (e: MessageEvent) => {
  const msg = e.data as { type: string; config?: RunConfig; speed?: number };
  switch (msg.type) {
    case 'start':
      if (msg.config) startRun(msg.config);
      break;
    case 'pause':
      if (status === 'running') {
        if (timer) clearInterval(timer);
        timer = null;
        setStatus('paused');
        log('info', 'Bot paused');
      }
      break;
    case 'resume':
      if (status === 'paused' && config) {
        setStatus('running');
        timer = setInterval(tickLoop, Math.max(40, 250 / config.speed));
        log('info', 'Bot resumed');
      }
      break;
    case 'stop':
      stopAll('Stopped by user');
      break;
    case 'set_speed':
      if (msg.speed && config) {
        config = { ...config, speed: msg.speed };
        if (status === 'running') {
          if (timer) clearInterval(timer);
          timer = setInterval(tickLoop, Math.max(40, 250 / config.speed));
        }
      }
      break;
  }
};
