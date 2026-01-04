import { startCLI } from "./interface/CLI.js";
import "./core/Orchestrator.js";
import { loadTools } from "./services/ToolRegistry.js";
import { ui } from "./interface/UIManager.js";


(async () => {
    ui.log("debug", "[System] Initializing Services..");
    await loadTools();

    // Start app
    startCLI();
})()