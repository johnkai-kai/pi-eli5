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
      "Save a fully self-contained HTML explainer to a file and open it in the " +
      "default browser. Returns the absolute path. After producing an explainer " +
      "with the eli5 skill, always deliver it through this tool — never write the " +
      "file yourself and never run your own open command.",
    parameters: Type.Object({
      topic: Type.String({ description: "The topic explained; used to derive the filename" }),
      html: Type.String({
        description: "Complete HTML document. Must be self-contained: inline CSS, no external assets, no CDN",
      }),
    }),
    async execute(_toolCallId, params, signal) {
      const { topic, html } = params as { topic: string; html: string };
      const config = loadConfig(agentDir);
      const result = await publish(topic, html, config, {
        ...nodeDeps,
        open: async (command, args) => {
          const run = await pi.exec(command, args, { timeout: OPEN_TIMEOUT_MS, signal });
          if (run.code !== 0) throw new Error(`open command exited with ${run.code}`);
        },
      });
      const note = result.opened
        ? "Opened in the default browser."
        : "Not opened (autoOpen is off, or the open command failed) — tell the user the path so they can open it.";
      return {
        content: [{ type: "text", text: `${result.path}\n${note}` }],
        details: result,
      };
    },
  });

  pi.registerCommand("eli5", {
    description: "Explain a topic with a big-picture, few-words HTML page",
    handler: async (args, ctx) => {
      const topic = args.trim();
      if (!topic) {
        ctx.ui.notify("Usage: /eli5 <topic>", "warning");
        return;
      }
      const message = `Use the eli5 skill to explain this topic: ${topic}`;
      try {
        pi.sendUserMessage(message);
      } catch {
        pi.sendUserMessage(message, { deliverAs: "followUp" });
      }
    },
  });
}
