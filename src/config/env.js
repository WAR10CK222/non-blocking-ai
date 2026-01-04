import "dotenv/config";
export const CONFIG = {
    // DEBUG Configurations
    DEBUG_MODE: process.env.DEBUG_MODE === "true",

    API_KEY: process.env.GEMINI_API_KEY,
    MODEL_NAME: "gemini-3-flash-preview",
    LOOP_INTERVAL_MS: 200,

    // ASANA KEYS - optional
    ASANA_ACCESS_TOKEN: process.env.ASANA_API_KEY,
    ASANA_PROJECT_ID: process.env.ASANA_PROJECT_ID
};