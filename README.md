# wheel-calc

A two-digit calculator over the digits `0` and `1` where **division by zero is defined**, including `0/0`.

Built on the *wheel* of fractions over **Z/2Z** from Jesper Carlström's *Wheels – On Division by Zero*
(canonical text: ch. 1 of *Partiality and Choice*, PhD thesis, Stockholm University, 2005).
The results are derived from the wheel axioms, not from a lookup table.

## The algebra in one screen

The wheel adds two elements to Z/2Z: `∞` for `1/0` and `⊥` for `0/0`. Over Z/2Z that gives four
elements, with `+` as XOR and `·` as AND:

```
 +  | 0 1 ∞ ⊥        ·  | 0 1 ∞ ⊥        x/y| 0 1 ∞ ⊥
 ---+--------        ---+--------        ---+--------
 0  | 0 1 ∞ ⊥        0  | 0 0 ⊥ ⊥        0  | ⊥ 0 0 ⊥
 1  | 1 0 ∞ ⊥        1  | 0 1 ∞ ⊥        1  | ∞ 1 0 ⊥
 ∞  | ∞ ∞ ⊥ ⊥        ∞  | ⊥ ∞ ∞ ⊥        ∞  | ∞ ∞ ⊥ ⊥
 ⊥  | ⊥ ⊥ ⊥ ⊥        ⊥  | ⊥ ⊥ ⊥ ⊥        ⊥  | ⊥ ⊥ ⊥ ⊥
```

`0·x = 0` and `x − x = 0` do not hold in general — a wheel gives up those ring laws to stay total.
The source of truth is [PROMPT.md](PROMPT.md), which pins the construction, the axioms and the
expected values to the 2005 thesis text.

## Quick start

Requires [Bun](https://bun.sh) 1.4.4.

```sh
bun install

bun src/cli.ts "1/0"        # one-shot: prints ∞
bun src/cli.ts "1+1"        # prints 0
bun src/cli.ts "(1/0)*0"    # prints ⊥
bun src/cli.ts table        # Cayley tables for + · / −, plus unary / and −
bun src/cli.ts              # interactive REPL (prompt: > )
```

REPL commands: `table`, `help`, `quit` / `exit`, EOF.

Grammar (whitespace ignored, `-` and `/` are prefix unary at the start of an operand):

```
expr    := term (('+' | '-') term)*
term    := unary (('*' | '/') unary)*
unary   := '-' unary | '/' unary | primary
primary := '0' | '1' | '(' expr ')'
```

Each literal is a single digit: `10` is an error, not a number. `∞` and `⊥` cannot be typed — write
`1/0` and `0/0`.

## Web GUI

`gui/` holds a static browser front end for the same engine: the page imports the algebra, parser
and presentation modules directly, so the browser and the CLI cannot drift.

```sh
bun run build:web                                      # bundle gui/main.ts -> gui/client/app.js
python3 -m http.server 8787 --directory gui/client     # serve it, then open http://127.0.0.1:8787
```

Any static file server works. The page loads no network resources beyond its own files and the
Fira Code stylesheet.

## Tests and type checking

```sh
bun test             # bun:test suites in test/ and gui/
bun run typecheck    # tsgo --noEmit (TypeScript 7 native preview)
```

The tests fall into four groups: expected values and tables, algebraic properties over all
elements, each paper axiom (1.1–1.8, involution, derived rules 1.9–1.13) checked exhaustively, and
anti-hard-coding checks — a source scan for element names in `algebra.ts`, a relabelled Z/2Z, and
Z/3Z / Z wheels that exercise `normalise`. A mutation suite proves the axiom checker can fail.

## Layout

| Path | Contents |
|---|---|
| `src/algebra.ts` | `Ring`, `Z2`, `Wheel` — the algebra only, no element names |
| `src/parser.ts` | Grammar and AST, with column-accurate errors |
| `src/presentation.ts` | Element names, formatting, table sort order |
| `src/cli.ts` | REPL, one-shot evaluation, `table` |
| `test/` | `bun:test` suites |
| `gui/` | Browser front end (view, storage, styles) |
| `PROMPT.md` | The specification this implementation is held to |

## References

- J. Carlström, *Partiality and Choice: Foundational Contributions*, PhD thesis, Stockholm
  University, 2005, ch. 1 — [DiVA `diva2:194366`](https://www.diva-portal.org/smash/get/diva2:194366/FULLTEXT01.pdf)
- J. Carlström, "Wheels – On Division by Zero", *Math. Struct. in Comp. Sci.* 14(1), 2004, pp. 143–184
  — DOI [10.1017/S0960129503004110](https://doi.org/10.1017/S0960129503004110)

## Status

Early. Only this README and a `.gitignore` are committed so far; the implementation above is in
the working tree and will land in follow-up commits.
