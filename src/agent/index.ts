import { supabase } from "../lib/supabase";
import { processEvent } from "./taskEngine";

let isAgentRunning = false;

export function startAgent() {
  if (isAgentRunning) return;
  isAgentRunning = true;

  console.log("🤖 SurgeMind AI Agent Started... Listening for events.");

  const channel = supabase.channel('ai-agent-global');

  // 1. Listen for Emergencies
  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'emergencies' },
    (payload) => {
      console.log("🚨 Agent detected EMERGENCY");
      processEvent({ type: 'EMERGENCY', ...payload.new });
    }
  );

  // 2. Listen for Critical IoT Readings
  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'iot_readings' },
    (payload) => {
      const r = payload.new;
      // Filter logic: only act on critical values to save tokens/noise
      if (r.heart_rate > 120 || r.spo2 < 90 || (r.status && r.status === 'critical')) {
        console.log("💓 Agent detected CRITICAL VITALS");
        processEvent({ type: 'IOT_CRITICAL', ...r });
      }
    }
  );

  // 3. (Optional) CCTV Anomalies
  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'cctv_events' },
    (payload) => {
        const e = payload.new;
        // Only high confidence adverse events
        if (e.confidence > 0.8 && (e.event_type === 'Fall Detected' || e.event_type === 'Fight')) {
             console.log("📷 Agent detected CCTV ANOMALY");
             processEvent({ type: 'CCTV_ALERT', ...e });
        }
    }
  );

  channel.subscribe();
}