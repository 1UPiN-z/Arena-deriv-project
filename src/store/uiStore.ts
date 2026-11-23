/** UI state: theme + toasts. */
import { create } from 'zustand';

export interface Toast {
  id: number;
  kind: 'info' | 'success' | 'warning' | 'error';
  title: string;
  body?: string;
}

interface UIState {
  theme: 'light' | 'dark';
  toasts: Toast[];
  toggleTheme(): void;
  setTheme(theme: 'light' | 'dark'): void;
  toast(kind: Toast['kind'], title: string, body?: string): void;
  dismissToast(id: number): void;
}

let toastSeq = 0;

export const useUIStore = create<UIState>((set, get) => ({
  theme: (localStorage.getItem('deriv-demo-theme') as 'light' | 'dark') ?? 'light',
  toasts: [],
  toggleTheme() {
    const next = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('deriv-demo-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    set({ theme: next });
  },
  setTheme(theme) {
    localStorage.setItem('deriv-demo-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },
  toast(kind, title, body) {
    const id = ++toastSeq;
    set((s) => ({ toasts: [...s.toasts, { id, kind, title, body }] }));
    setTimeout(() => get().dismissToast(id), 5200);
  },
  dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

/** Tiny WebAudio notification sounds (used by the bot's Play sound block). */
const audioCtx = { ctx: null as AudioContext | null };

export function playSound(kind: string): void {
  try {
    if (!audioCtx.ctx) audioCtx.ctx = new AudioContext();
    const ctx = audioCtx.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const presets: Record<string, [number, number, OscillatorType]> = {
      ping: [880, 0.18, 'sine'],
      success: [660, 0.25, 'triangle'],
      error: [220, 0.3, 'sawtooth'],
      coin: [1245, 0.12, 'square'],
    };
    const [freq, dur, type] = presets[kind] ?? presets.ping;
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.04;
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch {
    // audio not available — ignore
  }
}
