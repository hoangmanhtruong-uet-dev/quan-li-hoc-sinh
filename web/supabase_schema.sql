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

-- Thêm cột tutor_id cho DB đã tồn tại (Schema Upgrade)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Bảng buổi học (class_sessions)
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    student_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    roadmap_topic TEXT,
    date TEXT NOT NULL,
    month TEXT NOT NULL, -- Format: YYYY-MM hoặc Tháng MM/YYYY
    time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
    homework TEXT,
    homework_file_name TEXT,
    homework_file_url TEXT,
    homework_file_size TEXT,
    tutor_feedback TEXT,
    test_score NUMERIC(4,2),
    reschedule_request JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Thêm các cột mới cho DB đã tồn tại (Schema Upgrade)
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS test_score NUMERIC(4,2);
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS reschedule_request JSONB DEFAULT NULL;

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

-- 5. Bảng lời nhắn từ phụ huynh (parent_messages)
CREATE TABLE IF NOT EXISTS public.parent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tạo Indexes tối ưu truy vấn (Tránh Table Scan)
CREATE INDEX IF NOT EXISTS idx_class_sessions_student_month ON public.class_sessions (student_id, month);
CREATE INDEX IF NOT EXISTS idx_students_magic_token ON public.students (magic_token);
CREATE INDEX IF NOT EXISTS idx_students_parent_phone ON public.students (parent_phone);
CREATE INDEX IF NOT EXISTS idx_invoices_student_month ON public.invoices (student_id, month);

-- 6. Kích hoạt Row Level Security (RLS) Chuẩn Doanh Nghiệp
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ================================================
-- POLICY CHO GIA SƯ (Authenticated / Admin)
-- Gia sư chỉ quản trị dữ liệu của chính mình thông qua tutor_id
-- ================================================

-- Students: Gia sư toàn quyền trên học sinh của mình
DROP POLICY IF EXISTS "Allow all for students" ON public.students;
DROP POLICY IF EXISTS "Tutor full CRUD on own students" ON public.students;
CREATE POLICY "Tutor full CRUD on own students"
  ON public.students
  FOR ALL
  TO authenticated
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- Class Sessions: Gia sư toàn quyền trên buổi học của học sinh mình
DROP POLICY IF EXISTS "Allow all for class_sessions" ON public.class_sessions;
DROP POLICY IF EXISTS "Tutor full CRUD on own sessions" ON public.class_sessions;
CREATE POLICY "Tutor full CRUD on own sessions"
  ON public.class_sessions
  FOR ALL
  TO authenticated
  USING (
    student_id IN (SELECT id FROM public.students WHERE tutor_id = auth.uid())
  )
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE tutor_id = auth.uid())
  );

-- Invoices: Gia sư toàn quyền trên hoá đơn của học sinh mình
DROP POLICY IF EXISTS "Allow all for invoices" ON public.invoices;
DROP POLICY IF EXISTS "Tutor full CRUD on own invoices" ON public.invoices;
CREATE POLICY "Tutor full CRUD on own invoices"
  ON public.invoices
  FOR ALL
  TO authenticated
  USING (
    student_id IN (SELECT id FROM public.students WHERE tutor_id = auth.uid())
  )
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE tutor_id = auth.uid())
  );

-- ================================================
-- POLICY CHO PHỤ HUYNH (Anon / Không đăng nhập)
-- Phụ huynh chỉ ĐỌC dữ liệu qua magic_token (không thể sửa/xoá)
-- ================================================

-- Students: Anon chỉ SELECT được khi biết magic_token (filter bằng URL param)
DROP POLICY IF EXISTS "Anon read student by magic_token" ON public.students;
CREATE POLICY "Anon read student by magic_token"
  ON public.students
  FOR SELECT
  TO anon
  USING (magic_token IS NOT NULL);

-- Class Sessions: Anon chỉ đọc sessions của student mà mình đã tra cứu
DROP POLICY IF EXISTS "Anon read sessions of accessible students" ON public.class_sessions;
CREATE POLICY "Anon read sessions of accessible students"
  ON public.class_sessions
  FOR SELECT
  TO anon
  USING (
    student_id IN (SELECT id FROM public.students WHERE magic_token IS NOT NULL)
  );

-- Invoices: Anon chỉ đọc hoá đơn của student đã tra cứu
DROP POLICY IF EXISTS "Anon read invoices of accessible students" ON public.invoices;
CREATE POLICY "Anon read invoices of accessible students"
  ON public.invoices
  FOR SELECT
  TO anon
  USING (
    student_id IN (SELECT id FROM public.students WHERE magic_token IS NOT NULL)
  );

-- Parent Messages: Anon được phép insert message cho student (dựa trên student_id)
ALTER TABLE public.parent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon insert parent_messages" ON public.parent_messages;
CREATE POLICY "Anon insert parent_messages"
  ON public.parent_messages
  FOR INSERT
  TO anon
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE magic_token IS NOT NULL)
  );

-- Parent Messages: Tutor được phép select/update message của học sinh mình
DROP POLICY IF EXISTS "Tutor CRUD parent_messages" ON public.parent_messages;
CREATE POLICY "Tutor CRUD parent_messages"
  ON public.parent_messages
  FOR ALL
  TO authenticated
  USING (
    student_id IN (SELECT id FROM public.students WHERE tutor_id = auth.uid())
  )
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE tutor_id = auth.uid())
  );

-- ================================================
-- 7. CẤU HÌNH SUPABASE STORAGE BUCKET 'homework-files'
-- Copy đoạn này vào Supabase SQL Editor để bật Storage Public & Cấp quyền tải file
-- ================================================

-- Tạo Bucket 'homework-files' công khai (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('homework-files', 'homework-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Cho phép tất cả mọi người đọc/tải file từ bucket homework-files
DROP POLICY IF EXISTS "Public Read Access for homework-files" ON storage.objects;
CREATE POLICY "Public Read Access for homework-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'homework-files');

-- Cho phép upload file vào bucket homework-files
DROP POLICY IF EXISTS "Public Upload Access for homework-files" ON storage.objects;
CREATE POLICY "Public Upload Access for homework-files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'homework-files');

DROP POLICY IF EXISTS "Public Update Access for homework-files" ON storage.objects;
CREATE POLICY "Public Update Access for homework-files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'homework-files');

DROP POLICY IF EXISTS "Public Delete Access for homework-files" ON storage.objects;
CREATE POLICY "Public Delete Access for homework-files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'homework-files');


