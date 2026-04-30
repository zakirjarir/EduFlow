-- EduFlow Supabase Schema

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  roll TEXT UNIQUE NOT NULL,
  class TEXT NOT NULL,
  phone TEXT,
  password TEXT,
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
