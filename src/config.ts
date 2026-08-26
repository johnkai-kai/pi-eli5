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

// A broken config file must not stop an explainer from being produced, so any
// read failure falls back to the full defaults.
export function loadConfig(agentDir: string, home: string = homedir()): Eli5Config {
  try {
    return parseConfig(JSON.parse(readFileSync(join(agentDir, CONFIG_FILE), "utf-8")), home);
  } catch {
    return parseConfig({}, home);
  }
}
