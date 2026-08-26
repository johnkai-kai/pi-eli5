export interface OpenCommand {
  command: string;
  args: string[];
}

// Always an argv array, never a concatenated string. On Windows `start` treats
// the first quoted argument as the window title, so that empty string is a
// required placeholder, not noise.
export function openCommand(platform: NodeJS.Platform, path: string): OpenCommand {
  if (platform === "win32") return { command: "cmd", args: ["/c", "start", "", path] };
  if (platform === "darwin") return { command: "open", args: [path] };
  return { command: "xdg-open", args: [path] };
}
