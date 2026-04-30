
import { Student, AttendanceRecord, FeeRecord } from '../types';
import { format } from 'date-fns';

// Mock DB Initializer
const getStorage = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setStorage = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const api = {
  // --- Students ---
  students: {
    getAll: async (): Promise<Student[]> => {
      return getStorage<Student[]>('ef_students', []);
    },
    add: async (student: Omit<Student, 'id' | 'qrCode' | 'createdAt'>): Promise<Student> => {
      const students = await api.students.getAll();
      const newStudent = {
        ...student,
        id: crypto.randomUUID(),
        qrCode: `STU-${Date.now()}`, // Simple unique QR content
        createdAt: Date.now(),
      };
      setStorage('ef_students', [...students, newStudent]);
      return newStudent;
    },
    update: async (id: string, updates: Partial<Student>): Promise<Student> => {
      const students = await api.students.getAll();
      const index = students.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Student not found');
      students[index] = { ...students[index], ...updates };
      setStorage('ef_students', students);
      return students[index];
    },
    delete: async (id: string): Promise<void> => {
      const students = await api.students.getAll();
      setStorage('ef_students', students.filter(s => s.id !== id));
    },
    getById: async (id: string): Promise<Student | undefined> => {
      const students = await api.students.getAll();
      return students.find(s => s.id === id);
    }
  },

  // --- Attendance ---
  attendance: {
    getAll: async (): Promise<AttendanceRecord[]> => {
      return getStorage<AttendanceRecord[]>('ef_attendance', []);
    },
    mark: async (record: Omit<AttendanceRecord, 'id' | 'timestamp'>): Promise<AttendanceRecord> => {
      const records = await api.attendance.getAll();
      
      // Prevent duplicate attendance for same student on same day
      const existing = records.find(r => r.studentId === record.studentId && r.date === record.date);
      if (existing) {
        return api.attendance.update(existing.id, record.status);
      }

      const newRecord: AttendanceRecord = {
        ...record,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      setStorage('ef_attendance', [...records, newRecord]);
      return newRecord;
    },
    update: async (id: string, status: AttendanceRecord['status']): Promise<AttendanceRecord> => {
      const records = await api.attendance.getAll();
      const index = records.findIndex(r => r.id === id);
      if (index === -1) throw new Error('Record not found');
      records[index].status = status;
      setStorage('ef_attendance', records);
      return records[index];
    },
    getByDate: async (date: string): Promise<AttendanceRecord[]> => {
      const records = await api.attendance.getAll();
      return records.filter(r => r.date === date);
    }
  },

  // --- Fees ---
  fees: {
    getAll: async (): Promise<FeeRecord[]> => {
      return getStorage<FeeRecord[]>('ef_fees', []);
    },
    add: async (fee: Omit<FeeRecord, 'id' | 'timestamp'>): Promise<FeeRecord> => {
      const fees = await api.fees.getAll();
      const newFee: FeeRecord = {
        ...fee,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      setStorage('ef_fees', [...fees, newFee]);
      return newFee;
    },
    updateStatus: async (id: string, status: FeeRecord['status']): Promise<FeeRecord> => {
      const fees = await api.fees.getAll();
      const index = fees.findIndex(f => f.id === id);
      if (index === -1) throw new Error('Fee record not found');
      fees[index].status = status;
      setStorage('ef_fees', fees);
      return fees[index];
    }
  }
};
