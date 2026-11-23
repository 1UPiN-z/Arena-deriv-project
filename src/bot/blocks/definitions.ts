/**
 * Deriv Bot–style custom block definitions (JSON format).
 * Every type registered here is part of the interpreter's allowlist.
 */
import * as Blockly from 'blockly';

const CONTRACT_OPTIONS = [
  ['Rise', 'RISE'],
  ['Fall', 'FALL'],
  ['Even', 'EVEN'],
  ['Odd', 'ODD'],
  ['Over', 'OVER'],
  ['Under', 'UNDER'],
  ['Matches', 'MATCHES'],
  ['Differs', 'DIFFERS'],
];

const MARKET_OPTIONS = [
  ['Derived ▸ Continuous Indices ▸ Volatility 10 Index', 'R_10'],
  ['Derived ▸ Continuous Indices ▸ Volatility 25 Index', 'R_25'],
  ['Derived ▸ Continuous Indices ▸ Volatility 50 Index', 'R_50'],
  ['Derived ▸ Continuous Indices ▸ Volatility 75 Index', 'R_75'],
  ['Derived ▸ Continuous Indices ▸ Volatility 100 Index', 'R_100'],
];

const SOURCE_OPTIONS = [
  ['open', 'open'],
  ['high', 'high'],
  ['low', 'low'],
  ['close', 'close'],
];

const NUM = { type: 'input_value', check: 'Number' };
const BOOL = { type: 'input_value', check: 'Boolean' };

export const CUSTOM_BLOCK_JSON: unknown[] = [
  // ---------------------------------------------------------------- sections
  {
    type: 'trade_definition',
    message0: 'Trade options · Market %1',
    args0: [{ type: 'field_dropdown', name: 'MARKET', options: MARKET_OPTIONS }],
    message1: 'Trade type %1 · Default candle interval %2',
    args1: [
      {
        type: 'field_dropdown',
        name: 'TRADE_TYPE',
        options: [
          ['Up/Down', 'UPDOWN'],
          ['Digits', 'DIGITS'],
        ],
      },
      {
        type: 'field_dropdown',
        name: 'CANDLE_INTERVAL',
        options: [
          ['1 minute', '1m'],
          ['5 minutes', '5m'],
          ['15 minutes', '15m'],
          ['1 hour', '1h'],
        ],
      },
    ],
    message2: 'Duration %1 %2 · Stake %3 %4',
    args2: [
      { type: 'field_number', name: 'DURATION_VALUE', value: 5, min: 1, precision: 1 },
      {
        type: 'field_dropdown',
        name: 'DURATION_UNIT',
        options: [
          ['ticks', 'ticks'],
          ['minutes', 'minutes'],
        ],
      },
      {
        type: 'field_dropdown',
        name: 'CURRENCY',
        options: [
          ['USD', 'USD'],
          ['EUR', 'EUR'],
          ['GBP', 'GBP'],
          ['AUD', 'AUD'],
        ],
      },
      { type: 'field_number', name: 'AMOUNT', value: 10, min: 1, precision: 0.01 },
    ],
    message3: 'Restart last trade on error %1 · Restart buy/sell on error %2',
    args3: [
      {
        type: 'field_dropdown',
        name: 'RESTART_LAST_ON_ERROR',
        options: [
          ['✓', 'TRUE'],
          ['✕', 'FALSE'],
        ],
      },
      {
        type: 'field_dropdown',
        name: 'RESTART_BUYSELL_ON_ERROR',
        options: [
          ['✓', 'TRUE'],
          ['✕', 'FALSE'],
        ],
      },
    ],
    hat: 'cap',
    style: 'trade_blocks',
    tooltip: '1. Trade parameters — trade options: market, trade type, duration and stake.',
    helpUrl: '',
  },
  {
    type: 'run_once_at_start',
    message0: 'Run once at start',
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'DO' }],
    hat: 'cap',
    style: 'trade_blocks',
    tooltip: 'Blocks placed here run a single time when the bot starts.',
    helpUrl: '',
  },
  {
    type: 'purchase_conditions',
    message0: '2 · Purchase conditions',
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'DO' }],
    hat: 'cap',
    style: 'purchase_blocks',
    tooltip: 'Purchase contracts when your conditions are met.',
    helpUrl: '',
  },
  {
    type: 'sell_conditions',
    message0: '3 · Sell conditions (optional)',
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'DO' }],
    hat: 'cap',
    style: 'sell_blocks',
    tooltip: 'Sell the open contract before it expires when your conditions are met.',
    helpUrl: '',
  },
  {
    type: 'restart_trading_conditions',
    message0: '4 · Restart trading conditions',
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'DO' }],
    hat: 'cap',
    style: 'restart_blocks',
    tooltip: 'Decide when the bot should trade again or stop.',
    helpUrl: '',
  },

  // ----------------------------------------------------------- trading stmts
  {
    type: 'purchase',
    message0: 'Purchase %1',
    args0: [{ type: 'field_dropdown', name: 'CONTRACT', options: CONTRACT_OPTIONS }],
    message1: 'when %1 · stake %2 · prediction %3',
    args1: [BOOL, NUM, NUM],
    previousStatement: null,
    nextStatement: null,
    style: 'purchase_blocks',
    tooltip: 'Buy a contract of the selected type when the condition is true.',
    helpUrl: '',
  },
  {
    type: 'sell_at_market',
    message0: 'Sell at market · when %1',
    args0: [BOOL],
    previousStatement: null,
    nextStatement: null,
    style: 'sell_blocks',
    tooltip: 'Sell the currently open contract at the current market price.',
    helpUrl: '',
  },
  {
    type: 'sell_at_price',
    message0: 'Sell at price %1 %2 · when %3',
    args0: [NUM, { type: 'field_dropdown', name: 'DIR', options: [['target reached from below ▲', 'GTE'], ['target reached from above ▼', 'LTE']] }, BOOL],
    previousStatement: null,
    nextStatement: null,
    style: 'sell_blocks',
    tooltip: 'Sell the open contract when the market price reaches the target.',
    helpUrl: '',
  },
  {
    type: 'trade_again',
    message0: 'Trade again · when %1',
    args0: [BOOL],
    message1: 'then %1',
    args1: [{ type: 'input_statement', name: 'DO' }],
    previousStatement: null,
    nextStatement: null,
    style: 'restart_blocks',
    tooltip: 'Continue trading when the condition is true.',
    helpUrl: '',
  },
  {
    type: 'stop_trading',
    message0: 'Stop trading · when %1 · message %2',
    args0: [BOOL, { type: 'input_value', check: 'String' }],
    previousStatement: null,
    nextStatement: null,
    style: 'restart_blocks',
    tooltip: 'Stop the bot when the condition is true.',
    helpUrl: '',
  },

  // -------------------------------------------------------------- utility
  {
    type: 'notify_alert',
    message0: 'Alert %1',
    args0: [{ type: 'input_value', check: 'String' }],
    previousStatement: null,
    nextStatement: null,
    style: 'utility_blocks',
    tooltip: 'Show an alert in the journal (and a toast in the UI).',
    helpUrl: '',
  },
  {
    type: 'notify_sound',
    message0: 'Play sound %1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'SOUND',
        options: [
          ['ping', 'ping'],
          ['success', 'success'],
          ['error', 'error'],
          ['coin', 'coin'],
        ],
      },
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'utility_blocks',
    tooltip: 'Play a short notification sound.',
    helpUrl: '',
  },
  {
    type: 'debug_log',
    message0: 'Log %1',
    args0: [{ type: 'input_value', check: 'String' }],
    previousStatement: null,
    nextStatement: null,
    style: 'utility_blocks',
    tooltip: 'Write a message to the bot journal.',
    helpUrl: '',
  },
  {
    type: 'debug_console',
    message0: 'Print to console %1',
    args0: [{ type: 'input_value', check: 'String' }],
    previousStatement: null,
    nextStatement: null,
    style: 'utility_blocks',
    tooltip: 'Write a message to the journal with a console marker.',
    helpUrl: '',
  },

  // ------------------------------------------------------------ market vals
  {
    type: 'current_price',
    message0: 'current market price',
    output: 'Number',
    style: 'analysis_blocks',
    tooltip: 'The latest simulated price of the selected market.',
    helpUrl: '',
  },
  {
    type: 'current_digit',
    message0: 'last digit of current price',
    output: 'Number',
    style: 'analysis_blocks',
    tooltip: 'The last fractional digit of the current price (for digit contracts).',
    helpUrl: '',
  },
  {
    type: 'candle_value',
    message0: 'candle %1 · %2 candles back',
    args0: [{ type: 'field_dropdown', name: 'SOURCE', options: SOURCE_OPTIONS }, NUM],
    output: 'Number',
    style: 'analysis_blocks',
    tooltip: 'Read an OHLC value from a previously closed candle (1 = last closed).',
    helpUrl: '',
  },
  {
    type: 'candle_count',
    message0: 'closed candle count',
    output: 'Number',
    style: 'analysis_blocks',
    tooltip: 'How many closed candles are available for analysis.',
    helpUrl: '',
  },

  // ----------------------------------------------------------- indicators
  {
    type: 'indicator_sma',
    message0: 'SMA (%1) of %2',
    args0: [NUM, { type: 'field_dropdown', name: 'SOURCE', options: SOURCE_OPTIONS }],
    output: 'Number',
    style: 'indicator_blocks',
    tooltip: 'Simple moving average of closed candles.',
    helpUrl: '',
  },
  {
    type: 'indicator_ema',
    message0: 'EMA (%1) of %2',
    args0: [NUM, { type: 'field_dropdown', name: 'SOURCE', options: SOURCE_OPTIONS }],
    output: 'Number',
    style: 'indicator_blocks',
    tooltip: 'Exponential moving average of closed candles.',
    helpUrl: '',
  },
  {
    type: 'indicator_bollinger',
    message0: 'Bollinger %1 (%2) of %3',
    args0: [
      {
        type: 'field_dropdown',
        name: 'BAND',
        options: [
          ['upper band', 'upper'],
          ['middle band', 'middle'],
          ['lower band', 'lower'],
        ],
      },
      NUM,
      { type: 'field_dropdown', name: 'SOURCE', options: SOURCE_OPTIONS },
    ],
    output: 'Number',
    style: 'indicator_blocks',
    tooltip: 'Bollinger Bands (2 standard deviations).',
    helpUrl: '',
  },
  {
    type: 'indicator_rsi',
    message0: 'RSI (%1)',
    args0: [NUM],
    output: 'Number',
    style: 'indicator_blocks',
    tooltip: 'Relative Strength Index (0-100).',
    helpUrl: '',
  },
  {
    type: 'indicator_macd',
    message0: 'MACD %1 (fast %2 · slow %3 · signal %4)',
    args0: [
      {
        type: 'field_dropdown',
        name: 'COMPONENT',
        options: [
          ['macd line', 'macd'],
          ['signal line', 'signal'],
          ['histogram', 'hist'],
        ],
      },
      NUM,
      NUM,
      NUM,
    ],
    output: 'Number',
    style: 'indicator_blocks',
    tooltip: 'Moving Average Convergence Divergence.',
    helpUrl: '',
  },
  {
    type: 'indicator_stochastic',
    message0: 'Stochastic %1 (%2)',
    args0: [
      {
        type: 'field_dropdown',
        name: 'COMPONENT',
        options: [
          ['%K', 'k'],
          ['%D', 'd'],
        ],
      },
      NUM,
    ],
    output: 'Number',
    style: 'indicator_blocks',
    tooltip: 'Stochastic oscillator.',
    helpUrl: '',
  },

  // ---------------------------------------------------------------- tools
  {
    type: 'tools_total_profit',
    message0: 'total profit this run',
    output: 'Number',
    style: 'utility_blocks',
    tooltip: 'Total profit/loss accumulated in this run.',
    helpUrl: '',
  },
  {
    type: 'tools_last_profit',
    message0: 'profit of last trade',
    output: 'Number',
    style: 'utility_blocks',
    tooltip: 'Profit or loss of the most recent settled trade.',
    helpUrl: '',
  },
  {
    type: 'tools_balance',
    message0: 'account balance',
    output: 'Number',
    style: 'utility_blocks',
    tooltip: 'Current virtual account balance.',
    helpUrl: '',
  },
  {
    type: 'tools_run_count',
    message0: 'number of runs',
    output: 'Number',
    style: 'utility_blocks',
    tooltip: 'How many trades have settled in this run.',
    helpUrl: '',
  },
  {
    type: 'tools_consecutive_losses',
    message0: 'consecutive losses',
    output: 'Number',
    style: 'utility_blocks',
    tooltip: 'Current streak of losing trades.',
    helpUrl: '',
  },
  {
    type: 'tools_is_last_win',
    message0: 'last trade won?',
    output: 'Boolean',
    style: 'utility_blocks',
    tooltip: 'True when the last settled trade was a win.',
    helpUrl: '',
  },
  {
    type: 'tools_is_last_loss',
    message0: 'last trade lost?',
    output: 'Boolean',
    style: 'utility_blocks',
    tooltip: 'True when the last settled trade was a loss.',
    helpUrl: '',
  },
  {
    type: 'tools_contract_is_running',
    message0: 'contract is running?',
    output: 'Boolean',
    style: 'utility_blocks',
    tooltip: 'True while a contract is open.',
    helpUrl: '',
  },
  {
    type: 'tools_contract_entry_price',
    message0: 'entry price of open contract',
    output: 'Number',
    style: 'utility_blocks',
    tooltip: 'Entry spot of the currently open contract.',
    helpUrl: '',
  },
  {
    type: 'tools_stake',
    message0: 'configured stake',
    output: 'Number',
    style: 'utility_blocks',
    tooltip: 'The stake configured in trade options.',
    helpUrl: '',
  },
  {
    type: 'math_maxmin',
    message0: '%1 of %2 and %3',
    args0: [
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['max', 'MAX'],
          ['min', 'MIN'],
        ],
      },
      NUM,
      NUM,
    ],
    output: 'Number',
    style: 'math_blocks',
    tooltip: 'Maximum or minimum of two numbers.',
    helpUrl: '',
  },
];

let registered = false;

export function registerCustomBlocks(): void {
  if (registered) return;
  Blockly.common.defineBlocksWithJsonArray(CUSTOM_BLOCK_JSON as never[]);
  registered = true;
}

registerCustomBlocks();
