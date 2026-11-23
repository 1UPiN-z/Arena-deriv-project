/**
 * Quick-strategy templates — generate real Blockly workspace JSON that the
 * interpreter executes. Mirrors the classic Deriv Bot quick strategies.
 */
import type { BlockNode, WorkspaceState } from './types';

interface TplParams {
  market: string;
  amount: number;
  durationValue: number;
  durationUnit: 'ticks' | 'minutes';
  candleInterval: string;
  currency: string;
  tradeType?: 'UPDOWN' | 'DIGITS';
}

let seq = 0;
function bid(): string {
  seq = (seq + 1) % 100000;
  return `tpl_${Date.now().toString(36)}_${seq}`;
}

function numBlock(n: number): BlockNode {
  return { id: bid(), type: 'math_number', fields: { NUM: n } };
}

function boolBlock(b: boolean): BlockNode {
  return { id: bid(), type: 'logic_boolean', fields: { BOOL: b ? 'TRUE' : 'FALSE' } };
}

function varBlock(name: string): BlockNode {
  return { id: bid(), type: 'variables_get', fields: { VAR: name } };
}

function setVar(name: string, value: BlockNode): BlockNode {
  return { id: bid(), type: 'variables_set', fields: { VAR: name }, inputs: { VALUE: { block: value } } };
}

function tradeDefBlock(p: TplParams): BlockNode {
  return {
    id: bid(),
    type: 'trade_definition',
    fields: {
      MARKET: p.market,
      TRADE_TYPE: p.tradeType ?? 'UPDOWN',
      CANDLE_INTERVAL: p.candleInterval,
      DURATION_UNIT: p.durationUnit,
      DURATION_VALUE: p.durationValue,
      CURRENCY: p.currency,
      AMOUNT: p.amount,
      RESTART_LAST_ON_ERROR: 'TRUE',
      RESTART_BUYSELL_ON_ERROR: 'TRUE',
    },
  };
}

function runOnceBlock(body: BlockNode | null): BlockNode {
  const node: BlockNode = { id: bid(), type: 'run_once_at_start' };
  if (body) node.inputs = { DO: { block: body } };
  return node;
}

function purchaseBlock(contract: 'RISE' | 'FALL' | 'EVEN' | 'ODD', stakeBlock?: BlockNode, whenBlock?: BlockNode): BlockNode {
  const node: BlockNode = {
    id: bid(),
    type: 'purchase',
    fields: { CONTRACT: contract },
    inputs: {},
  };
  if (stakeBlock) node.inputs!.STAKE = { block: stakeBlock };
  if (whenBlock) node.inputs!.WHEN = { block: whenBlock };
  return node;
}

function purchasesHat(...purchases: BlockNode[]): BlockNode {
  const hat: BlockNode = { id: bid(), type: 'purchase_conditions' };
  if (purchases.length) {
    let cur = purchases[0];
    hat.inputs = { DO: { block: cur } };
    for (let i = 1; i < purchases.length; i++) {
      cur.next = { block: purchases[i] };
      cur = purchases[i];
    }
  }
  return hat;
}

function restartHat(...blocks: BlockNode[]): BlockNode {
  const hat: BlockNode = { id: bid(), type: 'restart_trading_conditions' };
  if (blocks.length) {
    let cur = blocks[0];
    hat.inputs = { DO: { block: cur } };
    for (let i = 1; i < blocks.length; i++) {
      cur.next = { block: blocks[i] };
      cur = blocks[i];
    }
  }
  return hat;
}

function tradeAgain(when?: BlockNode, doBody?: BlockNode): BlockNode {
  const node: BlockNode = { id: bid(), type: 'trade_again', inputs: {} };
  if (when) node.inputs!.WHEN = { block: when };
  if (doBody) node.inputs!.DO = { block: doBody };
  return node;
}

function stopTrading(when: BlockNode, message: string): BlockNode {
  return {
    id: bid(),
    type: 'stop_trading',
    inputs: {
      WHEN: { block: when },
      MESSAGE: { shadow: { id: bid(), type: 'text', fields: { TEXT: message } } },
    },
  };
}

function compare(op: string, a: BlockNode, b: BlockNode): BlockNode {
  return { id: bid(), type: 'logic_compare', fields: { OP: op }, inputs: { A: { block: a }, B: { block: b } } };
}

function arithmetic(op: string, a: BlockNode, b: BlockNode): BlockNode {
  return { id: bid(), type: 'math_arithmetic', fields: { OP: op }, inputs: { A: { block: a }, B: { block: b } } };
}

function maxmin(op: 'MAX' | 'MIN', a: BlockNode, b: BlockNode): BlockNode {
  return { id: bid(), type: 'math_maxmin', fields: { OP: op }, inputs: { A: { block: a }, B: { block: b } } };
}

function ifBlock(cond: BlockNode, thenBody: BlockNode, elseBody?: BlockNode): BlockNode {
  const node: BlockNode = {
    id: bid(),
    type: 'controls_if',
    extraState: { elseIfCount: 0, hasElse: Boolean(elseBody) },
    inputs: {
      IF: { block: cond },
      DO: { block: thenBody },
    },
  };
  if (elseBody) node.inputs!.ELSE = { block: elseBody };
  return node;
}

function logic(op: string, a: BlockNode, b: BlockNode): BlockNode {
  return { id: bid(), type: 'logic_operation', fields: { OP: op }, inputs: { A: { block: a }, B: { block: b } } };
}

function toolsProfit(): BlockNode {
  return { id: bid(), type: 'tools_total_profit' };
}
function toolsLastProfit(): BlockNode {
  return { id: bid(), type: 'tools_last_profit' };
}
function toolsIsLastWin(): BlockNode {
  return { id: bid(), type: 'tools_is_last_win' };
}
function notify(msg: string): BlockNode {
  return {
    id: bid(),
    type: 'notify_alert',
    inputs: { MESSAGE: { shadow: { id: bid(), type: 'text', fields: { TEXT: msg } } } },
  };
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface QuickStrategy {
  id: string;
  name: string;
  tagline: string;
  description: string;
  variables: { name: string; label: string; value: number }[];
  build(params: Record<string, number>): WorkspaceState;
}

function workspace(variables: { name: string }[], blocks: BlockNode[]): WorkspaceState {
  return {
    blocks: { languageVersion: 0, blocks },
    variables: variables.map((v) => ({ id: v.name, name: v.name })),
  };
}

const baseParams: TplParams = {
  market: 'R_100',
  amount: 10,
  durationValue: 5,
  durationUnit: 'ticks',
  candleInterval: '1m',
  currency: 'USD',
};

export const QUICK_STRATEGIES: QuickStrategy[] = [
  {
    id: 'martingale',
    name: 'Martingale',
    tagline: 'Double the stake after each loss',
    description:
      'Classic recovery strategy: after a losing trade the stake doubles so a win recovers previous losses plus the base profit. Resets to the base stake after a win.',
    variables: [
      { name: 'stake', label: 'Initial stake', value: 10 },
      { name: 'profit_threshold', label: 'Take profit', value: 50 },
      { name: 'loss_threshold', label: 'Stop loss', value: -100 },
    ],
    build(params) {
      const p = { ...baseParams, amount: params.stake };
      return workspace(
        [{ name: 'stake' }],
        [
          tradeDefBlock(p),
          runOnceBlock(setVar('stake', numBlock(params.stake))),
          purchasesHat(purchaseBlock('RISE', varBlock('stake'))),
          restartHat(
            // after loss: stake *= 2  |  after win: stake = initial
            ifBlock(
              { id: bid(), type: 'logic_negate', inputs: { BOOL: { block: toolsIsLastWin() } } },
              setVar('stake', arithmetic('MULTIPLY', varBlock('stake'), numBlock(2))),
              setVar('stake', numBlock(params.stake)),
            ),
            stopTrading(compare('GTE', toolsProfit(), numBlock(params.profit_threshold)), `Take profit reached: +${params.profit_threshold}`),
            stopTrading(compare('LTE', toolsProfit(), numBlock(params.loss_threshold)), `Stop loss reached: ${params.loss_threshold}`),
            tradeAgain(),
            notify('Martingale cycle complete'),
          ),
        ],
      );
    },
  },
  {
    id: 'dalembert',
    name: "D'Alembert",
    tagline: 'Raise stake by one unit after a loss',
    description:
      'A gentler progression: increase the stake by one unit after a loss and decrease it after a win, keeping risk smoother than Martingale.',
    variables: [
      { name: 'stake', label: 'Initial stake', value: 10 },
      { name: 'unit', label: 'Unit size', value: 5 },
      { name: 'profit_threshold', label: 'Take profit', value: 40 },
    ],
    build(params) {
      const p = { ...baseParams, amount: params.stake };
      return workspace(
        [{ name: 'stake' }],
        [
          tradeDefBlock(p),
          runOnceBlock(setVar('stake', numBlock(params.stake))),
          purchasesHat(purchaseBlock('FALL', varBlock('stake'))),
          restartHat(
            ifBlock(
              toolsIsLastWin(),
              // win: stake = max(unit, stake - unit)
              setVar('stake', maxmin('MAX', arithmetic('MINUS', varBlock('stake'), numBlock(params.unit)), numBlock(params.unit))),
              // loss: stake += unit
              setVar('stake', arithmetic('ADD', varBlock('stake'), numBlock(params.unit))),
            ),
            stopTrading(compare('GTE', toolsProfit(), numBlock(params.profit_threshold)), `Take profit reached: +${params.profit_threshold}`),
            tradeAgain(),
          ),
        ],
      );
    },
  },
  {
    id: 'oscars-grind',
    name: "Oscar's Grind",
    tagline: 'Increase after a win, hold after a loss',
    description:
      'A low-risk positive progression: after each winning trade the stake grows by one unit; losses keep the stake flat. Stops at a profit target.',
    variables: [
      { name: 'stake', label: 'Initial stake', value: 10 },
      { name: 'unit', label: 'Unit size', value: 5 },
      { name: 'profit_threshold', label: 'Take profit', value: 30 },
    ],
    build(params) {
      const p = { ...baseParams, amount: params.stake };
      return workspace(
        [{ name: 'stake' }],
        [
          tradeDefBlock(p),
          runOnceBlock(setVar('stake', numBlock(params.stake))),
          purchasesHat(purchaseBlock('RISE', varBlock('stake'))),
          restartHat(
            ifBlock(toolsIsLastWin(), setVar('stake', arithmetic('ADD', varBlock('stake'), numBlock(params.unit)))),
            stopTrading(compare('GTE', toolsProfit(), numBlock(params.profit_threshold)), `Take profit reached: +${params.profit_threshold}`),
            tradeAgain(),
          ),
        ],
      );
    },
  },
  {
    id: 'digit-parity',
    name: 'Digit Parity',
    tagline: 'Even/Odd analysis on Volatility indices',
    description:
      'Buys an Even contract whenever the last closed candle closed above its open (momentum) and manages risk with take-profit and stop-loss limits.',
    variables: [
      { name: 'stake', label: 'Initial stake', value: 5 },
      { name: 'profit_threshold', label: 'Take profit', value: 25 },
      { name: 'loss_threshold', label: 'Stop loss', value: -50 },
    ],
    build(params) {
      const p: TplParams = { ...baseParams, amount: params.stake, tradeType: 'DIGITS', durationValue: 1 };
      return workspace(
        [{ name: 'stake' }],
        [
          tradeDefBlock(p),
          purchasesHat(
            purchaseBlock(
              'EVEN',
              varBlock('stake'),
              compare(
                'GT',
                { id: bid(), type: 'candle_value', fields: { SOURCE: 'close' }, inputs: { OFFSET: { shadow: numBlock(1) } } },
                { id: bid(), type: 'candle_value', fields: { SOURCE: 'open' }, inputs: { OFFSET: { shadow: numBlock(1) } } },
              ),
            ),
          ),
          restartHat(
            stopTrading(compare('GTE', toolsProfit(), numBlock(params.profit_threshold)), `Take profit reached: +${params.profit_threshold}`),
            stopTrading(compare('LTE', toolsProfit(), numBlock(params.loss_threshold)), `Stop loss reached: ${params.loss_threshold}`),
            tradeAgain(),
          ),
        ],
      );
    },
  },
  {
    id: 'sma-crossover',
    name: 'SMA Momentum',
    tagline: 'Rise when price crosses above the SMA',
    description:
      'A simple technical strategy: buy a Rise contract when the previous candle closes above the SMA(10), with fixed stake and loss protection.',
    variables: [
      { name: 'stake', label: 'Initial stake', value: 10 },
      { name: 'sma_period', label: 'SMA period', value: 10 },
      { name: 'loss_threshold', label: 'Stop loss', value: -100 },
    ],
    build(params) {
      const p = { ...baseParams, amount: params.stake };
      return workspace(
        [{ name: 'stake' }],
        [
          tradeDefBlock(p),
          purchasesHat(
            purchaseBlock(
              'RISE',
              varBlock('stake'),
              compare(
                'GT',
                { id: bid(), type: 'current_price' },
                {
                  id: bid(),
                  type: 'indicator_sma',
                  fields: { SOURCE: 'close' },
                  inputs: { PERIOD: { shadow: numBlock(params.sma_period) } },
                },
              ),
            ),
          ),
          restartHat(
            stopTrading(compare('LTE', toolsProfit(), numBlock(params.loss_threshold)), `Stop loss reached: ${params.loss_threshold}`),
            tradeAgain(),
          ),
        ],
      );
    },
  },
  {
    id: 'manual',
    name: 'Basic template',
    tagline: 'Trade parameters + one purchase',
    description: 'The minimal runnable strategy: trade parameters, a Rise purchase, and an always-on restart condition. Customise it in the builder.',
    variables: [{ name: 'stake', label: 'Initial stake', value: 10 }],
    build(params) {
      return workspace(
        [{ name: 'stake' }],
        [
          tradeDefBlock({ ...baseParams, amount: params.stake }),
          purchasesHat(purchaseBlock('RISE', varBlock('stake'), boolBlock(true))),
          restartHat(tradeAgain()),
          runOnceBlock(setVar('stake', numBlock(params.stake))),
        ],
      );
    },
  },
];

/** A ready-to-run default strategy used for brand-new workspaces. */
export function defaultWorkspace(): WorkspaceState {
  return QUICK_STRATEGIES.find((s) => s.id === 'manual')!.build({ stake: 10 });
}
