
import { supabase } from "../lib/supabase";
import { runLLM } from "../lib/openrouter";
import { taskAgentPrompt } from "./prompts/taskAgentPrompt";

interface AITaskResponse {
  title: string;
  priority: 'low' | 'medium' | 'high';
  room: string;
  description: string;
  patient_name: string;
}

/**
 * Finds the best staff member to assign a task to.
 * Logic: Active staff with the lowest number of pending tasks.
 */
async function getBestStaff(): Promise<string | null> {
  try {
    // 1. Get all active staff
    const { data: activeStaff, error: staffError } = await supabase
      .from('staff')
      .select('id')
      .neq('status', 'Offline'); // Consider Active or Busy, but not Offline

    if (staffError || !activeStaff || activeStaff.length === 0) return null;

    // 2. Get task counts for these staff
    const { data: pendingTasks, error: taskError } = await supabase
      .from('tasks')
      .select('assigned_to')
      .eq('status', 'Pending');

    if (taskError) return activeStaff[0].id; // Fallback

    // 3. Calculate load
    const workload: Record<string, number> = {};
    activeStaff.forEach(s => workload[s.id] = 0);
    
    pendingTasks?.forEach((t: any) => {
      if (workload[t.assigned_to] !== undefined) {
        workload[t.assigned_to]++;
      }
    });

    // 4. Find min load
    let bestStaffId = activeStaff[0].id;
    let minLoad = Infinity;

    for (const staff of activeStaff) {
      if (workload[staff.id] < minLoad) {
        minLoad = workload[staff.id];
        bestStaffId = staff.id;
      }
    }

    return bestStaffId;

  } catch (error) {
    console.error("Staff assignment error:", error);
    return null;
  }
}

/**
 * Lookup patient ID by name if provided by AI
 */
async function lookupPatientId(name: string): Promise<string | null> {
  if (!name) return null;
  
  // Simple search, in a real app use strict ID matching or fuzzy search
  const { data } = await supabase
    .from('patients')
    .select('id')
    .ilike('name', `%${name}%`)
    .limit(1)
    .maybeSingle();
    
  return data?.id || null;
}

/**
 * Main engine entry point
 */
export async function processEvent(event: any) {
  console.log("⚙️ Agent processing event:", event);

  try {
    // 1. Call LLM with JSON mode = true
    const messages = taskAgentPrompt(event);
    const rawResponse = await runLLM(messages, "google/gemini-2.0-pro-exp-02-05:free", true);
    
    if (!rawResponse || rawResponse.startsWith("Error") || rawResponse.startsWith("System Error")) {
        console.warn("⚠️ AI Agent skipped event due to LLM error:", rawResponse);
        return;
    }

    // 2. Parse JSON (Handle potential markdown fences)
    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    let taskData: AITaskResponse;
    try {
        taskData = JSON.parse(cleanJson);
    } catch (e) {
        console.error("❌ Failed to parse AI JSON:", cleanJson);
        return;
    }

    console.log("🧠 AI Decided:", taskData);

    // 3. Enrich Data
    const patientId = await lookupPatientId(taskData.patient_name);
    const assignedTo = await getBestStaff();

    if (!assignedTo) {
      console.warn("⚠️ No staff available to assign task.");
      return;
    }

    // 4. Insert Task
    const { error } = await supabase.from('tasks').insert({
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority.charAt(0).toUpperCase() + taskData.priority.slice(1), // Capitalize
      room: taskData.room || event.room || 'Unknown',
      patient_id: patientId,
      assigned_to: assignedTo,
      status: 'Pending',
      created_by_ai: true,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error("❌ Failed to insert AI task:", error);
    } else {
      console.log(`✅ AI Task Created & Assigned to ${assignedTo}`);
    }

  } catch (error) {
    console.error("❌ Agent Error processing event:", error);
  }
}
