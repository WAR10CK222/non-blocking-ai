import { startCLI } from "./interface/CLI.js";
import "./core/Orchestrator.js";
import { loadTools } from "./services/ToolRegistry.js";


(async () => {
    console.log("[System] Initializing Services..");
    await loadTools();

    // Start app
    startCLI();
})()