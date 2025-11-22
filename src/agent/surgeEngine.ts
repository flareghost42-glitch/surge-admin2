import { supabase } from '../lib/supabase';
import { runLLM } from '../lib/openrouter';
import { gatherHospitalMetrics } from './utils/trendAnalysis';
import { buildSurgePrompt } from './prompts/surgePrompt';

let engineInterval: any = null;
const RUN_INTERVAL_MS = 5 * 60 * 1000; // 5 Minutes

interface SurgePrediction {
  risk_score: number;
  level: 'normal' | 'warning' | 'critical';
  reasoning: string;
  predicted_peak_time: string;
}

/**
 * The core logic that runs every cycle.
 */
const runSurgeAnalysis = async () => {
  console.log("🌊 SurgeMind Engine: Starting analysis cycle...");

  try {
    // 1. Gather Data
    const metrics = await gatherHospitalMetrics();
    console.log("📊 Metrics gathered:", metrics);

    // 2. Send to AI
    const messages = buildSurgePrompt(metrics);
    // Force JSON mode via prompt engineering + strict parsing, assuming standard model
    const rawResponse = await runLLM(messages, "google/gemini-2.0-pro-exp-02-05:free", true);

    // 3. Clean and Parse Response
    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    let prediction: SurgePrediction;
    
    try {
      prediction = JSON.parse(cleanJson);
    } catch (e) {
      console.error("❌ Surge Engine failed to parse AI response:", cleanJson);
      return;
    }

    console.log("🔮 Prediction generated:", prediction);

    // 4. Write to Database
    const { error } = await supabase.from('surge_predictions').insert({
      risk_score: prediction.risk_score,
      level: prediction.level,
      reasoning: prediction.reasoning,
      predicted_peak_time: prediction.predicted_peak_time,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error("❌ Failed to save surge prediction:", error);
    } else {
      console.log("✅ Surge prediction saved to database.");
    }

  } catch (error) {
    console.error("❌ Surge Engine Critical Error:", error);
  }
};

/**
 * Starts the autonomous forecasting agent.
 * Should be called once at app startup.
 */
export const startSurgeEngine = () => {
  if (engineInterval) {
    console.warn("⚠️ Surge Engine is already running.");
    return;
  }

  console.log("🚀 SurgeMind Surge Engine Initialized (Autopilot Mode)");
  
  // Run immediately on startup
  runSurgeAnalysis();

  // Schedule periodic runs
  engineInterval = setInterval(runSurgeAnalysis, RUN_INTERVAL_MS);
};

/**
 * Stops the agent (useful for cleanup if needed).
 */
export const stopSurgeEngine = () => {
  if (engineInterval) {
    clearInterval(engineInterval);
    engineInterval = null;
    console.log("🛑 Surge Engine stopped.");
  }
};