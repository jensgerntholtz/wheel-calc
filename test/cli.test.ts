import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { TABLE_SNAPSHOT } from "./helpers.ts";

const CLI = new URL("../src/cli.ts", import.meta.url).pathname;
const ROOT = new URL("..", import.meta.url).pathname;

function runCli(args: string[], input?: string): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", input, cwd: ROOT });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

test("one-shot expression exits 0 and prints the name", () => {
  const r = runCli(["1/0"]);
  expect(r.status).toBe(0);
  expect(r.stdout).toBe("∞\n");
  expect(r.stderr).toBe("");
});

test("one-shot expression evaluates 0/0", () => {
  const r = runCli(["0/0"]);
  expect(r.status).toBe(0);
  expect(r.stdout).toBe("⊥\n");
});

test("one-shot syntax error exits 1 and writes to stderr", () => {
  const r = runCli(["2"]);
  expect(r.status).toBe(1);
  expect(r.stdout).toBe("");
  expect(r.stderr).toMatch(/column 1: only digits 0 and 1 exist/);
});

test("too many arguments exit 2 with a usage line", () => {
  const r = runCli(["1", "2"]);
  expect(r.status).toBe(2);
  expect(r.stderr).toMatch(/usage/);
});

test("table command prints the oracle snapshot", () => {
  const r = runCli(["table"]);
  expect(r.status).toBe(0);
  expect(r.stdout).toBe(TABLE_SNAPSHOT + "\n");
});

test("repl evaluates expressions and quits", () => {
  const r = runCli([], "1/0\n0/0\nquit\n");
  expect(r.status).toBe(0);
  expect(r.stdout).toBe("> ∞\n> ⊥\n> \n");
});

test("repl continues after a syntax error", () => {
  const r = runCli([], "2\n1/0\nquit\n");
  expect(r.status).toBe(0);
  expect(r.stdout).toBe("> > ∞\n> \n");
  expect(r.stderr).toMatch(/error: column 1/);
});

test("repl table command", () => {
  const r = runCli([], "table\nquit\n");
  expect(r.status).toBe(0);
  expect(r.stdout).toBe("> " + TABLE_SNAPSHOT + "\n> \n");
});

test("repl help command", () => {
  const r = runCli([], "help\nquit\n");
  expect(r.status).toBe(0);
  expect(r.stdout).toMatch(/commands:/);
  expect(r.stdout).toMatch(/table\s+show the Cayley tables/);
});

test("repl help explains the symbols in plain language", () => {
  const r = runCli([], "help\nquit\n");
  expect(r.status).toBe(0);
  expect(r.stdout).toMatch(/∞\s+division by zero/);
  expect(r.stdout).toMatch(/⊥\s+no value at all/);
});

test("repl end of input exits 0", () => {
  const r = runCli([], "1/0\n");
  expect(r.status).toBe(0);
  expect(r.stdout).toBe("> ∞\n> \n");
});
