import assert from "node:assert/strict";
import { test } from "node:test";
import { openCommand } from "../src/opener.ts";

test("win32 用 cmd start,並保留標題佔位空字串", () => {
  const { command, args } = openCommand("win32", "D:\\explainers\\a b.html");
  assert.equal(command, "cmd");
  assert.deepEqual(args, ["/c", "start", "", "D:\\explainers\\a b.html"]);
});

test("darwin 用 open", () => {
  assert.deepEqual(openCommand("darwin", "/tmp/a.html"), {
    command: "open",
    args: ["/tmp/a.html"],
  });
});

test("其餘平台用 xdg-open", () => {
  assert.equal(openCommand("linux", "/tmp/a.html").command, "xdg-open");
  assert.equal(openCommand("freebsd", "/tmp/a.html").command, "xdg-open");
});

test("含空白的路徑仍是單一 argv 元素,不被拆開", () => {
  for (const platform of ["win32", "darwin", "linux"] as const) {
    const { args } = openCommand(platform, "/tmp/some file.html");
    assert.equal(args.filter((a) => a.includes("some file.html")).length, 1);
    assert.ok(args.includes("/tmp/some file.html"));
  }
});
