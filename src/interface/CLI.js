import { eventBus } from "../core/EventBus.js";
import { ui } from "./UIManager.js";

export function startCLI() {
    console.clear();
    console.log("-----------------------------------------");
    console.log(" 🤖 Gemini Async Agent (Type 'exit' to quit)");
    console.log("-----------------------------------------");

    // UI Listener
    ui.start((input) => {
        if (input.toLowerCase() === "exit") {
            console.log("Goodbye!");
            process.exit(0);
        }

        eventBus.emit("user:input", input);
    });
}