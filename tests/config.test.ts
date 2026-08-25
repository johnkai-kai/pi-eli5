import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { CONFIG_FILE, defaultOutputDir, expandHome, loadConfig, parseConfig } from "../src/config.ts";

const HOME = join("/", "home", "tester");

test("空設定回傳預設值", () => {
  const config = parseConfig({}, HOME);
  assert.equal(config.outputDir, defaultOutputDir(HOME));
  assert.equal(config.autoOpen, true);
});

test("autoOpen 讀 on/off,也吃得下舊的布林值", () => {
  assert.equal(parseConfig({ autoOpen: "off" }, HOME).autoOpen, false);
  assert.equal(parseConfig({ autoOpen: "on" }, HOME).autoOpen, true);
  assert.equal(parseConfig({ autoOpen: false }, HOME).autoOpen, false);
  assert.equal(parseConfig({ autoOpen: "maybe" }, HOME).autoOpen, true);
});

test("outputDir 展開 ~ 並忽略空字串", () => {
  assert.equal(parseConfig({ outputDir: "~/notes" }, HOME).outputDir, join(HOME, "notes"));
  assert.equal(parseConfig({ outputDir: "   " }, HOME).outputDir, defaultOutputDir(HOME));
  assert.equal(parseConfig({ outputDir: 42 }, HOME).outputDir, defaultOutputDir(HOME));
});

test("expandHome 只在開頭的 ~ 動手", () => {
  assert.equal(expandHome("~", HOME), HOME);
  assert.equal(expandHome("/a/~/b", HOME), "/a/~/b");
  assert.equal(expandHome("~x", HOME), "~x");
});

test("未知鍵被忽略,不影響已知鍵", () => {
  const config = parseConfig({ palette: "neon", autoOpen: "off" }, HOME);
  assert.equal(config.autoOpen, false);
  assert.equal(config.outputDir, defaultOutputDir(HOME));
});

test("loadConfig 讀得到檔案", () => {
  const dir = mkdtempSync(join(tmpdir(), "eli5-cfg-"));
  writeFileSync(join(dir, CONFIG_FILE), JSON.stringify({ autoOpen: "off" }));
  assert.equal(loadConfig(dir, HOME).autoOpen, false);
});

test("檔案缺失或 JSON 壞掉都靜默回退預設", () => {
  const dir = mkdtempSync(join(tmpdir(), "eli5-cfg-"));
  assert.equal(loadConfig(dir, HOME).autoOpen, true);
  writeFileSync(join(dir, CONFIG_FILE), "{ 這不是 JSON");
  const config = loadConfig(dir, HOME);
  assert.equal(config.autoOpen, true);
  assert.equal(config.outputDir, defaultOutputDir(HOME));
});
