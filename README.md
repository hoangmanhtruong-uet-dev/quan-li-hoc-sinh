# 🎓 TutorTrack — Nền Tảng Quản Lý Gia Sư & Sổ Liên Lạc Phụ Huynh Tự Động

<p align="center">
  <img src="https://raw.githubusercontent.com/hoangmanhtruong-uet-dev/quan-li-hoc-sinh/main/web/public/file.svg" alt="TutorTrack Logo" width="80" height="80" />
</p>

<p align="center">
  <b>Hệ thống quản lý giảng dạy toàn diện dành cho Gia sư chuyên nghiệp, Giáo viên tự do và Trung tâm giáo dục: Theo dõi lịch dạy thông minh, Cổng sổ liên lạc phụ huynh qua Magic Link không cần mật khẩu, Tích hợp thanh toán VietQR tự động gạch nợ, Quản lý bài tập nộp trên Cloud Storage & Ôn tập theo chuyên đề chuẩn hóa.</b>
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.3.8-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.2.8-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-PostgreSQL_%26_Auth_%26_Storage-3ecf8e?style=for-the-badge&logo=supabase" alt="Supabase" /></a>
  <a href="https://vietqr.net/"><img src="https://img.shields.io/badge/VietQR-NAPAS_24%2F7-e11d48?style=for-the-badge" alt="VietQR" /></a>
</p>

---

## 📑 Mục lục

- [🌟 Giới thiệu tổng quan](#-giới-thiệu-tổng-quan)
- [✨ Tính năng nổi bật](#-tính-năng-nổi-bật)
  - [1. Bảng điều khiển Gia Sư (Tutor Master Dashboard)](#1-bảng-điều-khiển-gia-sư-tutor-master-dashboard)
  - [2. Cổng Sổ Liên Lạc Phụ Huynh (Parent Portal - Magic Link)](#2-cổng-sổ-liên-lạc-phụ-huynh-parent-portal---magic-link)
  - [3. Tra cứu nhanh bằng Số Điện Thoại (`/lookup`)](#3-tra-cứu-nhanh-bằng-số-điện-thoại-lookup)
  - [4. Quản lý Bài tập, Nộp file trực tuyến & Ôn tập Chuyên đề](#4-quản-lý-bài-tập-nộp-file-trực-tuyến--ôn-tập-chuyên-đề)
  - [5. Fintech: Tự động tính học phí & VietQR](#5-fintech-tự-động-tính-học-phí--vietqr)
  - [6. Bảo mật đa tầng & Row Level Security (RLS)](#6-bảo-mật-đa-tầng--row-level-security-rls)
- [🏗️ Kiến trúc công nghệ (Tech Stack)](#️-kiến-trúc-công-nghệ-tech-stack)
- [📁 Cấu trúc thư mục dự án](#-cấu-trúc-thư-mục-dự-án)
- [🚀 Hướng dẫn cài đặt & Khởi chạy (Quick Start)](#-hướng-dẫn-cài-đặt--khởi-chạy-quick-start)
- [🗄️ Cấu hình Cơ sở dữ liệu Supabase](#️-cấu-hình-cơ-sở-dữ-liệu-supabase)
- [⚙️ Danh mục Biến môi trường (`.env.local`)](#️-danh-mục-biến-môi-trường-envlocal)
- [📋 Lộ trình phát triển (Roadmap)](#-lộ-trình-phát-triển-roadmap)
- [📄 Giấy phép (License)](#-giấy-phép-license)

---

## 🌟 Giới thiệu tổng quan

**TutorTrack** là giải pháp phần mềm hiện đại giải quyết triệt để các vấn đề nhức nhối trong công việc gia sư và giảng dạy cá nhân tại Việt Nam:
- ❌ **Mất thời gian ghi chép thủ công:** Theo dõi lịch dạy, tính tiền theo giờ, điểm danh bằng sổ tay hay Excel rời rạc.
- ❌ **Giao tiếp bất tiện với phụ huynh:** Phụ huynh thường xuyên hỏi con hôm nay học gì, làm bài tập chưa, tình hình tiến bộ ra sao.
- ❌ **Nhắc nhở học phí ngại ngùng:** Phải nhắn tin giục học phí từng tháng, tính toán nhầm lẫn số buổi nghỉ/học bù.
- ❌ **Thất lạc bài tập & tài liệu:** Gửi file bài tập qua Zalo dễ bị trôi tin nhắn và hết hạn tải xuống.

**TutorTrack** số hóa 100% quy trình:
1. **Gia sư** chỉ cần mở Dashboard để check-in buổi dạy, giao bài tập, nhập điểm số và theo dõi doanh thu.
2. **Phụ huynh** nhận được một đường link duy nhất (**Magic Link**) hoặc nhập SĐT để xem trọn vẹn lộ trình, nhận xét của gia sư, biểu đồ tiến độ, tải bài tập và chuyển khoản học phí qua mã VietQR tạo động chính xác từng đồng.

---

## ✨ Tính năng nổi bật

### 1. Bảng điều khiển Gia Sư (Tutor Master Dashboard)
- 📊 **Overview (Tổng quan KPI):** Thống kê số lượng học sinh đang theo học, tổng số buổi đã hoàn thành trong tháng, doanh thu dự kiến & thực thu, hiển thị thông báo phản hồi và đề xuất dời lịch mới nhất từ phụ huynh.
- 📅 **Schedule (Lịch dạy trực quan):** Lịch dạy theo tuần/tháng, phân loại màu sắc chuyên biệt theo từng môn học (Hóa học, Toán học, Tiếng Anh, Vật lý,...), tích hợp modal Check-in điểm danh 1 chạm.
- 👥 **Quản lý Học sinh & Lộ trình (Students):** 
  - Thêm học sinh kèm thông tin chi tiết (lớp, môn, số điện thoại phụ huynh, học phí/giờ, lịch học cố định).
  - Tự động sinh lịch học định kỳ từ cấu hình hoặc **Import lộ trình học tập từ file CSV** (ví dụ file mẫu `Roadmap_Hoa_12.csv`).
  - Hỗ trợ thêm lộ trình các tháng tương lai (`AddFutureMonthRoadmapModal`).
  - Mỗi học sinh có một mã `magic_token` bảo mật riêng để chia sẻ cổng tra cứu cho phụ huynh.
- 💰 **Quản lý Học phí & Doanh thu (Tuition):**
  - Tự động tổng hợp số buổi thực dạy trong tháng và nhân đơn giá học phí theo giờ.
  - Tạo nhanh mã thanh toán VietQR với số tiền và nội dung chuyển khoản chuẩn hóa.
  - Tích hợp **Modal xuất tin nhắn Zalo** mẫu soạn sẵn kèm chi tiết số buổi và thông tin tài khoản, sao chép chỉ bằng 1 click.
- 🖨️ **Phiếu Báo Cáo Học Tập (Printable PDF Report):**
  - Xuất phiếu đánh giá kết quả học tập định kỳ cho từng học sinh với giao diện sang trọng, hiển thị biểu đồ điểm số, lời nhận xét chi tiết và phần ký tên xác nhận của gia sư.

---

### 2. Cổng Sổ Liên Lạc Phụ Huynh (Parent Portal - Magic Link)
- 🔗 **Truy cập không cần mật khẩu:** Phụ huynh truy cập thông qua đường dẫn bảo mật `/p/[token]` (hoặc qua tên miền riêng dạng `phuhuynh.domain.com/[token]`), loại bỏ hoàn toàn phiền toái quên mật khẩu.
- 📋 **Theo dõi tiến độ buổi học:** Xem danh sách toàn bộ các buổi học (Đã hoàn thành, Sắp tới, Nghĩ/Dời lịch), kèm giờ học, chủ đề bài giảng và nhận xét chi tiết từ gia sư.
- 📈 **Biểu đồ tiến độ học tập trực quan:** Biểu đồ đường tích hợp thư viện Recharts thể hiện sự thay đổi điểm số kiểm tra qua từng buổi học.
- 🔄 **Đề xuất Dời lịch học linh hoạt (`RescheduleModal`):** Phụ huynh có thể chủ động gửi yêu cầu đổi ngày/giờ học kèm lý do, gia sư nhận thông báo và phê duyệt ngay trên Dashboard.
- 💬 **Kênh phản hồi 2 chiều:** Phụ huynh gửi tin nhắn góp ý, trao đổi trực tiếp với gia sư mà không lo trôi tin.

---

### 3. Tra cứu nhanh bằng Số Điện Thoại (`/lookup`)
- Dành cho phụ huynh khi không lưu lại Magic Link: chỉ cần nhập **Số điện thoại Phụ huynh (Zalo)** đã đăng ký với gia sư.
- Hệ thống tự động xác thực và điều hướng chính xác đến sổ liên lạc của con em mình.

---

### 4. Quản lý Bài tập, Nộp file trực tuyến & Ôn tập Chuyên đề
- 📂 **Lưu trữ Cloud Storage:** Toàn bộ đề bài, file tài liệu và bài nộp được upload trực tiếp lên **Supabase Storage** (hỗ trợ file PDF, Word, Ảnh đến 10MB).
- 📤 **Học sinh nộp bài tập trực tiếp:** Tại cổng Parent Portal, học sinh/phụ huynh có thể tải file bài làm (ảnh chụp bài tập, file scan) lên hệ thống để gia sư chấm điểm.
- 📚 **Chuyên mục Ôn tập theo chuyên đề (`TopicReviewSection`):**
  - Phân loại tài liệu và bài tập theo từng chuyên đề/chương học.
  - Quản lý trạng thái ôn tập: *Chưa ôn tập*, *Đang ôn tập*, *Đã hoàn thành*.
  - Đính kèm tài liệu học liệu và lời giải tham khảo riêng cho từng học sinh.

---

### 5. Fintech: Tự động tính học phí & VietQR
- 💳 **VietQR Chuẩn NAPAS 24/7:** Tạo mã QR thanh toán động hiển thị thông tin ngân hàng thụ hưởng, đúng số tiền cần thanh toán của tháng và mã tham chiếu giao dịch.
- ⚡ **Webhook Gạch Nợ Tự Động (`/api/webhooks/payment`):**
  - Tích hợp sẵn endpoint nhận webhook từ các cổng thanh toán/ngân hàng (PayOS, Casso, Open Banking).
  - Xác thực chữ ký số an toàn **HMAC-SHA256**.
  - Tự động kiểm tra nội dung chuyển khoản, cập nhật trạng thái hóa đơn sang `paid` ngay khi tiền vào tài khoản gia sư.

---

### 6. Bảo mật đa tầng & Row Level Security (RLS)
- 🔐 **Supabase Auth:** Bảo vệ khu vực quản trị Gia sư bằng Cookie Session bảo mật cao thông qua `@supabase/ssr`.
- 🛡️ **Next.js Middleware:** Tự động kiểm tra phiên đăng nhập của Gia sư, ngăn chặn truy cập trái phép vào trang quản trị; đồng thời hỗ trợ Rewrite định tuyến cho tên miền phụ huynh.
- 🔒 **PostgreSQL RLS Policies:**
  - Gia sư chỉ có quyền xem, sửa, xóa dữ liệu học sinh thuộc quyền quản lý của mình (`tutor_id = auth.uid()`).
  - Phụ huynh chỉ có quyền đọc dữ liệu thông qua `magic_token` hợp lệ, không bao giờ lộ thông tin của học sinh khác.

---

## 🏗️ Kiến trúc công nghệ (Tech Stack)

| Thành phần | Công nghệ sử dụng | Mục đích & Ưu điểm |
|---|---|---|
| **Frontend Framework** | **Next.js 16 (App Router)** | Hiệu năng tối đa với Server Components, SSR & Client State |
| **Giao diện & UI** | **Tailwind CSS v4** + **Lucide Icons** | Giao diện Dark Mode hiện đại, bảng màu HSL tinh tế |
| **Animation** | **Framer Motion** | Hiệu ứng chuyển cảnh mượt mà, micro-interactions sinh động |
| **Biểu đồ** | **Recharts** | Trực quan hóa tiến độ điểm số học tập |
| **Data Fetching** | **SWR** | Caching, tự động revalidate dữ liệu thời gian thực |
| **Cơ sở dữ liệu** | **PostgreSQL (Supabase)** | CSDL quan hệ chuẩn doanh nghiệp, hỗ trợ JSONB |
| **Bảo mật CSDL** | **Row Level Security (RLS)** | Phân quyền truy cập an toàn cấp độ dòng dữ liệu |
| **Xác thực** | **Supabase Auth** (`@supabase/ssr`) | Xác thực session dựa trên HTTP-Only Cookies an toàn |
| **Lưu trữ tệp tin** | **Supabase Storage** | Lưu trữ đề bài, tài liệu chuyên đề và bài nộp học sinh |
| **Thanh toán** | **VietQR + Webhook HMAC-SHA256** | Thanh toán chuyển khoản ngân hàng không qua trung gian |

---

## 📁 Cấu trúc thư mục dự án

```text
Theo-doi-lich-hoc/
├── .env                              # Biến môi trường chung
├── Roadmap_Hoa_12.csv                # File mẫu lộ trình chuyên đề ôn thi (CSV)
├── tutortrack_go_live_master_plan.md # Tài liệu kế hoạch chi tiết triển khai Go-Live
└── web/                              # Ứng dụng Next.js chính
    ├── .env.local                    # Biến môi trường ứng dụng Next.js
    ├── package.json                  # Dependencies & scripts
    ├── supabase_schema.sql           # Script khởi tạo toàn bộ CSDL, RLS & Indexes
    ├── public/                       # Static assets, icons, hình ảnh mã QR mẫu
    └── src/
        ├── middleware.ts             # Auth guard & điều hướng tên miền phụ huynh
        ├── types/
        │   └── database.ts           # Type definitions TypeScript (Student, ClassSession, ...)
        ├── lib/
        │   ├── db.ts                 # Toàn bộ hàm truy vấn CSDL Supabase (CRUD)
        │   ├── storage.ts            # Xử lý upload/download file lên Supabase Storage
        │   ├── utils.ts              # Các hàm tiện ích format ngày tháng, tiền tệ, classname
        │   └── supabase/             # Client & Server Supabase helpers (@supabase/ssr)
        ├── components/
        │   ├── AddStudentModal.tsx           # Modal thêm học sinh & tự động tạo lịch học
        │   ├── CheckInModal.tsx              # Modal điểm danh buổi học, chấm điểm & nộp bài
        │   ├── TopicReviewSection.tsx        # Quản lý ôn tập theo chuyên đề & đính kèm tài liệu
        │   ├── ZaloReceiptModal.tsx          # Tạo biên lai học phí & cú pháp nhắn tin Zalo
        │   ├── EditRoadmapModal.tsx          # Chỉnh sửa nội dung & ngày giờ lộ trình học
        │   ├── EditStudentModal.tsx          # Cập nhật thông tin học sinh & học phí
        │   ├── PrintableReportModal.tsx      # Xuất báo cáo kết quả học tập định kỳ (PDF/In)
        │   ├── RescheduleModal.tsx           # Xử lý đề xuất dời lịch học từ phụ huynh
        │   ├── StudentProgressChart.tsx      # Biểu đồ biến thiên điểm số học tập
        │   ├── AddFutureMonthRoadmapModal.tsx# Thêm nhanh lộ trình cho các tháng tiếp theo
        │   └── roadmap/
        │       └── FutureMonthSessionList.tsx # Danh sách buổi học trong các tháng tương lai
        └── app/
            ├── layout.tsx            # Root layout (Theme Dark, font Outfit)
            ├── globals.css           # Cấu hình styles nền & hiệu ứng kính Glassmorphism
            ├── page.tsx              # Tutor Master Dashboard (Tổng quan, Lịch dạy, Học sinh, Học phí, Chuyên đề)
            ├── login/page.tsx        # Trang đăng nhập & đăng ký dành cho Gia sư
            ├── lookup/page.tsx       # Trang tra cứu sổ học tập bằng Số điện thoại Phụ huynh
            ├── p/[token]/page.tsx    # Cổng sổ liên lạc học tập dành riêng cho Phụ huynh & Học sinh
            ├── actions/auth.ts       # Server Actions hỗ trợ đăng xuất & xác thực
            └── api/
                ├── auth/callback/    # OAuth & Email confirmation callback
                └── webhooks/payment/ # Webhook nhận thông báo thanh toán ngân hàng tự động
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy (Quick Start)

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.18.0 hoặc 20.x trở lên
- **npm** (hoặc `pnpm` / `yarn`)
- **Tài khoản Supabase** (miễn phí tại [supabase.com](https://supabase.com))

### 2. Clone mã nguồn
```bash
git clone https://github.com/hoangmanhtruong-uet-dev/quan-li-hoc-sinh.git
cd quan-li-hoc-sinh/web
```

### 3. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 4. Thiết lập biến môi trường
Tạo file `.env.local` bên trong thư mục `web/` với nội dung:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Webhook Security (Tùy chọn khi kích hoạt tự động gạch nợ)
WEBHOOK_CHECKSUM_KEY=your_webhook_secret_key
```

### 5. Khởi chạy môi trường phát triển (Development)
```bash
npm run dev
```
Mở trình duyệt và truy cập:
- **Bảng điều khiển Gia Sư:** [http://localhost:3000](http://localhost:3000)
- **Tra cứu sổ học tập Phụ huynh:** [http://localhost:3000/lookup](http://localhost:3000/lookup)
- **Đăng nhập:** [http://localhost:3000/login](http://localhost:3000/login)

---

## 🗄️ Cấu hình Cơ sở dữ liệu Supabase

Dự án đã được tích hợp sẵn toàn bộ script khởi tạo tại tệp [`web/supabase_schema.sql`](web/supabase_schema.sql).

### Các bước thiết lập trên Supabase:
1. Mở dự án của bạn trên [Supabase Dashboard](https://supabase.com/dashboard).
2. Chọn menu **SQL Editor**, tạo một truy vấn mới.
3. Sao chép toàn bộ nội dung trong tệp [`web/supabase_schema.sql`](web/supabase_schema.sql) và dán vào, sau đó nhấn **Run**.
4. Vào menu **Storage** -> Tạo một bucket tên là `homework-files` và tích chọn **Public Bucket** để cho phép tải tài liệu và nộp bài tập.

### Các bảng dữ liệu chính:
- `students`: Quản lý danh sách học sinh, phụ huynh, học phí/giờ và mã `magic_token`.
- `class_sessions`: Quản lý từng buổi học, ngày giờ, chủ đề, trạng thái điểm danh, tài liệu gia sư giao, bài tập học sinh nộp và điểm số.
- `invoices`: Theo dõi hóa đơn học phí từng tháng, tổng số buổi và trạng thái thanh toán.
- `parent_messages`: Lưu trữ tin nhắn và phản hồi từ phụ huynh gửi tới gia sư.
- `review_topics` & `review_topic_files`: Quản lý danh mục chuyên đề ôn tập và tài liệu học tập đính kèm.

---

## ⚙️ Danh mục Biến môi trường (`.env.local`)

| Tên biến | Bắt buộc | Mô tả |
|---|:---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Có | URL kết nối dự án Supabase (tìm thấy trong Project Settings > API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Có | Supabase Anon Key (Public) dùng cho client phía trình duyệt |
| `SUPABASE_SERVICE_ROLE_KEY` | Khuyên dùng | Khóa Service Role (Private) dùng cho Webhook xử lý gạch nợ tự động |
| `WEBHOOK_CHECKSUM_KEY` | Tùy chọn | Chuỗi bí mật xác thực chữ ký HMAC-SHA256 của Webhook thanh toán |

---

## 📋 Lộ trình phát triển (Roadmap)

- [x] **Giai đoạn 1: Nền tảng cốt lõi (MVP)**
  - [x] Quản lý thông tin học sinh, lịch dạy cố định và đơn giá học phí.
  - [x] Điểm danh buổi học, nhận xét và nhập điểm số.
  - [x] Import lộ trình học tập từ file CSV chuẩn hóa.
  - [x] Cổng thông tin phụ huynh qua Magic Link không cần mật khẩu.
- [x] **Giai đoạn 2: Tự động hóa & Tương tác nâng cao**
  - [x] Tạo mã VietQR động theo tháng kèm cú pháp thanh toán chuẩn.
  - [x] Modal xuất tin nhắn Zalo thông báo học phí chuẩn bị sẵn.
  - [x] Tính năng học sinh nộp bài tập trực tiếp lên Cloud Storage.
  - [x] Đề xuất dời lịch học trực tiếp từ phía phụ huynh.
  - [x] Xuất phiếu báo cáo học tập định kỳ (PDF/Printable).
  - [x] Quản lý ôn tập theo chuyên đề bài bản.
- [ ] **Giai đoạn 3: Thông báo tự động & AI Assistant**
  - [ ] Tích hợp Zalo ZNS / Telegram Bot tự động gửi thông báo điểm danh ngay sau mỗi buổi học.
  - [ ] AI tóm tắt tiến độ học tập và đề xuất bài tập củng cố cá nhân hóa cho học sinh.
  - [ ] Hỗ trợ đa ngôn ngữ và tối ưu ứng dụng thành PWA (Progressive Web App).

---

## 📄 Giấy phép (License)

Dự án được phân phối dưới giấy phép **MIT License**. Mọi cá nhân và tổ chức có thể tự do sử dụng, chỉnh sửa và triển khai phục vụ cho công tác giáo dục và giảng dạy.

---

<p align="center">
  Phát triển với ❤️ bởi <b>Hoàng Mạnh Trường</b> & cộng đồng giáo dục Việt Nam.
</p>
