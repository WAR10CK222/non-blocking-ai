import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CONFIG } from "../config/env.js";
import path from "node:path";
import fs from "node:fs/promises";

class CMCPManager {
    clients = new Map();

    async init() {
        try {
            const configPath = path.resolve(process.cwd(), "mcp.json");
            const configFile = await fs.readFile(configPath, "utf-8");
            const config = JSON.parse(configFile);
            const servers = config.mcpServers || {};

            console.log([`[MCP] Found ${Object.keys(servers).length} servers in config.`]);

            for (const [name, serverConfig] of Object.entries(servers)) {
                try {
                    if (serverConfig.url) {
                        await this.registerStreamableHTTPServer(name, serverConfig.url, serverConfig.headers);
                    } else if (serverConfig.command) {
                        await this.registerStdioServer(name, serverConfig);
                    }
                } catch (error) {
                    console.error(`[MCP] Failed to connect to ${name}:`, error.message);
                }
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.debug(`[MCP] No mcp.json found. Skipping MCP initialization.`);
            } else {
                console.error(`[MCP] Error loading config:`, error);
            }
        }
    }

    async registerStreamableHTTPServer(name, url, headers = {}) {
        const transport = new StreamableHTTPClientTransport(new URL(url), {
            requestInit: {
                headers
            }
        });

        await this.setupClient(name, transport);
    }

    async registerStdioServer(name, config) {
        const transport = new StdioClientTransport({
            command: config.command,
            args: config.args,
            env: {
                ...process.env,
                ...CONFIG,
                ...config.env
            }
        });

        await this.setupClient(name, transport);
    }

    async setupClient(name, transport) {
        const client = new Client({ name: `${name}-client`, version: "1.0.0" }, { capabilities: {} });
        await client.connect(transport);

        this.clients.set(name, client);
        const { tools } = await client.listTools();
        console.log(`Registered ${name} with ${tools.length} tools.`);
    }

    async getAllTools() {
        const mcpTools = {};
        for (const [serverName, client] of this.clients.entries()) {
            const { tools } = await client.listTools();

            tools.forEach(t => {
                const uniqueName = `${t.name}`; // modify this to aviod collisions
                mcpTools[uniqueName] = {
                    name: uniqueName,
                    description: t.description || `Tool from ${serverName}`,
                    schema: t.inputSchema,
                    execute: async (args) => {
                        const result = await client.callTool({
                            name: t.name,
                            arguments: args
                        });

                        // NORMALIZATION: MCP returns { content: [{ type: 'text', text: '...' }] }
                        if (result.content && Array.isArray(result.content)) {
                            return result.content
                                .map(c => c.text || JSON.stringify(c))
                                .join("\n");
                        }

                        // Fallback
                        return JSON.stringify(result);
                    }
                }
            })
        }

        return mcpTools;
    }
}

export const MCPManager = new CMCPManager();