import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { Element, NotEnumerable, Ring, Wheel, Z2 } from "../src/algebra.ts";
import { axiomFailures, CALC, groupBFailures, TABLE_SNAPSHOT } from "./helpers.ts";

const SRC = new URL("../src/", import.meta.url);
const REPO = new URL("../", import.meta.url);

function sourceText(name: string): string {
  return readFileSync(new URL(name + ".ts", SRC), "utf8");
}

test("the algebra source contains no display names", () => {
  expect(sourceText("algebra")).not.toMatch(/∞|⊥|inf|bot|nan/i);
});

test("the algebra module does not import presentation modules", () => {
  expect(sourceText("algebra")).not.toMatch(/from\s+"\.\/(parser|presentation|cli)\.ts"/);
});

test("no oracle table line appears in src", () => {
  const lines = TABLE_SNAPSHOT.split("\n").filter((line) => line.length > 0);
  for (const name of ["algebra", "parser", "presentation", "cli"]) {
    const text = sourceText(name);
    for (const line of lines) {
      if (text.includes(line)) throw new Error(name + ".ts contains the oracle line " + JSON.stringify(line));
    }
  }
});

test("package.json declares no runtime dependencies and wires tsgo", () => {
  const pkg = JSON.parse(readFileSync(new URL("package.json", REPO), "utf8"));
  expect(pkg.dependencies).toBeUndefined();
  expect(pkg.scripts.typecheck).toBe("tsgo --noEmit");
  expect(Object.keys(pkg.devDependencies).sort()).toEqual([
    "@types/bun",
    "@typescript/native-preview",
  ]);
});

const Z2_BOOL: Ring<boolean> = {
  zero: false,
  one: true,
  add: (a, b) => a !== b,
  mul: (a, b) => a && b,
  neg: (a) => a,
  elements: () => [false, true],
  eq: (a, b) => a === b,
};

type EU = "e" | "u";
const ADD_EU: Record<string, EU> = { ee: "e", eu: "u", ue: "u", uu: "e" };
const MUL_EU: Record<string, EU> = { ee: "e", eu: "e", ue: "e", uu: "u" };

const Z2_EU: Ring<EU> = {
  zero: "e",
  one: "u",
  add: (a, b) => ADD_EU[a + b],
  mul: (a, b) => MUL_EU[a + b],
  neg: (a) => a,
  elements: () => ["e", "u"],
  eq: (a, b) => a === b,
};

function agreeRelabelled<E>(w: Wheel<E>, map: (e: Element<number>) => Element<E>): boolean {
  const els = CALC.elements();
  for (const a of els) {
    if (!w.eq(w.inv(map(a)), map(CALC.inv(a)))) return false;
    if (!w.eq(w.neg(map(a)), map(CALC.neg(a)))) return false;
    for (const b of els) {
      if (!w.eq(w.add(map(a), map(b)), map(CALC.add(a, b)))) return false;
      if (!w.eq(w.mul(map(a), map(b)), map(CALC.mul(a, b)))) return false;
      if (!w.eq(w.div(map(a), map(b)), map(CALC.div(a, b)))) return false;
      if (!w.eq(w.sub(map(a), map(b)), map(CALC.sub(a, b)))) return false;
    }
  }
  return true;
}

test("relabelled Z/2Z on boolean passes groups B and C", () => {
  const w = new Wheel(Z2_BOOL, [true]);
  expect(groupBFailures(w)).toEqual([]);
  expect(axiomFailures(w)).toEqual([]);
});

test("relabelled Z/2Z on the strings e and u passes groups B and C", () => {
  const w = new Wheel(Z2_EU, ["u"]);
  expect(groupBFailures(w)).toEqual([]);
  expect(axiomFailures(w)).toEqual([]);
});

test("relabelled tables agree up to the relabelling", () => {
  const boolWheel = new Wheel(Z2_BOOL, [true]);
  expect(agreeRelabelled(boolWheel, (e) => boolWheel.element(e.x === 1, e.y === 1))).toBe(true);
  const euWheel = new Wheel(Z2_EU, ["u"]);
  expect(agreeRelabelled(euWheel, (e) => euWheel.element(e.x === 1 ? "u" : "e", e.y === 1 ? "u" : "e"))).toBe(true);
});

const Z3: Ring<number> = {
  zero: 0,
  one: 1,
  add: (a, b) => (a + b) % 3,
  mul: (a, b) => (a * b) % 3,
  neg: (a) => (3 - a) % 3,
  elements: () => [0, 1, 2],
  eq: (a, b) => a === b,
};

test("Z/3Z with S = {1} has 9 elements and is a wheel", () => {
  const w = new Wheel(Z3, [1]);
  expect(w.elements().length).toBe(9);
  // The "exactly for infinity and 0/0" properties of group B describe the shipped
  // four-element wheel; this nine-element wheel has further elements where 0*x != 0.
  expect(groupBFailures(w, undefined, { exactSets: false })).toEqual([]);
  expect(axiomFailures(w)).toEqual([]);
});

test("Z/3Z with S = {1,2} has 5 elements and is a wheel", () => {
  const w = new Wheel(Z3, [1, 2]);
  expect(w.elements().length).toBe(5);
  expect(groupBFailures(w)).toEqual([]);
  expect(axiomFailures(w)).toEqual([]);
  expect(w.normalise(2, 2)).toEqual([1, 1]);
  expect(w.normalise(2, 2)).not.toEqual([2, 2]);
});

const Z4: Ring<number> = {
  zero: 0,
  one: 1,
  add: (a, b) => (a + b) % 4,
  mul: (a, b) => (a * b) % 4,
  neg: (a) => (4 - a) % 4,
  elements: () => [0, 1, 2, 3],
  eq: (a, b) => a === b,
};

const Z_INT: Ring<bigint> = {
  zero: 0n,
  one: 1n,
  add: (a, b) => a + b,
  mul: (a, b) => a * b,
  neg: (a) => -a,
  elements: () => {
    throw new NotEnumerable("the integers have no element enumeration");
  },
  eq: (a, b) => a === b,
};

function gcdBig(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x;
}

const gcdNormaliser = (x: bigint, y: bigint): readonly [bigint, bigint] => {
  if (y === 0n) return x === 0n ? [0n, 0n] : [1n, 0n];
  const g = gcdBig(x, y);
  let nx = x / g;
  let ny = y / g;
  if (ny < 0n) {
    nx = -nx;
    ny = -ny;
  }
  return [nx, ny];
};

const Z_WHEEL = new Wheel(Z_INT, (e: bigint) => e !== 0n, gcdNormaliser);

function rawIntegerPairs(): Element<bigint>[] {
  const out: Element<bigint>[] = [];
  for (let x = -2n; x <= 2n; x++) {
    for (let y = -2n; y <= 2n; y++) out.push(Z_WHEEL.element(x, y));
  }
  return out;
}

function integerClasses(): Element<bigint>[] {
  const out: Element<bigint>[] = [];
  for (const e of rawIntegerPairs()) {
    if (!out.some((seen) => Z_WHEEL.eq(seen, e))) out.push(e);
  }
  return out;
}

test("Z with S = Z without 0 is a wheel over its classes", () => {
  const w = Z_WHEEL;
  const classes = integerClasses();
  expect(classes.length).toBe(9);
  expect(rawIntegerPairs().length).toBe(25);
  for (const raw of rawIntegerPairs()) {
    expect(classes.some((candidate) => w.eq(candidate, raw))).toBe(true);
  }
  expect(groupBFailures(w, classes)).toEqual([]);
  expect(axiomFailures(w, classes)).toEqual([]);
  expect(w.normalise(2n, 4n)).toEqual([1n, 2n]);
  expect(w.normalise(-1n, -2n)).toEqual([1n, 2n]);
  expect(w.eq(w.element(2n, 4n), w.element(1n, 2n))).toBe(true);
  expect(w.eq(w.inv(w.zero), w.div(w.zero, w.zero))).toBe(false);
});

function expectThrows(run: () => unknown, pattern: RegExp): void {
  let caught: unknown = null;
  try {
    run();
  } catch (error) {
    caught = error;
  }
  if (caught === null) throw new Error("expected the call to throw");
  const message = caught instanceof Error ? caught.message : String(caught);
  expect(message).toMatch(pattern);
}

test("S validation rejects invalid submonoids", () => {
  expectThrows(() => new Wheel(Z2, [0, 1]), /additive zero/);
  expectThrows(() => new Wheel(Z2, []), /multiplicative one/);
  expectThrows(() => new Wheel(Z4, [1, 2]), /closed under multiplication/);
  expectThrows(() => new Wheel(Z_INT, (e: bigint) => e !== 0n), /enumeration/);
});

test("normalise is the identity for Z/2Z with S = {1}", () => {
  const pairs: Array<[number, number]> = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ];
  for (const [x, y] of pairs) expect(CALC.normalise(x, y)).toEqual([x, y]);
});
