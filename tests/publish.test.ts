import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { Eli5Config } from "../src/config.ts";
import { nodeDeps, publish, type PublishDeps } from "../src/publish.ts";

const DAY = new Date(2026, 7, 26);

function fakeDeps(overrides: Partial<PublishDeps> = {}): PublishDeps & {
  written: Map<string, string>;
  opens: Array<{ command: string; args: string[] }>;
  dirs: string[];
} {
  const written = new Map<string, string>();
  const opens: Array<{ command: string; args: string[] }> = [];
  const dirs: string[] = [];
  return {
    written,
    opens,
    dirs,
    ensureDir: async (dir) => {
      dirs.push(dir);
    },
    listDir: async () => [],
    write: async (path, data) => {
      written.set(path, data);
    },
    open: async (command, args) => {
      opens.push({ command, args });
    },
    now: () => DAY,
    platform: "linux",
    ...overrides,
  };
}

const config: Eli5Config = { outputDir: join("/", "out"), autoOpen: true };

test("writes into outputDir with a name derived from topic and date", async () => {
  const deps = fakeDeps();
  const result = await publish("How does DNS work", "<html></html>", config, deps);
  assert.equal(result.path, join("/", "out", "2026-08-26-how-does-dns-work.html"));
  assert.equal(deps.written.get(result.path), "<html></html>");
  assert.deepEqual(deps.dirs, [join("/", "out")]);
});

test("with autoOpen on it runs the platform open command", async () => {
  const deps = fakeDeps({ platform: "win32" });
  const result = await publish("dns", "<html></html>", config, deps);
  assert.equal(result.opened, true);
  assert.deepEqual(deps.opens, [{ command: "cmd", args: ["/c", "start", "", result.path] }]);
});

test("with autoOpen off it never touches the open command", async () => {
  const deps = fakeDeps();
  const result = await publish("dns", "<html></html>", { ...config, autoOpen: false }, deps);
  assert.equal(result.opened, false);
  assert.equal(deps.opens.length, 0);
  assert.equal(deps.written.size, 1);
});

test("a failed open still returns the written path, just unopened", async () => {
  const deps = fakeDeps({
    open: async () => {
      throw new Error("xdg-open not found");
    },
  });
  const result = await publish("dns", "<html></html>", config, deps);
  assert.equal(result.opened, false);
  assert.ok(deps.written.has(result.path));
});

test("an existing file is never overwritten", async () => {
  const deps = fakeDeps({ listDir: async () => ["2026-08-26-dns.html"] });
  const result = await publish("dns", "<html></html>", config, deps);
  assert.equal(result.path, join("/", "out", "2026-08-26-dns-2.html"));
});

test("a write error propagates instead of being swallowed", async () => {
  const deps = fakeDeps({
    write: async () => {
      throw new Error("EACCES");
    },
  });
  await assert.rejects(() => publish("dns", "<html></html>", config, deps), /EACCES/);
});

test("nodeDeps really creates the directory and writes the file", async () => {
  const root = mkdtempSync(join(tmpdir(), "eli5-pub-"));
  const target = join(root, "nested", "eli5");
  const result = await publish(
    "real write",
    "<html>hi</html>",
    { outputDir: target, autoOpen: false },
    { ...nodeDeps, now: () => DAY },
  );
  assert.equal(readFileSync(result.path, "utf-8"), "<html>hi</html>");
  assert.deepEqual(await readdir(target), ["2026-08-26-real-write.html"]);
});

test("nodeDeps.listDir returns an empty array for a missing directory", async () => {
  assert.deepEqual(await nodeDeps.listDir(join(tmpdir(), "eli5-does-not-exist-xyz")), []);
});
