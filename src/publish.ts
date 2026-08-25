import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Eli5Config } from "./config.ts";
import { fileName } from "./naming.ts";
import { openCommand } from "./opener.ts";

export interface PublishDeps {
  ensureDir(dir: string): Promise<void>;
  listDir(dir: string): Promise<string[]>;
  write(path: string, data: string): Promise<void>;
  open(command: string, args: string[]): Promise<void>;
  now(): Date;
  platform: NodeJS.Platform;
}

export interface PublishResult {
  path: string;
  opened: boolean;
}

export const nodeDeps: PublishDeps = {
  ensureDir: async (dir) => {
    await mkdir(dir, { recursive: true });
  },
  listDir: async (dir) => {
    try {
      return await readdir(dir);
    } catch {
      return [];
    }
  },
  write: (path, data) => writeFile(path, data, "utf-8"),
  open: async () => {
    throw new Error("open 必須由 extension 注入 pi.exec");
  },
  now: () => new Date(),
  platform: process.platform,
};

export async function publish(
  topic: string,
  html: string,
  config: Eli5Config,
  deps: PublishDeps,
): Promise<PublishResult> {
  await deps.ensureDir(config.outputDir);
  const name = fileName(topic, deps.now(), await deps.listDir(config.outputDir));
  const path = join(config.outputDir, name);
  await deps.write(path, html);

  if (!config.autoOpen) return { path, opened: false };

  // 開不起來不算失敗:檔案已經在磁碟上了,回報沒開,讓模型改成單純告知路徑。
  const { command, args } = openCommand(deps.platform, path);
  try {
    await deps.open(command, args);
    return { path, opened: true };
  } catch {
    return { path, opened: false };
  }
}
