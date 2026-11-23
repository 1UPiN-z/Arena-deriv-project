/** Pure technical-indicator maths over closed-candle series. */

export function sma(values: number[], period: number): number | null {
  if (period <= 0 || values.length < period) return null;
  let sum = 0;
  for (let i = values.length - period; i < values.length; i++) sum += values[i];
  return sum / period;
}

export function ema(values: number[], period: number): number | null {
  if (period <= 0 || values.length < period) return null;
  const k = 2 / (period + 1);
  let cur = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) {
    cur = values[i] * k + cur * (1 - k);
  }
  return cur;
}

export function bollinger(values: number[], period: number, mult = 2): { upper: number; middle: number; lower: number } | null {
  const middle = sma(values, period);
  if (middle === null) return null;
  let sq = 0;
  for (let i = values.length - period; i < values.length; i++) sq += (values[i] - middle) ** 2;
  const sd = Math.sqrt(sq / period);
  return { upper: middle + mult * sd, middle, lower: middle - mult * sd };
}

export function rsi(values: number[], period: number): number | null {
  if (period <= 0 || values.length < period + 1) return null;
  let gain = 0;
  let loss = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  if (loss === 0) return 100;
  const rs = gain / loss;
  return 100 - 100 / (1 + rs);
}

export function macd(values: number[], fast: number, slow: number, signal: number): { macd: number; signal: number; hist: number } | null {
  if (values.length < slow + signal) return null;
  const fastK = 2 / (fast + 1);
  const slowK = 2 / (slow + 1);
  let fastEma = values.slice(0, fast).reduce((a, b) => a + b, 0) / fast;
  let slowEma = values.slice(0, slow).reduce((a, b) => a + b, 0) / slow;
  const line: number[] = [];
  for (let i = 1; i < values.length; i++) {
    fastEma = values[i] * fastK + fastEma * (1 - fastK);
    slowEma = values[i] * slowK + slowEma * (1 - slowK);
    line.push(fastEma - slowEma);
  }
  const sigK = 2 / (signal + 1);
  let sig = line.slice(0, signal).reduce((a, b) => a + b, 0) / signal;
  for (let i = signal; i < line.length; i++) {
    sig = line[i] * sigK + sig * (1 - sigK);
  }
  const m = line[line.length - 1];
  return { macd: m, signal: sig, hist: m - sig };
}

export function stochastic(highs: number[], lows: number[], closes: number[], period: number): { k: number; d: number } | null {
  if (closes.length < period + 2) return null;
  const ks: number[] = [];
  for (let end = closes.length - 2; end >= closes.length - 2 - Math.min(period, 10) && end >= period - 1; end--) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let i = end - period + 1; i <= end; i++) {
      hh = Math.max(hh, highs[i]);
      ll = Math.min(ll, lows[i]);
    }
    ks.unshift(hh === ll ? 50 : ((closes[end] - ll) / (hh - ll)) * 100);
    if (ks.length >= 3) break;
  }
  const k = ks[ks.length - 1];
  const dd = ks.reduce((a, b) => a + b, 0) / ks.length;
  return { k, d: dd };
}

export function meanStd(values: number[]): { mean: number; std: number } {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
  return { mean, std };
}
