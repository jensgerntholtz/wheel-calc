/**
 * Browser entry point: the calculator runs entirely here.
 *
 * The page is static HTML; this module evaluates the expression on the wheel,
 * paints the result, explainer, tables and history, and wires the keypad.
 */

import { evaluate, parse, ParseError } from "../src/parser.ts";
import { buildCalculator, formatElement } from "../src/presentation.ts";
import { EXPLAIN_HINT, renderExplainError, renderExplanation } from "./view/explain.ts";
import {
  renderConsole,
  renderErrorCard,
  renderHint,
  renderResultCard,
  renderTablesHtml,
} from "./view/render.ts";
import {
  clearHistory,
  readHistory,
  withEntry,
  writeHistory,
  type HistoryEntry,
} from "./view/storage.ts";

const calc = buildCalculator();
const storage = window.localStorage;

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (element === null) throw new Error("missing element #" + id);
  return element as T;
}

const form = requireElement<HTMLFormElement>("eval-form");
const input = requireElement<HTMLInputElement>("expr");
const consolePanel = requireElement("console");
const explainer = requireElement("explainer");
const tables = requireElement("tables");
const clearKey = document.querySelector('.keypad [data-action="clear"]');

let entries: HistoryEntry[] = readHistory(storage);

function paintConsole(card: string): void {
  consolePanel.innerHTML = renderConsole(entries, card);
}

function paintExplainer(html: string): void {
  explainer.innerHTML = html;
}

function focusInput(): void {
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

function setCaret(position: number): void {
  input.focus();
  input.setSelectionRange(position, position);
}

// The top-right key reads AC while the display is empty and C once it has
// content, like a pocket calculator: C clears the entry, AC resets everything.
function syncClearLabel(): void {
  if (!(clearKey instanceof HTMLButtonElement)) return;
  const hasContent = input.value.length > 0;
  clearKey.textContent = hasContent ? "C" : "AC";
  clearKey.setAttribute("aria-label", hasContent ? "Clear the display" : "Clear all");
}

function insert(text: string): void {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = input.value.slice(0, start) + text + input.value.slice(end);
  setCaret(start + text.length);
  syncClearLabel();
}

function backspace(): void {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  if (end > start) {
    input.value = input.value.slice(0, start) + input.value.slice(end);
    setCaret(start);
  } else if (start > 0) {
    input.value = input.value.slice(0, start - 1) + input.value.slice(start);
    setCaret(start - 1);
  } else {
    focusInput();
  }
  syncClearLabel();
}

function reset(): void {
  entries = [];
  clearHistory(storage);
  paintConsole(renderHint());
  paintExplainer(EXPLAIN_HINT);
  input.value = "";
  syncClearLabel();
  focusInput();
}

function clearOrReset(): void {
  if (input.value.length > 0) {
    input.value = "";
    syncClearLabel();
    focusInput();
    return;
  }
  reset();
}

function submitExpression(raw: string): void {
  try {
    const node = parse(raw);
    const element = evaluate(node, calc);
    const name = formatElement(element, calc.ring);
    entries = withEntry(entries, raw, name);
    writeHistory(storage, entries);
    paintConsole(renderResultCard(raw, name));
    paintExplainer(renderExplanation(calc, node));
    input.value = "";
    syncClearLabel();
    focusInput();
  } catch (error) {
    if (!(error instanceof ParseError)) throw error;
    paintConsole(renderErrorCard(raw, error));
    paintExplainer(renderExplainError(raw, error.message));
    focusInput();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitExpression(input.value);
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest("button");
  if (!(button instanceof HTMLButtonElement)) return;

  const inserted = button.dataset.insert;
  if (inserted !== undefined) {
    event.preventDefault();
    insert(inserted);
    return;
  }

  const action = button.dataset.action;
  if (action === "backspace") {
    event.preventDefault();
    backspace();
    return;
  }
  if (action === "clear") {
    event.preventDefault();
    clearOrReset();
    return;
  }
  if (action === "clear-history") {
    event.preventDefault();
    reset();
    return;
  }

  const example = button.dataset.example;
  if (example !== undefined) {
    event.preventDefault();
    input.value = example;
    syncClearLabel();
    form.requestSubmit();
    return;
  }

  const expression = button.dataset.expr;
  if (expression !== undefined) {
    event.preventDefault();
    input.value = expression;
    syncClearLabel();
    form.requestSubmit();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.activeElement === input) {
    input.value = "";
    syncClearLabel();
  }
});

input.addEventListener("input", syncClearLabel);

// Cayley tables: hovering a row header lights the row, a column header lights
// the column, and a cell lights the arm of its row through the cell plus the
// arm of its column down through the cell. The listeners are delegated because
// the table HTML is inserted after load.

let hotTable: HTMLTableElement | null = null;

function clearHot(table: HTMLTableElement): void {
  const hot = table.querySelectorAll(".is-row-hot, .is-col-hot, .is-cell-hot");
  for (const node of hot) {
    node.classList.remove("is-row-hot", "is-col-hot", "is-cell-hot");
  }
}

function markRow(row: HTMLTableRowElement, endIndex: number): void {
  const last = Math.min(endIndex, row.cells.length - 1);
  for (let index = 0; index <= last; index++) {
    row.cells[index].classList.add("is-row-hot");
  }
}

function markColumn(table: HTMLTableElement, columnIndex: number, endRowIndex: number): void {
  const head = table.tHead ? table.tHead.rows[0] : null;
  const body = table.tBodies[0];
  if (head === null || body === undefined) return;
  if (columnIndex >= 0 && columnIndex < head.cells.length) {
    head.cells[columnIndex].classList.add("is-col-hot");
  }
  const last = Math.min(endRowIndex, body.rows.length - 1);
  for (let index = 0; index <= last; index++) {
    const row = body.rows[index];
    if (row !== undefined && columnIndex < row.cells.length) {
      row.cells[columnIndex].classList.add("is-col-hot");
    }
  }
}

function updateHot(target: Element): void {
  const table = target.closest("table.cayley");
  if (hotTable !== null && hotTable !== table) {
    clearHot(hotTable);
    hotTable = null;
  }
  if (!(table instanceof HTMLTableElement)) return;
  clearHot(table);

  const head = table.tHead ? table.tHead.rows[0] : null;
  const body = table.tBodies[0];
  if (head === null || body === undefined) {
    hotTable = null;
    return;
  }

  const columnHeader = target.closest("thead th");
  if (columnHeader !== null) {
    if (columnHeader.classList.contains("corner")) {
      hotTable = null;
      return;
    }
    hotTable = table;
    markColumn(table, (columnHeader as HTMLTableCellElement).cellIndex, body.rows.length - 1);
    return;
  }

  const row = target.closest("tbody tr");
  if (!(row instanceof HTMLTableRowElement)) {
    hotTable = null;
    return;
  }
  hotTable = table;

  const cell = target.closest("tbody td");
  if (cell === null) {
    markRow(row, row.cells.length - 1);
    return;
  }
  markRow(row, (cell as HTMLTableCellElement).cellIndex);
  markColumn(table, (cell as HTMLTableCellElement).cellIndex, row.sectionRowIndex);
  cell.classList.add("is-cell-hot");
}

document.addEventListener("pointerover", (event) => {
  if (event.target instanceof Element) updateHot(event.target);
});

document.addEventListener("pointerout", (event) => {
  if (hotTable === null) return;
  const next = event.relatedTarget;
  if (next instanceof Node && hotTable.contains(next)) return;
  clearHot(hotTable);
  hotTable = null;
});

tables.innerHTML = renderTablesHtml();
paintConsole(renderHint());
paintExplainer(EXPLAIN_HINT);
syncClearLabel();
focusInput();
