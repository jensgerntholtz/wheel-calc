import { expect, test } from "bun:test";
import {
  clearHistory,
  decodeHistory,
  encodeHistory,
  MAX_HISTORY,
  readHistory,
  STORAGE_KEY,
  withEntry,
  writeHistory,
  type StorageLike,
} from "./storage.ts";

function createStorage(): { storage: StorageLike; data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    storage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        data.set(key, value);
      },
      removeItem: (key) => {
        data.delete(key);
      },
    },
  };
}

test("history round-trips through localStorage", () => {
  const { storage } = createStorage();
  const entries = withEntry(withEntry([], "1/0", "∞"), "0/0", "⊥");
  writeHistory(storage, entries);
  expect(readHistory(storage)).toEqual([
    { expr: "0/0", result: "⊥" },
    { expr: "1/0", result: "∞" },
  ]);
});

test("history keeps the newest entries and caps the list", () => {
  let entries: ReturnType<typeof withEntry> = [];
  for (let index = 0; index < MAX_HISTORY + 3; index++) {
    entries = withEntry(entries, String(index), "0");
  }
  expect(entries.length).toBe(MAX_HISTORY);
  expect(entries[0].expr).toBe(String(MAX_HISTORY + 2));
});

test("malformed stored data decodes to no history", () => {
  expect(decodeHistory(null)).toEqual([]);
  expect(decodeHistory("not json")).toEqual([]);
  expect(decodeHistory('{"nope":1}')).toEqual([]);
  expect(decodeHistory("[1, null, {\"expr\":2}]")).toEqual([]);
});

test("long expressions are capped", () => {
  const entries = withEntry([], "1+".repeat(400), "∞");
  expect(entries[0].expr.length).toBeLessThanOrEqual(160);
});

test("clearHistory removes the stored key", () => {
  const { storage, data } = createStorage();
  writeHistory(storage, [{ expr: "1/0", result: "∞" }]);
  expect(data.has(STORAGE_KEY)).toBe(true);
  clearHistory(storage);
  expect(data.has(STORAGE_KEY)).toBe(false);
  expect(readHistory(storage)).toEqual([]);
});

test("encodeHistory caps the array length", () => {
  const entries = Array.from({ length: MAX_HISTORY + 5 }, (_, index) => ({
    expr: String(index),
    result: "0",
  }));
  expect(JSON.parse(encodeHistory(entries)).length).toBe(MAX_HISTORY);
});
