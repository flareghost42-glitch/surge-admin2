import { Patient, StaffMember, Bed, Supply, BedStatus, StaffStatus } from './types';

export const STAFF_NAMES = ["Dr. Smith", "Dr. Jones", "Nurse Sarah", "Nurse Mike", "Dr. Chen", "Nurse Emily", "Dr. Patel", "Nurse David"];
export const WARDS = ["General", "ICU", "Maternity", "Pediatrics", "Cardiology"];
export const CCTV_VIDEO_FEEDS = ["https://www.shutterstock.com/shutterstock/videos/3654955493/preview/stock-footage-high-angle-cctv-footage-with-a-busy-hallway-with-reception-desk-of-a-hospital-building-diverse.mp4", "https://www.shutterstock.com/shutterstock/videos/3654955493/preview/stock-footage-high-angle-cctv-footage-with-a-busy-hallway-with-reception-desk-of-a-hospital-building-diverse.mp4", "https://www.shutterstock.com/shutterstock/videos/3654955493/preview/stock-footage-high-angle-cctv-footage-with-a-busy-hallway-with-reception-desk-of-a-hospital-building-diverse.mp4"];

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