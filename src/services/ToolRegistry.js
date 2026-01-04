import { ui } from "../interface/UIManager.js";
import { asanaTools } from "../tools/asana.js";
import { MCPManager } from "./MCPManager.js";

let tools = {
    ...asanaTools,
    long_task: {
        name: "long_task",
        description: "Simulates a long-running background task (wait 10s)",
        schema: {
            type: "object",
            properties: { input: { type: "string" } },
            required: ["input"]
        },
        execute: async (args) => {
            await new Promise(r => setTimeout(r, 10000)); // 10s delay
            return `Task processed: ${args.input}`;
        }
    }
};

export async function loadTools() {
    await MCPManager.init();

    const dynamicTools = await MCPManager.getAllTools();

    // Merge tools
    tools = {
        ...tools,
        ...dynamicTools
    };

    ui.log("debug", `[Registry] Total tools loaded: ${Object.keys(tools).length}`);
    return tools;
}

export { tools };