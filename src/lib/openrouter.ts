
import axios from 'axios';

// Helper to safely access environment variables in various environments
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        // @ts-ignore
        return import.meta.env[key];
    }
  } catch (e) {}
  
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
  } catch (e) {}

  return undefined;
};

const OPENROUTER_API_KEY = getEnv('VITE_OPENROUTER_API_KEY') || getEnv('VITE_OPENROUTER_KEY') || getEnv('REACT_APP_OPENROUTER_API_KEY');
const SITE_URL = 'http://localhost:3000'; 
const SITE_NAME = 'SurgeMind Hospital OS';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Sends a chat completion request to OpenRouter.
 * @param messages Array of chat messages
 * @param model Model ID (default: Gemini 2.0 Pro Exp Free)
 * @param jsonMode Whether to force JSON output (default: false)
 */
export async function runLLM(
    messages: ChatMessage[], 
    model = "google/gemini-2.0-pro-exp-02-05:free",
    jsonMode = false
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    console.error("❌ OpenRouter API Key missing. Checks: VITE_OPENROUTER_API_KEY");
    return "System Error: API Key is missing. Please check environment variables.";
  }

  try {
    const payload: any = {
        model,
        messages,
    };

    if (jsonMode) {
        payload.response_format = { type: "json_object" };
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      payload,
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": SITE_URL,
          "X-Title": SITE_NAME,
          "Content-Type": "application/json"
        }
      }
    );

    if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content || "";
    } else {
        console.error("❌ OpenRouter Response Empty:", response.data);
        return "Error: AI returned an empty response.";
    }

  } catch (error: any) {
    console.error("❌ OpenRouter API Error:", error.response?.data || error.message);
    const msg = error.response?.data?.error?.message || error.message;
    return `Connection Error: ${msg}`;
  }
}
