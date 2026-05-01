import { Student, AttendanceRecord, FeeRecord, UserRole } from '../types';
import { supabase } from '../lib/supabase';

// --- Local Storage Fallback (for easy testing) ---
const getStorage = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setStorage = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Check if we should use Supabase (if keys are provided)
const useSupabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- Helpers for Supabase Field Mapping ---
const mapStudentFromDb = (data: any): Student => ({
  id: data.id,
  name: data.name,
  roll: data.roll,
  index: data.index,
  section: data.section,
  batch: data.batch,
  phone: data.phone,
  email: data.email,
  imageUrl: data.image_url,
  qrCode: data.qr_code,
  isCaptain: data.is_captain,
  userId: data.user_id,
  createdAt: data.created_at
});

const mapStudentToDb = (data: Partial<Student>) => {
  const mapped: any = { ...data };
  if (data.imageUrl !== undefined) mapped.image_url = data.imageUrl;
  if (data.qrCode !== undefined) mapped.qr_code = data.qrCode;
  if (data.isCaptain !== undefined) mapped.is_captain = data.isCaptain;
  if (data.userId !== undefined) mapped.user_id = data.userId;
  if (data.createdAt !== undefined) mapped.created_at = data.createdAt;
  
  // Remove camelCase keys that were mapped
  delete mapped.imageUrl;
  delete mapped.qrCode;
  delete mapped.isCaptain;
  delete mapped.userId;
  delete mapped.createdAt;
  
  return mapped;
};

export const api = {
  // --- Auth via Supabase ---
  auth: {
    login: async (email: string, password: string): Promise<{ user: Student | null; role: UserRole }> => {
      // For Admin (Demo purpose usually uses fixed secrets or admin table)
      if (email === 'admin@eduflow.com' && password === 'admin123') {
        return { user: null, role: 'admin' };
      }

      if (useSupabase) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', authData.user?.id)
          .single();

        if (studentError || !student) {
           throw new Error('Student record not found for this account.');
        }

        const mappedStudent = mapStudentFromDb(student);

        if (!mappedStudent.isCaptain) {
          throw new Error('Access Denied: Only Class Captains can access this portal.');
        }

        return { user: mappedStudent, role: 'student' };
      }

      // Local Fallback
      const students = await api.students.getAll();
      const student = students.find(s => s.email === email && s.phone === password); // Simple fallback
      
      if (student) {
        if (!student.isCaptain) {
          throw new Error('Access Denied: Only Class Captains can access this portal.');
        }
        return { user: student, role: 'student' };
      }
      throw new Error('Invalid email or password');
    }
  },

  // --- Students ---
  students: {
    uploadImage: async (fileData: string, studentId: string): Promise<string> => {
      if (!useSupabase || !fileData.startsWith('data:')) return fileData;

      try {
        // Convert base64 to Blob
        const response = await fetch(fileData);
        const blob = await response.blob();
        
        const fileName = `${studentId}-${Date.now()}.jpg`;
        const filePath = `portraits/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('student-portraits')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('student-portraits')
          .getPublicUrl(filePath);

        return publicUrl;
      } catch (err) {
        console.error('Upload failed, falling back to base64:', err);
        return fileData;
      }
    },
    getAll: async (): Promise<Student[]> => {
      if (useSupabase) {
        const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
        if (!error && data) {
           return data.map(mapStudentFromDb);
        }
      }
      return getStorage<Student[]>('ef_students', []);
    },
    add: async (student: Omit<Student, 'id' | 'qrCode' | 'createdAt'>): Promise<Student> => {
      const newStudent: Student = {
        ...student,
        id: crypto.randomUUID(),
        qrCode: `STU-${Date.now()}`,
        createdAt: Date.now(),
      };

      if (useSupabase) {
        const { data, error } = await supabase
          .from('students')
          .insert(mapStudentToDb(newStudent))
          .select()
          .single();
        
        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }
        if (data) return mapStudentFromDb(data);
      }

      const students = await api.students.getAll();
      setStorage('ef_students', [...students, newStudent]);
      return newStudent;
    },
    update: async (id: string, updates: Partial<Student>): Promise<Student> => {
      if (useSupabase) {
        const { data, error } = await supabase
          .from('students')
          .update(mapStudentToDb(updates))
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
        if (data) return mapStudentFromDb(data);
      }

      const students = await api.students.getAll();
      const index = students.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Student not found');
      students[index] = { ...students[index], ...updates };
      setStorage('ef_students', students);
      return students[index];
    },
    delete: async (id: string): Promise<void> => {
      if (useSupabase) {
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) {
          console.error('Supabase delete error:', error);
          throw error;
        }
      }
      const students = await api.students.getAll();
      setStorage('ef_students', students.filter(s => s.id !== id));
    }
  },

  // --- Attendance ---
  attendance: {
    getAll: async (): Promise<AttendanceRecord[]> => {
      if (useSupabase) {
        const { data, error } = await supabase.from('attendance').select('*');
        if (!error && data) return data;
      }
      return getStorage<AttendanceRecord[]>('ef_attendance', []);
    },
    mark: async (record: Omit<AttendanceRecord, 'id' | 'timestamp'>): Promise<AttendanceRecord> => {
      const records = await api.attendance.getAll();
      const existing = records.find(r => r.studentId === record.studentId && r.date === record.date);

      if (existing) {
        return api.attendance.update(existing.id, record.status);
      }

      const newRecord: AttendanceRecord = {
        ...record,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };

      if (useSupabase) {
        const { data, error } = await supabase.from('attendance').insert(newRecord).select().single();
        if (!error && data) return data;
      }

      setStorage('ef_attendance', [...records, newRecord]);
      return newRecord;
    },
    update: async (id: string, status: AttendanceRecord['status']): Promise<AttendanceRecord> => {
      if (useSupabase) {
        const { data, error } = await supabase.from('attendance').update({ status }).eq('id', id).select().single();
        if (!error && data) return data;
      }

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
      if (useSupabase) {
        const { data, error } = await supabase.from('fees').select('*');
        if (!error && data) return data;
      }
      return getStorage<FeeRecord[]>('ef_fees', []);
    },
    add: async (fee: Omit<FeeRecord, 'id' | 'timestamp'>): Promise<FeeRecord> => {
      const newFee: FeeRecord = {
        ...fee,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };

      if (useSupabase) {
        const { data, error } = await supabase.from('fees').insert(newFee).select().single();
        if (!error && data) return data;
      }

      const fees = await api.fees.getAll();
      setStorage('ef_fees', [...fees, newFee]);
      return newFee;
    },
    updateStatus: async (id: string, status: FeeRecord['status']): Promise<FeeRecord> => {
      if (useSupabase) {
        const { data, error } = await supabase.from('fees').update({ status }).eq('id', id).select().single();
        if (!error && data) return data;
      }

      const fees = await api.fees.getAll();
      const index = fees.findIndex(f => f.id === id);
      if (index === -1) throw new Error('Fee record not found');
      fees[index].status = status;
      setStorage('ef_fees', fees);
      return fees[index];
    },
    getByStudentId: async (studentId: string): Promise<FeeRecord[]> => {
      const fees = await api.fees.getAll();
      return fees.filter(f => f.studentId === studentId);
    }
  }
};
