import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { CONFIG_FILE, defaultOutputDir, parseConfig } from "../src/config.ts";

const ROOT = join(import.meta.dirname, "..");
const readDoc = (path: string): string => readFileSync(join(ROOT, path), "utf-8");

const README = readDoc("README.md");
const SKILL = readDoc("skills/eli5/SKILL.md");
const PACKAGE = JSON.parse(readDoc("package.json")) as {
  files: string[];
  pi: { extensions: string[]; skills: string[] };
};

// A key documented but not implemented fails silently for the user; the
// reverse is a feature nobody knows about.
test("README and SKILL document exactly the real config keys", () => {
  const keys = Object.keys(parseConfig({}));
  for (const doc of [README, SKILL]) {
    for (const key of keys) assert.ok(doc.includes(`\`${key}\``), `docs are missing ${key}`);
  }
});

test("documented defaults match the implementation", () => {
  const config = parseConfig({});
  assert.equal(config.autoOpen, true);
  assert.ok(config.outputDir.endsWith(join(".pi", "eli5")));
  for (const doc of [README, SKILL]) {
    assert.ok(doc.includes("`~/.pi/eli5`"), "docs must state the default outputDir");
    assert.ok(doc.includes('`"on"`'), "docs must state that autoOpen defaults to on");
  }
});

test("the config filename in the docs matches the implementation", () => {
  assert.equal(CONFIG_FILE, "pi-eli5.json");
  assert.ok(README.includes(CONFIG_FILE));
  assert.ok(SKILL.includes(CONFIG_FILE));
  assert.ok(defaultOutputDir("/home/x").endsWith(join(".pi", "eli5")));
});

test("registered extension and skill paths exist and ship in files", () => {
  assert.deepEqual(PACKAGE.pi.extensions, ["./src/index.ts"]);
  assert.deepEqual(PACKAGE.pi.skills, ["./skills"]);
  readDoc("src/index.ts");
  readDoc("skills/eli5/SKILL.md");
  for (const entry of ["src", "skills", "LICENSE", "LICENSE-eli5", "README.md"]) {
    assert.ok(PACKAGE.files.includes(entry), `files must include ${entry}`);
  }
});

test("SKILL frontmatter carries name and description", () => {
  assert.match(SKILL, /^---\nname: eli5\ndescription: .+\n/);
});

test("SKILL states the tool call and the self-contained requirement", () => {
  assert.ok(SKILL.includes("eli5_publish"));
  assert.ok(SKILL.includes("self-contained"));
});

test("both licenses are present: our LICENSE and upstream LICENSE-eli5", () => {
  assert.ok(readDoc("LICENSE").includes("Copyright (c) 2026 johnkai-kai"));
  const upstream = readDoc("LICENSE-eli5");
  assert.ok(upstream.includes("Copyright (c) 2026 Thariq Shihipar"));
  assert.ok(upstream.includes("claude-plugins-community"));
  assert.ok(upstream.includes("Apache License 2.0"));
  assert.ok(README.includes("LICENSE-eli5"));
});
