import assert from "node:assert/strict";
import { test } from "node:test";
import { openCommand } from "../src/opener.ts";

test("win32 uses cmd start and keeps the title placeholder", () => {
  const { command, args } = openCommand("win32", "D:\\explainers\\a b.html");
  assert.equal(command, "cmd");
  assert.deepEqual(args, ["/c", "start", "", "D:\\explainers\\a b.html"]);
});

test("darwin uses open", () => {
  assert.deepEqual(openCommand("darwin", "/tmp/a.html"), {
    command: "open",
    args: ["/tmp/a.html"],
  });
});

test("every other platform uses xdg-open", () => {
  assert.equal(openCommand("linux", "/tmp/a.html").command, "xdg-open");
  assert.equal(openCommand("freebsd", "/tmp/a.html").command, "xdg-open");
});

test("a path containing spaces stays one argv element", () => {
  for (const platform of ["win32", "darwin", "linux"] as const) {
    const { args } = openCommand(platform, "/tmp/some file.html");
    assert.equal(args.filter((a) => a.includes("some file.html")).length, 1);
    assert.ok(args.includes("/tmp/some file.html"));
  }
});
