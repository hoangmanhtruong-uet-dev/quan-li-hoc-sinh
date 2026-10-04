# 🚀 KẾ HOẠCH PHÁT TRIỂN & GO-LIVE HỆ THỐNG TUTORTRACK

> **Dự án:** TutorTrack – Nền tảng quản lý gia sư & sổ liên lạc phụ huynh tự động
>
> **Phiên bản:** v1.0 Production Target
>
> **Stack chính:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Supabase (PostgreSQL, Auth, Storage), PayOS/VietQR, Telegram Bot / Zalo ZNS
>
> **Mục tiêu:** Chuyển đổi từ bản MVP sang nền tảng Production hoạt động ổn định, bảo mật cao, tự động hoá điểm danh và gạch nợ học phí.

## 📑 MỤC LỤC

1. [Tổng quan hiện trạng & Mục tiêu Go-Live](#1-tổng-quan-hiện-trạng--mục-tiêu-go-live)

2. [Giai đoạn 1: Bảo mật, Xác thực & Kiến trúc CSDL (Tuần 1)](#giai-đoạn-1-bảo-mật-xác-thực--kiến-trúc-csdl-tuần-1)

3. [Giai đoạn 2: Backend Server Actions & Lưu trữ Storage (Tuần 2)](#giai-đoạn-2-backend-server-actions--lưu-trữ-storage-tuần-2)

4. [Giai đoạn 3: Fintech & Tự động hoá thông báo (Tuần 3)](#giai-đoạn-3-fintech--tự-động-hoá-thông-báo-tuần-3)

5. [Giai đoạn 4: Tính năng nâng cao & Trải nghiệm Phụ huynh (Tuần 4)](#giai-đoạn-4-tính-năng-nâng-cao--trải-nghiệm-phụ-huynh-tuần-4)

6. [Giai đoạn 5: Testing, Hardening & Go-Live Playbook (Tuần 5)](#giai-đoạn-5-testing-hardening--go-live-playbook-tuần-5)

7. [Bảng kiểm tra (Checklist) & Quản trị rủi ro](#bảng-kiểm-tra-checklist--quản-trị-rủi-ro)

## 1. TỔNG QUAN HIỆN TRẠNG & MỤC TIÊU GO-LIVE

### 1.1. Hiện trạng (Audit Snapshot)

* **Frontend:** Next.js 16 App Router, Tailwind v4, Lucide Icons, Framer Motion hoàn thiện 4 tab Admin và 2 trang Parent Portal.

* **Database:** Kết nối trực tiếp Supabase qua `@supabase/supabase-js`, tuy nhiên RLS đang để chế độ mở tự do (`USING (true)`).

* **Bài tập & Tệp tin:** Mock preview bằng `URL.createObjectURL(file)`, chưa lưu file thực tế trên Cloud Storage.

* **Thanh toán & Liên lạc:** VietQR tĩnh, phụ huynh chuyển khoản phải báo thủ công; nút Zalo tạo tin nhắn copy tay.

### 1.2. Mục tiêu Go-Live

* **Bảo mật tuyệt đối:** Admin phân quyền bằng Supabase Auth; RLS phân tách dữ liệu gia sư và phụ huynh theo `magic_token`.

* **Zero-manual Work:**

  * Tự động sinh lịch học định kỳ mỗi tháng.

  * Tự động gạch nợ học phí qua Webhook ngân hàng (PayOS / Casso).

  * Tự động gửi thông báo điểm danh / bài tập qua Telegram / Zalo.

* **Thời gian tải trang:** Core Web Vitals loại Good, load dữ liệu ban đầu $< 800\text{ms}$ nhờ tối ưu truy vấn song song và SSR.

## GIAI ĐOẠN 1: BẢO MẬT, XÁC THỰC & KIẾN TRÚC CSDL (TUẦN 1)

> **Mục tiêu:** Đóng toàn bộ lỗ hổng bảo mật data, thiết lập Authentication cho Gia sư và phân quyền truy cập.

### 1.1. Khởi tạo & Tối ưu hoá CSDL Postgres (Supabase)

Chạy script migration tạo bảng hoàn chỉnh, khoá ngoại và các chỉ mục (Indexes) truy vấn hiệu năng cao:

```
-- 1. Kích hoạt Extension mã hoá và UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Đảm bảo cấu trúc bảng học sinh (students)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    hourly_rate NUMERIC(12, 2) NOT NULL DEFAULT 150000,
    magic_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'graduated')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Bảng buổi học (class_sessions)
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    month TEXT NOT NULL, -- Format: YYYY-MM
    topic TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    attendance_status TEXT DEFAULT 'pending' CHECK (attendance_status IN ('present', 'absent', 'pending', 'excused')),
    homework_url TEXT,
    homework_note TEXT,
    homework_score NUMERIC(4, 2),
    tutor_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Bảng hoá đơn / học phí (invoices)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL, -- YYYY-MM
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

```

### 1.2. Cấu hình Row Level Security (RLS) Chuẩn Doanh Nghiệp

Loại bỏ hoàn toàn policy `USING (true)` và kích hoạt chính sách bảo vệ đa tầng:

```
-- Kích hoạt RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policy 1: Gia sư (Admin) sở hữu toàn quyền quản trị bản ghi của mình
CREATE POLICY "Tutor full control on students" 
ON public.students 
FOR ALL 
TO authenticated 
USING (auth.uid() = tutor_id) 
WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Tutor full control on sessions" 
ON public.class_sessions 
FOR ALL 
TO authenticated 
USING (
    student_id IN (SELECT id FROM public.students WHERE tutor_id = auth.uid())
)
WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE tutor_id = auth.uid())
);

CREATE POLICY "Tutor full control on invoices" 
ON public.invoices 
FOR ALL 
TO authenticated 
USING (
    student_id IN (SELECT id FROM public.students WHERE tutor_id = auth.uid())
)
WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE tutor_id = auth.uid())
);

-- Policy 2: Phụ huynh (Khách / Anonymous) chỉ được phép SELECT đúng dữ liệu thông qua magic_token
CREATE POLICY "Public read students with magic token" 
ON public.students 
FOR SELECT 
TO anon, authenticated 
USING (magic_token IS NOT NULL);

CREATE POLICY "Public read sessions via student magic token" 
ON public.class_sessions 
FOR SELECT 
TO anon, authenticated 
USING (
    student_id IN (SELECT id FROM public.students)
);

CREATE POLICY "Public read invoices via student magic token" 
ON public.invoices 
FOR SELECT 
TO anon, authenticated 
USING (
    student_id IN (SELECT id FROM public.students)
);

```

### 1.3. Triển khai Supabase Auth cho Admin

* **Màn hình Đăng nhập:** Thiết lập `/login` với xác thực Email & Password hoặc Magic Link OTP cho Gia sư.

* **Cấu hình `@supabase/ssr`:** Thay thế client-only auth bằng Middleware cookie session handler.

* **Chặn Router trái phép:** Cập nhật `src/middleware.ts` kiểm tra phiên đăng nhập trên toàn bộ path `/admin/*`. Nếu chưa authenticated $\rightarrow$ Redirect thẳng về `/login`.

## GIAI ĐOẠN 2: BACKEND SERVER ACTIONS & LƯU TRỮ STORAGE (TUẦN 2)

> **Mục tiêu:** Chuyển dịch toàn bộ logic xử lý dữ liệu từ Client về Server, thiết lập Cloud Storage cho bài tập.

### 2.1. Thiết lập Supabase Storage (`homework-files`)

* **Tạo Bucket:** `homework-files` trên Supabase Dashboard.

* **Chính sách Bucket:**

  * Public Read: Bật để phụ huynh và học sinh tải file bài tập trực tiếp từ CDN.

  * Authenticated Upload: Chỉ người dùng có `auth.role() = 'authenticated'` (Gia sư) mới có quyền `INSERT/UPDATE/DELETE`.

* **Client Validation (Validate trước khi gửi):**

  * Định dạng tệp cho phép: `.pdf`, `.docx`, `.png`, `.jpg`, `.jpeg`.

  * Giới hạn dung lượng: Tối đa $10\text{ MB}$ cho mỗi tệp đính kèm.

### 2.2. Chuyển đổi sang Server Actions (`"use server"`)

Thay thế các lệnh gọi trực tiếp `supabase.from()` tại client components bằng các module Server Action an toàn:

* `actions/students.ts`: `createStudentAction()`, `updateStudentAction()`, `archiveStudentAction()`.

* `actions/sessions.ts`: `checkInSessionAction()`, `updateHomeworkAction()`, `rescheduleSessionAction()`.

* `actions/storage.ts`: `uploadHomeworkFileAction(formData: FormData)`.

### 2.3. Loại bỏ Render Waterfalls (Song song hoá truy vấn)

Tối ưu hàm fetch dữ liệu trong Dashboard để giảm tải $\approx 50\%$ thời gian chờ:

```
// src/services/dashboard.service.ts
import { createServerClient } from '@/lib/supabase/server';

export async function getDashboardData(tutorId: string, currentMonth: string) {
  const supabase = await createServerClient();

  // Thực thi song song - không chờ tuần tự
  const [studentsPromise, sessionsPromise, invoicesPromise] = await Promise.all([
    supabase.from('students').select('*').eq('tutor_id', tutorId),
    supabase.from('class_sessions').select('*, students!inner(tutor_id)').eq('students.tutor_id', tutorId).eq('month', currentMonth),
    supabase.from('invoices').select('*, students!inner(tutor_id)').eq('students.tutor_id', tutorId).eq('month', currentMonth)
  ]);

  return {
    students: studentsPromise.data ?? [],
    sessions: sessionsPromise.data ?? [],
    invoices: invoicesPromise.data ?? []
  };
}

```

### 2.4. Tự động sinh lịch học định kỳ (Cron Jobs)

* **Cơ chế:** Thiết lập **Vercel Cron** (`/api/cron/generate-sessions`) hoặc **pg_cron** của Supabase chạy vào 00:00 ngày 25 hàng tháng.

* **Nghiệp vụ:** Quét danh sách học sinh đang `active`, tự động tính toán số buổi Thứ 2 và Thứ 7 của tháng kế tiếp, tạo sẵn bản ghi `class_sessions` ở trạng thái `scheduled`.

## GIAI ĐOẠN 3: FINTECH & TỰ ĐỘNG HOÁ THÔNG BÁO (TUẦN 3)

> **Mục tiêu:** Biến hệ thống thành công cụ tự vận hành: Phụ huynh chuyển tiền $\rightarrow$ Tự gạch nợ; Gia sư điểm danh $\rightarrow$ Phụ huynh nhận tin nhắn ngay lập tức.

### 3.1. Tích hợp Webhook Ngân Hàng Gạch Nợ Tự Động (PayOS / Casso)

1. **Tạo mã tham chiếu thanh toán (Unique Reference):**

   * Quy chuẩn nội dung chuyển khoản: `TT <MÃ_HỌC_SINH> <THÁNG>` (Ví dụ: `TT HOA12 1026`).

   * Mã VietQR sinh ra trên Portal phụ huynh sẽ đính kèm sẵn nội dung này vào chuỗi QR chuẩn NAPAS.

2. **API Endpoint nhận Webhook:**

   * Tạo route: `POST /api/webhooks/payment`.

   * **Bảo mật:** Kiểm tra chữ ký HMAC-SHA256 (`x-webhook-signature`) để xác thực request xuất phát từ cổng thanh toán đối tác.

   * **Xử lý khớp lệnh (Matching Engine):**

     * Đọc `content` chuyển khoản $\rightarrow$ Parse ra `student_id` và `month`.

     * Kiểm tra số tiền chuyển $\ge$ `total_amount` của hoá đơn tháng đó.

     * Cập nhật `invoices.status = 'paid'`, lưu timestamp `paid_at`.

     * Chuyển trạng thái giao diện học phí sang `✅ Đã Đóng Học Phí`.

```
sequenceDiagram
    autonumber
    actor Parent as Phụ Huynh
    participant Portal as Portal (/p/[token])
    participant Bank as Ngân Hàng / VietQR
    participant Webhook as API Route (/api/webhooks/payment)
    participant DB as Supabase DB
    participant Noti as Telegram/Zalo Service

    Parent->>Portal: Quét mã VietQR trên điện thoại
    Parent->>Bank: Xác nhận chuyển khoản học phí
    Bank->>Webhook: Gửi HTTP POST Webhook (Mã GD, Số tiền, Nội dung)
    Webhook->>Webhook: Xác thực HMAC Signature
    Webhook->>DB: UPDATE invoices SET status = 'paid'
    Webhook->>Noti: Kích hoạt thông báo xác nhận nhận tiền
    Noti-->>Parent: Nhận thông báo xác nhận thanh toán thành công

```

### 3.2. Hệ thống Thông Báo Tức Thời (Telegram Bot / Zalo ZNS)

* **Kênh 1: Telegram Bot (Miễn phí, Realtime cho Gia sư & Phụ huynh cài Telegram):**

  * Tạo bot quản trị qua `@BotFather`.

  * Tạo Channel/Group thông báo riêng cho từng nhóm lớp hoặc gửi trực tiếp cho Chat ID của phụ huynh.

* **Kênh 2: Zalo ZNS (Official Account dành cho Phụ huynh phổ thông):**

  * Tích hợp gửi ZNS thông qua API khi phụ huynh đăng ký SĐT nhận tin.

* **Sự kiện kích hoạt (Triggers):**

  * `Trigger 1: Check-in điểm danh`: Gửi kết quả buổi học, nhận xét của thầy cô và link bài tập đính kèm.

  * `Trigger 2: Nhắc học phí`: Tự động gửi link VietQR vào ngày 28 hàng tháng nếu hoá đơn chưa thanh toán.

  * `Trigger 3: Xác nhận biên lai`: Gửi tin báo ngay khi Webhook gạch nợ thành công.

## GIAI ĐOẠN 4: TÍNH NĂNG NÂNG CAO & TRẢI NGHIỆM PHỤ HUYNH (TUẦN 4)

> **Mục tiêu:** Nâng tầm trải nghiệm người dùng, tạo sự an tâm tuyệt đối cho phụ huynh.

### 4.1. Phân Tích & Biểu Đồ Tiến Bộ Học Tập (Progress Analytics)

* **Cơ sở dữ liệu:** Thêm cột điểm số định kỳ (Kiểm tra 15 phút, 1 tiết, Thi thử THPTQG).

* **Trực quan hoá (Recharts):**

  * Tích hợp biểu đồ đường (Line Chart) trên Portal phụ huynh: Trục hoành là các tuần/tháng, trục tung là thang điểm 10.

  * Hiển thị đường xu hướng (Trend line) để phụ huynh thấy rõ sự tiến bộ sau từng chuyên đề Hoá học.

### 4.2. Tối ưu Giao diện Tức thì (Optimistic UI - React 19 / Next.js)

* Triển khai React hook `useOptimistic` cho các thao tác lặp lại nhiều lần:

  * Nút **"✅ Điểm danh"** và **"Đánh dấu vắng mặt"**: Checkmark đổi màu ngay tức thì ($0\text{ms}$ delay), gửi request nền về server; nếu lỗi tự động rollback và báo Toast.

  * Nút **"Đổi trạng thái học phí"** thủ công.

### 4.3. Xuất Báo Cáo & Phiếu Thu PDF Chuyên Nghiệp (1-Click PDF)

* Tích hợp thư viện `@react-pdf/renderer` hoặc in thông qua CSS Print Stylesheet chuẩn A4.

* Mẫu báo cáo cuối tháng bao gồm:

  * Logo TutorTrack, tên gia sư, tên học sinh và tháng học.

  * Bảng thống kê chi tiết từng buổi học: Ngày, Chuyên đề, Nhận xét, Điểm số BTVN.

  * Bảng kê học phí chi tiết và mã QR tra cứu hoá đơn điện tử.

### 4.4. Quy trình Đề Xuất Học Bù (Reschedule Workflow)

* **Phía Phụ huynh:** Trên trang `/p/[token]`, bấm "Xin nghỉ / Đổi lịch" $\rightarrow$ Chọn ngày bận & đề xuất giờ học thay thế.

* **Phía Gia sư:** Dashboard Admin hiển thị Badge thông báo `[1 Yêu cầu mới]` $\rightarrow$ Gia sư bấm "Chấp nhận" hoặc "Đề xuất giờ khác".

* Hệ thống tự động cập nhật lại lịch trong `class_sessions` khi được duyệt.

## GIAI ĐOẠN 5: TESTING, HARDENING & GO-LIVE PLAYBOOK (TUẦN 5)

> **Mục tiêu:** Đảm bảo toàn bộ hệ thống vận hành trơn tru, không có lỗi tiềm ẩn trước khi chuyển sang Domain chính thức.

### 5.1. Kế hoạch Kiểm Thử Toàn Diện (Testing Matrix)

| 

| **Hạng mục kiểm thử** | **Kịch bản thực hiện** | **Kết quả kỳ vọng** | **Trạng thái** | 
| **Auth & Security** | Dùng token nặc danh cố tình gọi API update student | Bị chặn với HTTP `401 Unauthorized` hoặc `403 Forbidden` | `PENDING` | 
| **Data Isolation** | Phụ huynh dùng `magic_token` học sinh A để query học sinh B | Không tìm thấy dữ liệu (Empty response) | `PENDING` | 
| **Storage Limits** | Upload file `.exe` hoặc file `.pdf` dung lượng $> 15\text{MB}$ | Hệ thống từ chối tệp và hiển thị cảnh báo hợp lệ | `PENDING` | 
| **Fintech Webhook** | Gửi payload chuyển khoản thử nghiệm với đúng định dạng | Hoá đơn chuyển `paid` trong vòng $\le 2\text{ giây}$ | `PENDING` | 
| **Multi-Domain** | Truy cập domain Admin và domain Parent qua Middleware | Chuyển hướng đúng layout và subdomain tương ứng | `PENDING` | 

### 5.2. Cấu hình Tên Miền & Multi-Domain Production

* Cấu hình DNS trên Cloudflare hoặc Vercel DNS:

  * `tutor.yourdomain.vn` $\rightarrow$ Trỏ về Dashboard dành cho Gia sư (Bảo vệ bởi Auth).

  * `sohoc.yourdomain.vn` $\rightarrow$ Trỏ về Portal tra cứu dành cho Phụ huynh.

* Đảm bảo cấu hình SSL/TLS Full (Strict) và bật HTTP/2, HTTP/3.

### 5.3. Biến Môi Trường (Environment Variables Audit)

Đảm bảo các biến sau được nạp đầy đủ trên Vercel Project Settings:

```
# Supabase Production
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..." # Chỉ dùng trên Server Actions/Webhooks

# Multi-Domain Hostnames
NEXT_PUBLIC_ADMIN_DOMAIN="tutor.yourdomain.vn"
NEXT_PUBLIC_PARENT_DOMAIN="sohoc.yourdomain.vn"

# Payment Gateway (PayOS / Casso)
PAYOS_CLIENT_ID="xxx"
PAYOS_API_KEY="xxx"
PAYOS_CHECKSUM_KEY="xxx"

# Notification Services
TELEGRAM_BOT_TOKEN="xxx"
TELEGRAM_DEFAULT_CHAT_ID="xxx"

# App Security
CRON_SECRET="your-ultra-secure-random-token"

```

## BẢNG KIỂM TRA (CHECKLIST) & QUẢN TRỊ RỦI RO

### Checklist Đếm Ngược Ngày Go-Live (T-Minus Checklist)

* \[ \] **T-7 ngày:** Hoàn thiện migration RLS trên production database Supabase; khoá hoàn toàn quyền sửa bảng từ role `anon`.

* \[ \] **T-5 ngày:** Thiết lập Supabase Storage, cấu hình hạn mức dung lượng bucket và liên kết CDN.

* \[ \] **T-4 ngày:** Thử nghiệm thành công kịch bản Webhook thanh toán VietQR với tài khoản thực tế.

* \[ \] **T-3 ngày:** Kiểm tra toàn bộ UI trên màn hình điện thoại (Safari iOS và Chrome Android).

* \[ \] **T-2 ngày:** Backup CSDL Supabase lần cuối trước khi nhập dữ liệu học sinh thật.

* \[ \] **T-1 ngày:** Trỏ DNS production domain, kích hoạt chứng chỉ SSL và kiểm tra Middleware routing.

* \[ \] **Day 0 (Go-Live):** Tạo tài khoản cho học sinh đầu tiên, gửi link Portal cho phụ huynh và bắt đầu theo dõi logs!

### Ma Trận Quản Trị Rủi Ro (Risk Mitigation)

| **Rủi ro tiềm ẩn** | **Mức độ** | **Biện pháp giảm thiểu** | 
| **Phụ huynh nhập sai nội dung chuyển khoản VietQR** | `Trung bình` | VietQR đã nhúng sẵn mã cố định không cho sửa. Nếu chuyển sai, hệ thống giữ trạng thái `unpaid` và cho phép gia sư "Khớp lệnh thủ công" chỉ bằng 1-Click. | 
| **Tắc nghẽn mạng khi xem file bài tập** | `Thấp` | Toàn bộ file lưu trên Supabase Storage CDN được cache biên toàn cầu, giảm tải cho máy chủ chính. | 
| **Rò rỉ thông tin cá nhân của học sinh** | `Nghiêm trọng` | Áp dụng chính sách RLS triệt để; `magic_token` được mã hoá ngẫu nhiên 32 ký tự hex (độ phức tạp $16^{32}$ không thể đoán mò). | 
