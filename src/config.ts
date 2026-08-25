import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface Eli5Config {
  outputDir: string;
  autoOpen: boolean;
}

export const CONFIG_FILE = "pi-eli5.json";

export function defaultOutputDir(home: string = homedir()): string {
  return join(home, ".pi", "eli5");
}

export function expandHome(path: string, home: string = homedir()): string {
  if (path === "~") return home;
  if (path.startsWith("~/") || path.startsWith("~\\")) return join(home, path.slice(2));
  return path;
}

function toBool(value: unknown, fallback: boolean): boolean {
  if (value === "on") return true;
  if (value === "off") return false;
  if (typeof value === "boolean") return value;
  return fallback;
}

export function parseConfig(raw: unknown, home: string = homedir()): Eli5Config {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const dir = source.outputDir;
  return {
    outputDir:
      typeof dir === "string" && dir.trim() !== ""
        ? expandHome(dir.trim(), home)
        : defaultOutputDir(home),
    autoOpen: toBool(source.autoOpen, true),
  };
}

// 設定檔壞掉不該讓解說產不出來,所以任何讀取失敗都靜默回退全預設。
export function loadConfig(agentDir: string, home: string = homedir()): Eli5Config {
  try {
    return parseConfig(JSON.parse(readFileSync(join(agentDir, CONFIG_FILE), "utf-8")), home);
  } catch {
    return parseConfig({}, home);
  }
}
