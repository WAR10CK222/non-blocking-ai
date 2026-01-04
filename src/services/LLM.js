import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../config/env.js";
import { tools } from "./ToolRegistry.js";

const client = new GoogleGenAI({ apiKey: CONFIG.API_KEY });


export async function generateChatResponse(history) {
    // Tool Definitions - Note. Moved to declare tools dynamically.
    const toolDeclarations = Object.values(tools).map(t => ({
        name: t.name,
        description: t.description,
        parametersJsonSchema: t.schema
    }));

    const SYSTEM_PROMPT = `
    You are a helpful AI Project Manager Assistant.
    
    TOOLS:
    - You have access to Asana tools to manage tasks.
    - If a user asks to "Complete a task" or "Delete a task" but you don't know the Task ID, 
      ALWAYS call 'asana_list_tasks' first to find the ID. Never guess an ID.
    
    BEHAVIOR:
    - If missing details (like task name), ask the user.
    - Be concise.
    `;

    const formattedHistory = history.map(msg => ({
        role: msg.role === "function" ? "model" : msg.role,
        parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
    }));

    const response = await client.models.generateContent({
        model: CONFIG.MODEL_NAME,
        contents: [
            { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
            ...formattedHistory
        ],
        config: {
            tools: [{ functionDeclarations: toolDeclarations }],
            toolConfig: { functionCallingConfig: { mode: "AUTO" } }
        }
    });

    // Extract Text
    const text = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;

    // Extract Function Call
    const fnCall = response.candidates?.[0]?.content?.parts?.find(p => p.functionCall)?.functionCall;

    return {
        text,
        toolCall: fnCall ? { name: fnCall.name, input: fnCall.args } : null
    };
}

// Notification Summarizer
export async function generateNotification(toolResult) {
    const userIntent = toolResult.context?.userIntent || "No specific question asked.";

    const prompt = `
    LOG CONTEXT:
    1. The User originally said: "${userIntent}"
    2. We ran a background tool: ${toolResult.toolName}
    3. The Tool Output was: 
    ${typeof toolResult.output === 'string' ? toolResult.output : JSON.stringify(toolResult.output)}

    INSTRUCTION:
    Write a notification for the user.
    - If the user asked a specific question (like "When is X?"), ANSWER IT using the tool output.
    - If the user just gave a command (like "Create X"), confirm it was done.
    - Keep it concise (1-2 sentences).
    - Do NOT mention "ID" unless there is an error.
    `;

    const response = await client.models.generateContent({
        model: CONFIG.MODEL_NAME,
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    return response.text;
}