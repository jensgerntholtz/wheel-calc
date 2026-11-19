import { expect, test } from "bun:test";
import { Element, Wheel, Z2 } from "../src/algebra.ts";
import { axiomFailures, CALC } from "./helpers.ts";

class ZeroMulWheel<E> extends Wheel<E> {
  override mul(a: Element<E>, b: Element<E>): Element<E> {
    if (this.eq(a, this.zero) || this.eq(b, this.zero)) return this.zero;
    return super.mul(a, b);
  }
}

class IdentityReciprocalWheel<E> extends Wheel<E> {
  override inv(a: Element<E>): Element<E> {
    return a;
  }
}

class NaiveAddWheel<E> extends Wheel<E> {
  override add(a: Element<E>, b: Element<E>): Element<E> {
    return this.element(this.ring.add(a.x, b.x), this.ring.add(a.y, b.y));
  }
}

test("the checker accepts the real calculator", () => {
  expect(axiomFailures(CALC)).toEqual([]);
});

test("forcing 0*x to 0 is detected", () => {
  expect(axiomFailures(new ZeroMulWheel(Z2, [Z2.one])).length).toBeGreaterThan(0);
});

test("replacing the reciprocal with the identity is detected", () => {
  expect(axiomFailures(new IdentityReciprocalWheel(Z2, [Z2.one])).length).toBeGreaterThan(0);
});

test("replacing addition with the naive pair sum is detected", () => {
  expect(axiomFailures(new NaiveAddWheel(Z2, [Z2.one])).length).toBeGreaterThan(0);
});
