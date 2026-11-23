/** Strategy CRUD + immutable version history. */
import { db } from './db';
import { contentHash, makeVersion, parseImportFile, structuredCloneSafe, toExportEnvelope } from '../bot/serialization';
import type { StrategyDoc, WorkspaceState } from '../bot/types';
import { uid } from '../lib/ids';
import { defaultWorkspace } from '../bot/templates';

export async function createStrategy(name: string, workspace: WorkspaceState, description?: string): Promise<StrategyDoc> {
  const now = Date.now();
  const doc: StrategyDoc = {
    id: uid('strat'),
    name,
    schemaVersion: 1,
    workspace: structuredCloneSafe(workspace),
    meta: { createdAt: now, updatedAt: now, description },
  };
  await db.strategies.add(doc);
  await db.strategyVersions.add(makeVersion(doc.id, name, workspace, 1, 'Initial version'));
  return doc;
}

export async function ensureDefaultStrategy(): Promise<StrategyDoc> {
  const existing = await db.strategies.orderBy('updatedAt').reverse().first();
  if (existing) return existing;
  return createStrategy('My first bot', defaultWorkspace(), 'Created automatically');
}

/**
 * Save the head workspace. Creates a new immutable version only when the
 * content actually changed (or a note forces a snapshot).
 */
export async function saveStrategy(
  doc: StrategyDoc,
  workspace: WorkspaceState,
  opts: { note?: string; forceVersion?: boolean } = {},
): Promise<{ doc: StrategyDoc; newVersion: number | null }> {
  const hash = contentHash(workspace);
  const versions = await db.strategyVersions.where('strategyId').equals(doc.id).toArray();
  const latest = versions.sort((a, b) => b.version - a.version)[0];
  const changed = !latest || latest.contentHash !== hash;

  const updated: StrategyDoc = {
    ...doc,
    workspace: structuredCloneSafe(workspace),
    meta: { ...doc.meta, updatedAt: Date.now() },
  };
  await db.strategies.put(updated);

  let newVersion: number | null = null;
  if (changed || opts.forceVersion) {
    newVersion = (latest?.version ?? 0) + 1;
    await db.strategyVersions.add(makeVersion(doc.id, doc.name, workspace, newVersion, opts.note));
  }
  return { doc: updated, newVersion };
}

export async function renameStrategy(id: string, name: string): Promise<void> {
  const doc = await db.strategies.get(id);
  if (!doc) return;
  await db.strategies.put({ ...doc, name, meta: { ...doc.meta, updatedAt: Date.now() } });
}

export async function duplicateStrategy(id: string): Promise<StrategyDoc | null> {
  const doc = await db.strategies.get(id);
  if (!doc) return null;
  return createStrategy(`${doc.name} (copy)`, doc.workspace, 'Duplicated');
}

export async function deleteStrategy(id: string): Promise<void> {
  await db.transaction('rw', db.strategies, db.strategyVersions, async () => {
    await db.strategies.delete(id);
    await db.strategyVersions.where('strategyId').equals(id).delete();
  });
}

export async function listVersions(strategyId: string) {
  const versions = await db.strategyVersions.where('strategyId').equals(strategyId).toArray();
  return versions.sort((a, b) => b.version - a.version);
}

/** Restore an old version into the head — creates a NEW version (old ones immutable). */
export async function restoreVersion(strategyId: string, versionId: string): Promise<StrategyDoc | null> {
  const doc = await db.strategies.get(strategyId);
  const version = await db.strategyVersions.get(versionId);
  if (!doc || !version) return null;
  const workspace = structuredCloneSafe(version.workspace);
  const updated: StrategyDoc = {
    ...doc,
    workspace,
    meta: { ...doc.meta, updatedAt: Date.now() },
  };
  await db.strategies.put(updated);
  const versions = await db.strategyVersions.where('strategyId').equals(strategyId).toArray();
  const next = Math.max(0, ...versions.map((v) => v.version)) + 1;
  await db.strategyVersions.add(makeVersion(strategyId, doc.name, workspace, next, `Restored from version ${version.version}`));
  return updated;
}

export async function exportStrategyFile(id: string): Promise<string | null> {
  const doc = await db.strategies.get(id);
  if (!doc) return null;
  return toExportEnvelope(doc);
}

export interface ImportOutcome {
  ok: boolean;
  message: string;
  doc?: StrategyDoc;
  issues: { severity: string; message: string }[];
}

export async function importStrategyFile(text: string): Promise<ImportOutcome> {
  const result = parseImportFile(text);
  if (!result.ok || !result.doc) {
    return {
      ok: false,
      message: 'Import failed validation.',
      issues: result.issues.map((i) => ({ severity: i.severity, message: i.message })),
    };
  }
  const doc = await createStrategy(result.doc.name, result.doc.workspace, 'Imported from file');
  return {
    ok: true,
    message: `Imported "${doc.name}" with ${result.issues.filter((i) => i.severity === 'warning').length} warning(s).`,
    doc,
    issues: result.issues.map((i) => ({ severity: i.severity, message: i.message })),
  };
}
