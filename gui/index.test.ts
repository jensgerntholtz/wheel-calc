import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("./client/index.html", import.meta.url), "utf8");
const headers = readFileSync(new URL("./client/_headers", import.meta.url), "utf8");

test("the page is static and loads the browser module", () => {
  expect(page).toContain('<script type="module" src="/app.js"></script>');
  expect(page).not.toContain("htmx");
  expect(page).not.toContain("hx-");
  expect(page).not.toContain("/vendor/");
  expect(page).toContain('<form id="eval-form" autocomplete="off">');
});

test("keypad follows the conventional layout", () => {
  const keypad = page.match(/<div class="keypad"[\s\S]*?<\/div>/)?.[0];
  expect(keypad).toBeDefined();
  if (keypad === undefined) return;

  const cells = Array.from(
    keypad.matchAll(/<button\b[^>]*>([^<]*)<\/button>/g),
    (match) => match[1].trim(),
  );
  expect(cells).toEqual([
    "⌫", "(", ")", "AC",
    "", "", "", "÷",
    "", "", "", "×",
    "1", "", "", "−",
    "0", "", "=", "+",
  ]);

  const blanks = keypad.match(/class="key-blank"[^>]*disabled/g) ?? [];
  expect(blanks.length).toBe(9);
});

test("static headers apply the CSP and cache policy", () => {
  expect(headers).toContain("Content-Security-Policy:");
  expect(headers).toContain("default-src 'self'");
  expect(headers).toContain("https://fonts.googleapis.com");
  expect(headers).toContain("https://fonts.gstatic.com");
  expect(headers).toContain("Cache-Control: no-store");
});
