import { Student, AttendanceRecord, FeeRecord, UserRole } from '../types';
import { supabase } from '../lib/supabase';

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
    getCurrentSession: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },

    getUserProfile: async (userId: string): Promise<{ user: Student | null; role: UserRole }> => {
      // 1. Check if user has a profile record
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      // Default to student role if no profile found or if role isn't admin
      const role: UserRole = profile?.role === 'admin' ? 'admin' : 'student';

      if (role === 'admin') {
        return { user: null, role: 'admin' };
      }

      // 2. For students, attempt to fetch their detailed student record
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (studentError) {
        console.error('Student record fetch error:', studentError);
      }

      return { 
        user: student ? mapStudentFromDb(student) : null, 
        role: 'student' 
      };
    },

    login: async (email: string, password: string): Promise<{ user: Student | null; role: UserRole }> => {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user found after authentication.');

      return api.auth.getUserProfile(authData.user.id);
    },

    signUp: async (email: string, password: string): Promise<void> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Signup failed: No user returned.');
      
      // Note: A database trigger (handle_new_user) now creates the profile record automatically.
      // This avoids RLS issues during the manual client-side insert.
    },

    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
  },

  // --- Students ---
  students: {
    uploadImage: async (fileData: string, studentId: string): Promise<string> => {
      if (!fileData || !fileData.startsWith('data:')) return fileData;

      try {
        const response = await fetch(fileData);
        if (!response.ok) throw new Error('Failed to process image data');
        const blob = await response.blob();
        
        const fileName = `${studentId}-${Date.now()}.jpg`;
        const filePath = `portraits/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('student-portraits')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error('Supabase Storage Error:', uploadError);
          // If the bucket doesn't exist, we fallback to returning the base64
          // but we log it clearly for the developer.
          if (uploadError.message.includes('bucket not found')) {
             console.warn('CRITICAL: Storage bucket "student-portraits" not found. Please create it in Supabase dashboard.');
          }
          return fileData; 
        }

        const { data: { publicUrl } } = supabase.storage
          .from('student-portraits')
          .getPublicUrl(filePath);

        return publicUrl;
      } catch (err) {
        console.error('Upload system failure:', err);
        return fileData; // Fallback to base64 so data isn't lost
      }
    },
    getAll: async (): Promise<Student[]> => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data ? data.map(mapStudentFromDb) : [];
    },
    add: async (student: Omit<Student, 'id' | 'qrCode' | 'createdAt'>): Promise<Student> => {
      const newStudent = {
        ...student,
        id: crypto.randomUUID(),
        qrCode: `STU-${Date.now()}`,
        createdAt: Date.now(),
      };

      const { data, error } = await supabase
        .from('students')
        .insert(mapStudentToDb(newStudent))
        .select()
        .single();
      
      if (error) throw error;
      return mapStudentFromDb(data);
    },
    update: async (id: string, updates: Partial<Student>): Promise<Student> => {
      const { data, error } = await supabase
        .from('students')
        .update(mapStudentToDb(updates))
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return mapStudentFromDb(data);
    },
    delete: async (id: string): Promise<void> => {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // --- Attendance ---
  attendance: {
    getAll: async (): Promise<AttendanceRecord[]> => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
    mark: async (record: Omit<AttendanceRecord, 'id' | 'timestamp'>): Promise<AttendanceRecord> => {
      const { data, error } = await supabase
        .from('attendance')
        .upsert({
          student_id: record.studentId,
          date: record.date,
          status: record.status,
          marked_by: record.markedBy,
          timestamp: Date.now()
        }, { onConflict: 'student_id, date' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    update: async (id: string, status: AttendanceRecord['status']): Promise<AttendanceRecord> => {
      const { data, error } = await supabase
        .from('attendance')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    getByDate: async (date: string): Promise<AttendanceRecord[]> => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', date);
      
      if (error) throw error;
      return data || [];
    }
  },

  // --- Fees ---
  fees: {
    getAll: async (): Promise<FeeRecord[]> => {
      const { data, error } = await supabase.from('fees').select('*');
      if (error) throw error;
      return data || [];
    },
    add: async (fee: Omit<FeeRecord, 'id' | 'timestamp'>): Promise<FeeRecord> => {
      const newFee = {
        ...fee,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };

      const { data, error } = await supabase
        .from('fees')
        .insert({
          id: newFee.id,
          student_id: fee.studentId,
          type: fee.type,
          amount: fee.amount,
          status: fee.status,
          date: fee.date,
          timestamp: newFee.timestamp
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    updateStatus: async (id: string, status: FeeRecord['status']): Promise<FeeRecord> => {
      const { data, error } = await supabase
        .from('fees')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    getByStudentId: async (studentId: string): Promise<FeeRecord[]> => {
      const { data, error } = await supabase
        .from('fees')
        .select('*')
        .eq('student_id', studentId);
      
      if (error) throw error;
      return data || [];
    }
  }
};
