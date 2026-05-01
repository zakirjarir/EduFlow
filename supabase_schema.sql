-- EduFlow Supabase Schema

-- 1. Students Table
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
  user_id UUID DEFAULT NULL,
  created_at BIGINT DEFAULT extract(epoch from now() ) * 1000
);

-- 2. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'late')),
  marked_by TEXT,
  timestamp BIGINT DEFAULT extract(epoch from now() ) * 1000,
  UNIQUE(student_id, date)
);

-- 3. Fees Table
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('admission', 'monthly', 'late', 'absent', 'fine', 'other')),
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('paid', 'due')),
  date DATE NOT NULL,
  timestamp BIGINT DEFAULT extract(epoch from now() ) * 1000
);

-- Row Level Security (RLS) - Basic Disable for Demo (Enable and configure policies for production)
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE fees DISABLE ROW LEVEL SECURITY;

-- 4. Storage Bucket Setup (Instructions)
-- Note: You must manually create a public bucket named 'student-portraits' in the Supabase Dashboard
-- 1. Go to Storage -> New Bucket -> Name it 'student-portraits' -> Make it PUBLIC.
-- 2. Add a policy to allow all uploads for better demo experience:
--    CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'student-portraits');
--    CREATE POLICY "Public Select" ON storage.objects FOR SELECT USING (bucket_id = 'student-portraits');
