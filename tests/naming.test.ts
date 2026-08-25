import assert from "node:assert/strict";
import { test } from "node:test";
import { dateStamp, fileName, slugify } from "../src/naming.ts";

const DAY = new Date(2026, 7, 26);

test("slugify 把句子壓成小寫連字號", () => {
  assert.equal(slugify("How does DNS work"), "how-does-dns-work");
  assert.equal(slugify("TCP/IP: the basics!"), "tcp-ip-the-basics");
  assert.equal(slugify("  spaced   out  "), "spaced-out");
});

test("slugify 擋掉路徑穿越與分隔字元", () => {
  assert.equal(slugify("../../.bashrc"), "bashrc");
  assert.equal(slugify("C:\\Windows\\System32"), "c-windows-system32");
  assert.equal(slugify("a/b"), "a-b");
});

test("slugify 對非 ASCII 主題退回 explainer", () => {
  assert.equal(slugify("網域名稱系統"), "explainer");
  assert.equal(slugify("!!!"), "explainer");
  assert.equal(slugify(""), "explainer");
});

test("slugify 截短後不留尾巴連字號", () => {
  const slug = slugify("a".repeat(80));
  assert.equal(slug.length, 60);
  const mixed = slugify(`${"b".repeat(59)} tail`);
  assert.ok(!mixed.endsWith("-"), `不該以連字號結尾: ${mixed}`);
});

test("dateStamp 用本地時間補零", () => {
  assert.equal(dateStamp(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(dateStamp(DAY), "2026-08-26");
});

test("fileName 組出日期加 slug", () => {
  assert.equal(fileName("How does DNS work", DAY, []), "2026-08-26-how-does-dns-work.html");
});

test("fileName 碰撞時加序號而不覆蓋", () => {
  const existing = ["2026-08-26-dns.html", "2026-08-26-dns-2.html"];
  assert.equal(fileName("dns", DAY, existing), "2026-08-26-dns-3.html");
});

test("fileName 忽略不相干的既有檔案", () => {
  assert.equal(fileName("dns", DAY, ["2026-08-25-dns.html"]), "2026-08-26-dns.html");
});
