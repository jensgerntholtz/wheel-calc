/**
 * Shared oracles and law checkers for the test suite.
 *
 * The literal tables below are the independent oracle: they are allowed only in
 * test files and must never appear in the implementation under src/.
 */

import { Element, Ring, Wheel, Z2 } from "../src/algebra.ts";

export const CALC: Wheel<number> = new Wheel(Z2, [Z2.one]);

/** The display order required for tables. */
export const DISPLAYED = ["0", "1", "∞", "⊥"];

export const ORACLE_ADD = [
  ["0", "1", "∞", "⊥"],
  ["1", "0", "∞", "⊥"],
  ["∞", "∞", "⊥", "⊥"],
  ["⊥", "⊥", "⊥", "⊥"],
];

export const ORACLE_MUL = [
  ["0", "0", "⊥", "⊥"],
  ["0", "1", "∞", "⊥"],
  ["⊥", "∞", "∞", "⊥"],
  ["⊥", "⊥", "⊥", "⊥"],
];

export const ORACLE_DIV = [
  ["⊥", "0", "0", "⊥"],
  ["∞", "1", "0", "⊥"],
  ["∞", "∞", "⊥", "⊥"],
  ["⊥", "⊥", "⊥", "⊥"],
];

export const ORACLE_SUB = [
  ["0", "1", "∞", "⊥"],
  ["1", "0", "∞", "⊥"],
  ["∞", "∞", "⊥", "⊥"],
  ["⊥", "⊥", "⊥", "⊥"],
];

export const ORACLE_INV = ["∞", "1", "0", "⊥"];
export const ORACLE_NEG = ["0", "1", "∞", "⊥"];

/** Exact expected output of the table command. */
export const TABLE_SNAPSHOT = [
  " +  | 0 1 ∞ ⊥",
  " ---+--------",
  " 0  | 0 1 ∞ ⊥",
  " 1  | 1 0 ∞ ⊥",
  " ∞  | ∞ ∞ ⊥ ⊥",
  " ⊥  | ⊥ ⊥ ⊥ ⊥",
  "",
  " ·  | 0 1 ∞ ⊥",
  " ---+--------",
  " 0  | 0 0 ⊥ ⊥",
  " 1  | 0 1 ∞ ⊥",
  " ∞  | ⊥ ∞ ∞ ⊥",
  " ⊥  | ⊥ ⊥ ⊥ ⊥",
  "",
  " x/y| 0 1 ∞ ⊥",
  " ---+--------",
  " 0  | ⊥ 0 0 ⊥",
  " 1  | ∞ 1 0 ⊥",
  " ∞  | ∞ ∞ ⊥ ⊥",
  " ⊥  | ⊥ ⊥ ⊥ ⊥",
  "",
  " x−y| 0 1 ∞ ⊥",
  " ---+--------",
  " 0  | 0 1 ∞ ⊥",
  " 1  | 1 0 ∞ ⊥",
  " ∞  | ∞ ∞ ⊥ ⊥",
  " ⊥  | ⊥ ⊥ ⊥ ⊥",
  "",
  " /x : 0→∞  1→1  ∞→0  ⊥→⊥",
  " −x : 0→0  1→1  ∞→∞  ⊥→⊥",
].join("\n");

export interface Constants<E> {
  zero: Element<E>;
  one: Element<E>;
  inf: Element<E>;
  bot: Element<E>;
}

/** The four distinguished constants, derived from the operations only. */
export function constants<E>(calc: Wheel<E>): Constants<E> {
  const zero = calc.zero;
  return { zero, one: calc.one, inf: calc.inv(zero), bot: calc.div(zero, zero) };
}

/** All tuples of the given arity over the supplied elements. */
export function tuplesOf<E>(elems: readonly Element<E>[], arity: number): Element<E>[][] {
  let out: Element<E>[][] = [[]];
  for (let i = 0; i < arity; i++) {
    const next: Element<E>[][] = [];
    for (const prefix of out) {
      for (const e of elems) next.push(prefix.concat([e]));
    }
    out = next;
  }
  return out;
}

export interface AxiomSpec<E> {
  key: string;
  title: string;
  citation: string;
  arity: number;
  holds: (args: Element<E>[]) => boolean;
}

/** Axioms 1.1 to 1.8, the involution laws and the derived rules 1.9 to 1.13. */
export function axiomSpecs<E>(calc: Wheel<E>): AxiomSpec<E>[] {
  const { zero, one, bot } = constants(calc);
  const add = (a: Element<E>, b: Element<E>): Element<E> => calc.add(a, b);
  const mul = (a: Element<E>, b: Element<E>): Element<E> => calc.mul(a, b);
  const inv = (a: Element<E>): Element<E> => calc.inv(a);
  const div = (a: Element<E>, b: Element<E>): Element<E> => calc.div(a, b);
  const eq = (a: Element<E>, b: Element<E>): boolean => calc.eq(a, b);
  const page5 = "Def. 1.1.1, thesis p. 5";
  const page24 = "Prop. 1.3.14, thesis p. 24";
  const page26 = "Prop. 1.4.3, thesis p. 26";
  return [
    { key: "1.1-add-commutativity", title: "x + y = y + x", citation: page5, arity: 2, holds: ([x, y]) => eq(add(x, y), add(y, x)) },
    { key: "1.1-add-associativity", title: "(x + y) + z = x + (y + z)", citation: page5, arity: 3, holds: ([x, y, z]) => eq(add(add(x, y), z), add(x, add(y, z))) },
    { key: "1.1-add-identity", title: "0 + x = x", citation: page5, arity: 1, holds: ([x]) => eq(add(zero, x), x) },
    { key: "1.2-mul-commutativity", title: "x·y = y·x", citation: page5, arity: 2, holds: ([x, y]) => eq(mul(x, y), mul(y, x)) },
    { key: "1.2-mul-associativity", title: "(x·y)·z = x·(y·z)", citation: page5, arity: 3, holds: ([x, y, z]) => eq(mul(mul(x, y), z), mul(x, mul(y, z))) },
    { key: "1.2-mul-identity", title: "1·x = x", citation: page5, arity: 1, holds: ([x]) => eq(mul(one, x), x) },
    { key: "1.2-involution", title: "//x = x", citation: "Def. 1.2.1, thesis section 1.2.1", arity: 1, holds: ([x]) => eq(inv(inv(x)), x) },
    { key: "1.2-reciprocal-product", title: "/(x·y) = /y·/x", citation: "Def. 1.2.1, thesis section 1.2.1", arity: 2, holds: ([x, y]) => eq(inv(mul(x, y)), mul(inv(y), inv(x))) },
    { key: "1.3-distributivity", title: "(x + y)z + 0z = xz + yz", citation: page5, arity: 3, holds: ([x, y, z]) => eq(add(mul(add(x, y), z), mul(zero, z)), add(mul(x, z), mul(y, z))) },
    { key: "1.4-division-rule", title: "x/y + z + 0y = (x + yz)/y", citation: page5, arity: 3, holds: ([x, y, z]) => eq(add(add(div(x, y), z), mul(zero, y)), div(add(x, mul(y, z)), y)) },
    { key: "1.5-zero-times-zero", title: "0·0 = 0", citation: page5, arity: 0, holds: () => eq(mul(zero, zero), zero) },
    { key: "1.6-shift-multiplication", title: "(x + 0y)z = xz + 0y", citation: page5, arity: 3, holds: ([x, y, z]) => eq(mul(add(x, mul(zero, y)), z), add(mul(x, z), mul(zero, y))) },
    { key: "1.7-shift-reciprocal", title: "/(x + 0y) = /x + 0y", citation: page5, arity: 2, holds: ([x, y]) => eq(inv(add(x, mul(zero, y))), add(inv(x), mul(zero, y))) },
    { key: "1.8-bottom-absorption", title: "x + 0/0 = 0/0", citation: page5, arity: 1, holds: ([x]) => eq(add(x, bot), bot) },
    { key: "1.9-reciprocal-of-one", title: "/1 = 1", citation: page26, arity: 0, holds: () => eq(inv(one), one) },
    { key: "1.10-zero-products", title: "0x + 0y = 0xy", citation: page26, arity: 2, holds: ([x, y]) => eq(add(mul(zero, x), mul(zero, y)), mul(zero, mul(x, y))) },
    { key: "1.11-bottom-times-x", title: "(0/0)x = 0/0", citation: page26, arity: 1, holds: ([x]) => eq(mul(bot, x), bot) },
    { key: "1.12-self-division", title: "x/x = 1 + 0x/x", citation: page26, arity: 1, holds: ([x]) => eq(div(x, x), add(one, div(mul(zero, x), x))) },
    { key: "1.13-cancellation", title: "xz = yz implies x + 0z/z = y + 0z/z", citation: page26, arity: 3, holds: ([x, y, z]) => !eq(mul(x, z), mul(y, z)) || eq(add(x, div(mul(zero, z), z)), add(y, div(mul(zero, z), z))) },
    { key: "p27-negation-rule", title: "x - x = 0x·x", citation: "thesis p. 27", arity: 1, holds: ([x]) => eq(calc.sub(x, x), mul(zero, mul(x, x))) },
  ];
}

/** Names of the axioms that fail somewhere on the supplied element set. */
export function axiomFailures<E>(calc: Wheel<E>, elements?: readonly Element<E>[]): string[] {
  const els = elements ?? calc.elements();
  const failures: string[] = [];
  for (const spec of axiomSpecs(calc)) {
    const bad = tuplesOf(els, spec.arity).find((tuple) => !spec.holds(tuple));
    if (bad !== undefined) failures.push(spec.key);
  }
  return failures;
}

/** Failure diagnostics for one named axiom (empty when it holds everywhere). */
export function axiomDiagnostics<E>(calc: Wheel<E>, key: string, elements?: readonly Element<E>[]): string[] {
  const spec = axiomSpecs(calc).find((candidate) => candidate.key === key);
  if (spec === undefined) throw new Error("unknown axiom " + key);
  const els = elements ?? calc.elements();
  const bad = tuplesOf(els, spec.arity).filter((tuple) => !spec.holds(tuple));
  if (bad.length === 0) return [];
  return [spec.key + " " + spec.title + " fails (" + spec.citation + ")"];
}

/** The properties listed in group B, independent of display names. */
export function groupBFailures<E>(
  calc: Wheel<E>,
  elements?: readonly Element<E>[],
  options: { exactSets?: boolean } = {},
): string[] {
  const els = elements ?? calc.elements();
  const { zero, one, inf, bot } = constants(calc);
  const pairs = tuplesOf(els, 2);
  const triples = tuplesOf(els, 3);
  const failures: string[] = [];
  const check = (name: string, ok: boolean): void => {
    if (!ok) failures.push(name);
  };

  check("+ is commutative", pairs.every(([x, y]) => calc.eq(calc.add(x, y), calc.add(y, x))));
  check("+ is associative", triples.every(([x, y, z]) => calc.eq(calc.add(calc.add(x, y), z), calc.add(x, calc.add(y, z)))));
  check("· is commutative", pairs.every(([x, y]) => calc.eq(calc.mul(x, y), calc.mul(y, x))));
  check("· is associative", triples.every(([x, y, z]) => calc.eq(calc.mul(calc.mul(x, y), z), calc.mul(x, calc.mul(y, z)))));
  check("0 + x = x", els.every((x) => calc.eq(calc.add(zero, x), x)));
  check("1·x = x", els.every((x) => calc.eq(calc.mul(one, x), x)));
  check("/x = 1/x", els.every((x) => calc.eq(calc.inv(x), calc.div(one, x))));

  check("+ absorbs 0/0", els.every((x) => calc.eq(calc.add(bot, x), bot) && calc.eq(calc.add(x, bot), bot)));
  check("· absorbs 0/0", els.every((x) => calc.eq(calc.mul(bot, x), bot) && calc.eq(calc.mul(x, bot), bot)));
  check("unary / maps 0/0 to 0/0", calc.eq(calc.inv(bot), bot));
  check("unary - maps 0/0 to 0/0", calc.eq(calc.neg(bot), bot));
  check("binary / absorbs 0/0", els.every((x) => calc.eq(calc.div(bot, x), bot) && calc.eq(calc.div(x, bot), bot)));
  check("binary - absorbs 0/0", els.every((x) => calc.eq(calc.sub(bot, x), bot) && calc.eq(calc.sub(x, bot), bot)));

  if (options.exactSets ?? true) {
    const subOffenders = els.filter((x) => !calc.eq(calc.sub(x, x), zero));
    check(
      "x - x differs from 0 exactly for infinity and 0/0",
      subOffenders.length === 2 && subOffenders.every((x) => calc.eq(x, inf) || calc.eq(x, bot)),
    );

    const zeroMulOffenders = els.filter((x) => !calc.eq(calc.mul(zero, x), zero));
    check(
      "0·x differs from 0 exactly for infinity and 0/0",
      zeroMulOffenders.length === 2 && zeroMulOffenders.every((x) => calc.eq(x, inf) || calc.eq(x, bot)),
    );
  }

  return failures;
}
