/**
 * Strategy interpreter — evaluates a serialized Blockly workspace.
 *
 * Design rules:
 *  - Allowlisted block registry: any block type not explicitly registered is a
 *    validation error. Imported strategies can NEVER execute arbitrary JS.
 *  - Pure evaluation over the workspace JSON; the caller (bot worker) owns the
 *    tick loop, market feed and account state.
 *  - Financial maths goes through decimal-safe helpers.
 */
import Decimal from 'decimal.js';
import { ContractType, PAYOUTS, settleContract } from '../market/engine';
import { Candle, SymbolId, Timeframe, lastDigitOf } from '../market/types';
import { bollinger, ema, macd, rsi, sma, stochastic } from './indicators';
import type { BlockNode, CompiledStrategy, TradeDefinition, ValidationIssue, WorkspaceState } from './types';
import type { RunContext } from './runtimeTypes';

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function unwrapField(v: unknown): unknown {
  if (v && typeof v === 'object' && 'value' in (v as object)) return (v as { value: unknown }).value;
  return v;
}

function fieldStr(node: BlockNode, name: string, fallback = ''): string {
  const v = unwrapField(node.fields?.[name]);
  return v === undefined || v === null ? fallback : String(v);
}

function fieldNum(node: BlockNode, name: string, fallback = 0): number {
  const v = unwrapField(node.fields?.[name]);
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function fieldBool(node: BlockNode, name: string, fallback = false): boolean {
  const v = unwrapField(node.fields?.[name]);
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').toUpperCase();
  if (s === 'TRUE' || s === '1') return true;
  if (s === 'FALSE' || s === '0' || s === '') return fallback;
  return fallback;
}

function inputBlock(node: BlockNode, name: string): BlockNode | null {
  const inp = node.inputs?.[name];
  return inp?.block ?? inp?.shadow ?? null;
}

function nextBlock(node: BlockNode): BlockNode | null {
  return node.next?.block ?? null;
}

function stackOf(node: BlockNode, inputName: string): BlockNode[] {
  const out: BlockNode[] = [];
  let cur = inputBlock(node, inputName);
  while (cur) {
    out.push(cur);
    cur = nextBlock(cur);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Allowlisted registries
// ---------------------------------------------------------------------------

type ValueEval = (node: BlockNode, ctx: RunContext) => unknown;
type StmtExec = (node: BlockNode, ctx: RunContext) => void;

const MAX_LOOP_ITERATIONS = 100_000;
const MAX_CALL_DEPTH = 32;

export const ALLOWED_BLOCK_TYPES = new Set<string>();

const valueBlocks: Record<string, ValueEval> = {};
const stmtBlocks: Record<string, StmtExec> = {};

function value(type: string, fn: ValueEval): void {
  valueBlocks[type] = fn;
  ALLOWED_BLOCK_TYPES.add(type);
}
function stmt(type: string, fn: StmtExec): void {
  stmtBlocks[type] = fn;
  ALLOWED_BLOCK_TYPES.add(type);
}

// --- evaluation core ------------------------------------------------------

function evalValue(node: BlockNode | null, ctx: RunContext): unknown {
  if (!node) return null;
  const fn = valueBlocks[node.type];
  if (!fn) throw new Error(`Unsupported value block: ${node.type}`);
  ctx.depth++;
  try {
    return fn(node, ctx);
  } finally {
    ctx.depth--;
  }
}

function evalInput(node: BlockNode, name: string, ctx: RunContext, fallback: unknown = null): unknown {
  const child = inputBlock(node, name);
  return child ? evalValue(child, ctx) : fallback;
}

function num(v: unknown): number {
  if (v instanceof Decimal) return v.toNumber();
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function bool(v: unknown): boolean {
  return Boolean(v) && v !== 0 && v !== '0' && v !== 'false';
}

function evalCondition(node: BlockNode, inputName: string, ctx: RunContext, defaultWhenEmpty = true): boolean {
  const child = inputBlock(node, inputName);
  if (!child) return defaultWhenEmpty;
  return bool(evalValue(child, ctx));
}

function execStatement(node: BlockNode | null, ctx: RunContext): void {
  if (!node) return;
  const fn = stmtBlocks[node.type];
  if (!fn) throw new Error(`Unsupported statement block: ${node.type}`);
  ctx.depth++;
  try {
    fn(node, ctx);
  } finally {
    ctx.depth--;
  }
}

function execStack(blocks: BlockNode[], ctx: RunContext): void {
  for (const b of blocks) execStatement(b, ctx);
}

// ---------------------------------------------------------------------------
// Value blocks — numbers, logic, variables, text
// ---------------------------------------------------------------------------

value('math_number', (n) => fieldNum(n, 'NUM'));
value('math_arithmetic', (n, ctx) => {
  const op = fieldStr(n, 'OP', 'ADD');
  const a = num(evalInput(n, 'A', ctx, 0));
  const b = num(evalInput(n, 'B', ctx, 0));
  switch (op) {
    case 'ADD':
      return new Decimal(a).plus(b).toNumber();
    case 'MINUS':
      return new Decimal(a).minus(b).toNumber();
    case 'MULTIPLY':
      return new Decimal(a).times(b).toNumber();
    case 'DIVIDE':
      return b === 0 ? 0 : new Decimal(a).div(b).toNumber();
    case 'POWER':
      return Math.pow(a, b);
    default:
      return 0;
  }
});
value('math_single', (n, ctx) => {
  const op = fieldStr(n, 'OP', 'ROOT');
  const a = num(evalInput(n, 'NUM', ctx, 0));
  switch (op) {
    case 'ROOT':
      return Math.sqrt(a);
    case 'ABS':
      return Math.abs(a);
    case 'NEG':
      return -a;
    case 'LN':
      return Math.log(a);
    case 'LOG10':
      return Math.log10(a);
    case 'EXP':
      return Math.exp(a);
    case 'POW10':
      return Math.pow(10, a);
    default:
      return 0;
  }
});
value('math_round', (n, ctx) => {
  const op = fieldStr(n, 'OP', 'ROUND');
  const a = num(evalInput(n, 'NUM', ctx, 0));
  return op === 'ROUNDUP' ? Math.ceil(a) : op === 'ROUNDDOWN' ? Math.floor(a) : Math.round(a);
});
value('math_modulo', (n, ctx) => {
  const a = num(evalInput(n, 'DIVIDEND', ctx, 0));
  const b = num(evalInput(n, 'DIVISOR', ctx, 1));
  return b === 0 ? 0 : a % b;
});
value('math_maxmin', (n, ctx) => {
  const a = num(evalInput(n, 'A', ctx, 0));
  const b = num(evalInput(n, 'B', ctx, 0));
  return fieldStr(n, 'OP', 'MAX') === 'MIN' ? Math.min(a, b) : Math.max(a, b);
});
value('math_random_int', (n, ctx) => {
  const from = num(evalInput(n, 'FROM', ctx, 0));
  const to = num(evalInput(n, 'TO', ctx, 100));
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  return Math.floor(lo + ctx.rng() * (hi - lo + 1));
});
value('math_constant', (n) => {
  const k = fieldStr(n, 'CONSTANT', 'PI');
  const map: Record<string, number> = {
    PI: Math.PI,
    E: Math.E,
    GOLDEN_RATIO: (1 + Math.sqrt(5)) / 2,
    SQRT2: Math.SQRT2,
    SQRT1_2: Math.SQRT1_2,
    INFINITY: Infinity,
  };
  return map[k] ?? 0;
});
value('math_number_property', (n, ctx) => {
  const prop = fieldStr(n, 'PROPERTY', 'EVEN');
  const numVal = num(evalInput(n, 'NUMBER_TO_CHECK', ctx, 0));
  switch (prop) {
    case 'EVEN':
      return numVal % 2 === 0;
    case 'ODD':
      return numVal % 2 === 1;
    case 'POSITIVE':
      return numVal > 0;
    case 'NEGATIVE':
      return numVal < 0;
    case 'DIVISIBLE_BY':
      return num(evalInput(n, 'DIVISOR', ctx, 1)) !== 0 && numVal % num(evalInput(n, 'DIVISOR', ctx, 1)) === 0;
    default:
      return false;
  }
});

value('logic_boolean', (n) => fieldStr(n, 'BOOL', 'FALSE') === 'TRUE');
value('logic_compare', (n, ctx) => {
  const op = fieldStr(n, 'OP', 'EQ');
  const a = evalInput(n, 'A', ctx);
  const b = evalInput(n, 'B', ctx);
  const an = Number(a);
  const bn = Number(b);
  const numeric = Number.isFinite(an) && Number.isFinite(bn);
  switch (op) {
    case 'EQ':
      return numeric ? an === bn : String(a) === String(b);
    case 'NEQ':
      return numeric ? an !== bn : String(a) !== String(b);
    case 'LT':
      return numeric ? an < bn : String(a) < String(b);
    case 'LTE':
      return numeric ? an <= bn : String(a) <= String(b);
    case 'GT':
      return numeric ? an > bn : String(a) > String(b);
    case 'GTE':
      return numeric ? an >= bn : String(a) >= String(b);
    default:
      return false;
  }
});
value('logic_operation', (n, ctx) => {
  const op = fieldStr(n, 'OP', 'AND');
  const a = bool(evalInput(n, 'A', ctx, false));
  const b = bool(evalInput(n, 'B', ctx, false));
  return op === 'AND' ? a && b : a || b;
});
value('logic_negate', (n, ctx) => !bool(evalInput(n, 'BOOL', ctx, true)));
value('logic_null', () => null);
value('logic_ternary', (n, ctx) =>
  bool(evalInput(n, 'IF', ctx, false)) ? evalInput(n, 'THEN', ctx) : evalInput(n, 'ELSE', ctx),
);

value('text', (n) => fieldStr(n, 'TEXT'));
value('text_length', (n, ctx) => String(evalInput(n, 'VALUE', ctx, '') ?? '').length);
value('text_join', (n, ctx) => {
  let out = '';
  const inputs = n.inputs ?? {};
  for (const key of Object.keys(inputs)) {
    if (key.startsWith('ADD') || key.startsWith('ITEM')) out += String(evalValue(inputBlock(n, key), ctx) ?? '');
  }
  return out;
});

function resolveVarName(ctx: RunContext, idOrName: string): string {
  return ctx.varNames.get(idOrName) ?? idOrName;
}

value('variables_get', (n, ctx) => {
  const id = fieldStr(n, 'VAR');
  const name = resolveVarName(ctx, id);
  return ctx.variables.has(name) ? ctx.variables.get(name) : 0;
});
stmt('variables_set', (n, ctx) => {
  const id = fieldStr(n, 'VAR');
  const name = resolveVarName(ctx, id);
  ctx.variables.set(name, evalInput(n, 'VALUE', ctx, 0));
});
// text_append maps to variables_set with VALUE input in blockly
stmt('text_append', (n, ctx) => {
  const id = fieldStr(n, 'VAR');
  const name = resolveVarName(ctx, id);
  const prev = String(ctx.variables.get(name) ?? '');
  ctx.variables.set(name, prev + String(evalInput(n, 'TEXT', ctx, '') ?? ''));
});

// --- lists (limited) ------------------------------------------------------

value('lists_create_with', (n, ctx) => {
  const out: unknown[] = [];
  const inputs = n.inputs ?? {};
  for (const key of Object.keys(inputs)) {
    if (key.startsWith('ADD') || key.startsWith('ITEM')) out.push(evalValue(inputBlock(n, key), ctx));
  }
  return out;
});
value('lists_length', (n, ctx) => {
  const v = evalInput(n, 'VALUE', ctx, []);
  return Array.isArray(v) ? v.length : String(v ?? '').length;
});
value('lists_getIndex', (n, ctx) => {
  const list = evalInput(n, 'VALUE', ctx, []);
  const arr = Array.isArray(list) ? list : Array.from(String(list ?? ''));
  if (arr.length === 0) return null;
  const mode = fieldStr(n, 'MODE', 'GET');
  const where = fieldStr(n, 'WHERE', 'FROM_START');
  if (mode === 'REMOVE') throw new Error('lists_getIndex REMOVE is not supported');
  let idx: number;
  switch (where) {
    case 'FIRST':
      idx = 0;
      break;
    case 'LAST':
      idx = arr.length - 1;
      break;
    case 'RANDOM':
      idx = Math.floor(ctx.rng() * arr.length);
      break;
    case 'FROM_END':
      idx = arr.length - 1 - num(evalInput(n, 'AT', ctx, 1));
      break;
    default:
      idx = num(evalInput(n, 'AT', ctx, 1)) - 1;
  }
  if (idx < 0 || idx >= arr.length) return null;
  return arr[idx];
});

// ---------------------------------------------------------------------------
// Control flow
// ---------------------------------------------------------------------------

stmt('controls_if', (n, ctx) => {
  let i = 0;
  while (true) {
    const ifKey = i === 0 ? 'IF' : `IF${i}`;
    const doKey = i === 0 ? 'DO' : `DO${i}`;
    const cond = inputBlock(n, ifKey);
    if (!cond) break;
    if (bool(evalValue(cond, ctx))) {
      execStack(stackOf(n, doKey), ctx);
      return;
    }
    i++;
    if (i > 50) break;
  }
  const elseStack = inputBlock(n, 'ELSE');
  if (elseStack) execStack(stackOf(n, 'ELSE'), ctx);
});
stmt('controls_repeat_ext', (n, ctx) => {
  const times = Math.min(Math.floor(num(evalInput(n, 'TIMES', ctx, 0))), MAX_LOOP_ITERATIONS);
  const body = stackOf(n, 'DO');
  for (let i = 0; i < times; i++) {
    ctx.loopVars.push(i);
    try {
      execStack(body, ctx);
    } finally {
      ctx.loopVars.pop();
    }
  }
});
stmt('controls_forEach', (n, ctx) => {
  const list = evalInput(n, 'LIST', ctx, []);
  const arr = Array.isArray(list) ? list : Array.from(String(list ?? ''));
  const varName = resolveVarName(ctx, fieldStr(n, 'VAR'));
  const body = stackOf(n, 'DO');
  for (const item of arr.slice(0, MAX_LOOP_ITERATIONS)) {
    ctx.variables.set(varName, item);
    execStack(body, ctx);
  }
});
stmt('controls_whileUntil', (n, ctx) => {
  const mode = fieldStr(n, 'MODE', 'WHILE');
  const body = stackOf(n, 'DO');
  let guard = 0;
  for (;;) {
    const cond = bool(evalInput(n, 'BOOL', ctx, false));
    if (mode === 'WHILE' ? !cond : cond) break;
    if (++guard > MAX_LOOP_ITERATIONS) throw new Error('Loop iteration limit exceeded (possible infinite loop)');
    execStack(body, ctx);
  }
});
stmt('controls_for', (n, ctx) => {
  const from = num(evalInput(n, 'FROM', ctx, 0));
  const to = num(evalInput(n, 'TO', ctx, 10));
  const by = num(evalInput(n, 'BY', ctx, 1)) || 1;
  const varName = resolveVarName(ctx, fieldStr(n, 'VAR'));
  const body = stackOf(n, 'DO');
  const ascending = by > 0;
  let i = 0;
  for (let v = from; ascending ? v <= to : v >= to; v += by) {
    if (++i > MAX_LOOP_ITERATIONS) throw new Error('Loop iteration limit exceeded');
    ctx.variables.set(varName, v);
    execStack(body, ctx);
  }
});
value('controls_forIndex', (n, ctx) => {
  const name = fieldStr(n, 'VAR');
  return Number(ctx.variables.get(resolveVarName(ctx, name)) ?? 0);
});

// --- procedures (no-argument functions) -----------------------------------

function procName(node: BlockNode): string {
  const extra = node.extraState as { name?: string } | undefined;
  return String(extra?.name ?? fieldStr(node, 'NAME') ?? fieldStr(node, 'PROCEDURE') ?? 'procedure');
}

stmt('procedures_defnoreturn', (n, ctx) => {
  ctx.procedures.set(procName(n), n);
});
stmt('procedures_defreturn', (n, ctx) => {
  ctx.procedures.set(procName(n), n);
});
value('procedures_callreturn', (n, ctx) => callProcedure(n, ctx));
stmt('procedures_callnoreturn', (n, ctx) => {
  callProcedure(n, ctx);
});

function callProcedure(node: BlockNode, ctx: RunContext): unknown {
  const name = procName(node);
  const def = ctx.procedures.get(name);
  if (!def) throw new Error(`Unknown procedure: ${name}`);
  if (ctx.callStack.length >= MAX_CALL_DEPTH) throw new Error('Procedure call depth exceeded');
  ctx.callStack.push(name);
  try {
    const isReturn = def.type === 'procedures_defreturn';
    execStack(stackOf(def, 'STACK'), ctx);
    return isReturn ? evalInput(def, 'RETURN', ctx, null) : null;
  } finally {
    ctx.callStack.pop();
  }
}

// ---------------------------------------------------------------------------
// Market analysis blocks
// ---------------------------------------------------------------------------

const SOURCE_FIELD = 'SOURCE';

function seriesFor(ctx: RunContext, source: string): number[] {
  const key = ({ open: 'o', high: 'h', low: 'l', close: 'c' } as const)[source as 'open' | 'high' | 'low' | 'close'] ?? 'c';
  const candles = ctx.market.closedCandles(ctx.tradeDef.candleInterval);
  return candles.map((c: Candle) => c[key]);
}

value('current_price', (_n, ctx) => ctx.market.lastPrice());
value('current_digit', (_n, ctx) => ctx.market.lastDigit());
value('candle_value', (n, ctx) => {
  const source = fieldStr(n, SOURCE_FIELD, 'close').toLowerCase();
  const key = ({ open: 'o', high: 'h', low: 'l', close: 'c' } as const)[source as 'open' | 'high' | 'low' | 'close'] ?? 'c';
  const offset = Math.max(1, Math.floor(num(evalInput(n, 'OFFSET', ctx, 1))));
  const candles = ctx.market.closedCandles(ctx.tradeDef.candleInterval);
  const c = candles[candles.length - offset];
  return c ? c[key] : null;
});
value('candle_count', (_n, ctx) => ctx.market.closedCandles(ctx.tradeDef.candleInterval).length);

value('indicator_sma', (n, ctx) => {
  const period = Math.max(1, Math.floor(num(evalInput(n, 'PERIOD', ctx, 10))));
  return sma(seriesFor(ctx, fieldStr(n, SOURCE_FIELD, 'close').toLowerCase()), period);
});
value('indicator_ema', (n, ctx) => {
  const period = Math.max(1, Math.floor(num(evalInput(n, 'PERIOD', ctx, 10))));
  return ema(seriesFor(ctx, fieldStr(n, SOURCE_FIELD, 'close').toLowerCase()), period);
});
value('indicator_bollinger', (n, ctx) => {
  const period = Math.max(2, Math.floor(num(evalInput(n, 'PERIOD', ctx, 20))));
  const band = fieldStr(n, 'BAND', 'upper').toLowerCase();
  const bb = bollinger(seriesFor(ctx, fieldStr(n, SOURCE_FIELD, 'close').toLowerCase()), period);
  return bb ? bb[band as 'upper' | 'middle' | 'lower'] : null;
});
value('indicator_rsi', (n, ctx) => {
  const period = Math.max(2, Math.floor(num(evalInput(n, 'PERIOD', ctx, 14))));
  return rsi(seriesFor(ctx, fieldStr(n, SOURCE_FIELD, 'close').toLowerCase()), period);
});
value('indicator_macd', (n, ctx) => {
  const fast = Math.max(2, Math.floor(num(evalInput(n, 'FAST', ctx, 12))));
  const slow = Math.max(3, Math.floor(num(evalInput(n, 'SLOW', ctx, 26))));
  const signal = Math.max(2, Math.floor(num(evalInput(n, 'SIGNAL', ctx, 9))));
  const comp = fieldStr(n, 'COMPONENT', 'macd').toLowerCase();
  const m = macd(seriesFor(ctx, 'close'), fast, slow, signal);
  return m ? (comp === 'signal' ? m.signal : comp === 'hist' ? m.hist : m.macd) : null;
});
value('indicator_stochastic', (n, ctx) => {
  const period = Math.max(2, Math.floor(num(evalInput(n, 'PERIOD', ctx, 14))));
  const comp = fieldStr(n, 'COMPONENT', 'k').toLowerCase();
  const candles = ctx.market.closedCandles(ctx.tradeDef.candleInterval);
  const s = stochastic(
    candles.map((c) => c.h),
    candles.map((c) => c.l),
    candles.map((c) => c.c),
    period,
  );
  return s ? (comp === 'd' ? s.d : s.k) : null;
});

// --- trade / tool state blocks --------------------------------------------

value('tools_total_profit', (_n, ctx) => ctx.stats.totalProfit);
value('tools_last_profit', (_n, ctx) => ctx.stats.lastProfit);
value('tools_balance', (_n, ctx) => ctx.stats.balance);
value('tools_run_count', (_n, ctx) => ctx.stats.trades);
value('tools_consecutive_losses', (_n, ctx) => ctx.stats.consecutiveLosses);
value('tools_is_last_win', (_n, ctx) => ctx.stats.lastWin === true);
value('tools_is_last_loss', (_n, ctx) => ctx.stats.lastWin === false);
value('tools_contract_is_running', (_n, ctx) => ctx.openContract !== null);
value('tools_contract_entry_price', (_n, ctx) => (ctx.openContract ? ctx.openContract.entrySpot : null));
value('tools_stake', (_n, ctx) => ctx.tradeDef.amount);
value('market_price', (_n, ctx) => ctx.market.lastPrice());

// ---------------------------------------------------------------------------
// Statement blocks — trading, notify, debug
// ---------------------------------------------------------------------------

const CONTRACT_TYPES = new Set(Object.keys(PAYOUTS));

function parseContract(raw: string): ContractType {
  const c = raw.toUpperCase().replace(/[^A-Z]/g, '');
  if (!CONTRACT_TYPES.has(c)) throw new Error(`Unknown contract type: ${raw}`);
  return c as ContractType;
}

stmt('purchase', (n, ctx) => {
  if (ctx.openContract) return;
  if (!evalCondition(n, 'WHEN', ctx, true)) return;
  const contractType = parseContract(fieldStr(n, 'CONTRACT', 'RISE'));
  const stake = new Decimal(num(evalInput(n, 'STAKE', ctx, ctx.tradeDef.amount)));
  if (stake.lte(0)) throw new Error('Purchase stake must be positive');
  if (stake.gt(ctx.stats.balance)) throw new Error('Insufficient virtual balance for stake');
  const predict = inputBlock(n, 'PREDICT') ? num(evalInput(n, 'PREDICT', ctx, 0)) : undefined;
  ctx.purchase(contractType, stake.toNumber(), predict);
});

stmt('sell_at_market', (n, ctx) => {
  if (!ctx.openContract) return;
  if (evalCondition(n, 'WHEN', ctx, true)) ctx.sellAtMarket('Sell at market');
});

stmt('sell_at_price', (n, ctx) => {
  if (!ctx.openContract) return;
  const target = num(evalInput(n, 'PRICE', ctx, 0));
  const dir = fieldStr(n, 'DIR', 'GTE');
  const hit = dir === 'LTE' ? ctx.market.lastPrice() <= target : ctx.market.lastPrice() >= target;
  if (hit && evalCondition(n, 'WHEN', ctx, true)) ctx.sellAtMarket(`Sell at price ${target}`);
});

stmt('trade_again', (n, ctx) => {
  // semantic marker: the restart evaluator inspects these blocks directly
  void n;
  void ctx;
});

stmt('stop_trading', (n, ctx) => {
  void n;
  void ctx;
});

stmt('notify_alert', (n, ctx) => {
  const msg = String(evalInput(n, 'MESSAGE', ctx, '') ?? '');
  ctx.log('warn', `Alert: ${msg}`);
});
stmt('notify_sound', (n, ctx) => {
  const sound = fieldStr(n, 'SOUND', 'ping');
  ctx.playSound(sound);
  ctx.log('info', `Sound notification: ${sound}`);
});
stmt('debug_log', (n, ctx) => {
  const msg = String(evalInput(n, 'MESSAGE', ctx, '') ?? '');
  ctx.log('debug', msg);
});
stmt('debug_console', (n, ctx) => {
  const msg = String(evalInput(n, 'MESSAGE', ctx, '') ?? '');
  ctx.log('debug', `[console] ${msg}`);
});

// ---------------------------------------------------------------------------
// Compilation
// ---------------------------------------------------------------------------

function findHats(blocks: BlockNode[]): {
  tradeDef?: BlockNode;
  runOnce?: BlockNode;
  purchases?: BlockNode;
  sells?: BlockNode;
  restarts?: BlockNode;
} {
  const out: ReturnType<typeof findHats> = {};
  for (const b of blocks) {
    switch (b.type) {
      case 'trade_definition':
        out.tradeDef = b;
        break;
      case 'run_once_at_start':
        out.runOnce = b;
        break;
      case 'purchase_conditions':
        out.purchases = b;
        break;
      case 'sell_conditions':
        out.sells = b;
        break;
      case 'restart_trading_conditions':
        out.restarts = b;
        break;
    }
  }
  return out;
}

function walkBlocks(node: BlockNode | null, visit: (n: BlockNode) => void): void {
  let cur = node;
  while (cur) {
    visit(cur);
    if (cur.inputs) {
      for (const inp of Object.values(cur.inputs)) {
        walkBlocks(inp.block ?? null, visit);
      }
    }
    cur = cur.next?.block ?? null;
  }
}

export function collectWorkspaceBlocks(state: WorkspaceState): BlockNode[] {
  const top = state.blocks?.blocks ?? [];
  const all: BlockNode[] = [];
  for (const b of top) walkBlocks(b, (n) => all.push(n));
  return all;
}

const SYMBOL_IDS = new Set(['R_10', 'R_25', 'R_50', 'R_75', 'R_100']);
const CANDLE_TFS = new Set(['1m', '5m', '15m', '1h']);

export function compileStrategy(state: WorkspaceState): CompiledStrategy {
  const issues: ValidationIssue[] = [];
  const top = state.blocks?.blocks ?? [];
  const hats = findHats(top);

  if (!hats.tradeDef) {
    issues.push({ severity: 'error', message: 'Strategy needs a "Trade parameters" block (trade definition).' });
  }

  // Allowlist check over every block in the workspace
  for (const b of collectWorkspaceBlocks(state)) {
    if (!valueBlocks[b.type] && !stmtBlocks[b.type] && b.type !== 'trade_definition' && b.type !== 'run_once_at_start' && b.type !== 'purchase_conditions' && b.type !== 'sell_conditions' && b.type !== 'restart_trading_conditions') {
      issues.push({ severity: 'error', message: `Unknown block type "${b.type}" — cannot execute.`, blockType: b.type });
    }
  }

  // --- trade definition fields
  const tdNode = hats.tradeDef;
  const market = tdNode ? (fieldStr(tdNode, 'MARKET', 'R_100') as SymbolId) : 'R_100';
  if (!SYMBOL_IDS.has(market)) {
    issues.push({ severity: 'error', message: `Unknown market "${market}".` });
  }
  const candleInterval = tdNode ? (fieldStr(tdNode, 'CANDLE_INTERVAL', '1m') as Timeframe) : '1m';
  if (!CANDLE_TFS.has(candleInterval)) {
    issues.push({ severity: 'error', message: `Unsupported candle interval "${candleInterval}".` });
  }
  const tradeTypeRaw = tdNode ? fieldStr(tdNode, 'TRADE_TYPE', 'UPDOWN') : 'UPDOWN';
  const tradeDef: TradeDefinition = {
    market,
    tradeType: tradeTypeRaw === 'DIGITS' ? 'DIGITS' : 'UPDOWN',
    candleInterval,
    durationUnit: tdNode && fieldStr(tdNode, 'DURATION_UNIT', 'ticks') === 'minutes' ? 'minutes' : 'ticks',
    durationValue: tdNode ? Math.max(1, Math.floor(fieldNum(tdNode, 'DURATION_VALUE', 5))) : 5,
    currency: tdNode ? fieldStr(tdNode, 'CURRENCY', 'USD') : 'USD',
    amount: tdNode ? Math.max(1, fieldNum(tdNode, 'AMOUNT', 10)) : 10,
    restartLastOnError: tdNode ? fieldBool(tdNode, 'RESTART_LAST_ON_ERROR', true) : true,
    restartBuySellOnError: tdNode ? fieldBool(tdNode, 'RESTART_BUYSELL_ON_ERROR', true) : true,
  };

  if (!hats.purchases) {
    issues.push({ severity: 'warning', message: 'No "Purchase conditions" section — the bot will never open trades.' });
  }

  const procedures = new Map<string, BlockNode>();
  for (const b of top) {
    if (b.type === 'procedures_defnoreturn' || b.type === 'procedures_defreturn') {
      procedures.set(procName(b), b);
    }
  }

  return {
    tradeDef,
    runOnce: hats.runOnce ? stackOf(hats.runOnce, 'DO') : [],
    purchases: hats.purchases ? stackOf(hats.purchases, 'DO') : [],
    sells: hats.sells ? stackOf(hats.sells, 'DO') : [],
    restarts: hats.restarts ? stackOf(hats.restarts, 'DO') : [],
    procedures,
    issues,
  };
}

// ---------------------------------------------------------------------------
// Runtime execution API (used by the bot worker / tests)
// ---------------------------------------------------------------------------

export function createRunContext(opts: {
  compiled: CompiledStrategy;
  varNames: Map<string, string>;
  market: RunContext['market'];
  rng: () => number;
  startingBalance: number;
  log: RunContext['log'];
  purchase: RunContext['purchase'];
  sellAtMarket: RunContext['sellAtMarket'];
  playSound: RunContext['playSound'];
  now: () => number;
}): RunContext {
  return {
    depth: 0,
    callStack: [],
    loopVars: [],
    variables: new Map(),
    varNames: opts.varNames,
    procedures: opts.compiled.procedures,
    tradeDef: opts.compiled.tradeDef,
    openContract: null,
    stats: {
      trades: 0,
      wins: 0,
      losses: 0,
      totalProfit: 0,
      lastProfit: 0,
      lastWin: null,
      consecutiveLosses: 0,
      balance: opts.startingBalance,
      startedAt: opts.now(),
      ticks: 0,
    },
    market: opts.market,
    rng: opts.rng,
    log: opts.log,
    purchase: opts.purchase,
    sellAtMarket: opts.sellAtMarket,
    playSound: opts.playSound,
    now: opts.now,
  };
}

/** Execute the "Run once at start" body and pre-declare procedure defs. */
export function runStart(compiled: CompiledStrategy, ctx: RunContext): void {
  for (const def of ctx.procedures.values()) {
    void def; // defs are already registered in ctx.procedures
  }
  execStack(compiled.runOnce, ctx);
}

export interface PurchaseDecision {
  contractType: ContractType;
  stake: number;
  predict?: number;
}

/** Evaluate purchase conditions; returns the first triggered purchase. */
export function evaluatePurchases(compiled: CompiledStrategy, ctx: RunContext): PurchaseDecision | null {
  for (const block of compiled.purchases) {
    if (block.type !== 'purchase') continue;
    try {
      if (!evalCondition(block, 'WHEN', ctx, true)) continue;
      const contractType = parseContract(fieldStr(block, 'CONTRACT', 'RISE'));
      const stake = new Decimal(num(evalInput(block, 'STAKE', ctx, ctx.tradeDef.amount)));
      if (stake.lte(0) || stake.gt(ctx.stats.balance)) continue;
      const predict = inputBlock(block, 'PREDICT') ? num(evalInput(block, 'PREDICT', ctx, 0)) : undefined;
      return { contractType, stake: stake.toNumber(), predict };
    } catch (e) {
      ctx.log('error', `Purchase condition error: ${(e as Error).message}`);
    }
  }
  return null;
}

/** Evaluate sell conditions; returns true when the open contract should be sold. */
export function evaluateSells(compiled: CompiledStrategy, ctx: RunContext): string | null {
  for (const block of compiled.sells) {
    if (block.type !== 'sell_at_market' && block.type !== 'sell_at_price') continue;
    try {
      if (block.type === 'sell_at_market') {
        if (evalCondition(block, 'WHEN', ctx, true)) return 'Sell at market';
      } else {
        const target = num(evalInput(block, 'PRICE', ctx, 0));
        const dir = fieldStr(block, 'DIR', 'GTE');
        const hit = dir === 'LTE' ? ctx.market.lastPrice() <= target : ctx.market.lastPrice() >= target;
        if (hit && evalCondition(block, 'WHEN', ctx, true)) return `Sell at price ${target}`;
      }
    } catch (e) {
      ctx.log('error', `Sell condition error: ${(e as Error).message}`);
    }
  }
  return null;
}

export type RestartDecision = { action: 'continue' } | { action: 'stop'; reason: string };

/** Evaluate restart trading conditions after a contract settles. */
export function evaluateRestart(compiled: CompiledStrategy, ctx: RunContext): RestartDecision {
  let hasTradeAgain = false;
  for (const block of compiled.restarts) {
    try {
      if (block.type === 'stop_trading') {
        if (evalCondition(block, 'WHEN', ctx, true)) {
          const msg = String(evalInput(block, 'MESSAGE', ctx, 'Stop condition met') ?? 'Stop condition met');
          return { action: 'stop', reason: msg };
        }
      } else if (block.type === 'trade_again') {
        hasTradeAgain = true;
        if (evalCondition(block, 'WHEN', ctx, true)) return { action: 'continue' };
      }
    } catch (e) {
      ctx.log('error', `Restart condition error: ${(e as Error).message}`);
    }
  }
  if (hasTradeAgain) return { action: 'stop', reason: 'Restart conditions not met' };
  return { action: 'continue' };
}

/** Execute any generic statements embedded in the restart section (e.g. martingale stake updates). */
export function executeRestartSideEffects(compiled: CompiledStrategy, ctx: RunContext): void {
  for (const block of compiled.restarts) {
    try {
      if (block.type === 'trade_again' || block.type === 'stop_trading') {
        // semantic markers: only their attached side-effect stacks run here
        execStack(stackOf(block, 'DO'), ctx);
      } else {
        execStatement(block, ctx);
      }
    } catch (e) {
      ctx.log('error', `Restart action error: ${(e as Error).message}`);
    }
  }
}

export function settleOpenContract(
  ctx: RunContext,
  exitSpot: number,
  soldEarly: boolean,
): { won: boolean; profit: number; payout: number } {
  const c = ctx.openContract;
  if (!c) throw new Error('No open contract');
  const digits = ctx.market.digits();
  let profit: number;
  let won: boolean;
  let payout: number;
  if (soldEarly) {
    // resale model: an in-the-money contract resells at 75% of its potential
    // payout (banks part of the profit); an out-of-the-money contract resells
    // at 25% of stake (recovers part of the loss).
    const itm = isCurrentlyInTheMoney(c, exitSpot, digits);
    const potential = c.stake * (PAYOUTS[c.contractType] ?? 1.95);
    const resale = itm ? potential * 0.75 : c.stake * 0.25;
    profit = resale - c.stake;
    won = resale >= c.stake;
    payout = resale / c.stake;
  } else {
    const res = settleContract({
      contractType: c.contractType,
      entrySpot: c.entrySpot,
      exitSpot,
      predict: c.predict,
      digits,
    });
    won = res.won;
    profit = res.won ? c.stake * (res.payout - 1) : -c.stake;
    payout = res.payout;
  }
  ctx.stats.balance = new Decimal(ctx.stats.balance).plus(profit).toNumber();
  ctx.stats.trades += 1;
  if (won) {
    ctx.stats.wins += 1;
    ctx.stats.consecutiveLosses = 0;
  } else {
    ctx.stats.losses += 1;
    ctx.stats.consecutiveLosses += 1;
  }
  ctx.stats.totalProfit = new Decimal(ctx.stats.totalProfit).plus(profit).toNumber();
  ctx.stats.lastProfit = profit;
  ctx.stats.lastWin = won;
  return { won, profit, payout };
}

function isCurrentlyInTheMoney(c: RunContext['openContract'], spot: number, digits: number): boolean {
  if (!c) return false;
  switch (c.contractType) {
    case 'RISE':
      return spot > c.entrySpot;
    case 'FALL':
      return spot < c.entrySpot;
    case 'EVEN':
      return lastDigitOf(spot, digits) % 2 === 0;
    case 'ODD':
      return lastDigitOf(spot, digits) % 2 === 1;
    case 'OVER':
      return lastDigitOf(spot, digits) > (c.predict ?? 5);
    case 'UNDER':
      return lastDigitOf(spot, digits) < (c.predict ?? 4);
    case 'MATCHES':
      return lastDigitOf(spot, digits) === (c.predict ?? 0);
    case 'DIFFERS':
      return lastDigitOf(spot, digits) !== (c.predict ?? 0);
    default:
      return false;
  }
}

export { lastDigitOf };
