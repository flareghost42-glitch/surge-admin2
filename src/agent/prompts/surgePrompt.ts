
import { ChatMessage } from "../../lib/openrouter";
import { SurgeFeatures } from "../utils/trendAnalysis";

const SYSTEM_PROMPT = `
You are the "SurgeMind Surge Engine", a specialized medical AI for predictive hospital analytics.

Your Goal: Analyze specific hospital metrics to predict patient surge risk.

Rules:
1. Output ONLY valid JSON. No markdown formatting (no \`\`\`json blocks), no conversational text.
2. Analyze the relationships between bed occupancy, emergency inflow, and staff load.
3. Use the following thresholds as a guide:
   - Bed Occupancy > 85% -> High Risk
   - Emergency Rate > 5/hour -> High Risk
   - Critical Supplies > 3 items -> Moderate Risk
   - Combination of high task backlog + crowding -> Critical Risk

Output Format:
{
  "risk_score": number (0-100),
  "level": "normal" | "warning" | "critical",
  "reasoning": "A single, concise paragraph explaining the primary drivers of this risk level.",
  "predicted_peak_time": "ISO 8601 timestamp (estimate 1-4 hours from now based on velocity)"
}
`;

export const buildSurgePrompt = (metrics: SurgeFeatures): ChatMessage[] => {
  const now = new Date().toLocaleString();
  
  const userContent = `
    Current Hospital State (${now}):
    - Bed Occupancy: ${metrics.bedOccupancyPercent.toFixed(1)}%
    - Admissions (Last Hour): ${metrics.admissionRate}
    - New Emergencies (Last Hour): ${metrics.emergencyRate}
    - Critical Vital Alerts (Last Hour): ${metrics.abnormalVitalsRate}
    - Pending Nurse Tasks: ${metrics.pendingTasks}
    - Supplies Below Critical Threshold: ${metrics.supplyStrain}
    - Crowd/Agitation Events (CCTV): ${metrics.cctvCrowdingScore}
    
    Based on this snapshot, predict the surge status for the next 4 hours.
  `;

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userContent }
  ];
};
