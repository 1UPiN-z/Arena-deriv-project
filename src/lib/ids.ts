/** Small id + misc helpers. */

let counter = 0;

export function uid(prefix = 'id'): string {
  counter = (counter + 1) % 0xffff;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}

export function nowTs(): number {
  return Date.now();
}

/** Stable JSON stringify (sorted keys) for content hashing. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, function replacer(_k, v) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(v as object).sort()) sorted[key] = (v as Record<string, unknown>)[key];
      return sorted;
    }
    return v;
  });
}

/** Tiny non-crypto hash (FNV-1a) for content fingerprints. */
export function hashString(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour12: false });
}
