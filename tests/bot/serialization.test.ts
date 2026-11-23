import { beforeEach, describe, expect, it } from 'vitest';
import { parseImportFile, toExportEnvelope, validateStrategyPayload, contentHash } from '../../src/bot/serialization';
import { defaultWorkspace } from '../../src/bot/templates';
import type { StrategyDoc } from '../../src/bot/types';

function sampleDoc(): StrategyDoc {
  return {
    id: 'strat_1',
    name: 'My strategy',
    schemaVersion: 1,
    workspace: defaultWorkspace(),
    meta: { createdAt: 1, updatedAt: 2 },
  };
}

describe('strategy serialization', () => {
  it('exports and re-imports a strategy envelope', () => {
    const doc = sampleDoc();
    const file = toExportEnvelope(doc);
    const result = parseImportFile(file);
    expect(result.ok).toBe(true);
    expect(result.doc?.name).toBe('My strategy');
    expect(contentHash(result.doc!.workspace)).toBe(contentHash(doc.workspace));
  });

  it('rejects invalid JSON', () => {
    const result = parseImportFile('{not json');
    expect(result.ok).toBe(false);
    expect(result.issues[0].message).toContain('valid JSON');
  });

  it('rejects payloads without a workspace', () => {
    expect(validateStrategyPayload({ hello: 'world' }).issues.some((i) => i.severity === 'error')).toBe(true);
    expect(validateStrategyPayload(null).issues.some((i) => i.severity === 'error')).toBe(true);
    expect(validateStrategyPayload(42).issues.some((i) => i.severity === 'error')).toBe(true);
  });

  it('rejects strategies with unknown block types on import', () => {
    const payload = {
      magic: 'deriv-bot-strategy',
      name: 'evil',
      workspace: {
        blocks: {
          blocks: [
            {
              type: 'trade_definition',
              fields: { MARKET: 'R_10', TRADE_TYPE: 'UPDOWN', CANDLE_INTERVAL: '1m', DURATION_UNIT: 'ticks', DURATION_VALUE: 5, CURRENCY: 'USD', AMOUNT: 10, RESTART_LAST_ON_ERROR: 'TRUE', RESTART_BUYSELL_ON_ERROR: 'TRUE' },
            },
            { type: 'fetch_and_eval', inputs: {} },
          ],
        },
      },
    };
    const result = parseImportFile(JSON.stringify(payload));
    expect(result.ok).toBe(false);
  });

  it('content hash is stable across key order', () => {
    const a = { blocks: { blocks: [{ type: 'math_number', fields: { NUM: 1 } }] }, variables: [] };
    const b = { variables: [], blocks: { blocks: [{ fields: { NUM: 1 }, type: 'math_number' }] } };
    expect(contentHash(a as never)).toBe(contentHash(b as never));
  });
});
