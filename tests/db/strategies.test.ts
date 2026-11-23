import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/db/db';
import {
  createStrategy,
  deleteStrategy,
  duplicateStrategy,
  listVersions,
  renameStrategy,
  restoreVersion,
  saveStrategy,
  importStrategyFile,
  exportStrategyFile,
} from '../../src/db/strategies';
import { defaultWorkspace } from '../../src/bot/templates';

beforeEach(async () => {
  await db.strategies.clear();
  await db.strategyVersions.clear();
  await db.botSessions.clear();
  await db.trades.clear();
});

describe('strategy persistence + versioning', () => {
  it('creates a strategy with an initial immutable version', async () => {
    const doc = await createStrategy('Test bot', defaultWorkspace());
    const versions = await listVersions(doc.id);
    expect(versions).toHaveLength(1);
    expect(versions[0].version).toBe(1);
  });

  it('adds a new version only when content changes', async () => {
    const doc = await createStrategy('Test bot', defaultWorkspace());
    const same = await saveStrategy(doc, doc.workspace);
    expect(same.newVersion).toBeNull();

    const ws2 = JSON.parse(JSON.stringify(doc.workspace));
    ws2.blocks.blocks.push({ id: 'extra', type: 'math_number', fields: { NUM: 42 } });
    const changed = await saveStrategy(doc, ws2);
    expect(changed.newVersion).toBe(2);
    const versions = await listVersions(doc.id);
    expect(versions).toHaveLength(2);
  });

  it('keeps old versions immutable and restores by copying', async () => {
    const doc = await createStrategy('Test bot', defaultWorkspace());
    const original = (await listVersions(doc.id))[0];

    const ws2 = JSON.parse(JSON.stringify(doc.workspace));
    ws2.blocks.blocks.push({ id: 'extra', type: 'math_number', fields: { NUM: 42 } });
    await saveStrategy(doc, ws2, { note: 'v2' });

    const restored = await restoreVersion(doc.id, original.id);
    expect(restored).not.toBeNull();
    // original version untouched
    const originalAfter = await db.strategyVersions.get(original.id);
    expect(originalAfter?.version).toBe(1);
    expect((originalAfter?.workspace.blocks?.blocks ?? []).length).toBe(original.workspace.blocks?.blocks?.length);

    // restore recorded as a NEW version
    const versions = await listVersions(doc.id);
    expect(versions[0].version).toBe(3);
    expect(versions[0].note).toContain('Restored');
  });

  it('renames and duplicates', async () => {
    const doc = await createStrategy('Old name', defaultWorkspace());
    await renameStrategy(doc.id, 'New name');
    const renamed = await db.strategies.get(doc.id);
    expect(renamed?.name).toBe('New name');

    const copy = await duplicateStrategy(doc.id);
    expect(copy?.name).toBe('New name (copy)');
    expect(copy?.id).not.toBe(doc.id);
  });

  it('deletes strategy and its versions', async () => {
    const doc = await createStrategy('Doomed', defaultWorkspace());
    await deleteStrategy(doc.id);
    expect(await db.strategies.get(doc.id)).toBeUndefined();
    expect(await listVersions(doc.id)).toHaveLength(0);
  });

  it('exports and imports through the file format', async () => {
    const doc = await createStrategy('Exportable', defaultWorkspace());
    const file = await exportStrategyFile(doc.id);
    expect(file).toContain('deriv-bot-strategy');

    const outcome = await importStrategyFile(file!);
    expect(outcome.ok).toBe(true);
    expect(outcome.doc?.name).toBe('Exportable');
  });

  it('run records reference exact strategy versions', async () => {
    const doc = await createStrategy('Run bot', defaultWorkspace());
    const { newVersion } = await saveStrategy(doc, doc.workspace, { forceVersion: true, note: 'snapshot' });
    const versions = await listVersions(doc.id);
    const snapshot = versions.find((v) => v.version === newVersion);
    await db.botSessions.add({
      id: 'sess_1',
      strategyId: doc.id,
      strategyVersionId: snapshot!.id,
      strategyName: doc.name,
      status: 'running',
      startedAt: Date.now(),
      endedAt: null,
      startingBalance: 10000,
      endingBalance: null,
      seed: 1,
      speed: 1,
      stats: null,
    });
    const session = await db.botSessions.get('sess_1');
    expect(session?.strategyVersionId).toBe(snapshot!.id);
  });
});
