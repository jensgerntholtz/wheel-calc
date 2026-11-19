import { expect, test } from "bun:test";
import {
  axiomDiagnostics,
  axiomFailures,
  axiomSpecs,
  CALC,
  constants,
  groupBFailures,
  tuplesOf,
} from "./helpers.ts";

test("group B properties over all elements and all pairs and triples", () => {
  expect(groupBFailures(CALC)).toEqual([]);
});

test("the carrier has four elements and H^3 has 64 triples", () => {
  expect(CALC.elements().length).toBe(4);
  expect(tuplesOf(CALC.elements(), 3).length).toBe(64);
});

test("Proposition 1.4.4: 0, 1, /0 and 0/0 are pairwise distinct", () => {
  const { zero, one, inf, bot } = constants(CALC);
  const all = [zero, one, inf, bot];
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      expect(CALC.eq(all[i], all[j])).toBe(false);
    }
  }
});

for (const spec of axiomSpecs(CALC)) {
  test("axiom " + spec.key + ": " + spec.title + " (" + spec.citation + ")", () => {
    expect(axiomDiagnostics(CALC, spec.key)).toEqual([]);
  });
}

test("Proposition 1.3.14: the wheel of fractions over Z/2Z is a wheel", () => {
  expect(axiomFailures(CALC)).toEqual([]);
});
