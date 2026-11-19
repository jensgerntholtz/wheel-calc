/**
 * Algebra section of the two-digit wheel calculator.
 *
 * Everything in this file is generic over a commutative ring: Ring is the ring
 * interface, Element is a canonical pair, Wheel is the wheel of fractions over
 * that ring and a multiplicative submonoid S. Display names of the elements
 * belong to the presentation modules, never here.
 */

export interface Ring<E> {
  readonly zero: E;
  readonly one: E;
  add(a: E, b: E): E;
  mul(a: E, b: E): E;
  neg(a: E): E;
  /** Every element of the ring; rings with no enumeration throw NotEnumerable. */
  elements(): readonly E[];
  eq(a: E, b: E): boolean;
}

/** Thrown by rings that cannot list their elements (for example the integers). */
export class NotEnumerable extends Error {
  constructor(message: string = "this ring does not enumerate its elements") {
    super(message);
    this.name = "NotEnumerable";
  }
}

/** The ring of integers modulo 2: addition is xor, multiplication is and. */
export const Z2: Ring<number> = {
  zero: 0,
  one: 1,
  add: (a, b) => a ^ b,
  mul: (a, b) => a & b,
  neg: (a) => a,
  elements: () => [0, 1],
  eq: (a, b) => a === b,
};

/** Canonical representative of an equivalence class of pairs. */
export class Element<E> {
  readonly x: E;
  readonly y: E;

  constructor(x: E, y: E) {
    this.x = x;
    this.y = y;
  }
}

/** A multiplicative submonoid: either an explicit list or a membership test. */
export type Submonoid<E> = Iterable<E> | ((e: E) => boolean);

/** Maps a raw pair to the canonical representative of its class. */
export type Normaliser<E> = (x: E, y: E) => readonly [E, E];

function contains<E>(ring: Ring<E>, S: Submonoid<E>, e: E): boolean {
  if (typeof S === "function") return S(e);
  for (const candidate of S) if (ring.eq(candidate, e)) return true;
  return false;
}

function tryElements<E>(ring: Ring<E>): readonly E[] | null {
  try {
    return ring.elements();
  } catch (error) {
    if (error instanceof NotEnumerable) return null;
    throw error;
  }
}

function buildNormaliser<E>(ring: Ring<E>, els: readonly E[], S: readonly E[]): Normaliser<E> {
  const pairs: Array<readonly [E, E]> = [];
  for (const x of els) for (const y of els) pairs.push([x, y]);

  const rankOf = (value: E): number => {
    for (let i = 0; i < els.length; i++) {
      if (ring.eq(els[i], value)) return i;
    }
    throw new Error("normalise: value is not an element of the ring");
  };

  const equivalent = (x: E, y: E, z: E, w: E): boolean => {
    for (const s of S) {
      for (const t of S) {
        if (ring.eq(ring.mul(s, x), ring.mul(t, z)) && ring.eq(ring.mul(s, y), ring.mul(t, w))) {
          return true;
        }
      }
    }
    return false;
  };

  const canonical: Array<readonly [E, E]> = pairs.map(([x, y]) => {
    let best: readonly [E, E] | null = null;
    let bestRank = pairs.length * els.length;
    for (const [z, w] of pairs) {
      if (!equivalent(x, y, z, w)) continue;
      const rank = rankOf(z) * els.length + rankOf(w);
      if (rank < bestRank) {
        bestRank = rank;
        best = [z, w];
      }
    }
    if (best === null) throw new Error("normalise: empty equivalence class");
    return best;
  });

  return (x, y) => {
    for (let i = 0; i < pairs.length; i++) {
      const [px, py] = pairs[i];
      if (ring.eq(px, x) && ring.eq(py, y)) return canonical[i];
    }
    throw new Error("normalise: pair is not over elements of the ring");
  };
}

/** The wheel of fractions over a commutative ring and a multiplicative submonoid S. */
export class Wheel<E> {
  readonly ring: Ring<E>;
  readonly zero: Element<E>;
  readonly one: Element<E>;
  private readonly normaliseFn: Normaliser<E>;
  private readonly ringElements: readonly E[] | null;
  readonly negOne: Element<E>;

  constructor(ring: Ring<E>, S: Submonoid<E>, normalise?: Normaliser<E>) {
    this.ring = ring;
    const finite = tryElements(ring);
    this.ringElements = finite;

    if (!contains(ring, S, ring.one)) {
      throw new Error("S must contain the multiplicative one of the ring");
    }
    if (contains(ring, S, ring.zero)) {
      throw new Error("S must not contain the additive zero: the wheel of fractions would be trivial");
    }

    if (finite !== null) {
      const effective = finite.filter((e) => contains(ring, S, e));
      for (const a of effective) {
        for (const b of effective) {
          if (!contains(ring, S, ring.mul(a, b))) {
            throw new Error("S is not closed under multiplication: " + String(a) + " * " + String(b) + " is not in S");
          }
        }
      }
      this.normaliseFn = normalise ?? buildNormaliser(ring, finite, effective);
    } else if (normalise !== undefined) {
      this.normaliseFn = normalise;
    } else {
      throw new Error("ring has no element enumeration; pass a normaliser");
    }

    this.zero = this.element(ring.zero, ring.one);
    this.one = this.element(ring.one, ring.one);
    this.negOne = this.element(ring.neg(ring.one), ring.one);
  }

  normalise(x: E, y: E): readonly [E, E] {
    return this.normaliseFn(x, y);
  }

  element(x: E, y: E): Element<E> {
    const [nx, ny] = this.normalise(x, y);
    return new Element(nx, ny);
  }

  eq(a: Element<E>, b: Element<E>): boolean {
    return this.ring.eq(a.x, b.x) && this.ring.eq(a.y, b.y);
  }

  /** Raw pair of the sum, before normalisation (exposed for explanations). */
  rawAdd(a: Element<E>, b: Element<E>): readonly [E, E] {
    return [
      this.ring.add(this.ring.mul(a.x, b.y), this.ring.mul(b.x, a.y)),
      this.ring.mul(a.y, b.y),
    ];
  }

  /** Raw pair of the product, before normalisation. */
  rawMul(a: Element<E>, b: Element<E>): readonly [E, E] {
    return [this.ring.mul(a.x, b.x), this.ring.mul(a.y, b.y)];
  }

  /** Raw pair of the reciprocal, before normalisation. */
  rawInv(a: Element<E>): readonly [E, E] {
    return [a.y, a.x];
  }

  /** Raw pair of the additive inverse, before normalisation. */
  rawNeg(a: Element<E>): readonly [E, E] {
    return this.rawMul(this.negOne, a);
  }

  add(a: Element<E>, b: Element<E>): Element<E> {
    const [x, y] = this.rawAdd(a, b);
    return this.element(x, y);
  }

  mul(a: Element<E>, b: Element<E>): Element<E> {
    const [x, y] = this.rawMul(a, b);
    return this.element(x, y);
  }

  inv(a: Element<E>): Element<E> {
    const [x, y] = this.rawInv(a);
    return this.element(x, y);
  }

  neg(a: Element<E>): Element<E> {
    const [x, y] = this.rawNeg(a);
    return this.element(x, y);
  }

  sub(a: Element<E>, b: Element<E>): Element<E> {
    return this.add(a, this.neg(b));
  }

  div(a: Element<E>, b: Element<E>): Element<E> {
    return this.mul(a, this.inv(b));
  }

  elements(): Element<E>[] {
    const els = this.ringElements;
    if (els === null) throw new NotEnumerable();
    const rankOf = (value: E): number => {
      for (let i = 0; i < els.length; i++) {
        if (this.ring.eq(els[i], value)) return i;
      }
      throw new Error("value is not an element of the ring");
    };
    const out: Element<E>[] = [];
    for (const x of els) {
      for (const y of els) {
        const candidate = this.element(x, y);
        if (!out.some((seen) => this.eq(seen, candidate))) out.push(candidate);
      }
    }
    out.sort((p, q) => rankOf(p.x) - rankOf(q.x) || rankOf(p.y) - rankOf(q.y));
    return out;
  }
}
