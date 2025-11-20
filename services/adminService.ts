import { supabase } from '../lib/supabase';
import { 
  Patient, StaffMember, Task, Emergency, Bed, Supply, 
  IoTReading, CCTVEvent, ForecastData, StaffStatus, 
  BedStatus, TaskStatus, EmergencySeverity, CCTVEventType,
  IoTDevice
} from '../types';

// --- Mappers (DB Schema -> App Type) ---

const mapStaff = (data: any): StaffMember => ({
  id: data.id,
  name: data.name || 'Unknown Staff', // 'name' not strictly in schema provided (users table link needed?), assuming view or join
  role: data.role,
  status: (data.status as StaffStatus) || StaffStatus.Offline,
  shiftEnd: new Date(), // specific column missing in schema provided, mocking for UI
  workload: data.tasks_completed ? Math.min(data.tasks_completed * 10, 100) : 0,
  tasksCompleted: data.tasks_completed || 0
});

// Schema: id, user_id, name, age, room, condition, admitted_at
const mapPatient = (data: any): Patient => ({
  id: data.id,
  name: data.name,
  age: data.age,
  gender: 'Other', // Column missing in provided schema
  admissionDate: new Date(data.admitted_at),
  bedId: data.room, // Mapping 'room' column to bedId for assignment logic
  condition: data.condition,
  // Vitals missing in patients table, mocking default safe values or need join with iot_readings
  vitals: { heartRate: 80, oxygenLevel: 98, temperature: 98.6, bpSystolic: 120 }
});

// Schema: id, title, room, priority, patient_id, assigned_to, status, created_at
const mapTask = (data: any): Task => ({
  id: data.id,
  title: data.title,
  description: `Room: ${data.room || 'N/A'}`,
  status: (data.status as TaskStatus) || TaskStatus.Pending,
  assignedTo: data.assigned_to,
  createdAt: new Date(data.created_at),
  priority: data.priority
});

// Schema: id, type, room, triggered_by, status, created_at
const mapEmergency = (data: any): Emergency => ({
  id: data.id,
  type: data.type,
  location: data.room || 'Unknown',
  severity: EmergencySeverity.High, // Schema lacks severity column, defaulting
  timestamp: new Date(data.created_at),
  details: `Status: ${data.status}`,
  assignedStaff: []
});

// Schema: id, ward, bed_number, status
const mapBed = (data: any): Bed => ({
  id: String(data.id), // DB is int, App expects string
  ward: data.ward,
  status: (data.status as BedStatus) || BedStatus.Free,
  patientId: null // Need to join with patients to populate this efficiently
});

const mapSupply = (data: any): Supply => ({
  id: data.id,
  name: data.name,
  level: data.quantity || 0,
  criticalThreshold: data.threshold || 10
});

const mapIoTDevice = (data: any): IoTDevice => ({
    id: data.id || 'unknown',
    type: 'HeartRate', // Defaulting as schema for iot_devices wasn't fully detailed in dump (iot_readings exists)
    patientId: 'unknown',
    status: 'online',
    lastReading: 0,
    unit: 'bpm'
});

const mapIoTReading = (data: any): IoTReading => ({
  deviceId: data.device_id,
  value: data.heart_rate || data.spo2 || 0, // simplistic mapping
  timestamp: new Date(data.timestamp)
});

const mapCCTVEvent = (data: any): CCTVEvent => ({
  id: data.id,
  cameraId: data.camera_id,
  location: 'Unknown',
  type: (data.event_type as CCTVEventType) || CCTVEventType.Anomaly,
  timestamp: new Date(data.timestamp),
  clipUrl: '',
  riskScore: Number(data.confidence) || 0,
  detectionData: []
});

const mapForecast = (data: any): ForecastData => ({
  region: data.level, // Mismatch in schema, using level as region placeholder
  riskLevel: data.risk_score ? data.risk_score / 100 : 0
});

// --- API Functions ---

export const getStaffStatus = async (): Promise<StaffMember[]> => {
  // Note: Real app would join with 'users' table to get names
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
  // We need to know which patient is in which bed to populate patientId.
  // Since 'patients' table has 'room' (mapped to bedId), we fetch patients too.
  const [{ data: bedsData, error: bedsError }, { data: patientsData }] = await Promise.all([
      supabase.from('beds').select('*').order('id'),
      supabase.from('patients').select('id, room')
  ]);
  
  if (bedsError) throw bedsError;
  
  const patientsByRoom = (patientsData || []).reduce((acc: any, p: any) => {
      if (p.room) acc[String(p.room)] = p.id;
      return acc;
  }, {});

  return (bedsData || []).map(b => {
      const bed = mapBed(b);
      bed.patientId = patientsByRoom[bed.id] || null;
      // If patient exists but status is Free, force Occupied? Or trust DB?
      // Trust DB status for now, but ideally they should sync.
      return bed;
  });
};

export const getEmergencies = async (): Promise<Emergency[]> => {
  const { data, error } = await supabase
    .from('emergencies')
    .select('*')
    .order('created_at', { ascending: false })
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
  const { data, error } = await supabase.from('surge_predictions').select('*');
  if (error) throw error;
  return (data || []).map(mapForecast);
};

export const getIoTDevices = async (): Promise<IoTDevice[]> => {
    // Schema for 'iot_devices' was not provided in the dump, only 'iot_readings'.
    // Returning empty or mocking based on readings if needed.
    return []; 
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

// --- Actions ---

export const assignPatientToBed = async (patientId: string, bedId: string) => {
  // 1. Update Bed Status
  const { error: bedError } = await supabase
    .from('beds')
    .update({ status: 'Occupied' })
    .eq('id', parseInt(bedId)); // ID is int in DB

  if (bedError) throw bedError;

  // 2. Update Patient Room (mapped to Bed ID)
  const { error: patientError } = await supabase
    .from('patients')
    .update({ room: bedId })
    .eq('id', patientId);

  if (patientError) {
    // Rollback bed status if patient update fails
    await supabase.from('beds').update({ status: 'Free' }).eq('id', parseInt(bedId));
    throw patientError;
  }

  return true;
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
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'surge_predictions' }, async () => {
      const forecasts = await getSurgePredictions();
      callback(forecasts);
    })
    .subscribe();
};
