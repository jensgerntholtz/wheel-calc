/**
 * Presentation: display names, display order, Cayley tables and the help text.
 *
 * This module is the only place that knows the names of the four elements of
 * the shipped calculator (0, 1, infinity and bottom).
 */

import { Element, Ring, Wheel, Z2 } from "./algebra.ts";

/** Generic naming rule, applied to the canonical representative of an element. */
export function formatElement<E>(e: Element<E>, ring: Ring<E>): string {
  if (ring.eq(e.y, ring.one)) return String(e.x);
  if (ring.eq(e.x, ring.one) && ring.eq(e.y, ring.zero)) return "∞";
  if (ring.eq(e.x, ring.zero) && ring.eq(e.y, ring.zero)) return "⊥";
  return "[" + String(e.x) + "," + String(e.y) + "]";
}

/** Display order for tables: 0, 1, infinity, bottom, then anything else by name. */
export function displayOrder<E>(calc: Wheel<E>): Element<E>[] {
  const ranked = [calc.zero, calc.one, calc.inv(calc.zero), calc.div(calc.zero, calc.zero)];
  const rankOf = (e: Element<E>): number => {
    for (let i = 0; i < ranked.length; i++) if (calc.eq(e, ranked[i])) return i;
    return ranked.length;
  };
  return calc.elements().sort((a, b) => {
    const rankA = rankOf(a);
    const rankB = rankOf(b);
    if (rankA !== rankB) return rankA - rankB;
    const nameA = formatElement(a, calc.ring);
    const nameB = formatElement(b, calc.ring);
    return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
  });
}

function grid<E>(
  calc: Wheel<E>,
  order: Element<E>[],
  names: string[],
  cellWidth: number,
  corner: string,
  op: (a: Element<E>, b: Element<E>) => Element<E>,
): string {
  const labelWidth = Math.max(3, corner.length, cellWidth);
  const body = " " + names.map((name) => name.padEnd(cellWidth)).join(" ");
  const lines: string[] = [];
  lines.push(" " + corner.padEnd(labelWidth) + "|" + body);
  lines.push(" " + "-".repeat(labelWidth) + "+" + "-".repeat(body.length));
  for (let row = 0; row < order.length; row++) {
    const cells = order.map((column) => formatElement(op(order[row], column), calc.ring).padEnd(cellWidth));
    lines.push(" " + names[row].padEnd(labelWidth) + "| " + cells.join(" "));
  }
  return lines.join("\n");
}

/** Every table and unary row, computed by calling the wheel operations. */
export function tableText<E>(calc: Wheel<E>): string {
  const order = displayOrder(calc);
  const names = order.map((e) => formatElement(e, calc.ring));
  const cellWidth = Math.max(...names.map((name) => name.length));

  const grids = [
    grid(calc, order, names, cellWidth, "+", (a, b) => calc.add(a, b)),
    grid(calc, order, names, cellWidth, "·", (a, b) => calc.mul(a, b)),
    grid(calc, order, names, cellWidth, "x/y", (a, b) => calc.div(a, b)),
    grid(calc, order, names, cellWidth, "x−y", (a, b) => calc.sub(a, b)),
  ];

  const unary = (label: string, op: (a: Element<E>) => Element<E>): string =>
    " " +
    label +
    " : " +
    order
      .map((e) => formatElement(e, calc.ring) + "→" + formatElement(op(e), calc.ring))
      .join("  ");

  const unaryLines = [unary("/x", (a) => calc.inv(a)), unary("−x", (a) => calc.neg(a))];
  return grids.join("\n\n") + "\n\n" + unaryLines.join("\n");
}

export const HELP = [
  "Wheel calculator over the digits 0 and 1",
  "",
  "expressions:  0 1 + - * / ( )    ('*' and '/' bind tighter than '+' and '-')",
  "prefix:       -x negation, /x reciprocal (both bind tighter than infix operators)",
  "examples:     1/0 = ∞   0/0 = ⊥   /0 = ∞   //0 = 0",
  "symbols:      ∞  division by zero, e.g. 1/0",
  "              ⊥  no value at all, e.g. 0/0; the calculation has no answer",
  "",
  "commands:     table   show the Cayley tables and the unary rows",
  "              help    this text",
  "              quit    leave the repl (also: exit, or end of input)",
].join("\n");

export function buildCalculator(): Wheel<number> {
  return new Wheel(Z2, [Z2.one]);
}
