-- ===============================================
-- TUTORTRACK MASTER GO-LIVE DATABASE SCHEMA (PostgreSQL)
-- Master Script - Copy vĂ  DĂĄn toĂ n báť vĂ o Supabase SQL Editor
-- ===============================================

-- 1. KĂ­ch hoáşĄt Extension mĂŁ hoĂĄ vĂ  UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ÄáşŁm báşŁo cáşĽu trĂşc báşŁng háťc sinh (students)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    subject TEXT NOT NULL,
    parent_name TEXT,
    parent_phone TEXT NOT NULL,
    hourly_rate NUMERIC(12, 2) NOT NULL DEFAULT 200000,
    schedule_days TEXT,
    schedule_time TEXT,
    magic_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'graduated')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ThĂŞm cĂĄc cáťt cho DB ÄĂŁ táťn táşĄi (Schema Upgrade)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_name TEXT;

-- 3. BáşŁng buáťi háťc (class_sessions)
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    student_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    roadmap_topic TEXT,
    date TEXT NOT NULL,
    month TEXT NOT NULL, -- Format: YYYY-MM hoáşˇc ThĂĄng MM/YYYY
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

-- ThĂŞm cĂĄc cáťt máťi cho DB ÄĂŁ táťn táşĄi (Schema Upgrade)
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS test_score NUMERIC(4,2);
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS reschedule_request JSONB DEFAULT NULL;

-- 4. BáşŁng hoĂĄ ÄĆĄn / háťc phĂ­ (invoices)
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

-- 5. BáşŁng láťi nháşŻn táťŤ pháťĽ huynh (parent_messages)
CREATE TABLE IF NOT EXISTS public.parent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TáşĄo Indexes táťi Ć°u truy váşĽn (TrĂĄnh Table Scan)
CREATE INDEX IF NOT EXISTS idx_class_sessions_student_month ON public.class_sessions (student_id, month);
CREATE INDEX IF NOT EXISTS idx_students_magic_token ON public.students (magic_token);
CREATE INDEX IF NOT EXISTS idx_students_parent_phone ON public.students (parent_phone);
CREATE INDEX IF NOT EXISTS idx_invoices_student_month ON public.invoices (student_id, month);

-- 6. KĂ­ch hoáşĄt Row Level Security (RLS) ChuáşŠn Doanh Nghiáťp
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ================================================
-- POLICY CHO GIA SĆŻ (Authenticated / Admin)
-- Gia sĆ° cháť quáşŁn tráť dáťŻ liáťu cáť§a chĂ­nh mĂŹnh thĂ´ng qua tutor_id
-- ================================================

-- Students: Gia sĆ° toĂ n quyáťn trĂŞn háťc sinh cáť§a mĂŹnh (káť cáşŁ khi tutor_id lĂ  NULL)
DROP POLICY IF EXISTS "Allow all for students" ON public.students;
DROP POLICY IF EXISTS "Tutor full CRUD on own students" ON public.students;
CREATE POLICY "Tutor full CRUD on own students"
  ON public.students
  FOR ALL
  USING (tutor_id IS NULL OR tutor_id = auth.uid())
  WITH CHECK (tutor_id IS NULL OR tutor_id = auth.uid());

-- Class Sessions: Gia sĆ° toĂ n quyáťn trĂŞn buáťi háťc
DROP POLICY IF EXISTS "Allow all for class_sessions" ON public.class_sessions;
DROP POLICY IF EXISTS "Tutor full CRUD on own sessions" ON public.class_sessions;
CREATE POLICY "Tutor full CRUD on own sessions"
  ON public.class_sessions
  FOR ALL
  USING (
    student_id IN (SELECT id FROM public.students WHERE tutor_id IS NULL OR tutor_id = auth.uid())
  )
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE tutor_id IS NULL OR tutor_id = auth.uid())
  );

-- Invoices: Gia sĆ° toĂ n quyáťn trĂŞn hoĂĄ ÄĆĄn
DROP POLICY IF EXISTS "Allow all for invoices" ON public.invoices;
DROP POLICY IF EXISTS "Tutor full CRUD on own invoices" ON public.invoices;
CREATE POLICY "Tutor full CRUD on own invoices"
  ON public.invoices
  FOR ALL
  USING (
    student_id IN (SELECT id FROM public.students WHERE tutor_id IS NULL OR tutor_id = auth.uid())
  )
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE tutor_id IS NULL OR tutor_id = auth.uid())
  );

-- ================================================
-- POLICY CHO PHáť¤ HUYNH (Anon / KhĂ´ng ÄÄng nháş­p)
-- PháťĽ huynh cháť ÄáťC dáťŻ liáťu qua magic_token (khĂ´ng tháť sáť­a/xoĂĄ)
-- ================================================

-- Students: Anon cháť SELECT ÄĆ°áťŁc khi biáşżt magic_token (filter báşąng URL param)
DROP POLICY IF EXISTS "Anon read student by magic_token" ON public.students;
CREATE POLICY "Anon read student by magic_token"
  ON public.students
  FOR SELECT
  
  USING (magic_token IS NOT NULL);

-- Class Sessions: Anon cháť Äáťc sessions cáť§a student mĂ  mĂŹnh ÄĂŁ tra cáťŠu
DROP POLICY IF EXISTS "Anon read sessions of accessible students" ON public.class_sessions;
CREATE POLICY "Anon read sessions of accessible students"
  ON public.class_sessions
  FOR SELECT
  
  USING (
    student_id IN (SELECT id FROM public.students WHERE magic_token IS NOT NULL)
  );

-- Invoices: Anon cháť Äáťc hoĂĄ ÄĆĄn cáť§a student ÄĂŁ tra cáťŠu
DROP POLICY IF EXISTS "Anon read invoices of accessible students" ON public.invoices;
CREATE POLICY "Anon read invoices of accessible students"
  ON public.invoices
  FOR SELECT
  
  USING (
    student_id IN (SELECT id FROM public.students WHERE magic_token IS NOT NULL)
  );

-- Parent Messages: Anon ÄĆ°áťŁc phĂŠp insert message cho student (dáťąa trĂŞn student_id)
ALTER TABLE public.parent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon insert parent_messages" ON public.parent_messages;
CREATE POLICY "Anon insert parent_messages"
  ON public.parent_messages
  FOR INSERT
  
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE magic_token IS NOT NULL)
  );

-- Parent Messages: Tutor ÄĆ°áťŁc phĂŠp select/update message cáť§a háťc sinh mĂŹnh
DROP POLICY IF EXISTS "Tutor CRUD parent_messages" ON public.parent_messages;
CREATE POLICY "Tutor CRUD parent_messages"
  ON public.parent_messages
  FOR ALL
  
  USING (
    student_id IN (SELECT id FROM public.students WHERE tutor_id = auth.uid())
  )
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE tutor_id = auth.uid())
  );

-- ================================================
-- 7. Cáş¤U HĂNH SUPABASE STORAGE BUCKET 'homework-files'
-- Copy ÄoáşĄn nĂ y vĂ o Supabase SQL Editor Äáť báş­t Storage Public & CáşĽp quyáťn táşŁi file
-- ================================================

-- TáşĄo Bucket 'homework-files' cĂ´ng khai (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('homework-files', 'homework-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Cho phĂŠp táşĽt cáşŁ máťi ngĆ°áťi Äáťc/táşŁi file táťŤ bucket homework-files
DROP POLICY IF EXISTS "Public Read Access for homework-files" ON storage.objects;
CREATE POLICY "Public Read Access for homework-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'homework-files');

-- Cho phĂŠp upload file vĂ o bucket homework-files
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



-- ===============================================
-- 8. C?P NH?T TÍNH NĂNG Đ? CÝŐNG & BŔI T?P (V2)
-- ===============================================

CREATE TABLE IF NOT EXISTS public.monthly_outlines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL,
    file_name TEXT,
    file_url TEXT,
    file_size TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_monthly_outlines_student_month ON public.monthly_outlines (student_id, month);

ALTER TABLE public.monthly_outlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ""Tutor full CRUD on monthly outlines"" ON public.monthly_outlines;
CREATE POLICY ""Tutor full CRUD on monthly outlines""
  ON public.monthly_outlines FOR ALL
  
  USING (student_id IN (SELECT id FROM public.students WHERE tutor_id IS NULL OR tutor_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE tutor_id IS NULL OR tutor_id = auth.uid()));

DROP POLICY IF EXISTS ""Anon read monthly outlines"" ON public.monthly_outlines;
CREATE POLICY ""Anon read monthly outlines""
  ON public.monthly_outlines FOR SELECT
  
  USING (student_id IN (SELECT id FROM public.students WHERE magic_token IS NOT NULL));

ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS student_homework_file_name TEXT;
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS student_homework_file_url TEXT;
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS student_homework_file_size TEXT;
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS student_homework_submitted_at TIMESTAMPTZ;

DROP POLICY IF EXISTS ""Anon update sessions for homework"" ON public.class_sessions;
CREATE POLICY ""Anon update sessions for homework""
  ON public.class_sessions FOR UPDATE
  
  USING (student_id IN (SELECT id FROM public.students WHERE magic_token IS NOT NULL))
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE magic_token IS NOT NULL));

-- ===============================================
-- 9. N?P BŔI T?P Đ? CÝŐNG CHO H?C SINH
-- ===============================================

ALTER TABLE public.monthly_outlines ADD COLUMN IF NOT EXISTS student_homework_file_name TEXT;
ALTER TABLE public.monthly_outlines ADD COLUMN IF NOT EXISTS student_homework_file_url TEXT;
ALTER TABLE public.monthly_outlines ADD COLUMN IF NOT EXISTS student_homework_file_size TEXT;
ALTER TABLE public.monthly_outlines ADD COLUMN IF NOT EXISTS student_homework_submitted_at TIMESTAMPTZ;

DROP POLICY IF EXISTS ""Anon update monthly outlines for homework"" ON public.monthly_outlines;
CREATE POLICY ""Anon update monthly outlines for homework""
  ON public.monthly_outlines FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ===============================================
-- 10. BẢNG ÔN TẬP THEO CHỦ ĐỀ (review_topics)
-- Gia sư tự tạo chủ đề ôn tập cho từng học sinh
-- ===============================================

CREATE TABLE IF NOT EXISTS public.review_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_review_topics_student ON public.review_topics (student_id);

ALTER TABLE public.review_topics ENABLE ROW LEVEL SECURITY;

-- Gia sư toàn quyền CRUD trên review_topics của học sinh mình
DROP POLICY IF EXISTS "Tutor full CRUD on review_topics" ON public.review_topics;
CREATE POLICY "Tutor full CRUD on review_topics"
  ON public.review_topics FOR ALL
  USING (student_id IN (SELECT id FROM public.students WHERE tutor_id IS NULL OR tutor_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE tutor_id IS NULL OR tutor_id = auth.uid()));

-- Phụ huynh (anon) chỉ đọc
DROP POLICY IF EXISTS "Anon read review_topics" ON public.review_topics;
CREATE POLICY "Anon read review_topics"
  ON public.review_topics FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE magic_token IS NOT NULL));

-- Bảng file đính kèm cho review_topics
CREATE TABLE IF NOT EXISTS public.review_topic_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES public.review_topics(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_review_topic_files_topic ON public.review_topic_files (topic_id);

ALTER TABLE public.review_topic_files ENABLE ROW LEVEL SECURITY;

-- Gia sư toàn quyền CRUD trên review_topic_files
DROP POLICY IF EXISTS "Tutor full CRUD on review_topic_files" ON public.review_topic_files;
CREATE POLICY "Tutor full CRUD on review_topic_files"
  ON public.review_topic_files FOR ALL
  USING (topic_id IN (SELECT id FROM public.review_topics WHERE student_id IN (SELECT id FROM public.students WHERE tutor_id IS NULL OR tutor_id = auth.uid())))
  WITH CHECK (topic_id IN (SELECT id FROM public.review_topics WHERE student_id IN (SELECT id FROM public.students WHERE tutor_id IS NULL OR tutor_id = auth.uid())));

-- Phụ huynh (anon) chỉ đọc file
DROP POLICY IF EXISTS "Anon read review_topic_files" ON public.review_topic_files;
CREATE POLICY "Anon read review_topic_files"
  ON public.review_topic_files FOR SELECT
  USING (topic_id IN (SELECT id FROM public.review_topics WHERE student_id IN (SELECT id FROM public.students WHERE magic_token IS NOT NULL)));
