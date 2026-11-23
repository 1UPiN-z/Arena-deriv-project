/** Quick strategy modal — pick a template, tune parameters, generate blocks. */
import { useState } from 'react';
import { Modal, Spinner } from '../../components/ui/kit';
import { QUICK_STRATEGIES } from '../../bot/templates';
import type { WorkspaceState } from '../../bot/types';

export function QuickStrategyModal({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (workspace: WorkspaceState, name: string) => void | Promise<void>;
}) {
  const [selected, setSelected] = useState(QUICK_STRATEGIES[0].id);
  const [params, setParams] = useState<Record<string, number>>(
    Object.fromEntries(QUICK_STRATEGIES[0].variables.map((v) => [v.name, v.value])),
  );
  const [busy, setBusy] = useState(false);
  const tpl = QUICK_STRATEGIES.find((t) => t.id === selected)!;

  return (
    <Modal open={open} onClose={onClose} title="Quick strategy" width="max-w-2xl">
      <p className="text-sm text-deriv-muted">
        Start with a popular strategy, then customise it in the builder. Loading a template replaces the current
        workspace (a version snapshot is kept in history).
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {QUICK_STRATEGIES.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setSelected(t.id);
              setParams(Object.fromEntries(t.variables.map((v) => [v.name, v.value])));
            }}
            className={`rounded-card border p-4 text-left transition-all duration-200 ${
              selected === t.id
                ? 'border-deriv-red bg-deriv-red/5 shadow-sm'
                : 'border-[var(--panel-border)] hover:-translate-y-0.5 hover:border-deriv-red/40'
            }`}
          >
            <div className="text-sm font-bold text-[var(--text-main)]">{t.name}</div>
            <div className="mt-1 text-xs text-deriv-muted">{t.tagline}</div>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-card bg-deriv-band p-4 text-sm dark:bg-white/5">
        <p className="text-deriv-body dark:text-white/70">{tpl.description}</p>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-[var(--text-main)]">Parameters</h4>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {tpl.variables.map((v) => (
            <div key={v.name}>
              <label className="label">{v.label}</label>
              <input
                type="number"
                className="input"
                value={params[v.name] ?? v.value}
                onChange={(e) => setParams((p) => ({ ...p, [v.name]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex justify-end gap-3">
        <button className="btn-secondary h-11 px-6" onClick={onClose}>Cancel</button>
        <button
          className="btn-primary h-11 px-6"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const ws = tpl.build(params);
              await onApply(ws, `QS: ${tpl.name}`);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Spinner size={18} /> : 'Load strategy'}
        </button>
      </div>
    </Modal>
  );
}
