-- EduFlow Supabase Schema

-- 1. Profiles Table (Linked to Auth.Users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  roll TEXT UNIQUE NOT NULL,
  index TEXT UNIQUE,
  section TEXT NOT NULL,
  batch TEXT,
  phone TEXT,
  email TEXT UNIQUE,
  image_url TEXT,
  qr_code TEXT UNIQUE,
  is_captain BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at BIGINT DEFAULT extract(epoch from now() ) * 1000
);

-- 3. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'late')),
  marked_by TEXT,
  timestamp BIGINT DEFAULT extract(epoch from now() ) * 1000,
  UNIQUE(student_id, date)
);

-- 4. Fees Table
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('admission', 'monthly', 'late', 'absent', 'fine', 'other')),
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('paid', 'due')),
  date DATE NOT NULL,
  timestamp BIGINT DEFAULT extract(epoch from now() ) * 1000
);

-- Row Level Security (RLS) - Basic Disable for Demo
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE fees DISABLE ROW LEVEL SECURITY;

-- 5. Storage Bucket Setup (Instructions)
-- Note: You must manually create a public bucket named 'student-portraits' in the Supabase Dashboard
-- 1. Go to Storage -> New Bucket -> Name it 'student-portraits' -> Make it PUBLIC.
-- 2. Add a policy to allow all uploads for better demo experience:
--    CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'student-portraits');
--    CREATE POLICY "Public Select" ON storage.objects FOR SELECT USING (bucket_id = 'student-portraits');

-- 6. Setup First Admin (Manual Step)
-- After creating a user in Supabase Auth (Authentication -> Users -> Add User),
-- get their 'id' (UUID) and insert it into the profiles table:
-- INSERT INTO profiles (id, email, role) VALUES ('<USER_UUID>', 'your-email@example.com', 'admin');
