# 🤖 Async Gemini Agent (CLI)

A non-blocking, event-driven AI agent built with Node.js and Google Gemini.

Unlike standard chatbots that freeze while "thinking" or running tools, this agent uses an **Asynchronous Orchestrator**. It allows the user to keep chatting while the AI performs long-running tasks (like managing Asana projects, analyzing files, or fetching data) in the background.

## 🚀 Key Architecture

This project is built on a **Priority Queue Event Loop**:

1.  **User Loop (High Priority):** Handles immediate chat interactions.
2.  **Tool Loop (Background):** Executes tools asynchronously without blocking the main thread.
3.  **Context preservation:** When a tool finishes, the result is processed with the _original user intent_, ensuring the notification answers the user's specific question (e.g., "When is the meeting?" -> "The meeting is on Friday").

## 🛠️ Prerequisites

- **Node.js** (v18 or higher)
- **Google Gemini API Key** (Get it from [Google AI Studio](https://aistudio.google.com/))
- **Asana Account** (Optional, if using the project management features)

## 📦 Installation & Setup

1.  **Clone the repository**

    ```bash
    git clone https://github.com/WAR10CK222/non-blocking-ai.git
    cd non-blocking-ai
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory:

    ```bash
    cp .env.example .env
    ```

    Fill in your keys:

    ```ini
    # .env
    GEMINI_API_KEY=your_google_api_key_here

    # Optional: For Asana Tools
    ASANA_ACCESS_TOKEN=your_asana_token
    ASANA_PROJECT_ID=your_project_id
    ```

4.  **Run the Agent**
    ```bash
    npm start
    ```

## 🔧 How to Add New Tools

Adding a tool is a 2-step process. The architecture handles the queuing and execution automatically.

### Step 1: Define the Tool

Create a file in `src/tools/` (e.g., `weather.js`). You need a **name**, **description**, **JSON Schema**, and an **execute function**.

```javascript
// src/tools/weather.js
export const weatherTool = {
  name: "get_weather",
  description: "Fetches current weather for a city",
  schema: {
    type: "object",
    properties: {
      city: { type: "string", description: "City name" },
    },
    required: ["city"],
  },
  execute: async ({ city }) => {
    // Perform your API call logic here
    return `The weather in ${city} is Sunny, 25°C.`;
  },
};
```

### Step 2: Register the Tool

Import your tool in `src/services/ToolRegistry.js` and export it.

```javascript
// src/services/ToolRegistry.js
import { weatherTool } from "../tools/weather.js";
import { asanaTools } from "../tools/asana.js";

export const tools = {
  ...asanaTools,
  [weatherTool.name]: weatherTool,
};
```

**That's it!** The Agent will now be able to call this tool, run it in the background, and notify you when it's done.

## 🗺️ Roadmap & Scaling Strategies

To take this from a local CLI tool to a production-grade backend service, follow these steps:

### 1. Add Session Management

Currently, `globalMemory` is a singleton. To support multiple users:

- Modify `Memory.js` to store a Map: `conversations.set(sessionId, [])`.
- Pass a `sessionId` (generated or from a request header) through the `EventBus` and `Orchestrator`.

### 2. Expose via API (Express/Fastify)

Allow external apps (Frontend, Slack, WhatsApp) to talk to your agent.

- Create an Express server.
- **POST /chat**: Accepts `{ sessionId, message }`. Pushes to `userQueue`. Returns HTTP 200 immediately (Acknowledged).
- **WebSockets / Webhooks**: When the `Orchestrator` generates a notification, emit it via WebSocket to the client or POST to a webhook URL.

### 3. Distributed Queues (Redis/SQS)

Move `userQueue` and `notificationQueue` out of Node.js memory.

- **Use Case:** If the server restarts, you don't lose pending jobs.
- **Implementation:** Use **Redis** (BullMQ) or **AWS SQS**.
- The `JobManager` pushes a job to Redis. A separate "Worker" process pulls the job, executes the tool, and pushes the result back.

### 4. Remote Cache (Redis)

Store conversation history in Redis instead of in-memory arrays.

- Allows the agent to be stateless.
- Any server instance can handle the user's next message.

### 5. Integrations

Once the API is exposed, you can easily connect:

- **Telegram/Discord Bot:** Use a webhook to send user messages to your API and receive tool notifications back.
- **WhatsApp (Twilio):** Same pattern.

---

### Project Structure

```text
/src
 ├── config/         # Environment variables
 ├── core/           # Logic: Orchestrator, Memory, EventBus
 ├── interface/      # UI: CLI, Markdown Rendering
 ├── services/       # Integrations: LLM, JobManager, ToolRegistry
 ├── tools/          # Tool Logic: Asana, Weather, etc.
 └── index.js        # Entry point
```
