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

// 文件寫了但程式沒有的鍵,使用者照著設會靜靜失效;反過來則是沒人知道的功能。
test("README 與 SKILL 的設定表涵蓋且僅涵蓋實際的設定鍵", () => {
  const keys = Object.keys(parseConfig({}));
  for (const doc of [README, SKILL]) {
    for (const key of keys) assert.ok(doc.includes(`\`${key}\``), `文件缺少 ${key}`);
  }
});

test("文件寫的預設值與程式一致", () => {
  const config = parseConfig({});
  assert.equal(config.autoOpen, true);
  assert.ok(config.outputDir.endsWith(join(".pi", "eli5")));
  for (const doc of [README, SKILL]) {
    assert.ok(doc.includes("`~/.pi/eli5`"), "文件應寫明預設 outputDir");
    assert.ok(doc.includes('`"on"`'), "文件應寫明 autoOpen 預設為 on");
  }
});

test("文件指的設定檔名與程式一致", () => {
  assert.equal(CONFIG_FILE, "pi-eli5.json");
  assert.ok(README.includes(CONFIG_FILE));
  assert.ok(SKILL.includes(CONFIG_FILE));
  assert.ok(defaultOutputDir("/home/x").endsWith(join(".pi", "eli5")));
});

test("package.json 註冊的 extension 與 skill 路徑存在且被 files 帶走", () => {
  assert.deepEqual(PACKAGE.pi.extensions, ["./src/index.ts"]);
  assert.deepEqual(PACKAGE.pi.skills, ["./skills"]);
  readDoc("src/index.ts");
  readDoc("skills/eli5/SKILL.md");
  for (const entry of ["src", "skills", "LICENSE", "LICENSE-eli5", "README.md"]) {
    assert.ok(PACKAGE.files.includes(entry), `files 應包含 ${entry}`);
  }
});

test("SKILL frontmatter 有 name 與 description", () => {
  assert.match(SKILL, /^---\nname: eli5\ndescription: .+\n/);
});

test("SKILL 明講要呼叫工具、且 HTML 必須自包含", () => {
  assert.ok(SKILL.includes("eli5_publish"));
  assert.ok(SKILL.includes("自包含"));
});

test("授權疊法齊全:自己的 LICENSE 與上游的 LICENSE-eli5", () => {
  assert.ok(readDoc("LICENSE").includes("Copyright (c) 2026 johnkai-kai"));
  const upstream = readDoc("LICENSE-eli5");
  assert.ok(upstream.includes("Copyright (c) 2026 Thariq Shihipar"));
  assert.ok(upstream.includes("claude-plugins-community"));
  assert.ok(upstream.includes("Apache License 2.0"));
  assert.ok(README.includes("LICENSE-eli5"));
});
