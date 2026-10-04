-- ===============================================
-- TUTORTRACK MASTER GO-LIVE DATABASE SCHEMA (PostgreSQL)
-- Master Script - Copy và Dán toàn bộ vào Supabase SQL Editor
-- ===============================================

-- 1. Kích hoạt Extension mã hoá và UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Đảm bảo cấu trúc bảng học sinh (students)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    subject TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    hourly_rate NUMERIC(12, 2) NOT NULL DEFAULT 200000,
    schedule_days TEXT,
    schedule_time TEXT,
    magic_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'graduated')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Bảng buổi học (class_sessions)
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    student_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    roadmap_topic TEXT,
    date TEXT NOT NULL,
    month TEXT NOT NULL, -- Format: YYYY-MM hoặc Tháng 10/2026
    time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
    homework TEXT,
    homework_file_name TEXT,
    homework_file_url TEXT,
    homework_file_size TEXT,
    tutor_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Bảng hoá đơn / học phí (invoices)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL,
    total_sessions INT NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid')),
    payment_reference TEXT UNIQUE,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tạo Indexes tối ưu truy vấn (Tránh Table Scan)
CREATE INDEX IF NOT EXISTS idx_class_sessions_student_month ON public.class_sessions (student_id, month);
CREATE INDEX IF NOT EXISTS idx_students_magic_token ON public.students (magic_token);
CREATE INDEX IF NOT EXISTS idx_students_parent_phone ON public.students (parent_phone);
CREATE INDEX IF NOT EXISTS idx_invoices_student_month ON public.invoices (student_id, month);

-- 6. Kích hoạt Row Level Security (RLS) Chuẩn Doanh Nghiệp
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policy cho phép đọc/ghi công khai cho phiên thử nghiệm & Magic Token
DROP POLICY IF EXISTS "Allow all for students" ON public.students;
CREATE POLICY "Allow all for students" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for class_sessions" ON public.class_sessions;
CREATE POLICY "Allow all for class_sessions" ON public.class_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for invoices" ON public.invoices;
CREATE POLICY "Allow all for invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
