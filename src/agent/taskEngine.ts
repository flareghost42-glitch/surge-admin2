
import { supabase } from "../lib/supabase";
import { runLLM } from "../lib/openrouter";
import { taskAgentPrompt } from "./prompts/taskAgentPrompt";

interface AITaskResponse {
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  room: string;
  description: string;
  patient_name: string;
}

/**
 * Finds the best staff member to assign a task to.
 * Logic: Active staff with the lowest number of active (Pending/In-Progress) tasks.
 */
async function getBestStaff(): Promise<string | null> {
  try {
    // 1. Get all active staff (Exclude offline)
    const { data: activeStaff, error: staffError } = await supabase
      .from('staff')
      .select('id, name, status')
      .neq('status', 'Offline');

    if (staffError || !activeStaff || activeStaff.length === 0) {
      console.warn("⚠️ No active staff available for assignment.");
      return null;
    }

    // 2. Get active task counts for these staff (Pending & In-Progress)
    const { data: activeTasks, error: taskError } = await supabase
      .from('tasks')
      .select('assigned_to, status')
      .in('status', ['Pending', 'In-Progress', 'pending', 'in-progress']);

    if (taskError) {
      console.error("⚠️ Failed to fetch task load, defaulting to first staff member.");
      return activeStaff[0].id;
    }

    // 3. Calculate workload
    const workload: Record<string, number> = {};
    activeStaff.forEach(s => workload[s.id] = 0);
    
    activeTasks?.forEach((t: any) => {
      if (workload[t.assigned_to] !== undefined) {
        workload[t.assigned_to]++;
      }
    });

    // 4. Find staff with min load
    // Sort by: Workload ASC -> Status (Active > Busy)
    activeStaff.sort((a, b) => {
        const loadA = workload[a.id];
        const loadB = workload[b.id];
        if (loadA !== loadB) return loadA - loadB;
        
        // Tie-breaker: Prefer 'Active' over 'Busy'
        if (a.status === 'Active' && b.status !== 'Active') return -1;
        if (b.status === 'Active' && a.status !== 'Active') return 1;
        return 0;
    });

    const bestStaff = activeStaff[0];
    console.log(`👨‍⚕️ Auto-Assignment: Selected ${bestStaff.name} (Load: ${workload[bestStaff.id]})`);
    
    return bestStaff.id;

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
  
  // Simple search
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
  console.log("⚙️ Agent processing event:", event.type);

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

    console.log("🧠 AI Generated Task:", taskData.title);

    // 3. Enrich Data
    const patientId = await lookupPatientId(taskData.patient_name);
    const assignedTo = await getBestStaff();

    if (!assignedTo) {
      console.warn("⚠️ No staff available to assign task.");
      return;
    }

    // 4. Insert Task
    // Normalizing priority to match Enum
    const priorityCap = taskData.priority.charAt(0).toUpperCase() + taskData.priority.slice(1) as 'Low' | 'Medium' | 'High';
    
    const { error } = await supabase.from('tasks').insert({
      title: taskData.title,
      description: taskData.description,
      priority: priorityCap,
      room: taskData.room || event.room || 'Unknown',
      patient_id: patientId,
      assigned_to: assignedTo,
      status: 'Pending',
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error("❌ Failed to insert AI task:", error);
    } else {
      console.log(`✅ Task "${taskData.title}" assigned to ${assignedTo}`);
    }

  } catch (error) {
    console.error("❌ Agent Error processing event:", error);
  }
}
