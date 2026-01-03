import { asanaTools } from "../tools/asana.js";

export const tools = {
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