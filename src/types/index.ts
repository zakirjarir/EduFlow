
export type UserRole = 'admin' | 'student';

export interface Student {
  id: string;
  name: string;
  roll: string;
  class: string;
  phone: string;
  password?: string; // For login
  qrCode: string;
  isCaptain: boolean; // Captain can take attendance
  userId?: string;    // Links to auth record
  createdAt: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // ISO format
  status: AttendanceStatus;
  markedBy: string; // ID of the person who marked it (Admin or Captain)
  timestamp: number;
}

export type FeeStatus = 'paid' | 'due' | 'partial';
export type FeeType = 'admission' | 'monthly' | 'late' | 'absent' | 'fine' | 'other';

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
