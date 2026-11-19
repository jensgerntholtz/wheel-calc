import { expect, test } from "bun:test";
import { evaluate, parse, ParseError } from "../src/parser.ts";
import { formatElement } from "../src/presentation.ts";
import { CALC } from "./helpers.ts";

function value(text: string): string {
  return formatElement(evaluate(parse(text), CALC), CALC.ring);
}

function expectParseError(text: string, column: number, pattern: RegExp): void {
  let caught: unknown = null;
  try {
    parse(text);
  } catch (error) {
    caught = error;
  }
  if (caught === null) throw new Error("expected a ParseError for " + JSON.stringify(text));
  if (!(caught instanceof ParseError)) throw new Error("expected a ParseError, got " + String(caught));
  expect(caught.column).toBe(column);
  expect(caught.message).toMatch(pattern);
}

test("precedence and associativity", () => {
  expect(value("1+1*0")).toBe("1");
  expect(value("(1+1)*0")).toBe("0");
  expect(value("1 + 1 * 0")).toBe("1");
  expect(value("1/0*0")).toBe("⊥");
  expect(value("1/0/0")).toBe("∞");
  expect(value("1//0")).toBe("0");
  expect(value("//0")).toBe("0");
  expect(value("-1/0")).toBe("∞");
  expect(value("-(1/0)")).toBe("∞");
});

test("AST of 1/0", () => {
  expect(parse("1/0")).toEqual({
    kind: "binary",
    op: "/",
    left: { kind: "literal", digit: "1" },
    right: { kind: "literal", digit: "0" },
  });
});

test("AST of -(1/0) is not the AST of -1/0", () => {
  expect(parse("-(1/0)")).toEqual({
    kind: "unary",
    op: "-",
    child: {
      kind: "binary",
      op: "/",
      left: { kind: "literal", digit: "1" },
      right: { kind: "literal", digit: "0" },
    },
  });
  expect(parse("-1/0")).toEqual({
    kind: "binary",
    op: "/",
    left: { kind: "unary", op: "-", child: { kind: "literal", digit: "1" } },
    right: { kind: "literal", digit: "0" },
  });
});

test("AST of //0 nests two unary reciprocals", () => {
  expect(parse("//0")).toEqual({
    kind: "unary",
    op: "/",
    child: { kind: "unary", op: "/", child: { kind: "literal", digit: "0" } },
  });
});

test("AST of 1+1*0 binds multiplication tighter", () => {
  expect(parse("1+1*0")).toEqual({
    kind: "binary",
    op: "+",
    left: { kind: "literal", digit: "1" },
    right: {
      kind: "binary",
      op: "*",
      left: { kind: "literal", digit: "1" },
      right: { kind: "literal", digit: "0" },
    },
  });
});

test("empty input", () => {
  expectParseError("", 1, /empty input/);
  expectParseError("   ", 1, /empty input/);
});

test("digits other than 0 and 1", () => {
  expectParseError("2", 1, /only digits 0 and 1 exist/);
  expectParseError("1+2", 3, /only digits 0 and 1 exist/);
  expectParseError("12", 2, /only digits 0 and 1 exist/);
  expectParseError("1 2", 3, /only digits 0 and 1 exist/);
});

test("adjacent digits", () => {
  expectParseError("10", 2, /adjacent digits/);
  expectParseError("01", 2, /adjacent digits/);
  expectParseError("1 0", 3, /adjacent digits/);
});

test("unbalanced parentheses", () => {
  expectParseError("(1", 3, /unbalanced parentheses: expected/);
  expectParseError("1+(1", 5, /unbalanced parentheses: expected/);
  expectParseError("((1)", 5, /unbalanced parentheses: expected/);
  expectParseError("1)", 2, /unbalanced parentheses: unexpected/);
  expectParseError("()", 2, /unbalanced parentheses: unexpected/);
  expectParseError("1)(", 2, /unbalanced parentheses: unexpected/);
  expectParseError("(1))", 4, /unbalanced parentheses: unexpected/);
});

test("dangling operators", () => {
  expectParseError("1+", 2, /dangling operator '\+'/);
  expectParseError("-", 1, /dangling operator '-'/);
  expectParseError("/", 1, /dangling operator '\/'/);
  expectParseError("1**0", 3, /dangling operator '\*'/);
  expectParseError("+1", 1, /dangling operator '\+'/);
  expectParseError("1+-", 3, /dangling operator '-'/);
});

test("unexpected characters", () => {
  expectParseError("x", 1, /unexpected character 'x'/);
  expectParseError(".", 1, /unexpected character '\.'/);
  expectParseError("∞", 1, /unexpected character '∞'/);
  expectParseError("⊥", 1, /unexpected character '⊥'/);
  expectParseError("1(", 2, /unexpected character '\('/);
});
