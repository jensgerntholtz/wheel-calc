/**
 * Presentation-side derivation of a wheel expression for the GUI explainer.
 *
 * Steps are produced in evaluation order and show the pair arithmetic behind
 * every operation. The second half answers what conventional field arithmetic
 * (ordinary division, with 1 / 0 undefined) would do with the same expression.
 */

import { Element, Wheel } from "../../src/algebra.ts";
import { evaluate, Node } from "../../src/parser.ts";
import { formatElement } from "../../src/presentation.ts";

const RING_SUM = "\u2295";
const RING_PRODUCT = "\u2227";

export interface ExplainStep {
  expr: string;
  op: string;
  rule: string;
  work: string[];
  resultName: string;
  resultPair: string;
}

export interface ConventionalTraceLine {
  text: string;
  failed: boolean;
}

export interface ConventionalVerdict {
  kind: "value" | "undefined";
  valueName: string;
  agrees: boolean;
  atText: string;
  atWheelName: string;
  why: string;
  trace: ConventionalTraceLine[];
}

export interface Explanation {
  steps: ExplainStep[];
  finalName: string;
  finalPair: string;
  conventional: ConventionalVerdict;
}

export function explain(calc: Wheel<number>, node: Node): Explanation {
  const steps: ExplainStep[] = [];
  const final = trace(calc, node, steps);
  const finalName = formatElement(final, calc.ring);
  return {
    steps,
    finalName,
    finalPair: pair(final),
    conventional: conventionalVerdict(calc, node, finalName),
  };
}

function pair(element: Element<number>): string {
  return "[" + String(element.x) + ", " + String(element.y) + "]";
}

function pairArray(values: readonly [number, number]): string {
  return "[" + String(values[0]) + ", " + String(values[1]) + "]";
}

function product(a: number, b: number): string {
  return String(a) + RING_PRODUCT + String(b);
}

function sum(a: number, b: number): string {
  return String(a) + " " + RING_SUM + " " + String(b);
}

function normaliseLine(
  calc: Wheel<number>,
  raw: readonly [number, number],
  result: Element<number>,
): string {
  const unchanged = calc.ring.eq(raw[0], result.x) && calc.ring.eq(raw[1], result.y);
  return "normalise " + pairArray(raw) + " → " + pair(result) + (unchanged ? " (already canonical)" : "");
}

const PRECEDENCE: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

function render(node: Node, parentPrecedence = 0): string {
  if (node.kind === "literal") return node.digit;
  if (node.kind === "unary") return node.op + render(node.child, 3);
  const precedence = PRECEDENCE[node.op];
  const text = render(node.left, precedence) + " " + node.op + " " + render(node.right, precedence + 1);
  return precedence < parentPrecedence ? "(" + text + ")" : text;
}

function trace(calc: Wheel<number>, node: Node, steps: ExplainStep[]): Element<number> {
  if (node.kind === "literal") {
    const element = node.digit === "0" ? calc.zero : calc.one;
    steps.push({
      expr: render(node),
      op: "literal",
      rule:
        node.digit === "0"
          ? "the wheel zero is the pair [0, 1]"
          : "the wheel one is the pair [1, 1]",
      work: [node.digit + " ↦ " + pair(element)],
      resultName: formatElement(element, calc.ring),
      resultPair: pair(element),
    });
    return element;
  }

  if (node.kind === "unary") {
    const child = trace(calc, node.child, steps);
    if (node.op === "/") {
      const raw = calc.rawInv(child);
      const result = calc.element(raw[0], raw[1]);
      steps.push({
        expr: render(node),
        op: "reciprocal",
        rule: "/x = [y, x]: swap numerator and denominator",
        work: [
          "x = " + pair(child),
          "swap → [" + child.y + ", " + child.x + "] = " + pairArray(raw),
          normaliseLine(calc, raw, result),
        ],
        resultName: formatElement(result, calc.ring),
        resultPair: pair(result),
      });
      return result;
    }
    const raw = calc.rawNeg(child);
    const result = calc.element(raw[0], raw[1]);
    steps.push({
      expr: render(node),
      op: "negation",
      rule: "−x = a·x with a = " + pair(calc.negOne) + " (the solution of 1 + a = 0)",
      work: [
        "x = " + pair(child),
        pair(calc.negOne) +
          " · " +
          pair(child) +
          " → [" +
          product(calc.negOne.x, child.x) +
          ", " +
          product(calc.negOne.y, child.y) +
          "] = " +
          pairArray(raw),
        normaliseLine(calc, raw, result),
      ],
      resultName: formatElement(result, calc.ring),
      resultPair: pair(result),
    });
    return result;
  }

  const left = trace(calc, node.left, steps);
  const right = trace(calc, node.right, steps);

  if (node.op === "+") {
    const raw = calc.rawAdd(left, right);
    const result = calc.element(raw[0], raw[1]);
    const first = calc.ring.mul(left.x, right.y);
    const second = calc.ring.mul(right.x, left.y);
    const denominator = calc.ring.mul(left.y, right.y);
    steps.push({
      expr: render(node),
      op: "addition",
      rule: "x + y = [x·y' ⊕ x'·y, y·y']",
      work: [
        pair(left) +
          " + " +
          pair(right) +
          " → [" +
          product(left.x, right.y) +
          " " +
          RING_SUM +
          " " +
          product(right.x, left.y) +
          ", " +
          product(left.y, right.y) +
          "]",
        "→ [" + sum(first, second) + ", " + denominator + "] = " + pairArray(raw),
        normaliseLine(calc, raw, result),
      ],
      resultName: formatElement(result, calc.ring),
      resultPair: pair(result),
    });
    return result;
  }

  if (node.op === "-") {
    const negRight = calc.neg(right);
    const raw = calc.rawAdd(left, negRight);
    const result = calc.element(raw[0], raw[1]);
    const first = calc.ring.mul(left.x, negRight.y);
    const second = calc.ring.mul(negRight.x, left.y);
    const denominator = calc.ring.mul(left.y, negRight.y);
    steps.push({
      expr: render(node),
      op: "subtraction",
      rule: "x − y = x + (−y)",
      work: [
        "−y = " + pair(negRight),
        pair(left) +
          " + " +
          pair(negRight) +
          " → [" +
          product(left.x, negRight.y) +
          " " +
          RING_SUM +
          " " +
          product(negRight.x, left.y) +
          ", " +
          product(left.y, negRight.y) +
          "]",
        "→ [" + sum(first, second) + ", " + denominator + "] = " + pairArray(raw),
        normaliseLine(calc, raw, result),
      ],
      resultName: formatElement(result, calc.ring),
      resultPair: pair(result),
    });
    return result;
  }

  if (node.op === "*") {
    const raw = calc.rawMul(left, right);
    const result = calc.element(raw[0], raw[1]);
    steps.push({
      expr: render(node),
      op: "multiplication",
      rule: "x · y = [x·x', y·y']",
      work: [
        pair(left) +
          " · " +
          pair(right) +
          " → [" +
          product(left.x, right.x) +
          ", " +
          product(left.y, right.y) +
          "] = " +
          pairArray(raw),
        normaliseLine(calc, raw, result),
      ],
      resultName: formatElement(result, calc.ring),
      resultPair: pair(result),
    });
    return result;
  }

  const inverseRight = calc.inv(right);
  const raw = calc.rawMul(left, inverseRight);
  const result = calc.element(raw[0], raw[1]);
  steps.push({
    expr: render(node),
    op: "division",
    rule: "x / y = x · /y",
    work: [
      "y = " + pair(right),
      "/y = [" + right.y + ", " + right.x + "] = " + pair(inverseRight),
      pair(left) +
        " · " +
        pair(inverseRight) +
        " → [" +
        product(left.x, inverseRight.x) +
        ", " +
        product(left.y, inverseRight.y) +
        "] = " +
        pairArray(raw),
      normaliseLine(calc, raw, result),
    ],
    resultName: formatElement(result, calc.ring),
    resultPair: pair(result),
  });
  return result;
}

type ConventionalOutcome =
  | { kind: "value"; value: number }
  | { kind: "undefined"; node: Node; why: string };

function conventional(
  calc: Wheel<number>,
  node: Node,
  trace: ConventionalTraceLine[],
): ConventionalOutcome {
  if (node.kind === "literal") {
    return { kind: "value", value: node.digit === "0" ? calc.ring.zero : calc.ring.one };
  }
  if (node.kind === "unary") {
    const child = conventional(calc, node.child, trace);
    if (child.kind === "undefined") return child;
    if (node.op === "/") {
      if (calc.ring.eq(child.value, calc.ring.zero)) {
        trace.push({ text: render(node) + " — undefined", failed: true });
        return { kind: "undefined", node, why: "0 has no multiplicative inverse" };
      }
      trace.push({ text: render(node) + " = " + String(calc.ring.one), failed: false });
      return { kind: "value", value: calc.ring.one };
    }
    const negated = calc.ring.neg(child.value);
    trace.push({ text: render(node) + " = " + String(negated), failed: false });
    return { kind: "value", value: negated };
  }
  const left = conventional(calc, node.left, trace);
  if (left.kind === "undefined") return left;
  const right = conventional(calc, node.right, trace);
  if (right.kind === "undefined") return right;
  if (node.op === "/" && calc.ring.eq(right.value, calc.ring.zero)) {
    trace.push({ text: render(node) + " — undefined", failed: true });
    return { kind: "undefined", node, why: "0 has no multiplicative inverse" };
  }
  const value =
    node.op === "+"
      ? calc.ring.add(left.value, right.value)
      : node.op === "-"
        ? calc.ring.add(left.value, calc.ring.neg(right.value))
        : node.op === "*"
          ? calc.ring.mul(left.value, right.value)
          : calc.ring.mul(left.value, calc.ring.one);
  trace.push({ text: render(node) + " = " + String(value), failed: false });
  return { kind: "value", value };
}

function conventionalVerdict(
  calc: Wheel<number>,
  node: Node,
  finalName: string,
): ConventionalVerdict {
  const trace: ConventionalTraceLine[] = [];
  const outcome = conventional(calc, node, trace);
  if (outcome.kind === "value") {
    const valueName = String(outcome.value);
    return {
      kind: "value",
      valueName,
      agrees: valueName === finalName,
      atText: "",
      atWheelName: "",
      why: "",
      trace,
    };
  }
  return {
    kind: "undefined",
    valueName: "",
    agrees: false,
    atText: render(outcome.node),
    atWheelName: formatElement(evaluate(outcome.node, calc), calc.ring),
    why: outcome.why,
    trace,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const EXPLAIN_HINT =
  '<p class="hint">Evaluate an expression to see each wheel operation, then the same expression under conventional field arithmetic.</p>';

export function renderExplainError(expr: string, message: string): string {
  return (
    '<p class="hint">No derivation: <code>' +
    escapeHtml(expr) +
    "</code> did not parse (" +
    escapeHtml(message) +
    ").</p>"
  );
}

export function renderExplanation(calc: Wheel<number>, node: Node): string {
  const explanation = explain(calc, node);
  const intro =
    '<p class="explain-intro"><code>' +
    escapeHtml(render(node)) +
    "</code>: each element is a pair <code>[numerator, denominator]</code>; <code>" +
    RING_SUM +
    "</code> is XOR (ring addition) and <code>" +
    RING_PRODUCT +
    "</code> is AND (ring multiplication).</p>";
  const steps = explanation.steps
    .map(
      (step) =>
        '<li class="step"><div class="step-head"><code class="step-expr">' +
        escapeHtml(step.expr) +
        '</code><span class="step-op">' +
        escapeHtml(step.op) +
        '</span></div><p class="step-rule">' +
        escapeHtml(step.rule) +
        '</p><div class="step-work">' +
        step.work.map((line) => "<code>" + escapeHtml(line) + "</code>").join("") +
        '</div><p class="step-result">= <strong>' +
        escapeHtml(step.resultName) +
        '</strong> <span class="step-pair">' +
        escapeHtml(step.resultPair) +
        "</span></p></li>",
    )
    .join("");
  const final =
    '<p class="explain-final">result <strong>' +
    escapeHtml(explanation.finalName) +
    "</strong> " +
    escapeHtml(explanation.finalPair) +
    (explanation.finalName === "⊥"
      ? ' <span class="final-gloss">— means “no value”</span>'
      : "") +
    "</p>";
  return intro + '<ol class="steps">' + steps + "</ol>" + final + conventionalPanel(explanation);
}

function conventionalPanel(explanation: Explanation): string {
  const heading =
    '<h3>Conventional arithmetic <span class="conv-tag">the field F\u2082</span></h3>';
  const conv = explanation.conventional;
  const trace =
    conv.trace.length === 0
      ? ""
      : '<ol class="conv-steps">' +
        conv.trace
          .map(
            (line) =>
              '<li' +
              (line.failed ? ' class="is-failed"' : "") +
              "><code>" +
              escapeHtml(line.text) +
              "</code></li>",
          )
          .join("") +
        "</ol>";
  if (conv.kind === "value") {
    return (
      '<section class="conventional">' +
      heading +
      '<p class="conv-verdict is-value">= ' +
      escapeHtml(conv.valueName) +
      "</p>" +
      trace +
      '<p class="conv-detail">No division by zero occurs, so ordinary field arithmetic and the wheel agree.</p></section>'
    );
  }
  return (
    '<section class="conventional">' +
    heading +
    '<p class="conv-verdict is-undefined">Undefined</p>' +
    trace +
    '<p class="conv-detail">In a field, <code>' +
    escapeHtml(conv.atText) +
    "</code> has no value: " +
    escapeHtml(conv.why) +
    ". The wheel defines <code>" +
    escapeHtml(conv.atText) +
    " = " +
    escapeHtml(conv.atWheelName) +
    "</code> and carries on; here it ends at <strong>" +
    escapeHtml(explanation.finalName) +
    "</strong>.</p></section>"
  );
}
