
import { supabase } from '../../lib/supabase';

export type SurgeFeatures = {
  admissionRate: number;      // Patients admitted in last 1h
  bedOccupancyPercent: number; // % of beds occupied
  emergencyRate: number;      // Emergencies in last 1h
  abnormalVitalsRate: number; // Critical IoT readings in last 1h
  pendingTasks: number;       // Total pending tasks
  supplyStrain: number;       // Count of supplies below threshold
  cctvCrowdingScore: number;  // Count of crowd/agitation events in last 1h
};

/**
 * Aggregates real-time data from multiple tables to form a snapshot of hospital health.
 */
export const gatherHospitalMetrics = async (): Promise<SurgeFeatures> => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  try {
    // 1. Bed Occupancy
    const { data: beds } = await supabase.from('beds').select('status');
    const totalBeds = beds?.length || 1;
    const occupiedBeds = beds?.filter(b => b.status === 'Occupied').length || 0;
    const bedOccupancyPercent = (occupiedBeds / totalBeds) * 100;

    // 2. Admission Rate (Last 1 Hour)
    const { count: admissionRate } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .gt('admitted_at', oneHourAgo); // Assuming 'admitted_at' exists, or we check created_at

    // 3. Emergency Rate (Last 1 Hour)
    const { count: emergencyRate } = await supabase
      .from('emergencies')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', oneHourAgo);

    // 4. Abnormal Vitals (Last 1 Hour)
    // We look for readings specifically flagged or implicitly critical logic
    const { count: abnormalVitalsRate } = await supabase
      .from('iot_readings')
      .select('*', { count: 'exact', head: true })
      .gt('timestamp', oneHourAgo)
      .or('heart_rate.gt.120,spo2.lt.90');

    // 5. Task Backlog
    const { count: pendingTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending');

    // 6. Supply Strain
    // We fetch all supplies and count how many are below threshold locally
    const { data: supplies } = await supabase.from('supplies').select('quantity, threshold');
    const supplyStrain = supplies?.filter((s: any) => s.quantity < s.threshold).length || 0;

    // 7. CCTV Crowding (Last 1 Hour)
    const { count: cctvCrowdingScore } = await supabase
      .from('cctv_events')
      .select('*', { count: 'exact', head: true })
      .gt('timestamp', oneHourAgo)
      .or('event_type.ilike.%crowd%,event_type.ilike.%agitation%');

    return {
      admissionRate: admissionRate || 0,
      bedOccupancyPercent,
      emergencyRate: emergencyRate || 0,
      abnormalVitalsRate: abnormalVitalsRate || 0,
      pendingTasks: pendingTasks || 0,
      supplyStrain,
      cctvCrowdingScore: cctvCrowdingScore || 0
    };

  } catch (error) {
    console.error("❌ Error gathering metrics for Surge Engine:", error);
    // Return safe defaults to keep engine running
    return {
      admissionRate: 0,
      bedOccupancyPercent: 0,
      emergencyRate: 0,
      abnormalVitalsRate: 0,
      pendingTasks: 0,
      supplyStrain: 0,
      cctvCrowdingScore: 0
    };
  }
};
