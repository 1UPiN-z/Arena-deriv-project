/** Strategy document serialization, validation and versioning helpers. */
import { hashString, stableStringify, uid } from '../lib/ids';
import { collectWorkspaceBlocks, compileStrategy } from './interpreter';
import type { StrategyDoc, StrategyVersionRecord, ValidationIssue, WorkspaceState } from './types';

export interface ImportResult {
  ok: boolean;
  doc?: StrategyDoc;
  issues: ValidationIssue[];
}

export const STRATEGY_FILE_MAGIC = 'deriv-bot-strategy';

/** Validate an untrusted parsed JSON value as a strategy document. */
export function validateStrategyPayload(payload: unknown): { workspace?: WorkspaceState; name?: string; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (!payload || typeof payload !== 'object') {
    issues.push({ severity: 'error', message: 'File is not a valid strategy (not an object).' });
    return { issues };
  }
  const obj = payload as Record<string, unknown>;

  // Accept either a full export envelope or a bare workspace state
  let workspace: WorkspaceState | undefined;
  let name: string | undefined;

  if (obj.magic === STRATEGY_FILE_MAGIC && obj.workspace && typeof obj.workspace === 'object') {
    workspace = obj.workspace as WorkspaceState;
    name = typeof obj.name === 'string' ? obj.name : undefined;
  } else if (obj.workspace && typeof obj.workspace === 'object' && (obj.workspace as WorkspaceState).blocks) {
    workspace = obj.workspace as WorkspaceState;
    name = typeof obj.name === 'string' ? obj.name : undefined;
  } else if (obj.blocks && typeof obj.blocks === 'object') {
    workspace = obj as WorkspaceState;
    name = typeof obj.name === 'string' ? obj.name : undefined;
  } else {
    issues.push({ severity: 'error', message: 'File does not contain a Blockly workspace.' });
    return { issues };
  }

  const blocksState = workspace.blocks;
  if (!blocksState || !Array.isArray(blocksState.blocks)) {
    issues.push({ severity: 'error', message: 'Workspace has no block list.' });
    return { issues };
  }

  // Size guard against hostile files
  const all = collectWorkspaceBlocks(workspace);
  if (all.length > 2000) {
    issues.push({ severity: 'error', message: 'Strategy is too large (over 2000 blocks).' });
    return { issues };
  }

  // Compile → allowlist + structure validation
  const compiled = compileStrategy(workspace);
  issues.push(...compiled.issues);
  return { workspace, name, issues };
}

/** Wrap a workspace into an exportable envelope. */
export function toExportEnvelope(doc: StrategyDoc): string {
  return JSON.stringify(
    {
      magic: STRATEGY_FILE_MAGIC,
      formatVersion: 1,
      name: doc.name,
      exportedAt: new Date().toISOString(),
      workspace: doc.workspace,
    },
    null,
    2,
  );
}

export function parseImportFile(text: string): ImportResult {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return { ok: false, issues: [{ severity: 'error', message: 'File is not valid JSON.' }] };
  }
  const { workspace, name, issues } = validateStrategyPayload(payload);
  const hasErrors = issues.some((i) => i.severity === 'error');
  if (!workspace || hasErrors) return { ok: false, issues };
  const now = Date.now();
  const doc: StrategyDoc = {
    id: uid('strat'),
    name: name ?? 'Imported strategy',
    schemaVersion: 1,
    workspace,
    meta: { createdAt: now, updatedAt: now, description: 'Imported from file' },
  };
  return { ok: true, doc, issues };
}

export function contentHash(workspace: WorkspaceState): string {
  return hashString(stableStringify(workspace));
}

export function makeVersion(strategyId: string, name: string, workspace: WorkspaceState, version: number, note?: string): StrategyVersionRecord {
  return {
    id: uid('ver'),
    strategyId,
    version,
    name,
    workspace: structuredCloneSafe(workspace),
    createdAt: Date.now(),
    note,
    contentHash: contentHash(workspace),
  };
}

export function structuredCloneSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Human summary of a compiled strategy (used in dashboard + validation UI). */
export function summarizeWorkspace(workspace: WorkspaceState): string[] {
  const compiled = compileStrategy(workspace);
  const lines: string[] = [];
  const td = compiled.tradeDef;
  lines.push(`Market: ${td.market} · ${td.tradeType} · candle ${td.candleInterval}`);
  lines.push(`Duration: ${td.durationValue} ${td.durationUnit} · Stake: ${td.amount} ${td.currency}`);
  lines.push(`Purchase blocks: ${compiled.purchases.filter((b) => b.type === 'purchase').length}`);
  lines.push(`Sell blocks: ${compiled.sells.length}`);
  lines.push(`Restart blocks: ${compiled.restarts.length}`);
  return lines;
}
