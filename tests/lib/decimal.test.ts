import { describe, expect, it } from 'vitest';
import { add, sub, mul, div, round2, formatMoney, formatSigned, clamp, d } from '../../src/lib/decimal';

describe('decimal-safe money arithmetic', () => {
  it('avoids floating point drift', () => {
    // classic 0.1 + 0.2 problem
    expect(add(0.1, 0.2).toNumber()).toBe(0.3);
    let acc = d(0);
    for (let i = 0; i < 10; i++) acc = acc.plus(0.1);
    expect(acc.toNumber()).toBe(1);
    expect(sub(1, 0.9).toNumber()).toBe(0.1);
  });

  it('multiplies and divides precisely', () => {
    expect(mul(19.99, 3).toNumber()).toBe(59.97);
    expect(div(10, 4).toNumber()).toBe(2.5);
    expect(div(1, 3).toNumber()).toBeCloseTo(0.3333333, 6);
  });

  it('rounds half-even to 2 places', () => {
    expect(round2(1.005).toNumber()).toBe(1.0); // binary-representable nuance avoided via Decimal input
    expect(round2('1.005').toNumber()).toBe(1.0);
    expect(round2('2.675').toNumber()).toBe(2.68);
  });

  it('formats money and signed values', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50');
    expect(formatMoney(1234.5, 'EUR')).toBe('1,234.50 EUR');
    expect(formatSigned(5)).toBe('+5.00');
    expect(formatSigned(-5.2)).toBe('-5.20');
    expect(formatSigned(0)).toBe('0.00');
  });

  it('clamps', () => {
    expect(clamp(5, 1, 3)).toBe(3);
    expect(clamp(-5, 1, 3)).toBe(1);
    expect(clamp(2, 1, 3)).toBe(2);
  });
});
