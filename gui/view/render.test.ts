import { expect, test } from "bun:test";
import { ParseError, parse } from "../../src/parser.ts";
import {
  escapeHtml,
  renderConsole,
  renderErrorCard,
  renderHint,
  renderHistory,
  renderResultCard,
  renderTablesHtml,
} from "./render.ts";

function parseError(expr: string): ParseError {
  try {
    parse(expr);
  } catch (error) {
    if (error instanceof ParseError) return error;
    throw error;
  }
  throw new Error("expected a parse error for " + expr);
}

test("result card explains bottom in plain language", () => {
  const bottom = renderResultCard("0/0", "⊥");
  expect(bottom).toContain('<p class="result-name">⊥</p>');
  expect(bottom).toContain('class="result-explainer"');
  expect(bottom).toContain("no value");
  expect(renderResultCard("1/0", "∞")).not.toContain('class="result-explainer"');
});

test("result card carries the 1/0 legend", () => {
  const card = renderResultCard("-(1/0)", "∞");
  expect(card).toContain('<p class="result-legend">1/0</p>');
  expect(renderResultCard("1/0", "∞")).not.toContain("result-legend");
});

test("history lists entries with a local clear action", () => {
  const html = renderHistory([
    { expr: "0/0", result: "⊥" },
    { expr: "1/0", result: "∞" },
  ]);
  expect(html).toContain('data-expr="0/0"');
  expect(html).toContain('data-expr="1/0"');
  expect(html).toContain('data-action="clear-history"');
  expect(html).toContain('class="history-result"');

  const empty = renderHistory([]);
  expect(empty).toContain("No history yet.");
  expect(empty).not.toContain("clear-history");
});

test("console combines the result card and history", () => {
  const html = renderConsole([{ expr: "1/0", result: "∞" }], renderHint());
  expect(html).toContain('class="result-panel"');
  expect(html).toContain("Enter an expression above");
  expect(html).toContain('data-expr="1/0"');
});

test("error card shows the caret at the failing column", () => {
  const html = renderErrorCard("1+2", parseError("1+2"));
  expect(html).toContain("Syntax error");
  expect(html).toContain("column 3");
  expect(html).toContain("<code>1+2\n  ^</code>");
});

test("Cayley tables are rendered from the wheel and label bottom", () => {
  const html = renderTablesHtml();
  expect(html).toContain('class="cayley"');
  expect(html).toContain("x/y");
  expect(html).toContain('title="0 / 0 = ⊥"');
  expect(html).toContain('class="table-note"');
  expect(html).toContain("no value");
  expect(renderTablesHtml()).toBe(html);
});

test("escapeHtml escapes markup", () => {
  expect(escapeHtml('<a href="x">&\'</a>')).toBe(
    "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;",
  );
});
