import { CONFIG } from "../config/env.js";

const BASE_URL = "https://app.asana.com/api/1.0";

async function callAsana(method, endpoint, body = null) {
    if (!CONFIG.ASANA_ACCESS_TOKEN) {
        throw new Error("Missing ASANA_ACCESS_TOKEN in .env");
    }

    const headers = {
        "Authorization": `Bearer ${CONFIG.ASANA_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify({ data: body });

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Asana API Error: ${JSON.stringify(data.errors || data)}`);
    }

    return data.data;
}

export const asanaTools = {
    // LIST TASKS
    asana_list_tasks: {
        name: "asana_list_tasks",
        description: "List open tasks from the default project. Returns ID, Name, and Status.",
        schema: {
            type: "object",
            properties: {
                limit: { type: "integer", description: "Number of tasks to return (default 10)" }
            }
        },
        execute: async ({ limit = 10 }) => {
            // Note: We specifically ask for name, completed status, and permalink - visit asana api docs for more.
            const endpoint = `/projects/${CONFIG.ASANA_PROJECT_ID}/tasks?opt_fields=name,completed,due_on,permalink_url&limit=${limit}`;
            const tasks = await callAsana("GET", endpoint);

            if (tasks.length === 0) return "No tasks found in this project.";

            return tasks.map(t =>
                `- [${t.completed ? "X" : " "}] ${t.name} (ID: ${t.gid})`
            ).join("\n");
        }
    },

    // CREATE TASK
    asana_create_task: {
        name: "asana_create_task",
        description: "Create a new task in Asana.",
        schema: {
            type: "object",
            properties: {
                name: { type: "string", description: "The title of the task" },
                notes: { type: "string", description: "Description or details of the task" },
                due_on: { type: "string", description: "Due date in YYYY-MM-DD format" }
            },
            required: ["name"]
        },
        execute: async ({ name, notes, due_on }) => {
            const body = {
                projects: [CONFIG.ASANA_PROJECT_ID],
                name,
                notes,
                due_on
            };
            const result = await callAsana("POST", "/tasks", body);
            return `Task Created Successfully!\nID: ${result.gid}\nLink: ${result.permalink_url}`;
        }
    },

    // UPDATE TASK
    asana_update_task: {
        name: "asana_update_task",
        description: "Update a task's status or details.",
        schema: {
            type: "object",
            properties: {
                taskId: { type: "string", description: "The Task GID (ID)" },
                completed: { type: "boolean", description: "True to mark as done, False to unmark" },
                name: { type: "string", description: "New name for the task" }
            },
            required: ["taskId"]
        },
        execute: async ({ taskId, completed, name }) => {
            const body = {};
            if (completed !== undefined) body.completed = completed;
            if (name) body.name = name;

            const result = await callAsana("PUT", `/tasks/${taskId}`, body);
            return `Task ${taskId} updated. Status: ${result.completed ? "Completed" : "Active"}`;
        }
    },

    // DELETE TASK
    asana_delete_task: {
        name: "asana_delete_task",
        description: "Permanently delete a task.",
        schema: {
            type: "object",
            properties: {
                taskId: { type: "string", description: "The Task GID (ID) to delete" }
            },
            required: ["taskId"]
        },
        execute: async ({ taskId }) => {
            await callAsana("DELETE", `/tasks/${taskId}`);
            return `Task ${taskId} has been deleted.`;
        }
    }
};