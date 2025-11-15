export enum SurgeLevel {
  Normal = 'Normal',
  Moderate = 'Moderate',
  High = 'High',
  Critical = 'Critical'
}

export enum BedStatus {
  Occupied = 'Occupied',
  Free = 'Free',
  Cleaning = 'Cleaning',
  Reserved = 'Reserved'
}

export enum StaffStatus {
  Active = 'Active',
  Busy = 'Busy',
  Offline = 'Offline',
}

export enum TaskStatus {
  Pending = 'Pending',
  InProgress = 'In-Progress',
  Completed = 'Completed'
}

export enum EmergencySeverity {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  admissionDate: Date;
  bedId: string | null;
  condition: 'Stable' | 'Guarded' | 'Critical';
  vitals: {
    heartRate: number;
    oxygenLevel: number;
    temperature: number;
    bpSystolic: number;
  };
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: StaffStatus;
  shiftEnd: Date;
  workload: number; // 0 to 100
  tasksCompleted: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo: string | null;
  createdAt: Date;
  priority: 'Low' | 'Medium' | 'High';
}

export interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  date: Date;
  reason: string;
}

export interface Emergency {
  id: string;
  type: string;
  location: string;
  severity: EmergencySeverity;
  timestamp: Date;
  details: string;
  assignedStaff: string[];
}

export interface Bed {
  id: string;
  ward: string;
  status: BedStatus;
  patientId: string | null;
}

export interface ForecastData {
  region: string;
  riskLevel: number; // 0 to 1
}

export interface Supply {
  id: string;
  name: string;
  level: number; // 0 to 100
  criticalThreshold: number;
}

export enum CCTVEventType {
  Fall = 'Fall Detected',
  Crowd = 'Crowd Formation',
  Anomaly = 'Unusual Activity',
  UnauthorizedEntry = 'Unauthorized Entry',
  PersonDetected = 'Person Detected',
}

export interface CCTVEvent {
  id: string;
  cameraId: string;
  location: string;
  type: CCTVEventType;
  timestamp: Date;
  clipUrl: string; 
  riskScore: number; // 0 to 1
  detectionData?: { box: [number, number, number, number] }[]; // [x, y, width, height] in percentage
}

export interface IoTDevice {
  id: string;
  type: 'HeartRate' | 'Oxygen' | 'Temperature' | 'BPSystolic';
  patientId: string;
  status: 'online' | 'offline' | 'error';
  lastReading: number;
  unit: string;
}

export interface IoTReading {
  deviceId: string;
  value: number;
  timestamp: Date;
}

export interface AIRecommendation {
  id: string;
  text: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  category: 'STAFF' | 'PATIENT_FLOW' | 'SUPPLY' | 'OPERATIONS' | 'GENERAL';
}

export enum AlertType {
  CCTV = 'CCTV',
  IoT = 'IoT',
  Surge = 'Surge',
  Supply = 'Supply',
  Emergency = 'Emergency'
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
}