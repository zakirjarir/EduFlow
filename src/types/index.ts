
export interface Student {
  id: string;
  name: string;
  roll: string;
  class: string;
  phone: string;
  qrCode: string;
  createdAt: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // ISO format
  status: AttendanceStatus;
  timestamp: number;
}

export type FeeStatus = 'paid' | 'due' | 'partial';
export type FeeType = 'admission' | 'monthly' | 'late' | 'fine';

export interface FeeRecord {
  id: string;
  studentId: string;
  type: FeeType;
  amount: number;
  status: FeeStatus;
  date: string;
  timestamp: number;
}

export interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  totalFeesCollected: number;
  dueFeesSummary: number;
}
