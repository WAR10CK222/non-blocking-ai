import { eventBus } from "./EventBus.js";
import { globalMemory } from "./Memory.js";
import { generateChatResponse, generateNotification } from "../services/LLM.js";
import { enqueueJob } from "../services/JobManager.js";
import { CONFIG } from "../config/env.js";
import { ui } from "../interface/UIManager.js";

class Orchestrator {
    constructor() {
        this.userQueue = [];
        this.notificationQueue = [];
        this.isProcessing = false;

        this.setupListeners();
        this.loop();
    }

    setupListeners() {
        eventBus.on("user:input", (msg) => this.userQueue.push(msg));

        // Log job starts immediately
        eventBus.on("job:started", (data) => {
            ui.log("system", `Job started: ${data.toolName} (ID: ${data.jobId.slice(0, 4)}...)`);
        });

        eventBus.on("job:completed", (result) => {
            this.notificationQueue.push(result);
        });
    }

    async loop() {
        if (this.isProcessing) {
            setTimeout(() => this.loop(), CONFIG.LOOP_INTERVAL_MS);
            return;
        }

        try {
            // User Input
            if (this.userQueue.length > 0) {
                this.isProcessing = true;
                const msg = this.userQueue.shift();

                ui.log("spinner", "Thinking..."); // Thinking

                await this.handleUserMessage(msg);
                this.isProcessing = false;
                setImmediate(() => this.loop());
                return;
            }

            // Notifications
            if (this.notificationQueue.length > 0) {
                this.isProcessing = true;
                const result = this.notificationQueue.shift();
                await this.handleNotification(result);
                this.isProcessing = false;
                setImmediate(() => this.loop());
                return;
            }

            setTimeout(() => this.loop(), CONFIG.LOOP_INTERVAL_MS);

        } catch (error) {
            ui.log("system", `Error: ${error.message}`);
            this.isProcessing = false;
            setTimeout(() => this.loop(), CONFIG.LOOP_INTERVAL_MS);
        }
    }

    async handleUserMessage(content) {
        globalMemory.add("user", content);

        const response = await generateChatResponse(globalMemory.getHistory());

        if (response.toolCall) {
            const { name, input } = response.toolCall;
            const context = { userIntent: content };
            const jobId = enqueueJob(name, input, context);

            const sysMsg = `I've started the '${name}' task for you. (ID: ${jobId}).`;
            ui.log("bot", sysMsg);
            globalMemory.add("model", sysMsg);
        }

        if (response.text) {
            ui.log("bot", response.text);
            globalMemory.add("model", response.text);
        }
    }

    async handleNotification(result) {
        const summary = await generateNotification(result);
        ui.log("notification", summary);
        globalMemory.add("model", `[System Update]: ${summary}`);
    }
}

export const orchestrator = new Orchestrator();