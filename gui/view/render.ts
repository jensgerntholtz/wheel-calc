/**
 * HTML fragments rendered in the browser.
 *
 * The page used to be server-rendered; these strings are now produced from the
 * same pure modules the CLI uses, so the static site cannot drift from it.
 */

import type { Element } from "../../src/algebra.ts";
import { ParseError } from "../../src/parser.ts";
import { buildCalculator, displayOrder, formatElement } from "../../src/presentation.ts";
import type { HistoryEntry } from "./storage.ts";

const calc = buildCalculator();
const order = displayOrder(calc);
const names = order.map((element) => formatElement(element, calc.ring));

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderHistory(entries: HistoryEntry[]): string {
  const items = entries
    .map(
      (entry) =>
        '<li><button type="button" class="history-entry" data-expr="' +
        escapeHtml(entry.expr) +
        '"><span class="history-expression">' +
        escapeHtml(entry.expr) +
        '</span><span class="history-result">' +
        escapeHtml(entry.result) +
        "</span></button></li>",
    )
    .join("");
  const clearButton =
    entries.length > 0
      ? '<button type="button" class="ghost" data-action="clear-history">clear</button>'
      : "";
  const body =
    entries.length > 0 ? "<ol>" + items + "</ol>" : '<p class="hint">No history yet.</p>';
  return (
    '<section class="history"><header class="history-header"><h2>History</h2>' +
    clearButton +
    "</header>" +
    body +
    "</section>"
  );
}

export function renderHint(): string {
  return '<p class="hint">Enter an expression above. <code>1/0</code> is ∞, <code>0/0</code> is ⊥ (“no value”), and every result is computed in your browser, not looked up.</p>';
}

export function renderResultCard(expr: string, name: string): string {
  const legend = name === "∞" ? "1/0" : name === "⊥" ? "0/0" : "";
  const showLegend = legend !== "" && expr.trim() !== legend;
  const explainer =
    name === "⊥"
      ? '<p class="result-explainer">⊥ means “no value”: this expression has no answer. Ordinary arithmetic would stop with an error here; the wheel writes ⊥ instead, and anything combined with ⊥ stays ⊥.</p>'
      : "";
  return (
    '<article class="result-card" role="status">' +
    '<p class="result-expression">' +
    escapeHtml(expr) +
    '</p><p class="result-name">' +
    escapeHtml(name) +
    "</p>" +
    (showLegend
      ? '<p class="result-legend">' + escapeHtml(legend) + "</p>"
      : "") +
    explainer +
    "</article>"
  );
}

export function renderErrorCard(expr: string, error: ParseError): string {
  const caret = " ".repeat(Math.max(0, error.column - 1)) + "^";
  return (
    '<article class="result-card is-error" role="alert">' +
    '<p class="result-expression">' +
    escapeHtml(expr) +
    '</p><p class="error-title">Syntax error</p><p class="error-detail">' +
    escapeHtml(error.message) +
    '</p><pre class="error-caret"><code>' +
    escapeHtml(expr) +
    "\n" +
    escapeHtml(caret) +
    "</code></pre></article>"
  );
}

export function renderConsole(entries: HistoryEntry[], card: string): string {
  return '<div class="result-panel">' + card + "</div>" + renderHistory(entries);
}

function renderBinaryTable(
  corner: string,
  symbol: string,
  op: (a: Element<number>, b: Element<number>) => Element<number>,
): string {
  const header =
    '<tr><th class="corner" scope="col"></th>' +
    names.map((name) => '<th scope="col">' + escapeHtml(name) + "</th>").join("") +
    "</tr>";
  const rows = order
    .map((row, rowIndex) => {
      const cells = order
        .map((column, columnIndex) => {
          const value = formatElement(op(row, column), calc.ring);
          const title = names[rowIndex] + " " + symbol + " " + names[columnIndex] + " = " + value;
          return '<td title="' + escapeHtml(title) + '">' + escapeHtml(value) + "</td>";
        })
        .join("");
      return '<tr><th scope="row">' + escapeHtml(names[rowIndex]) + "</th>" + cells + "</tr>";
    })
    .join("");
  return (
    '<table class="cayley"><caption>' +
    escapeHtml(corner) +
    "</caption><thead>" +
    header +
    "</thead><tbody>" +
    rows +
    "</tbody></table>"
  );
}

function renderUnaryTable(): string {
  const header =
    '<tr><th class="corner" scope="col"></th>' +
    names.map((name) => '<th scope="col">' + escapeHtml(name) + "</th>").join("") +
    "</tr>";
  const row = (label: string, op: (a: Element<number>) => Element<number>): string => {
    const cells = order
      .map((element, index) => {
        const value = formatElement(op(element), calc.ring);
        const title = label + " with x = " + names[index] + " gives " + value;
        return '<td title="' + escapeHtml(title) + '">' + escapeHtml(value) + "</td>";
      })
      .join("");
    return '<tr><th scope="row">' + escapeHtml(label) + "</th>" + cells + "</tr>";
  };
  return (
    '<table class="cayley"><caption>unary</caption><thead>' +
    header +
    "</thead><tbody>" +
    row("/x", (element) => calc.inv(element)) +
    row("\u2212x", (element) => calc.neg(element)) +
    "</tbody></table>"
  );
}

let tablesHtml: string | null = null;

export function renderTablesHtml(): string {
  if (tablesHtml === null) {
    tablesHtml =
      '<div class="table-grid">' +
      renderBinaryTable("+", "+", (a, b) => calc.add(a, b)) +
      renderBinaryTable("\u00b7", "\u00b7", (a, b) => calc.mul(a, b)) +
      renderBinaryTable("x/y", "/", (a, b) => calc.div(a, b)) +
      renderBinaryTable("x\u2212y", "\u2212", (a, b) => calc.sub(a, b)) +
      renderUnaryTable() +
      "</div>" +
      '<p class="table-note">⊥ means “no value”: the operation has no answer, for example <code>0 / 0</code>, <code>0 · ∞</code> or <code>∞ + ∞</code>.</p>';
  }
  return tablesHtml;
}
