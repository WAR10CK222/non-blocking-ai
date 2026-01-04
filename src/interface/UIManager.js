import readline from "node:readline";
import chalk from "chalk";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import util from "node:util";
import { CONFIG } from "../config/env.js";

// Configure Markdown Renderer for Terminal
marked.setOptions({
    renderer: new TerminalRenderer({
        width: 80, // Wrap text width
        reflowText: true,
        colors: {
            heading: chalk.bold.blue,
            firstHeading: chalk.bold.blueUnderline,
            list: chalk.cyan,
            codespan: chalk.yellow,
            code: chalk.yellow,
            link: chalk.green,
            strong: chalk.bold.white
        }
    })
});

class UIManager {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: "" // We handle prompting manually for control
        });

        this.PROMPT_TEXT = chalk.green("You > ");
        this.isPromptActive = false;
    }

    /**
     * Start the Input Listener
     * @param {Function} onInput - Callback when user hits enter
     */
    start(onInput) {
        // Show initial prompt
        this.showPrompt();

        this.rl.on("line", (line) => {
            // 1. Move cursor up to overwrite the prompt line with the "finalized" message
            // We use standard terminal escape codes
            readline.moveCursor(process.stdout, 0, -1);
            readline.clearLine(process.stdout, 0);

            // 2. Print what the user just typed, but formatted
            console.log(`${this.PROMPT_TEXT}${line.trim()}`);

            // 3. Send input to logic
            if (line.trim()) {
                onInput(line.trim());
            }

            // 4. Show prompt again (unless logic decides to hide it)
            this.showPrompt();
        });
    }

    /**
     * Safe Log: Prints a message ABOVE the current prompt
     * without breaking the user's current input buffer.
     */
    log(type, content) {
        // Filter debug logs.
        if (type === "debug" && !CONFIG.DEBUG_MODE) {
            return;
        }

        // 1. Clear the current prompt line (where the user might be typing)
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);

        // 2. Print the Message based on type
        switch (type) {
            case "bot":
                console.log(chalk.bold.blue("Gemini:"));
                console.log(marked(content)); // Render Markdown
                break;

            case "system":
                console.log(chalk.dim(`[System] ${content}`));
                break;

            case "notification":
                console.log(chalk.yellow("🔔 Notification:"));
                console.log(chalk.yellow(content));
                console.log(chalk.dim("-----------------------------------"));
                break;

            case "debug":
                const debugText = typeof content === 'object'
                    ? util.inspect(content, { colors: true, depth: null, breakLength: Infinity })
                    : content;

                console.log(chalk.gray(`🐛 [DEBUG]: ${debugText}`));
                break;

            case "spinner":
                console.log(chalk.magenta(`⚙️  ${content}`));
                break;

            default:
                console.log(content);
        }

        // 3. Redraw the Prompt and the User's current buffer
        this.redrawPrompt();
    }

    showPrompt() {
        this.isPromptActive = true;
        this.rl.setPrompt(this.PROMPT_TEXT);
        this.rl.prompt(true);
    }

    redrawPrompt() {
        // Force readline to repaint the prompt + current input buffer
        this.rl.prompt(true);
    }

    close() {
        this.rl.close();
    }
}

export const ui = new UIManager();