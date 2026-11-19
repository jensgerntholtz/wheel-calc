#!/usr/bin/env bun
/**
 * Presentation: command-line interface and repl.
 */

import { createInterface } from "node:readline";
import { Wheel } from "./algebra.ts";
import { evaluate, parse, ParseError } from "./parser.ts";
import { buildCalculator, formatElement, HELP, tableText } from "./presentation.ts";

/** Interactive prompt; reads expressions and the table, help and quit commands. */
export function repl<E>(calc: Wheel<E>): void {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: Boolean(process.stdin.isTTY),
  });

  const prompt = (): void => rl.prompt();

  rl.setPrompt("> ");
  prompt();

  rl.on("line", (line: string) => {
    const command = line.trim();
    if (command === "quit" || command === "exit") {
      rl.close();
      return;
    }
    if (command === "table") {
      console.log(tableText(calc));
      prompt();
      return;
    }
    if (command === "help") {
      console.log(HELP);
      prompt();
      return;
    }
    try {
      console.log(formatElement(evaluate(parse(line), calc), calc.ring));
    } catch (error) {
      if (!(error instanceof ParseError)) throw error;
      console.error("error: " + error.message);
    }
    prompt();
  });

  rl.on("close", () => {
    process.stdout.write("\n");
  });
}

/**
 * One-shot entry point. Returns an exit code, or null when the repl was started
 * and will keep the process alive until it finishes.
 */
export function run(argv: readonly string[]): number | null {
  const calc = buildCalculator();

  if (argv.length === 0) {
    repl(calc);
    return null;
  }

  if (argv.length === 1 && argv[0] === "table") {
    console.log(tableText(calc));
    return 0;
  }

  if (argv.length !== 1) {
    console.error('usage: bun src/cli.ts ["<expr>" | table]');
    return 2;
  }

  try {
    console.log(formatElement(evaluate(parse(argv[0]), calc), calc.ring));
    return 0;
  } catch (error) {
    if (error instanceof ParseError) {
      console.error("error: " + error.message);
      return 1;
    }
    throw error;
  }
}

if (import.meta.main) {
  const code = run(process.argv.slice(2));
  if (code !== null) process.exitCode = code;
}
