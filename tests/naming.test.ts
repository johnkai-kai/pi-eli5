import assert from "node:assert/strict";
import { test } from "node:test";
import { dateStamp, fileName, slugify } from "../src/naming.ts";

const DAY = new Date(2026, 7, 26);

test("slugify flattens a sentence to lowercase hyphens", () => {
  assert.equal(slugify("How does DNS work"), "how-does-dns-work");
  assert.equal(slugify("TCP/IP: the basics!"), "tcp-ip-the-basics");
  assert.equal(slugify("  spaced   out  "), "spaced-out");
});

test("slugify strips traversal and separator characters", () => {
  assert.equal(slugify("../../.bashrc"), "bashrc");
  assert.equal(slugify("D:\\Windows\\System32"), "d-windows-system32");
  assert.equal(slugify("a/b"), "a-b");
});

test("slugify falls back to explainer when nothing survives", () => {
  // A topic written entirely in a non-Latin script slugs to nothing.
  assert.equal(slugify("ドメイン"), "explainer");
  assert.equal(slugify("!!!"), "explainer");
  assert.equal(slugify(""), "explainer");
});

test("slugify leaves no trailing hyphen after truncation", () => {
  const slug = slugify("a".repeat(80));
  assert.equal(slug.length, 60);
  const mixed = slugify(`${"b".repeat(59)} tail`);
  assert.ok(!mixed.endsWith("-"), `should not end with a hyphen: ${mixed}`);
});

test("dateStamp pads local-time components", () => {
  assert.equal(dateStamp(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(dateStamp(DAY), "2026-08-26");
});

test("fileName joins the date and the slug", () => {
  assert.equal(fileName("How does DNS work", DAY, []), "2026-08-26-how-does-dns-work.html");
});

test("fileName suffixes on collision instead of overwriting", () => {
  const existing = ["2026-08-26-dns.html", "2026-08-26-dns-2.html"];
  assert.equal(fileName("dns", DAY, existing), "2026-08-26-dns-3.html");
});

test("fileName ignores unrelated existing files", () => {
  assert.equal(fileName("dns", DAY, ["2026-08-25-dns.html"]), "2026-08-26-dns.html");
});
