import Decimal from 'decimal.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

export { Decimal };

/** Money helper: always work with Decimal, present with fixed decimals. */
export function d(value: number | string | Decimal): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

export function add(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return d(a).plus(b);
}

export function sub(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return d(a).minus(b);
}

export function mul(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return d(a).times(b);
}

export function div(a: number | string | Decimal, b: number | string | Decimal): Decimal {
  return d(a).div(b);
}

export function round2(value: number | string | Decimal): Decimal {
  return d(value).toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN);
}

export function toNum(value: Decimal | number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

export function formatMoney(value: number | string | Decimal, currency = 'USD', decimals = 2): string {
  const n = toNum(round2(value));
  return `${currency === 'USD' ? '$' : ''}${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${currency && currency !== 'USD' ? ` ${currency}` : ''}`;
}

export function formatSigned(value: number | string | Decimal, decimals = 2): string {
  const n = toNum(round2(value));
  const s = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return n > 0 ? `+${s}` : n < 0 ? `-${s}` : s;
}

/** Clamp a number. */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
