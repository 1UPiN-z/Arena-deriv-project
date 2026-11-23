/** Toolbox definition for the Deriv Bot–style workspace. */

function numShadow(value: number) {
  return { type: 'math_number', fields: { NUM: value } };
}
function textShadow(value: string) {
  return { type: 'text', fields: { TEXT: value } };
}
function boolShadow(value: boolean) {
  return { type: 'logic_boolean', fields: { BOOL: value ? 'TRUE' : 'FALSE' } };
}

function withShadows(type: string, inputs: Record<string, unknown>) {
  const shadowInputs: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(inputs)) shadowInputs[k] = { shadow: v };
  return { kind: 'block', type, inputs: shadowInputs };
}

export const TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Trade parameters',
      colour: '#CC2E39',
      categorystyle: 'trade_category',
      contents: [
        { kind: 'block', type: 'trade_definition' },
        { kind: 'block', type: 'run_once_at_start' },
      ],
    },
    {
      kind: 'category',
      name: 'Purchase conditions',
      colour: '#22A45D',
      categorystyle: 'purchase_category',
      contents: [
        withShadows('purchase', { WHEN: boolShadow(true), STAKE: numShadow(10), PREDICT: numShadow(5) }),
      ],
    },
    {
      kind: 'category',
      name: 'Sell conditions (optional)',
      colour: '#2C9C8F',
      categorystyle: 'sell_category',
      contents: [
        withShadows('sell_at_market', { WHEN: boolShadow(true) }),
        withShadows('sell_at_price', { PRICE: numShadow(100), WHEN: boolShadow(true) }),
      ],
    },
    {
      kind: 'category',
      name: 'Restart trading conditions',
      colour: '#785E93',
      categorystyle: 'restart_category',
      contents: [
        withShadows('trade_again', { WHEN: boolShadow(true) }),
        withShadows('stop_trading', { WHEN: boolShadow(true), MESSAGE: textShadow('Stop condition met') }),
      ],
    },
    {
      kind: 'category',
      name: 'Analysis',
      colour: '#4A76A8',
      categorystyle: 'analysis_category',
      contents: [
        { kind: 'label', text: 'Candle' },
        withShadows('candle_value', { OFFSET: numShadow(1) }),
        { kind: 'block', type: 'candle_count' },
        { kind: 'block', type: 'current_price' },
        { kind: 'block', type: 'current_digit' },
        { kind: 'label', text: 'Indicators' },
        withShadows('indicator_sma', { PERIOD: numShadow(10) }),
        withShadows('indicator_ema', { PERIOD: numShadow(10) }),
        withShadows('indicator_bollinger', { PERIOD: numShadow(20) }),
        withShadows('indicator_rsi', { PERIOD: numShadow(14) }),
        withShadows('indicator_macd', { FAST: numShadow(12), SLOW: numShadow(26), SIGNAL: numShadow(9) }),
        withShadows('indicator_stochastic', { PERIOD: numShadow(14) }),
      ],
    },
    {
      kind: 'category',
      name: 'Utility',
      colour: '#64748B',
      categorystyle: 'utility_category',
      contents: [
        { kind: 'label', text: 'Notifications' },
        withShadows('notify_alert', { MESSAGE: textShadow('Hello from my bot') }),
        { kind: 'block', type: 'notify_sound' },
        { kind: 'label', text: 'Debug' },
        withShadows('debug_log', { MESSAGE: textShadow('debug message') }),
        withShadows('debug_console', { MESSAGE: textShadow('debug message') }),
        { kind: 'label', text: 'Tools' },
        { kind: 'block', type: 'tools_total_profit' },
        { kind: 'block', type: 'tools_last_profit' },
        { kind: 'block', type: 'tools_balance' },
        { kind: 'block', type: 'tools_run_count' },
        { kind: 'block', type: 'tools_consecutive_losses' },
        { kind: 'block', type: 'tools_is_last_win' },
        { kind: 'block', type: 'tools_is_last_loss' },
        { kind: 'block', type: 'tools_contract_is_running' },
        { kind: 'block', type: 'tools_contract_entry_price' },
        { kind: 'block', type: 'tools_stake' },
      ],
    },
    {
      kind: 'category',
      name: 'Logic',
      categorystyle: 'logic_category',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'controls_if', extraState: { elseIfCount: 1, hasElse: true } },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_negate' },
        { kind: 'block', type: 'logic_boolean' },
        { kind: 'block', type: 'logic_ternary' },
      ],
    },
    {
      kind: 'category',
      name: 'Loops',
      categorystyle: 'loop_category',
      contents: [
        withShadows('controls_repeat_ext', { TIMES: numShadow(10) }),
        withShadows('controls_whileUntil', { BOOL: boolShadow(false) }),
        withShadows('controls_for', { FROM: numShadow(1), TO: numShadow(10), BY: numShadow(1) }),
        { kind: 'block', type: 'controls_forEach' },
        { kind: 'block', type: 'controls_flow_statements' },
      ],
    },
    {
      kind: 'category',
      name: 'Math',
      categorystyle: 'math_category',
      contents: [
        { kind: 'block', type: 'math_number' },
        withShadows('math_arithmetic', { A: numShadow(1), B: numShadow(1) }),
        { kind: 'block', type: 'math_single' },
        { kind: 'block', type: 'math_trig' },
        { kind: 'block', type: 'math_constant' },
        { kind: 'block', type: 'math_number_property' },
        { kind: 'block', type: 'math_round' },
        withShadows('math_modulo', { DIVIDEND: numShadow(10), DIVISOR: numShadow(2) }),
        withShadows('math_constrain', { VALUE: numShadow(5), LOW: numShadow(1), HIGH: numShadow(10) }),
        withShadows('math_random_int', { FROM: numShadow(1), TO: numShadow(100) }),
        { kind: 'block', type: 'math_random_float' },
        withShadows('math_maxmin', { A: numShadow(1), B: numShadow(2) }),
      ],
    },
    {
      kind: 'category',
      name: 'Text',
      categorystyle: 'text_category',
      contents: [
        { kind: 'block', type: 'text' },
        { kind: 'block', type: 'text_join' },
        { kind: 'block', type: 'text_append' },
        { kind: 'block', type: 'text_length' },
        { kind: 'block', type: 'text_isEmpty' },
        { kind: 'block', type: 'text_indexOf' },
        { kind: 'block', type: 'text_changeCase' },
        { kind: 'block', type: 'text_trim' },
      ],
    },
    {
      kind: 'category',
      name: 'Lists',
      categorystyle: 'list_category',
      contents: [
        { kind: 'block', type: 'lists_create_with', extraState: { itemCount: 3 } },
        { kind: 'block', type: 'lists_create_empty' },
        { kind: 'block', type: 'lists_repeat' },
        { kind: 'block', type: 'lists_length' },
        { kind: 'block', type: 'lists_isEmpty' },
        { kind: 'block', type: 'lists_indexOf' },
        { kind: 'block', type: 'lists_getIndex' },
        { kind: 'block', type: 'lists_setIndex' },
        { kind: 'block', type: 'lists_getSublist' },
        { kind: 'block', type: 'lists_sort' },
        { kind: 'block', type: 'lists_split' },
      ],
    },
    {
      kind: 'category',
      name: 'Variables',
      categorystyle: 'variable_category',
      custom: 'VARIABLE',
    },
    {
      kind: 'category',
      name: 'Functions',
      categorystyle: 'procedure_category',
      custom: 'PROCEDURE',
    },
  ],
};

/** Flattened block types the toolbox offers — used by the "add block" search. */
export const TOOLBOX_BLOCK_TYPES: { type: string; category: string }[] = [
  { type: 'trade_definition', category: 'Trade parameters' },
  { type: 'run_once_at_start', category: 'Trade parameters' },
  { type: 'purchase', category: 'Purchase conditions' },
  { type: 'sell_at_market', category: 'Sell conditions' },
  { type: 'sell_at_price', category: 'Sell conditions' },
  { type: 'trade_again', category: 'Restart trading' },
  { type: 'stop_trading', category: 'Restart trading' },
  { type: 'candle_value', category: 'Analysis' },
  { type: 'candle_count', category: 'Analysis' },
  { type: 'current_price', category: 'Analysis' },
  { type: 'current_digit', category: 'Analysis' },
  { type: 'indicator_sma', category: 'Indicators' },
  { type: 'indicator_ema', category: 'Indicators' },
  { type: 'indicator_bollinger', category: 'Indicators' },
  { type: 'indicator_rsi', category: 'Indicators' },
  { type: 'indicator_macd', category: 'Indicators' },
  { type: 'indicator_stochastic', category: 'Indicators' },
  { type: 'notify_alert', category: 'Utility' },
  { type: 'notify_sound', category: 'Utility' },
  { type: 'debug_log', category: 'Utility' },
  { type: 'debug_console', category: 'Utility' },
  { type: 'tools_total_profit', category: 'Utility' },
  { type: 'tools_last_profit', category: 'Utility' },
  { type: 'tools_balance', category: 'Utility' },
  { type: 'tools_run_count', category: 'Utility' },
  { type: 'tools_is_last_win', category: 'Utility' },
  { type: 'controls_if', category: 'Logic' },
  { type: 'logic_compare', category: 'Logic' },
  { type: 'logic_operation', category: 'Logic' },
  { type: 'logic_boolean', category: 'Logic' },
  { type: 'controls_repeat_ext', category: 'Loops' },
  { type: 'controls_whileUntil', category: 'Loops' },
  { type: 'math_number', category: 'Math' },
  { type: 'math_arithmetic', category: 'Math' },
  { type: 'math_maxmin', category: 'Math' },
  { type: 'variables_get', category: 'Variables' },
  { type: 'variables_set', category: 'Variables' },
  { type: 'text', category: 'Text' },
  { type: 'lists_create_with', category: 'Lists' },
];
