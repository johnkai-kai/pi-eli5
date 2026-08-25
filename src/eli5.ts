import { type ExtensionAPI, getAgentDir } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { loadConfig } from "./config.ts";
import { nodeDeps, publish } from "./publish.ts";

const OPEN_TIMEOUT_MS = 10_000;

export default function eli5(pi: ExtensionAPI): void {
  const agentDir = getAgentDir();

  pi.registerTool({
    name: "eli5_publish",
    label: "eli5",
    description:
      "把一份完整自包含的 HTML 解說存成檔案並用系統預設瀏覽器開啟。回傳檔案的絕對路徑。" +
      "使用 eli5 skill 產生解說後,一律用這個工具交付,不要自己寫檔或自己下開檔指令。",
    parameters: Type.Object({
      topic: Type.String({ description: "解說主題,用來決定檔名" }),
      html: Type.String({
        description: "完整的 HTML 文件,必須自包含:inline CSS、零外部資源、零 CDN",
      }),
    }),
    async execute(_toolCallId, params, signal) {
      const { topic, html } = params as { topic: string; html: string };
      const config = loadConfig(agentDir);
      const result = await publish(topic, html, config, {
        ...nodeDeps,
        open: async (command, args) => {
          const run = await pi.exec(command, args, { timeout: OPEN_TIMEOUT_MS, signal });
          if (run.code !== 0) throw new Error(`開檔指令回傳 ${run.code}`);
        },
      });
      const note = result.opened
        ? "已用預設瀏覽器開啟。"
        : "沒有自動開啟(autoOpen 關閉或開檔指令失敗),請告訴使用者路徑讓他自己開。";
      return {
        content: [{ type: "text", text: `${result.path}\n${note}` }],
        details: result,
      };
    },
  });

  pi.registerCommand("eli5", {
    description: "用大圖少字的 HTML 解說一個主題",
    handler: async (args, ctx) => {
      const topic = args.trim();
      if (!topic) {
        ctx.ui.notify("用法:/eli5 <主題>", "warning");
        return;
      }
      const message = `使用 eli5 skill 解說這個主題:${topic}`;
      try {
        pi.sendUserMessage(message);
      } catch {
        pi.sendUserMessage(message, { deliverAs: "followUp" });
      }
    },
  });
}
