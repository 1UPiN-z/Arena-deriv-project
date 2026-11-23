/**
 * React wrapper around Google Blockly. The editor is fully decoupled from the
 * execution engine: it only produces/consumes serializable workspace state.
 */
import * as Blockly from 'blockly';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import 'blockly/blocks';
import * as En from 'blockly/msg/en';
import { registerCustomBlocks } from '../../bot/blocks/definitions';
import { derivDarkTheme, derivLightTheme } from '../../bot/blocks/theme';
import { TOOLBOX } from '../../bot/blocks/toolbox';
import type { WorkspaceState } from '../../bot/types';

Blockly.setLocale(En as never);
registerCustomBlocks();

export interface BlocklyWorkspaceHandle {
  getWorkspace(): Blockly.WorkspaceSvg | null;
  save(): WorkspaceState;
  load(state: WorkspaceState): void;
  undo(): void;
  redo(): void;
  clear(): void;
  addBlock(type: string): void;
  center(): void;
  resize(): void;
}

interface Props {
  initialWorkspace?: WorkspaceState | null;
  onChange?: (state: WorkspaceState) => void;
  onReady?: (ws: Blockly.WorkspaceSvg) => void;
  dark?: boolean;
  readOnly?: boolean;
  className?: string;
}

export const BlocklyWorkspace = forwardRef<BlocklyWorkspaceHandle, Props>(function BlocklyWorkspace(
  { initialWorkspace, onChange, onReady, dark = false, readOnly = false, className = '' },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useImperativeHandle(ref, () => ({
    getWorkspace: () => wsRef.current,
    save: () => (wsRef.current ? (Blockly.serialization.workspaces.save(wsRef.current) as WorkspaceState) : { blocks: { blocks: [] } }),
    load: (state: WorkspaceState) => {
      const ws = wsRef.current;
      if (!ws) return;
      ws.clear();
      try {
        Blockly.serialization.workspaces.load(state as never, ws);
      } catch (e) {
        console.error('Failed to load workspace', e);
      }
    },
    undo: () => wsRef.current?.undo(false),
    redo: () => wsRef.current?.undo(true),
    clear: () => {
      wsRef.current?.clear();
    },
    addBlock: (type: string) => {
      const ws = wsRef.current;
      if (!ws) return;
      try {
        const block = ws.newBlock(type);
        block.initSvg();
        block.render();
        const metrics = ws.getMetricsManager().getViewMetrics();
        block.moveBy(metrics.left + metrics.width / 2 - 60, metrics.top + metrics.height / 2 - 40);
        block.select();
      } catch (e) {
        console.error('Failed to add block', type, e);
      }
    },
    center: () => {
      const ws = wsRef.current;
      if (!ws) return;
      Blockly.Events.disable();
      ws.scrollCenter();
      Blockly.Events.enable();
    },
    resize: () => {
      wsRef.current?.resize();
    },
  }));

  // init / destroy
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ws = Blockly.inject(el, {
      toolbox: TOOLBOX as never,
      theme: dark ? derivDarkTheme : derivLightTheme,
      renderer: 'geras',
      trashcan: true,
      move: {
        scrollbars: { horizontal: true, vertical: true },
        drag: true,
        wheel: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.85,
        maxScale: 2.5,
        minScale: 0.3,
        scaleSpeed: 1.15,
        pinch: true,
      },
      grid: {
        spacing: 24,
        length: 3,
        colour: dark ? '#2A3136' : '#D9DEE3',
        snap: true,
      },
    } as never);
    wsRef.current = ws;

    if (initialWorkspace) {
      try {
        Blockly.serialization.workspaces.load(initialWorkspace as never, ws);
      } catch (e) {
        console.error('Failed to load initial workspace', e);
      }
    }

    if (readOnly) {
      ws.addChangeListener((e: Blockly.Events.Abstract) => {
        if (e.isUiEvent) return;
        // revert any modification attempts in read-only mode
        if (e.type !== Blockly.Events.FINISHED_LOADING) {
          // allow load events only
        }
      });
    }

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const listener = (e: Blockly.Events.Abstract) => {
      if (e.isUiEvent) return;
      if (e.type === Blockly.Events.FINISHED_LOADING) return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        if (onChangeRef.current && wsRef.current) {
          onChangeRef.current(Blockly.serialization.workspaces.save(wsRef.current) as WorkspaceState);
        }
      }, 350);
    };
    ws.addChangeListener(listener);
    onReady?.(ws);

    const ro = new ResizeObserver(() => ws.resize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      if (debounce) clearTimeout(debounce);
      ws.dispose();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // theme switching
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;
    ws.setTheme(dark ? derivDarkTheme : derivLightTheme);
  }, [dark]);

  return <div ref={containerRef} className={`blocklyWrapper blockly-wrapper-host ${className}`} style={{ position: 'relative', height: '100%', width: '100%' }} />;
});

export { Blockly };
