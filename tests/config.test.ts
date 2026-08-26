import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { CONFIG_FILE, defaultOutputDir, expandHome, loadConfig, parseConfig } from "../src/config.ts";

const HOME = join("/", "home", "tester");

test("an empty config yields the defaults", () => {
  const config = parseConfig({}, HOME);
  assert.equal(config.outputDir, defaultOutputDir(HOME));
  assert.equal(config.autoOpen, true);
});

test("autoOpen reads on/off and still accepts legacy booleans", () => {
  assert.equal(parseConfig({ autoOpen: "off" }, HOME).autoOpen, false);
  assert.equal(parseConfig({ autoOpen: "on" }, HOME).autoOpen, true);
  assert.equal(parseConfig({ autoOpen: false }, HOME).autoOpen, false);
  assert.equal(parseConfig({ autoOpen: "maybe" }, HOME).autoOpen, true);
});

test("outputDir expands ~ and ignores blank strings", () => {
  assert.equal(parseConfig({ outputDir: "~/notes" }, HOME).outputDir, join(HOME, "notes"));
  assert.equal(parseConfig({ outputDir: "   " }, HOME).outputDir, defaultOutputDir(HOME));
  assert.equal(parseConfig({ outputDir: 42 }, HOME).outputDir, defaultOutputDir(HOME));
});

test("expandHome only touches a leading ~", () => {
  assert.equal(expandHome("~", HOME), HOME);
  assert.equal(expandHome("/a/~/b", HOME), "/a/~/b");
  assert.equal(expandHome("~x", HOME), "~x");
});

test("unknown keys are ignored without affecting known ones", () => {
  const config = parseConfig({ palette: "neon", autoOpen: "off" }, HOME);
  assert.equal(config.autoOpen, false);
  assert.equal(config.outputDir, defaultOutputDir(HOME));
});

test("loadConfig reads the file", () => {
  const dir = mkdtempSync(join(tmpdir(), "eli5-cfg-"));
  writeFileSync(join(dir, CONFIG_FILE), JSON.stringify({ autoOpen: "off" }));
  assert.equal(loadConfig(dir, HOME).autoOpen, false);
});

test("a missing file or broken JSON falls back to the defaults silently", () => {
  const dir = mkdtempSync(join(tmpdir(), "eli5-cfg-"));
  assert.equal(loadConfig(dir, HOME).autoOpen, true);
  writeFileSync(join(dir, CONFIG_FILE), "{ not json");
  const config = loadConfig(dir, HOME);
  assert.equal(config.autoOpen, true);
  assert.equal(config.outputDir, defaultOutputDir(HOME));
});
