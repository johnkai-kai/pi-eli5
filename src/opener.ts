export interface OpenCommand {
  command: string;
  args: string[];
}

// 永遠回傳 argv 陣列,不拼字串。Windows 的 start 會把第一個帶引號的參數
// 當成視窗標題,所以那個空字串是必要的佔位,不是贅字。
export function openCommand(platform: NodeJS.Platform, path: string): OpenCommand {
  if (platform === "win32") return { command: "cmd", args: ["/c", "start", "", path] };
  if (platform === "darwin") return { command: "open", args: [path] };
  return { command: "xdg-open", args: [path] };
}
