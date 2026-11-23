import { describe, expect, it } from 'vitest';
import {
  compileStrategy,
  createRunContext,
  evaluatePurchases,
  evaluateRestart,
  evaluateSells,
  executeRestartSideEffects,
  runStart,
  settleOpenContract,
  ALLOWED_BLOCK_TYPES,
} from '../../src/bot/interpreter';
import { QUICK_STRATEGIES, defaultWorkspace } from '../../src/bot/templates';
import type { WorkspaceState, BlockNode } from '../../src/bot/types';
import type { MarketFacade, OpenContract } from '../../src/bot/runtimeTypes';
import type { Candle } from '../../src/market/types';
import { makeRng } from '../../src/market/engine';

function fakeCandles(values: number[]): Candle[] {
  return values.map((c, i) => ({ t: i * 60_000, o: c, h: c + 1, l: c - 1, c, v: 10, closed: true }));
}

function fakeMarket(prices: number[], digits = 3): MarketFacade {
  let idx = 0;
  return {
    lastPrice: () => prices[Math.min(idx, prices.length - 1)],
    lastDigit: () => Number(prices[Math.min(idx, prices.length - 1)].toFixed(digits).slice(-1)),
    digits: () => digits,
    closedCandles: () => fakeCandles(prices),
  };
}

function makeCtx(workspace: WorkspaceState, prices: number[], startingBalance = 1000) {
  const compiled = compileStrategy(workspace);
  const logs: string[] = [];
  const purchases: { type: string; stake: number }[] = [];
  let sellAt: string | null = null;
  const ctx = createRunContext({
    compiled,
    varNames: new Map((workspace.variables ?? []).map((v) => [v.id, v.name])),
    market: fakeMarket(prices),
    rng: makeRng(1),
    startingBalance,
    log: (_l, m) => logs.push(m),
    purchase: (type, stake) => {
      purchases.push({ type, stake });
    },
    sellAtMarket: (reason) => {
      sellAt = reason;
    },
    playSound: () => undefined,
    now: () => 1000,
  });
  return { compiled, ctx, logs, purchases, getSell: () => sellAt };
}

describe('compileStrategy', () => {
  it('compiles a default workspace', () => {
    const compiled = compileStrategy(defaultWorkspace());
    expect(compiled.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
    expect(compiled.tradeDef.market).toBe('R_100');
    expect(compiled.purchases.length).toBeGreaterThan(0);
  });

  it('requires a trade definition', () => {
    const ws: WorkspaceState = { blocks: { blocks: [] } };
    const compiled = compileStrategy(ws);
    expect(compiled.issues.some((i) => i.severity === 'error' && i.message.includes('Trade parameters'))).toBe(true);
  });

  it('rejects unknown block types (allowlist)', () => {
    const ws: WorkspaceState = {
      blocks: {
        blocks: [
          {
            type: 'trade_definition',
            fields: { MARKET: 'R_10', TRADE_TYPE: 'UPDOWN', CANDLE_INTERVAL: '1m', DURATION_UNIT: 'ticks', DURATION_VALUE: 5, CURRENCY: 'USD', AMOUNT: 10, RESTART_LAST_ON_ERROR: 'TRUE', RESTART_BUYSELL_ON_ERROR: 'TRUE' },
          },
          {
            type: 'purchase_conditions',
            inputs: { DO: { block: { type: 'evil_eval_block', fields: {} } } },
          },
        ],
      },
    };
    const compiled = compileStrategy(ws);
    expect(compiled.issues.some((i) => i.severity === 'error' && i.blockType === 'evil_eval_block')).toBe(true);
  });

  it('validates market and candle interval', () => {
    const ws = defaultWorkspace();
    const top = ws.blocks!.blocks!;
    (top[0].fields as Record<string, unknown>).MARKET = 'BTC_REAL';
    const compiled = compileStrategy(ws);
    expect(compiled.issues.some((i) => i.message.includes('Unknown market'))).toBe(true);
  });

  it('every quick strategy compiles without errors', () => {
    for (const tpl of QUICK_STRATEGIES) {
      const ws = tpl.build(Object.fromEntries(tpl.variables.map((v) => [v.name, v.value])));
      const compiled = compileStrategy(ws);
      const errors = compiled.issues.filter((i) => i.severity === 'error');
      expect(errors, `${tpl.name}: ${errors.map((e) => e.message).join('; ')}`).toHaveLength(0);
    }
  });

  it('exposes a finite allowlist', () => {
    expect(ALLOWED_BLOCK_TYPES.size).toBeGreaterThan(30);
    expect(ALLOWED_BLOCK_TYPES.has('purchase')).toBe(true);
    expect(ALLOWED_BLOCK_TYPES.has('eval')).toBe(false);
  });
});

describe('run semantics', () => {
  it('executes run-once body at start (variable initialisation)', () => {
    const tpl = QUICK_STRATEGIES.find((t) => t.id === 'martingale')!;
    const ws = tpl.build({ stake: 10, profit_threshold: 50, loss_threshold: -100 });
    const { compiled, ctx } = makeCtx(ws, [100, 100, 100]);
    runStart(compiled, ctx);
    expect(ctx.variables.get('stake')).toBe(10);
  });

  it('purchases with the configured stake', () => {
    const tpl = QUICK_STRATEGIES.find((t) => t.id === 'basic') ?? QUICK_STRATEGIES[QUICK_STRATEGIES.length - 1];
    const ws = tpl.build({ stake: 25 });
    const { compiled, ctx, purchases } = makeCtx(ws, [100, 101]);
    runStart(compiled, ctx);
    const decision = evaluatePurchases(compiled, ctx);
    expect(decision).not.toBeNull();
    expect(decision!.contractType).toBe('RISE');
    expect(decision!.stake).toBe(25);
  });

  it('martingale doubles stake after a loss and resets after a win', () => {
    const tpl = QUICK_STRATEGIES.find((t) => t.id === 'martingale')!;
    const ws = tpl.build({ stake: 10, profit_threshold: 1000, loss_threshold: -1000 });
    const { compiled, ctx } = makeCtx(ws, [100, 90, 80, 110]);
    runStart(compiled, ctx);

    // simulate a losing trade
    ctx.openContract = { id: 'c1', contractType: 'RISE', stake: 10, entrySpot: 100, openedAt: 0, durationUnit: 'ticks', durationValue: 5, ticksLeft: 0, settleAt: 0 } as OpenContract;
    settleOpenContract(ctx, 95, false); // lost
    expect(ctx.stats.losses).toBe(1);
    executeRestartSideEffects(compiled, ctx);
    expect(evaluateRestart(compiled, ctx).action).toBe('continue');
    expect(ctx.variables.get('stake')).toBe(20); // doubled

    // simulate a winning trade
    ctx.openContract = { id: 'c2', contractType: 'RISE', stake: 20, entrySpot: 95, openedAt: 0, durationUnit: 'ticks', durationValue: 5, ticksLeft: 0, settleAt: 0 } as OpenContract;
    settleOpenContract(ctx, 110, false); // won
    executeRestartSideEffects(compiled, ctx);
    expect(ctx.variables.get('stake')).toBe(10); // reset
    expect(ctx.stats.wins).toBe(1);
  });

  it('stop_trading halts the run when its condition is met', () => {
    const tpl = QUICK_STRATEGIES.find((t) => t.id === 'martingale')!;
    const ws = tpl.build({ stake: 10, profit_threshold: 5, loss_threshold: -1000 });
    const { compiled, ctx } = makeCtx(ws, [100]);
    runStart(compiled, ctx);
    ctx.openContract = { id: 'c', contractType: 'RISE', stake: 10, entrySpot: 100, openedAt: 0, durationUnit: 'ticks', durationValue: 5, ticksLeft: 0, settleAt: 0 } as OpenContract;
    settleOpenContract(ctx, 110, false); // profit = 10 * 0.95 = 9.5 > 5
    const decision = evaluateRestart(compiled, ctx);
    expect(decision.action).toBe('stop');
    if (decision.action === 'stop') expect(decision.reason).toContain('Take profit');
  });

  it('balances reconcile after win/loss settlement (decimal-safe)', () => {
    const tpl = QUICK_STRATEGIES.find((t) => t.id === 'basic') ?? QUICK_STRATEGIES[QUICK_STRATEGIES.length - 1];
    const ws = tpl.build({ stake: 10 });
    const { compiled, ctx } = makeCtx(ws, [100], 1000);
    runStart(compiled, ctx);

    ctx.openContract = { id: 'a', contractType: 'RISE', stake: 10, entrySpot: 100, openedAt: 0, durationUnit: 'ticks', durationValue: 5, ticksLeft: 0, settleAt: 0 } as OpenContract;
    settleOpenContract(ctx, 110, false); // win +9.5
    ctx.openContract = { id: 'b', contractType: 'RISE', stake: 10, entrySpot: 100, openedAt: 0, durationUnit: 'ticks', durationValue: 5, ticksLeft: 0, settleAt: 0 } as OpenContract;
    settleOpenContract(ctx, 90, false); // loss -10

    expect(ctx.stats.balance).toBeCloseTo(999.5, 2);
    expect(ctx.stats.totalProfit).toBeCloseTo(-0.5, 2);
    expect(ctx.stats.trades).toBe(2);
  });

  it('sell conditions trigger on price targets', () => {
    const ws = defaultWorkspace();
    // add a sell block
    const hats = ws.blocks!.blocks!;
    const sellHat: BlockNode = {
      type: 'sell_conditions',
      inputs: {
        DO: {
          block: {
            type: 'sell_at_price',
            fields: { DIR: 'GTE' },
            inputs: { PRICE: { shadow: { type: 'math_number', fields: { NUM: 150 } } } },
          },
        },
      },
    };
    hats.push(sellHat);
    const { compiled, ctx } = makeCtx(ws, [160]);
    ctx.openContract = { id: 'c', contractType: 'RISE', stake: 10, entrySpot: 100, openedAt: 0, durationUnit: 'ticks', durationValue: 5, ticksLeft: 5, settleAt: 0 } as OpenContract;
    const reason = evaluateSells(compiled, ctx);
    expect(reason).toContain('Sell at price');
  });

  it('early sell settles with the resale model', () => {
    const ws = defaultWorkspace();
    const { compiled, ctx } = makeCtx(ws, [110], 1000);
    ctx.openContract = { id: 'c', contractType: 'RISE', stake: 10, entrySpot: 100, openedAt: 0, durationUnit: 'ticks', durationValue: 5, ticksLeft: 5, settleAt: 0 } as OpenContract;
    const res = settleOpenContract(ctx, 110, true); // in the money -> 75% of potential payout
    expect(res.won).toBe(true);
    // resale = 10 * 1.95 * 0.75 = 14.625 -> profit +4.625
    expect(ctx.stats.balance).toBeCloseTo(1004.625, 2);
  });
});
