import { supabase } from '../lib/supabase';
import { 
  Patient, StaffMember, Task, Emergency, Bed, Supply, 
  IoTReading, CCTVEvent, ForecastData, StaffStatus, 
  BedStatus, TaskStatus, EmergencySeverity, CCTVEventType,
  IoTDevice
} from '../types';

// --- Mappers (DB Snake_case -> App CamelCase) ---

const mapStaff = (data: any): StaffMember => ({
  id: data.id,
  name: data.name,
  role: data.role,
  status: data.status as StaffStatus,
  shiftEnd: new Date(data.shift_end),
  workload: data.workload,
  tasksCompleted: data.tasks_completed
});

const mapPatient = (data: any): Patient => ({
  id: data.id,
  name: data.name,
  age: data.age,
  gender: data.gender,
  admissionDate: new Date(data.admission_date),
  bedId: data.bed_id,
  condition: data.condition,
  vitals: data.vitals || { heartRate: 0, oxygenLevel: 0, temperature: 98.6, bpSystolic: 120 }
});

const mapTask = (data: any): Task => ({
  id: data.id,
  title: data.title,
  description: data.description,
  status: data.status as TaskStatus,
  assignedTo: data.assigned_to,
  createdAt: new Date(data.created_at),
  priority: data.priority
});

const mapEmergency = (data: any): Emergency => ({
  id: data.id,
  type: data.type,
  location: data.location,
  severity: data.severity as EmergencySeverity,
  timestamp: new Date(data.timestamp),
  details: data.details,
  assignedStaff: data.assigned_staff || []
});

const mapBed = (data: any): Bed => ({
  id: data.id,
  ward: data.ward,
  status: data.status as BedStatus,
  patientId: data.patient_id
});

const mapSupply = (data: any): Supply => ({
  id: data.id,
  name: data.name,
  level: data.level,
  criticalThreshold: data.critical_threshold
});

const mapIoTDevice = (data: any): IoTDevice => ({
    id: data.id,
    type: data.type,
    patientId: data.patient_id,
    status: data.status,
    lastReading: data.last_reading,
    unit: data.unit
});

const mapIoTReading = (data: any): IoTReading => ({
  deviceId: data.device_id,
  value: data.value,
  timestamp: new Date(data.timestamp)
});

const mapCCTVEvent = (data: any): CCTVEvent => ({
  id: data.id,
  cameraId: data.camera_id,
  location: data.location,
  type: data.type as CCTVEventType,
  timestamp: new Date(data.timestamp),
  clipUrl: data.clip_url,
  riskScore: data.risk_score,
  detectionData: data.detection_data
});

const mapForecast = (data: any): ForecastData => ({
  region: data.region,
  riskLevel: data.risk_level
});

// --- API Functions ---

export const getDashboardStats = async () => {
  const [
    { count: patientCount },
    { count: bedCount },
    { count: taskCount },
    { count: emergencyCount }
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('beds').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabase.from('emergencies').select('*', { count: 'exact', head: true }).neq('severity', 'Low')
  ]);

  return {
    patientCount: patientCount || 0,
    bedCount: bedCount || 0,
    pendingTasks: taskCount || 0,
    activeEmergencies: emergencyCount || 0
  };
};

export const getStaffStatus = async (): Promise<StaffMember[]> => {
  const { data, error } = await supabase.from('staff').select('*');
  if (error) throw error;
  return (data || []).map(mapStaff);
};

export const getPatients = async (): Promise<Patient[]> => {
  const { data, error } = await supabase.from('patients').select('*');
  if (error) throw error;
  return (data || []).map(mapPatient);
};

export const getSupplies = async (): Promise<Supply[]> => {
  const { data, error } = await supabase.from('supplies').select('*');
  if (error) throw error;
  return (data || []).map(mapSupply);
};

export const getBeds = async (): Promise<Bed[]> => {
  const { data, error } = await supabase.from('beds').select('*').order('id');
  if (error) throw error;
  return (data || []).map(mapBed);
};

export const getEmergencies = async (): Promise<Emergency[]> => {
  const { data, error } = await supabase
    .from('emergencies')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map(mapEmergency);
};

export const getTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []).map(mapTask);
};

export const getSurgePredictions = async (): Promise<ForecastData[]> => {
  const { data, error } = await supabase.from('forecasts').select('*');
  if (error) throw error;
  return (data || []).map(mapForecast);
};

export const getIoTDevices = async (): Promise<IoTDevice[]> => {
    const { data, error } = await supabase.from('iot_devices').select('*');
    if (error) throw error;
    return (data || []).map(mapIoTDevice);
};

export const getCCTVEvents = async (): Promise<CCTVEvent[]> => {
    const { data, error } = await supabase
        .from('cctv_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
    if (error) throw error;
    return (data || []).map(mapCCTVEvent);
};

// --- Realtime Subscriptions ---

export const subscribeToEmergencies = (callback: (emergency: Emergency) => void) => {
  return supabase
    .channel('emergencies-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'emergencies' }, (payload) => {
      callback(mapEmergency(payload.new));
    })
    .subscribe();
};

export const subscribeToTasks = (callback: (task: Task) => void) => {
  return supabase
    .channel('tasks-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, (payload) => {
      callback(mapTask(payload.new));
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, (payload) => {
      callback(mapTask(payload.new));
    })
    .subscribe();
};

export const subscribeToIoTReadings = (callback: (reading: IoTReading) => void) => {
  return supabase
    .channel('iot-readings-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'iot_readings' }, (payload) => {
      callback(mapIoTReading(payload.new));
    })
    .subscribe();
};

export const subscribeToCCTV = (callback: (event: CCTVEvent) => void) => {
  return supabase
    .channel('cctv-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cctv_events' }, (payload) => {
      callback(mapCCTVEvent(payload.new));
    })
    .subscribe();
};

export const subscribeToSupplies = (callback: (supplies: Supply[]) => void) => {
  // For supplies, we just refetch the whole list on any change for simplicity as the list is small
  return supabase
    .channel('supplies-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'supplies' }, async () => {
      const supplies = await getSupplies();
      callback(supplies);
    })
    .subscribe();
};

export const subscribeToSurgePredictions = (callback: (forecast: ForecastData[]) => void) => {
  return supabase
    .channel('forecast-channel')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'forecasts' }, async () => {
      const forecasts = await getSurgePredictions();
      callback(forecasts);
    })
    .subscribe();
};