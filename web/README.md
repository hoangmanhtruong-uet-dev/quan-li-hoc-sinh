# 🎓 TutorTrack Web Application

> Giao diện Frontend & API Server của hệ thống **TutorTrack** — Nền tảng quản lý gia sư & sổ liên lạc phụ huynh tự động.

Chi tiết toàn bộ kiến trúc, CSDL và hướng dẫn sử dụng, vui lòng tham khảo [README chính của dự án](../README.md).

---

## ⚡ Khởi chạy nhanh (Quick Start)

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Thiết lập Biến môi trường
Tạo file `.env.local` trong thư mục này:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WEBHOOK_CHECKSUM_KEY=your-webhook-secret
```

### 3. Chạy Development Server
```bash
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Các lệnh Scripts

- `npm run dev`: Chạy Next.js development server
- `npm run build`: Tạo bản build production tối ưu
- `npm run start`: Chạy Next.js production server
- `npm run lint`: Kiểm tra cú pháp mã nguồn với ESLint
