/**
 * History in localStorage.
 *
 * The site is fully static, so the last few results live in the browser.
 * Stored values are untrusted input and are validated on read.
 */

export interface HistoryEntry {
  expr: string;
  result: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_KEY = "wheel_history";
export const MAX_HISTORY = 12;

/** Expressions are capped so one entry cannot bloat the stored list. */
const MAX_EXPRESSION = 160;

/** Prepends an entry and keeps the newest MAX_HISTORY results. */
export function withEntry(
  entries: readonly HistoryEntry[],
  expr: string,
  result: string,
): HistoryEntry[] {
  const entry: HistoryEntry = { expr: expr.trim().slice(0, MAX_EXPRESSION), result };
  return [entry, ...entries].slice(0, MAX_HISTORY);
}

/** Validates the stored JSON, dropping anything malformed. */
export function decodeHistory(text: string | null): HistoryEntry[] {
  if (text === null) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    const entries: HistoryEntry[] = [];
    for (const item of parsed) {
      if (typeof item !== "object" || item === null) continue;
      const entry = item as Record<string, unknown>;
      if (typeof entry.expr !== "string" || typeof entry.result !== "string") continue;
      entries.push({ expr: entry.expr.slice(0, MAX_EXPRESSION), result: entry.result.slice(0, 8) });
      if (entries.length === MAX_HISTORY) break;
    }
    return entries;
  } catch {
    return [];
  }
}

export function encodeHistory(entries: readonly HistoryEntry[]): string {
  return JSON.stringify(entries.slice(0, MAX_HISTORY));
}

export function readHistory(storage: StorageLike): HistoryEntry[] {
  return decodeHistory(storage.getItem(STORAGE_KEY));
}

export function writeHistory(storage: StorageLike, entries: readonly HistoryEntry[]): void {
  storage.setItem(STORAGE_KEY, encodeHistory(entries));
}

export function clearHistory(storage: StorageLike): void {
  storage.removeItem(STORAGE_KEY);
}
