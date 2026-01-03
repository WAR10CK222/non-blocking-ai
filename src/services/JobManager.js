import { v4 as uuid } from "uuid";
import { eventBus } from "../core/EventBus.js";
import { tools } from "./ToolRegistry.js";

export function enqueueJob(toolName, input, context = {}) {
    const jobId = uuid();

    // Run async without awaiting - Fire & Forget method
    // console.log(`Job: ${jobId} started (${toolName})...`);
    eventBus.emit("job:started", { jobId, toolName, context });

    (async () => {
        try {
            const result = await tools[toolName].execute(input);
            // console.log("Result", result, jobId)
            eventBus.emit("job:completed", {
                jobId,
                toolName,
                status: "success",
                output: result,
                context
            });
        } catch (error) {
            // console.error("Error", error, jobId);
            eventBus.emit("job:completed", {
                jobId,
                toolName,
                status: "failed",
                error: error.message,
                context
            });
        }
    })();

    return jobId;
}