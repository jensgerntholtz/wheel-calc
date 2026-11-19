/**
 * Presentation: expression grammar, AST and evaluation for the wheel calculator.
 *
 * The parser never computes wheel values; evaluate maps the AST onto the
 * operations of a Wheel instance.
 */

import { Element, Wheel } from "./algebra.ts";

/** A syntax error, carrying the 1-based column of the offending character. */
export class ParseError extends Error {
  readonly column: number;
  readonly detail: string;

  constructor(column: number, detail: string) {
    super("column " + column + ": " + detail);
    this.name = "ParseError";
    this.column = column;
    this.detail = detail;
  }
}

export type Node =
  | { readonly kind: "literal"; readonly digit: "0" | "1" }
  | { readonly kind: "binary"; readonly op: "+" | "-" | "*" | "/"; readonly left: Node; readonly right: Node }
  | { readonly kind: "unary"; readonly op: "-" | "/"; readonly child: Node };

class Scanner {
  private readonly text: string;
  private pos = 0;

  constructor(text: string) {
    this.text = text;
  }

  peek(): string | null {
    while (this.pos < this.text.length && /\s/.test(this.text[this.pos])) this.pos += 1;
    if (this.pos >= this.text.length) return null;
    return this.text[this.pos];
  }

  column(): number {
    return this.pos + 1;
  }

  take(): string {
    const next = this.peek();
    if (next === null) throw new Error("scanner: end of input");
    this.pos += 1;
    return next;
  }
}

function isBinaryOperator(c: string | null): boolean {
  return c === "+" || c === "-" || c === "*" || c === "/";
}

function isAdjacentDigit(c: string | null): boolean {
  return c === "0" || c === "1";
}

const ADJACENT_MESSAGE = "adjacent digits are not allowed; write a single 0 or 1";

export function parse(text: string): Node {
  if (text.trim() === "") throw new ParseError(1, "empty input");
  const scanner = new Scanner(text);

  const expr = (): Node => {
    let node = term();
    for (;;) {
      const op = scanner.peek();
      if (op !== "+" && op !== "-") return node;
      const column = scanner.column();
      scanner.take();
      if (scanner.peek() === null) throw new ParseError(column, "dangling operator '" + op + "'");
      node = { kind: "binary", op: op as "+" | "-", left: node, right: term() };
    }
  };

  const term = (): Node => {
    let node = unary();
    for (;;) {
      const op = scanner.peek();
      if (op !== "*" && op !== "/") return node;
      const column = scanner.column();
      scanner.take();
      if (scanner.peek() === null) throw new ParseError(column, "dangling operator '" + op + "'");
      node = { kind: "binary", op: op as "*" | "/", left: node, right: unary() };
    }
  };

  const unary = (): Node => {
    const op = scanner.peek();
    if (op === "-" || op === "/") {
      const column = scanner.column();
      scanner.take();
      if (scanner.peek() === null) throw new ParseError(column, "dangling operator '" + op + "'");
      return { kind: "unary", op: op as "-" | "/", child: unary() };
    }
    return primary();
  };

  const primary = (): Node => {
    const c = scanner.peek();
    if (c === null) throw new ParseError(scanner.column(), "expected an operand");
    if (c >= "2" && c <= "9") throw new ParseError(scanner.column(), "only digits 0 and 1 exist (found '" + c + "')");
    if (isAdjacentDigit(c)) {
      scanner.take();
      if (isAdjacentDigit(scanner.peek())) throw new ParseError(scanner.column(), ADJACENT_MESSAGE);
      return { kind: "literal", digit: c as "0" | "1" };
    }
    if (c === "(") {
      scanner.take();
      const node = expr();
      if (scanner.peek() !== ")") throw new ParseError(scanner.column(), "unbalanced parentheses: expected ')'");
      scanner.take();
      return node;
    }
    if (c === ")") throw new ParseError(scanner.column(), "unbalanced parentheses: unexpected ')'");
    if (isBinaryOperator(c)) throw new ParseError(scanner.column(), "dangling operator '" + c + "'");
    throw new ParseError(scanner.column(), "unexpected character '" + c + "'");
  };

  const node = expr();
  const trailing = scanner.peek();
  if (trailing === null) return node;
  if (trailing >= "2" && trailing <= "9") {
    throw new ParseError(scanner.column(), "only digits 0 and 1 exist (found '" + trailing + "')");
  }
  if (isAdjacentDigit(trailing)) throw new ParseError(scanner.column(), ADJACENT_MESSAGE);
  if (trailing === ")") throw new ParseError(scanner.column(), "unbalanced parentheses: unexpected ')'");
  if (isBinaryOperator(trailing)) throw new ParseError(scanner.column(), "dangling operator '" + trailing + "'");
  throw new ParseError(scanner.column(), "unexpected character '" + trailing + "'");
}

export function evaluate<E>(node: Node, calc: Wheel<E>): Element<E> {
  if (node.kind === "literal") return node.digit === "0" ? calc.zero : calc.one;
  if (node.kind === "unary") {
    const child = evaluate(node.child, calc);
    return node.op === "-" ? calc.neg(child) : calc.inv(child);
  }
  const left = evaluate(node.left, calc);
  const right = evaluate(node.right, calc);
  switch (node.op) {
    case "+":
      return calc.add(left, right);
    case "-":
      return calc.sub(left, right);
    case "*":
      return calc.mul(left, right);
    case "/":
      return calc.div(left, right);
  }
  throw new Error("unreachable operator");
}
