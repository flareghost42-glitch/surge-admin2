import axios from 'axios';

// Use the specific key env var, falling back to general if needed
const OPENROUTER_API_KEY = (import.meta as any).env.VITE_OPENROUTER_API_KEY || (import.meta as any).env.VITE_OPENROUTER_KEY;
const SITE_URL = 'http://localhost:3000'; // Default for local dev
const SITE_NAME = 'SurgeMind Hospital OS';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Sends a chat completion request to OpenRouter.
 * Defaults to Google Gemini Pro 2.0 Experimental (free tier usually available or low cost).
 */
export async function runLLM(messages: ChatMessage[], model = "google/gemini-2.0-pro-exp-02-05:free"): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    console.warn("⚠️ Missing VITE_OPENROUTER_API_KEY. Agent cannot think.");
    return "";
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        messages,
        response_format: { type: "json_object" } // Force JSON if supported by provider/model
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": SITE_URL,
          "X-Title": SITE_NAME,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("❌ OpenRouter API Error:", error);
    return "";
  }
}