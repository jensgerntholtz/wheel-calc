import { expect, test } from "bun:test";
import { Element } from "../src/algebra.ts";
import { evaluate, parse } from "../src/parser.ts";
import { displayOrder, formatElement, tableText } from "../src/presentation.ts";
import {
  CALC,
  constants,
  DISPLAYED,
  ORACLE_ADD,
  ORACLE_DIV,
  ORACLE_INV,
  ORACLE_MUL,
  ORACLE_NEG,
  ORACLE_SUB,
  TABLE_SNAPSHOT,
} from "./helpers.ts";

function nameOf(e: Element<number>): string {
  return formatElement(e, CALC.ring);
}

function order(): Element<number>[] {
  return displayOrder(CALC);
}

function matrix(op: (a: Element<number>, b: Element<number>) => Element<number>): string[][] {
  const els = order();
  return els.map((row) => els.map((column) => nameOf(op(row, column))));
}

const { zero, one, inf, bot } = constants(CALC);

test("addition table", () => {
  expect(matrix((a, b) => CALC.add(a, b))).toEqual(ORACLE_ADD);
});

test("multiplication table", () => {
  expect(matrix((a, b) => CALC.mul(a, b))).toEqual(ORACLE_MUL);
});

test("division table", () => {
  expect(matrix((a, b) => CALC.div(a, b))).toEqual(ORACLE_DIV);
});

test("subtraction table", () => {
  expect(matrix((a, b) => CALC.sub(a, b))).toEqual(ORACLE_SUB);
});

test("unary reciprocal row", () => {
  expect(order().map((e) => nameOf(CALC.inv(e)))).toEqual(ORACLE_INV);
});

test("unary negation row", () => {
  expect(order().map((e) => nameOf(CALC.neg(e)))).toEqual(ORACLE_NEG);
});

test("display order is 0, 1, infinity, bottom", () => {
  expect(order().map((e) => nameOf(e))).toEqual(DISPLAYED);
});

test("listed values through the operations", () => {
  expect(nameOf(CALC.div(one, zero))).toBe("∞");
  expect(nameOf(CALC.div(zero, zero))).toBe("⊥");
  expect(nameOf(CALC.div(inf, inf))).toBe("⊥");
  expect(nameOf(CALC.div(one, inf))).toBe("0");
  expect(nameOf(CALC.div(zero, one))).toBe("0");
  expect(nameOf(CALC.div(one, one))).toBe("1");
  expect(nameOf(CALC.mul(zero, inf))).toBe("⊥");
  expect(nameOf(CALC.add(one, one))).toBe("0");
  expect(nameOf(CALC.add(one, inf))).toBe("∞");
  expect(nameOf(CALC.add(inf, inf))).toBe("⊥");
  expect(nameOf(CALC.sub(inf, inf))).toBe("⊥");
  expect(nameOf(CALC.div(inf, zero))).toBe("∞");
  expect(nameOf(CALC.div(zero, inf))).toBe("0");
  for (const x of order()) {
    expect(nameOf(CALC.add(bot, x))).toBe("⊥");
    expect(nameOf(CALC.mul(bot, x))).toBe("⊥");
    expect(nameOf(CALC.div(bot, x))).toBe("⊥");
    expect(nameOf(CALC.div(x, bot))).toBe("⊥");
    expect(nameOf(CALC.sub(bot, x))).toBe("⊥");
    expect(nameOf(CALC.sub(x, bot))).toBe("⊥");
  }
  expect(nameOf(CALC.inv(bot))).toBe("⊥");
  expect(nameOf(CALC.neg(bot))).toBe("⊥");
});

const PARSED_VALUES: Array<[string, string]> = [
  ["0", "0"],
  ["1", "1"],
  ["1/0", "∞"],
  ["0/0", "⊥"],
  ["/0", "∞"],
  ["-(1/0)", "∞"],
  ["(1/0)/(1/0)", "⊥"],
  ["1/(1/0)", "0"],
  ["0/(1/0)", "0"],
  ["0/1", "0"],
  ["1/1", "1"],
  ["0*(1/0)", "⊥"],
  ["1+1", "0"],
  ["1+1/0", "∞"],
  ["(1/0)+(1/0)", "⊥"],
  ["(1/0)-(1/0)", "⊥"],
  ["(1/0)/0", "∞"],
  ["//0", "0"],
  ["1//0", "0"],
  ["(0/0)+1", "⊥"],
  ["(0/0)*1", "⊥"],
  ["/(0/0)", "⊥"],
  ["1/(0/0)", "⊥"],
  ["-(0/0)", "⊥"],
  ["1-(0/0)", "⊥"],
];

test("listed values through the parser", () => {
  for (const [expression, expected] of PARSED_VALUES) {
    expect(nameOf(evaluate(parse(expression), CALC))).toBe(expected);
  }
});

test("table command output", () => {
  expect(tableText(CALC)).toBe(TABLE_SNAPSHOT);
});
