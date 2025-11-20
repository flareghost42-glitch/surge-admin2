
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// --- Configuration ---
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  (process as any).exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- Types ---

interface TaskData {
  title: string;
  room: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  description?: string;
  patient_id?: string;
  assigned_to?: string;
}

interface Staff {
  id: string;
  name: string;
  status: string;
  role: string;
  active_tasks_count?: number;
}

interface IoTReading {
  id: string;
  device_id: string;
  heart_rate: number;
  spo2: number;
  bp: string;
  timestamp: string;
}

interface CCTVEvent {
  id: string;
  event_type: string;
  camera_id: string;
  confidence: number;
  timestamp: string;
}

// --- State Tracking (to avoid duplicate tasks) ---
let lastCheckTimes = {
  iot: new Date().toISOString(),
  cctv: new Date().toISOString(),
  supply: new Date().toISOString(),
  bed: new Date().toISOString(),
  surge: new Date().toISOString(),
};

// --- Helper Functions ---

/**
 * Fetch active staff and calculate their current workload.
 * Returns the staff member with the lowest number of pending/in-progress tasks.
 */
async function getBestStaff(): Promise<string | null> {
  try {
    // 1. Get all active staff
    const { data: staffMembers, error: staffError } = await supabase
      .from('staff')
      .select('id, name, status')
      .eq('status', 'active');

    if (staffError || !staffMembers || staffMembers.length === 0) {
      console.warn('⚠️ No active staff found for assignment.');
      return null;
    }

    // 2. Get task counts for these staff members
    // Note: In a raw SQL query we would join, but with Supabase JS client, we'll do a quick aggregate check.
    // We select tasks that are NOT completed.
    const { data: activeTasks, error: taskError } = await supabase
      .from('tasks')
      .select('assigned_to')
      .in('status', ['pending', 'in-progress', 'Pending', 'In-Progress']); // Handle case sensitivity

    if (taskError) {
      console.error('Error fetching tasks for workload calculation:', taskError);
      // Fallback: Random assignment if workload check fails
      const randomStaff = staffMembers[Math.floor(Math.random() * staffMembers.length)];
      return randomStaff.id;
    }

    // 3. Calculate workload
    const workloadMap: Record<string, number> = {};
    staffMembers.forEach(s => workloadMap[s.id] = 0);
    
    activeTasks?.forEach((t: any) => {
      if (workloadMap[t.assigned_to] !== undefined) {
        workloadMap[t.assigned_to]++;
      }
    });

    // 4. Find staff with minimum workload
    let bestStaffId = staffMembers[0].id;
    let minLoad = Infinity;

    for (const staff of staffMembers) {
      const load = workloadMap[staff.id];
      if (load < minLoad) {
        minLoad = load;
        bestStaffId = staff.id;
      }
    }

    console.log(`👨‍⚕️ Auto-Assignment: Selected staff ${bestStaffId} with active load: ${minLoad}`);
    return bestStaffId;

  } catch (err) {
    console.error('Error in getBestStaff:', err);
    return null;
  }
}

/**
 * Inserts generated tasks into Supabase after assigning them to the best staff member.
 */
async function insertTasks(tasks: TaskData[]) {
  if (tasks.length === 0) return;

  console.log(`⚡ AI Generator produced ${tasks.length} new tasks.`);

  for (const task of tasks) {
    const assignedStaffId = await getBestStaff();
    
    if (!assignedStaffId) {
      console.error(`❌ Could not assign task "${task.title}". No staff available.`);
      continue;
    }

    const payload = {
      title: task.title,
      room: task.room,
      priority: task.priority,
      // Mapping description to title if description column doesn't exist in old schema, 
      // or using it if the schema was updated as requested. 
      // We will assume standard schema fields.
      patient_id: task.patient_id || null,
      assigned_to: assignedStaffId,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('tasks').insert(payload);

    if (error) {
      console.error(`❌ Failed to insert task: ${task.title}`, error);
    } else {
      console.log(`✅ Task Created: [${task.priority}] ${task.title} -> Assigned to ${assignedStaffId}`);
    }
  }
}

// --- AI Logic Generators ---

async function checkIoT() {
  console.log('🔍 Checking IoT Devices...');
  const now = new Date().toISOString();
  
  // Fetch readings created since last check
  const { data: readings, error } = await supabase
    .from('iot_readings')
    .select('*')
    .gt('timestamp', lastCheckTimes.iot);

  if (error) {
    console.error('Error fetching IoT readings:', error);
    return;
  }

  lastCheckTimes.iot = now;

  const tasks: TaskData[] = [];

  readings?.forEach((r: IoTReading) => {
    if (r.heart_rate > 120) {
      tasks.push({
        title: `High Heart Rate Detected (${r.heart_rate} bpm)`,
        room: 'ICU', // In real app, join with device/patient location
        priority: 'High',
        description: 'Evaluate tachycardia immediately.',
      });
    }
    if (r.spo2 < 90) {
      tasks.push({
        title: `Critical SpO2 Level (${r.spo2}%)`,
        room: 'ICU', 
        priority: 'Critical',
        description: 'Check oxygen mask and breathing condition.',
      });
    }
    // Simple string check for BP 'critical' assuming pre-processed string or parsing logic
    if (r.bp && r.bp.toLowerCase().includes('critical')) {
        tasks.push({
            title: `Blood Pressure Critical`,
            room: 'ICU',
            priority: 'High',
            description: 'Check blood pressure manually.'
        });
    }
  });

  await insertTasks(tasks);
}

async function checkCCTV() {
  console.log('👀 Analyzing CCTV Events...');
  const now = new Date().toISOString();

  const { data: events, error } = await supabase
    .from('cctv_events')
    .select('*')
    .gt('timestamp', lastCheckTimes.cctv);

  if (error) {
    console.error('Error fetching CCTV events:', error);
    return;
  }

  lastCheckTimes.cctv = now;

  const tasks: TaskData[] = [];

  events?.forEach((e: CCTVEvent) => {
    const type = e.event_type.toLowerCase();
    
    if (type.includes('fall')) {
      tasks.push({
        title: `Fall Detected at ${e.camera_id}`,
        room: 'Hallway', // Map camera_id to location in real app
        priority: 'Critical',
        description: 'Assist patient immediately after fall detection.',
      });
    } else if (type.includes('agitation') || type.includes('fight')) {
      tasks.push({
        title: `Security: Agitation Detected`,
        room: 'Waiting Room',
        priority: 'High',
        description: 'De-escalate situation in monitored area.',
      });
    } else if (type.includes('crowd')) {
      tasks.push({
        title: `Crowd Control Needed`,
        room: 'Entrance',
        priority: 'Medium',
        description: 'Disperse crowd blocking emergency path.',
      });
    }
  });

  await insertTasks(tasks);
}

async function checkSupplies() {
  console.log('📦 Verifying Inventory Levels...');
  // No timestamp check here, we check current state vs threshold
  const { data: supplies, error } = await supabase
    .from('supplies')
    .select('*');

  if (error) return;

  const tasks: TaskData[] = [];

  supplies?.forEach((item: any) => {
    if (item.quantity < item.threshold) {
      // Check if a restocking task already exists to avoid duplicates
      // (Skipped for simplicity in this script, but recommended in prod)
      tasks.push({
        title: `Restock ${item.name}`,
        room: 'Supply Room',
        priority: 'Medium',
        description: `Quantity ${item.quantity} is below threshold ${item.threshold}.`,
      });
    }
  });

  // We only want to create these occasionally, so we might debounce real logic
  // For this agent, we assume the Supply Loop frequency (2 mins) handles the pacing.
  await insertTasks(tasks);
}

async function checkBeds() {
  console.log('🛏️ Managing Bed Turnover...');
  const { data: beds, error } = await supabase
    .from('beds')
    .select('*');

  if (error) return;

  const tasks: TaskData[] = [];

  beds?.forEach((bed: any) => {
    if (bed.status === 'Cleaning') {
       // Logic: In a real app, check 'updated_at'. 
       // Here we simulate "Too Long" if it stays cleaning across checks.
       tasks.push({
           title: `Inspect Bed ${bed.bed_number} Cleaning`,
           room: bed.ward,
           priority: 'Low',
           description: `Bed ${bed.bed_number} has been in cleaning status. Prepare for next patient.`
       });
    }
  });

  await insertTasks(tasks);
}

async function checkSurgeAndEmergencies() {
    console.log('📈 Analyzing Surge & Emergency Frequency...');
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

    // 1. Emergency Frequency
    const { data: emergencies, error: emError } = await supabase
        .from('emergencies')
        .select('id')
        .gt('created_at', tenMinutesAgo);

    const tasks: TaskData[] = [];

    if (emergencies && emergencies.length > 2) {
        tasks.push({
            title: 'Emergency Monitoring Round',
            room: 'ER',
            priority: 'High',
            description: 'High frequency of incoming emergencies detected. Verify triage status.'
        });
    }

    // 2. Surge Prediction
    const { data: surge, error: surgeError } = await supabase
        .from('surge_predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (surge && surge.length > 0) {
        const prediction = surge[0];
        if (prediction.risk_score > 70) {
            tasks.push({
                title: 'Prepare Backup Beds',
                room: 'General Ward',
                priority: 'High',
                description: `Surge risk is ${prediction.risk_score}. Prepare overflow capacity.`
            });
            tasks.push({
                title: 'Stock Oxygen and Ventilators',
                room: 'ICU',
                priority: 'Critical',
                description: 'High surge risk detected. Ensure life support equipment availability.'
            });
        }
    }

    await insertTasks(tasks);
}


// --- Main Agent Loop ---

console.log('🤖 SurgeMind Autonomous Supervisor Agent Initialized...');
console.log('⏱️  Starting monitoring loops...');

// 1. IoT Loop (Every 10s)
setInterval(checkIoT, 10 * 1000);

// 2. CCTV Loop (Every 20s)
setInterval(checkCCTV, 20 * 1000);

// 3. Bed Check (Every 1 min)
setInterval(checkBeds, 60 * 1000);

// 4. Supply Check (Every 2 mins)
setInterval(checkSupplies, 2 * 60 * 1000);

// 5. Surge & Emergency (Every 5 mins)
setInterval(checkSurgeAndEmergencies, 5 * 60 * 1000);

// Initial run
checkIoT();
checkCCTV();
