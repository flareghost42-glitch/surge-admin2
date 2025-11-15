import { Patient, StaffMember, Bed, Supply, BedStatus, StaffStatus } from './types';

export const STAFF_NAMES = ["Dr. Smith", "Dr. Jones", "Nurse Sarah", "Nurse Mike", "Dr. Chen", "Nurse Emily", "Dr. Patel", "Nurse David"];
export const PATIENT_NAMES = ["John Doe", "Jane Smith", "Robert Brown", "Emily White", "Michael Green", "Jessica Black", "Chris Blue", "Olivia Grey", "William Red", "Sophia Purple"];
export const WARDS = ["General", "ICU", "Maternity", "Pediatrics", "Cardiology"];
export const CCTV_VIDEO_FEEDS = ["/videos/ward1.mp4", "https://www.shutterstock.com/shutterstock/videos/3654955493/preview/stock-footage-high-angle-cctv-footage-with-a-busy-hallway-with-reception-desk-of-a-hospital-building-diverse.mp4", "/videos/icu1.mp4"];

export const INITIAL_STAFF: StaffMember[] = STAFF_NAMES.map((name, i) => ({
  id: `staff-${i}`,
  name,
  role: name.startsWith("Dr.") ? 'Doctor' : 'Nurse',
  status: StaffStatus.Active,
  shiftEnd: new Date(Date.now() + 8 * 60 * 60 * 1000),
  workload: 40 + Math.floor(Math.random() * 30),
  tasksCompleted: Math.floor(Math.random() * 10),
}));

export const INITIAL_BEDS: Bed[] = WARDS.flatMap(ward => 
  Array.from({ length: 10 }).map((_, i) => ({
    id: `${ward.slice(0, 3).toUpperCase()}-${i + 1}`,
    ward,
    status: Math.random() > 0.6 ? BedStatus.Occupied : BedStatus.Free,
    patientId: null,
  }))
);

export const INITIAL_PATIENTS: Patient[] = PATIENT_NAMES.map((name, i) => {
  const occupiedBed = INITIAL_BEDS.find(b => b.status === BedStatus.Occupied && b.patientId === null);
  if (occupiedBed) {
    occupiedBed.patientId = `patient-${i}`;
  }
  const conditionRoll = Math.random();
  return {
    id: `patient-${i}`,
    name,
    age: 20 + Math.floor(Math.random() * 60),
    gender: Math.random() > 0.5 ? 'Male' : 'Female',
    admissionDate: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
    bedId: occupiedBed ? occupiedBed.id : null,
    condition: conditionRoll > 0.8 ? 'Critical' : (conditionRoll > 0.5 ? 'Guarded' : 'Stable'),
    vitals: {
      heartRate: 70 + Math.floor(Math.random() * 20),
      oxygenLevel: 96 + Math.floor(Math.random() * 4),
      temperature: 98.6 + (Math.random() - 0.5),
      bpSystolic: 120 + Math.floor(Math.random() * 10),
    },
  };
});

export const INITIAL_SUPPLIES: Supply[] = [
  { id: 'oxygen', name: 'Oxygen Supply', level: 85, criticalThreshold: 30 },
  { id: 'masks', name: 'N95 Masks', level: 95, criticalThreshold: 20 },
  { id: 'gloves', name: 'Surgical Gloves', level: 90, criticalThreshold: 20 },
  { id: 'iv_fluids', name: 'IV Fluids', level: 70, criticalThreshold: 40 },
];

export const INDIA_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweeep", "Puducherry"
];

export const SIMULATION_INTERVALS = {
  GLOBAL_TICK: 4000,
  SURGE_PREDICTION: 120000,
  NEW_TASK: 25000,
  EMERGENCY: 60000,
  CCTV_EVENT: 15000,
  IOT_READING: 4000,
  PATIENT_INFLOW: 20000,
  RECOMMENDATION: 150000,
  ALERT: 10000,
};