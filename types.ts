export interface HealthRecord {
  id: string;
  date: string; // ISO string format YYYY-MM-DD
  weight: number; // Current body weight (kg)
  dryWeight: number; // Target dry weight (kg)
  fluidRemoval?: number; // Fluid removed during dialysis (kg/L)
  systolic: number; // mmHg
  diastolic: number; // mmHg
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string; // e.g., "每日一次", "透析后"
  reminderTime?: string; // HH:mm format for notifications
  takenToday: boolean;
  lastTakenDate?: string; // YYYY-MM-DD
}

export interface PatientProfile {
  name: string;
  age: number;
  dialysisAge?: number; // Months on dialysis
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ENTRY = 'ENTRY',
  ANALYTICS = 'ANALYTICS',
  MEDICATIONS = 'MEDICATIONS',
  PROFILE = 'PROFILE',
}

export interface AnalysisResult {
  summary: string;
  trend: 'stable' | 'warning' | 'improving';
}