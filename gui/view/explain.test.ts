import { expect, test } from "bun:test";
import { Wheel, Z2 } from "../../src/algebra.ts";
import { parse } from "../../src/parser.ts";
import { explain, renderExplanation } from "./explain.ts";

const calc = new Wheel(Z2, [Z2.one]);

test("derives 1 / 0 step by step", () => {
  const result = explain(calc, parse("1/0"));
  expect(result.steps.map((step) => step.op)).toEqual(["literal", "literal", "division"]);
  expect(result.finalName).toBe("∞");
  expect(result.finalPair).toBe("[1, 0]");

  const division = result.steps[2];
  expect(division.expr).toBe("1 / 0");
  expect(division.rule).toBe("x / y = x · /y");
  expect(division.work).toContain("y = [0, 1]");
  expect(division.work).toContain("/y = [1, 0] = [1, 0]");
  expect(division.work).toContain("[1, 1] · [1, 0] → [1∧1, 1∧0] = [1, 0]");
  expect(division.work).toContain("normalise [1, 0] → [1, 0] (already canonical)");
  expect(division.resultName).toBe("∞");
  expect(division.resultPair).toBe("[1, 0]");
});

test("conventional arithmetic stops at 1 / 0", () => {
  const result = explain(calc, parse("1/0"));
  expect(result.conventional.kind).toBe("undefined");
  expect(result.conventional.atText).toBe("1 / 0");
  expect(result.conventional.atWheelName).toBe("∞");
  expect(result.conventional.why).toContain("inverse");
  expect(result.conventional.trace).toEqual([{ text: "1 / 0 — undefined", failed: true }]);
});

test("conventional arithmetic agrees when no division by zero occurs", () => {
  const result = explain(calc, parse("1+1*0"));
  expect(result.steps.map((step) => step.op)).toEqual([
    "literal",
    "literal",
    "literal",
    "multiplication",
    "addition",
  ]);
  expect(result.finalName).toBe("1");
  expect(result.conventional.kind).toBe("value");
  expect(result.conventional.valueName).toBe("1");
  expect(result.conventional.agrees).toBe(true);
  expect(result.conventional.trace.map((line) => line.text)).toEqual([
    "1 * 0 = 0",
    "1 + 1 * 0 = 1",
  ]);
});

test("addition shows the pair formula", () => {
  const result = explain(calc, parse("1+1"));
  expect(result.finalName).toBe("0");
  const addition = result.steps[2];
  expect(addition.work).toContain("[1, 1] + [1, 1] → [1∧1 ⊕ 1∧1, 1∧1]");
  expect(addition.work).toContain("→ [1 ⊕ 1, 1] = [0, 1]");
  expect(addition.work).toContain("normalise [0, 1] → [0, 1] (already canonical)");
});

test("0 / 0 is bottom in the wheel but undefined in the field", () => {
  const result = explain(calc, parse("0/0"));
  expect(result.finalName).toBe("⊥");
  expect(result.steps[2].work).toContain("[0, 1] · [1, 0] → [0∧1, 1∧0] = [0, 0]");
  expect(result.conventional.kind).toBe("undefined");
  expect(result.conventional.atText).toBe("0 / 0");
  expect(result.conventional.atWheelName).toBe("⊥");
  expect(result.conventional.trace[0].text).toBe("0 / 0 — undefined");
});

test("the wheel rescues an expression the field rejects", () => {
  const result = explain(calc, parse("//0"));
  expect(result.steps.map((step) => step.op)).toEqual(["literal", "reciprocal", "reciprocal"]);
  expect(result.finalName).toBe("0");
  expect(result.conventional.kind).toBe("undefined");
  expect(result.conventional.atText).toBe("/0");
  expect(result.conventional.atWheelName).toBe("∞");
  expect(result.conventional.trace[0].text).toBe("/0 — undefined");
});

test("division failure is reported at the subexpression that fails", () => {
  const result = explain(calc, parse("1/0*0"));
  expect(result.finalName).toBe("⊥");
  expect(result.steps.map((step) => step.op)).toEqual([
    "literal",
    "literal",
    "division",
    "literal",
    "multiplication",
  ]);
  expect(result.conventional.atText).toBe("1 / 0");
  expect(result.conventional.atWheelName).toBe("∞");
});

test("negation is derived from a = [-1, 1]", () => {
  const result = explain(calc, parse("-1/0"));
  expect(result.steps.map((step) => step.op)).toEqual([
    "literal",
    "negation",
    "literal",
    "division",
  ]);
  expect(result.finalName).toBe("∞");
});

test("the rendered panel contains steps, the final pair and both verdicts", () => {
  const html = renderExplanation(calc, parse("1/0"));
  expect(html).toContain('<ol class="steps">');
  expect(html).toContain("x / y = x · /y");
  expect(html).toContain("normalise [1, 0]");
  expect(html).toContain('<p class="explain-final">result <strong>∞</strong> [1, 0]</p>');
  expect(html).toContain("Conventional arithmetic");
  expect(html).toContain('class="conv-steps"');
  expect(html).toContain("1 / 0 — undefined");
  expect(html).toContain("is-undefined");
  expect(html).toContain("has no value");
});

test("the explainer labels bottom in plain language", () => {
  const html = renderExplanation(calc, parse("0/0"));
  expect(html).toMatch(/class="final-gloss">[^<]*no value/);
  expect(renderExplanation(calc, parse("1/0"))).not.toContain('class="final-gloss"');
});
