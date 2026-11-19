# Prompt: two-digit wheel calculator

## Goal
Build a calculator over the digits 0 and 1 where division by zero is defined, including `0/0`. It
must be an actual algebra: the results come out of the construction, they are not listed.

## Backround
This repo is simply an investigation of what a different arithmetic system would look like.
It's by no means accurate, just a thought experiment.
I have very little understanding of mathematics, but this a learning project, that I have used DS v4.1 Flash to implement.

You may use the original [PROMPT.md](PROMPT.md) to have your jab at it. 

## Source of truth
All definitions below were checked against the paper text on 2026-11-19. Cite the 2005 version.

| Version | Where | Status |
|---|---|---|
| **Canonical: 2005 thesis reprint**, ch. 1 of J. Carlström, *Partiality and Choice: Foundational Contributions*, PhD thesis, Stockholm University, 2005 | DiVA `diva2:194366`, https://www.diva-portal.org/smash/get/diva2:194366/FULLTEXT01.pdf | Free. Latest author revision. Says only a few words changed from the journal, plus proofs the journal left out. |
| Journal: "Wheels – On Division by Zero", *Math. Struct. in Comp. Sci.* 14(1), 2004, pp. 143–184 | DOI `10.1017/S0960129503004110` | Paywalled, not checked. |
| Preprint: Stockholm Univ. Research Reports in Mathematics 2001:11 (licentiate thesis) | https://www2.math.su.se/reports/2001/11/2001-11.pdf | Free. Axioms identical to the 2005 version, numbered (1)–(8) instead of (1.1)–(1.8). |
| Author's corrections page | `https://www2.math.su.se/~jesper/research/wheels/` | HTTP 404, so errata can't be checked. |

Note: DiVA record `diva2:194362`, cited in earlier drafts of this prompt, is the journal paper's
record. The free full text is the thesis, `diva2:194366`.

Section and equation numbers below follow the 2005 thesis, with 2001 report numbers in brackets.

## Background
- Division by 0 cannot be added to a field. If 1/0 existed with the ring axioms, then
  1 = 0·(1/0) = 0, which collapses the ring. Any total division gives up a field law.
- Wheels add `/0` (shown here as `∞`) and an absorbing `0/0` (shown here as `⊥`). They weaken some
  ring laws: `0x = 0` fails in general, and `x − x = 0x²` takes the place of `x − x = 0`.
- Related, for contrast only: common meadows (Bergstra & Ponse: one absorbing `⊥`, `1/0 = ⊥`), the
  projective line (`1/0 = ∞`, `0/0` undefined), IEEE 754 (`NaN`), transreal arithmetic (`Φ`).

## Mathematical specification (from the paper)

### Wheel of fractions (thesis p. 4 [report p. 4–5])
Let A be a commutative ring and S a multiplicative submonoid of A.
- Carrier: `A × A / ≡S`, where
  `(x,y) ≡S (x',y')  ⇔  ∃ s, s' ∈ S : (sx, sy) = (s'x', s'y')`.
- `0 = [0,1]`, `1 = [1,1]`
- `[x,y] + [x',y'] = [xy' + x'y, yy']`
- `[x,y] · [x',y'] = [xx', yy']`
- `/[x,y] = [y,x]` (unary reciprocal)

Derived operations, from the definition footnote on thesis p. 4 and §1.4 on p. 27:
- Binary division: `x / y = x · (/y)`. Also `/y = 1/y`.
- Negation: `−x = a·x`, where `a = [−1, 1]` solves `1 + a = 0`. So `−[x,y] = [−x, y]`, using ring
  negation on the numerator only.
- Subtraction: `x − y = x + (−y)`.

### Z/2Z case
- The only usable S is `{1}`. The paper writes the wheel as `{1}(Z/2Z)` (ex. 3, p. 5) and
  `∅(Z/2Z)` (p. 27). Both mean the same thing, because the empty set generates the monoid `{1}`.
  With `S = {1}`, `≡S` is equality, so `normalise` is the identity.
- Ring: `+` is XOR, `·` is AND, and `−x = x`. So wheel negation is the identity, and `x − y = x + y`.
- 4 elements. Prop 1.4.4 [report Prop 4.4]: if any two of `0, 1, /0, 0/0` are equal, the wheel is
  trivial. So this is the smallest non-trivial wheel, unique up to isomorphism.

### Wheel axioms, Definition 1.1.1, thesis p. 5 [report Def 1.1, p. 5]
A wheel is a structure `⟨H, 0, 1, +, ·, /⟩` where `x/y` abbreviates `x·/y`:

| # | Axiom |
|---|---|
| 1.1 | `⟨H, 0, +⟩` is a commutative monoid |
| 1.2 | `⟨H, 1, ·, /⟩` is a commutative monoid with involution `/` |
| 1.3 | `(x + y)z + 0z = xz + yz` |
| 1.4 | `x/y + z + 0y = (x + yz)/y` |
| 1.5 | `0·0 = 0` |
| 1.6 | `(x + 0y)z = xz + 0y` |
| 1.7 | `/(x + 0y) = /x + 0y` |
| 1.8 | `x + 0/0 = 0/0` |

Involution, Def 1.2.1 (§1.2.1): `//x = x` and `/(xy) = /y·/x`.

Precedence (p. 5): lower arity binds tighter, and `·` binds tighter than `+`.

### Derived rules, Prop 1.4.3, thesis p. 26 [report rules (9)–(13), p. 24]
| # | Rule |
|---|---|
| 1.9 | `/1 = 1` |
| 1.10 | `0x + 0y = 0xy` |
| 1.11 | `(0/0)x = 0/0` |
| 1.12 | `x/x = 1 + 0x/x` |
| 1.13 | `xz = yz ⇒ x + 0z/z = y + 0z/z` |

Also, from p. 27: `x − x = 0x²` when `−x = a·x` with `1 + a = 0`.

Prop 1.3.14, p. 24: every wheel of fractions is a wheel. The tests check this rather than assume
it.

## Requirements

### 1. Real arithmetic
- Implement the wheel-of-fractions construction over a ring class.
- The ring for v1 is Z/2Z, with addition as XOR and multiplication as AND on bits.
- Wheel `+`, `·`, unary `/`, binary `/`, unary `−` and binary `−` are defined only by the formulas
  above.
- No lookup table. No special-casing of `0/0`, `1/0`, `∞` or `⊥`. No `if` on pair values in the
  algebra code, apart from the generic `normalise` hook.

### 2. Generic over (ring, S)
- `Ring` interface: `zero`, `one`, `add(a,b)`, `mul(a,b)`, `neg(a)`, `eq(a,b)`, and
  `elements()` (finite rings only; may throw for infinite rings).
- The wheel class takes a ring and a multiplicative submonoid S (for example
  `new Wheel(Z2, [Z2.one])`). No wheel code changes when the ring changes. S is a finite list for
  Z/2Z and Z/3Z, and a membership predicate for Z (an infinite set cannot be listed).
- `normalise(x, y)` returns a canonical representative of the `≡S` class.
  - Default for finite rings: generic brute force over the class
    `{(x',y') : ∃ s,s' ∈ S, (sx,sy) = (s'x',s'y')}`. Pick the minimum under `elements()` order.
  - A ring/S pair may supply its own normaliser. Example for Z with `S = Z∖{0}`: divide by the
    gcd, then make `y > 0`, or `x > 0` when `y = 0`. `(0,0)` stays `(0,0)`.
  - Every operation normalises its result. Equality of wheel elements is equality of normalised
    pairs.
  - For Z/2Z with `S = {1}`, `normalise` must come out as the identity. A test confirms this.
- Validate S on construction: `one ∈ S`, closed under `mul`. If `zero ∈ S`, reject S with a clear
  error, since `≡S` would collapse to the trivial wheel. Checked by enumeration for finite rings.

### 3. Elements and display names
- `0 = [0,1]`, `1 = [1,1]`, `∞ = [1,0]`, `⊥ = [0,0]`. The paper writes `/0` and `0/0` for the last
  two.
- Names come from the normalised pair, for printing only. Generic rule: `[x,1] → String(x)`,
  `[1,0] → ∞`, `[0,0] → ⊥`, anything else `→ [x,y]`.
- Behaviour never branches on a name.
- `src/algebra.ts` is the algebra section: `Ring`, `Z2`, `Wheel`, element type.
  `src/parser.ts`, `src/presentation.ts` and `src/cli.ts` are presentation (formatter, parser,
  REPL, `table`). Only presentation files may contain `∞`, `⊥` or element names.
- Display order for tables is `0, 1, ∞, ⊥`. The order comes from a sort key in the presentation
  layer.

### 4. Input
Grammar, with whitespace ignored:
```
expr    := term (('+' | '-') term)*            left-assoc
term    := unary (('*' | '/') unary)*          left-assoc
unary   := '-' unary | '/' unary | primary     prefix '-' = negation, prefix '/' = reciprocal
primary := '0' | '1' | '(' expr ')'
```
- A prefix `/` counts as unary only at the start of an operand. So `1/0` is binary and `/0` is
  unary.
- Each literal is one digit. Adjacent digits such as `10` or `01` are an error, not a number.
- Clear errors, each with the column number:
  - a digit `2`–`9`: "only digits 0 and 1 exist"
  - any other character, including `∞`, `⊥`, `.` and letters
  - unbalanced parentheses
  - empty input
  - a dangling operator
  - adjacent digits
- The parser builds an AST, and evaluation calls the wheel operations. The parser never computes
  values itself.

### 5. CLI, REPL and `table`
- `bun src/cli.ts` starts the REPL with the prompt `> `.
  - An expression prints its name only. For example, `0/0` prints `⊥`.
  - Commands: `table`, `help`, `quit` / `exit`, and EOF.
  - Errors print a message and the REPL continues.
- `bun src/cli.ts "<expr>"` evaluates once, prints the result and exits with code 0. A parse
  error prints to stderr and exits with code 1.
- `bun src/cli.ts table` prints the tables and exits.
- `table` prints, all computed by calling the wheel operations over `elements()`:
  - Cayley tables for `+`, `·`, binary `/` and binary `−`.
  - Rows for unary `−` and unary `/`.

### 6. Language and files
- TypeScript executed by Bun 1.4.4 (no build step), no npm runtime dependencies: `src/algebra.ts`
  (algebra), `src/parser.ts`, `src/presentation.ts` and `src/cli.ts` (presentation), plus
  `package.json`/`bun.lock` with the `start`, `table`, `test` and `typecheck` scripts.
- Tests use the built-in `bun:test` module in `test/`, so they run with `bun test`.
- Types are checked with the TypeScript 7 native preview compiler: `bun run typecheck` runs
  `tsgo --noEmit` against `tsconfig.json`. Dev dependencies are `@typescript/native-preview`
  and `@types/bun`, installed with `bun install`.

## Expected values
These were hand-derived. The tests must confirm them from the formulas. The tables may appear as
literals in the `test/` files only, where they serve as an independent oracle. They must never
appear in `src/`.

`1/0 = ∞`, `0/0 = ⊥`, `∞/∞ = ⊥`, `1/∞ = 0`, `0/1 = 0`, `1/1 = 1`, `0·∞ = ⊥`, `1+1 = 0`,
`1+∞ = ∞`, `∞+∞ = ⊥`, `∞−∞ = ⊥`, `∞/0 = ∞`, `0/∞ = 0`, and `⊥` absorbs under every operation.

```
 +  | 0 1 ∞ ⊥        ·  | 0 1 ∞ ⊥        x/y| 0 1 ∞ ⊥   (row x, column y)
 ---+--------        ---+--------        ---+--------
 0  | 0 1 ∞ ⊥        0  | 0 0 ⊥ ⊥        0  | ⊥ 0 0 ⊥
 1  | 1 0 ∞ ⊥        1  | 0 1 ∞ ⊥        1  | ∞ 1 0 ⊥
 ∞  | ∞ ∞ ⊥ ⊥        ∞  | ⊥ ∞ ∞ ⊥        ∞  | ∞ ∞ ⊥ ⊥
 ⊥  | ⊥ ⊥ ⊥ ⊥        ⊥  | ⊥ ⊥ ⊥ ⊥        ⊥  | ⊥ ⊥ ⊥ ⊥

 x−y: same as +, since −y = y over Z/2Z
 /x : 0→∞  1→1  ∞→0  ⊥→⊥
 −x : identity
```

## Tests (`test/`)
Run with `bun test` from the repo root (milliseconds; no wrapper and no long timeout needed).
Type check with `bun run typecheck` (`tsgo --noEmit`, TypeScript 7 native preview).

### A. Expected values
- Every value above, and every table cell, evaluated through the wheel operations.
- The same values again through the parser (`"1/0"`, `"-(1/0)"`, `"/0"`, and so on).

### B. Properties, over all elements and all pairs/triples
- `+` and `·` are commutative and associative.
- Identities: `0 + x = x` and `1·x = x`.
- `/x == 1/x`.
- `⊥` absorbs under `+`, `·`, unary `/`, binary `/`, unary `−` and binary `−`.
- `x − x = 0` fails exactly for `{∞, ⊥}`.
- `0·x = 0` fails exactly for `{∞, ⊥}`.

### C. Paper axioms
- Each of 1.1–1.8, plus the involution laws, is encoded as a named equation with its thesis number
  and page in the test name or docstring. Each is checked exhaustively over H³: 64 triples for
  Z/2Z.
- Derived rules 1.9–1.13 and `x − x = 0x²`, checked exhaustively.
- Prop 1.4.4: the four constants `0`, `1`, `/0` and `0/0` are pairwise distinct.
- The axiom text in the tests must match the "Wheel axioms" table above, which was taken from the
  paper. Do not re-derive it.

### D. Anti-hard-coding
1. **Source scan**: read `src/algebra.ts` and assert its text contains none of `∞`, `⊥`, `inf`,
   `bot` or `nan`, case-insensitive.
2. **Relabelled ring**: Z/2Z built on `boolean` (false/true) or on the strings `'e'`/`'u'` instead of
   0/1. The same `Wheel` code must pass groups B and C, and the tables must agree up to the
   relabelling. This catches code that compares raw pairs such as `(1,0)`.
3. **Z/3Z**, test-only ring:
   - With `S = {1}`: 9 elements, axioms pass exhaustively.
   - With `S = {1,2}`: 5 elements (`0, 1, 2, /0, 0/0`), axioms pass, and `normalise` is not the
     identity there.
4. **Z**, test-only ring, with `S = Z∖{0}` (a membership predicate) and a gcd normaliser. Axioms
   are checked over all triples of the 9 distinct classes of pairs with entries in −2..2 (729
   triples); all 25 raw pairs are asserted to map into those classes. Expect `[2,4] == [1,2]`,
   `[−1,−2] == [1,2]`, and `/0 ≠ 0/0`.
5. **Validation**: constructing a wheel with `0 ∈ S` throws.

### E. Mutation check (the checker must be able to fail)
Run the axiom checker against deliberately broken wheels. Each must fail at least one axiom:
- `0·x` forced to `0`
- `/` replaced by the identity
- `+` replaced by a naive `[x+x', y+y']`

This proves group C actually detects errors.

### F. Parser and CLI
- Precedence and associativity, for example:
  - `1+1*0 = 1`
  - `1/0*0 = ⊥`, because `(1/0)·0 = ∞·0`
  - `-1/0`
  - `//0 = 0`
- Every error case in Requirement 4, with its column.
- One-shot CLI exit codes 0, 1 and 2, via `spawnSync(process.execPath, ["src/cli.ts", …])`.
- The `table` output equals the oracle tables.

## Out of scope for v1
- Rings other than Z/2Z in the shipped calculator. Z/3Z and Z live only in the tests.
- Input of `∞` or `⊥` as literals. Use `1/0` and `0/0`.
- Simplifying symbolic expressions or variables.

## Open decisions for the user
1. **`--compare` flag**: show the same expression under common-meadow, projective-line and IEEE 754
   semantics.
   - Recommendation: leave it out of v1. Those semantics are not defined over Z/2Z. In IEEE 754
     `1+1=2`, which is outside the digit set. On the projective line `∞+∞` is undefined.
   - Supporting them would need ad-hoc tables, which goes against Requirement 1.
   - If wanted later, give each semantics its own construction over Z/2Z.
2. **Unary `/` in input**: included above, because the paper's primitive is unary `/`. Drop it if
   input should only allow binary operators.
