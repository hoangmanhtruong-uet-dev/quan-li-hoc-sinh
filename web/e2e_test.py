from playwright.sync_api import sync_playwright
import time
import os

print("Bắt đầu kịch bản kiểm thử End-to-End...")

def run_test():
    with sync_playwright() as p:
        print("Đang khởi động trình duyệt Chromium...")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        try:
            # 1. Đăng ký & Đăng nhập
            print("1. Truy cập trang /login...")
            page.goto('http://localhost:3000/login')
            page.wait_for_load_state('networkidle')

            print("   -> Chuyển sang chế độ Đăng Ký")
            page.click("text=Chưa có tài khoản? Đăng ký ngay")
            
            print("   -> Điền thông tin đăng ký")
            test_email = f"gia.su.{int(time.time())}@tutortrack.edu.vn"
            page.fill('input[type="email"]', test_email)
            page.fill('input[type="password"]', "password123")
            page.click("button[type='submit']")
            
            # Wait for redirect to dashboard or error message
            print("   -> Đợi phản hồi từ máy chủ Auth...")
            try:
                page.wait_for_url("http://localhost:3000/", timeout=5000)
                page.wait_for_load_state('networkidle')
                print("   ✅ Đăng nhập / Đăng ký thành công và đã vào Dashboard!")
            except:
                # Check if there is an email confirmation error
                error_locator = page.locator("text=Vui lòng kiểm tra email xác nhận")
                if error_locator.count() > 0:
                    print("   ✅ Đăng ký thành công! (Supabase yêu cầu xác nhận Email trước khi đăng nhập).")
                    print("   ⚠️ Kịch bản tự động sẽ dừng tại đây do không thể tự động mở email cá nhân của bạn để xác nhận.")
                    print("\n🎉 KIỂM THỬ ĐĂNG KÝ HOÀN TẤT THÀNH CÔNG!")
                    browser.close()
                    return
                else:
                    raise Exception("Không thể chuyển hướng về Dashboard và không thấy thông báo yêu cầu xác nhận email.")

            # 2. Thêm Học Sinh
            print("2. Kiểm thử thêm Học sinh mới...")
            page.click("button:has-text('Thêm Học Sinh & Lộ Trình')")
            
            # Form thêm học sinh (Bước 1)
            page.wait_for_selector("text=Thông tin Học sinh & Phụ huynh")
            student_name = f"Nguyễn Văn Playwright {int(time.time() % 1000)}"
            page.fill("input[placeholder='VD: Nguyễn Văn A']", student_name)
            page.select_option("select:has-text('Lớp 1')", label="Lớp 10")
            page.select_option("select:has-text('Toán học')", label="Hóa học")
            test_phone = f"0999{int(time.time() % 1000000):06d}"
            page.fill("input[placeholder='Nhập số điện thoại Zalo']", test_phone)
            page.fill("input[placeholder='VD: 200000']", "250000")
            page.click("button:has-text('Tiếp Tục Xếp Lịch')")

            # Bước 2
            print("   -> Chọn lịch học...")
            page.click("text=Thứ 3")
            page.click("text=Thứ 5")
            page.fill("input[placeholder='VD: 19h30 - 21h30']", "18h00 - 20h00")
            page.click("button:has-text('Tạo Kế Hoạch Động')")
            
            # Đợi load lộ trình
            page.wait_for_selector("text=Nội dung học (Có thể sửa)", timeout=15000)
            page.click("button:has-text('Lưu Học Sinh & Lộ Trình')")
            
            # Check for success
            page.wait_for_selector("text=Đã lưu học sinh và lịch học thành công", timeout=10000)
            print("   ✅ Thêm học sinh thành công!")
            
            # 3. Đăng xuất
            print("3. Đăng xuất tài khoản...")
            page.click("button:has-text('Đăng Xuất')")
            page.wait_for_url("http://localhost:3000/login")
            print("   ✅ Đăng xuất thành công!")

            # 4. Tra cứu Sổ học tập
            print("4. Truy cập Parent Portal (/lookup)...")
            page.goto('http://localhost:3000/lookup')
            page.wait_for_load_state('networkidle')

            print("   -> Điền SĐT tra cứu")
            page.fill("input[type='tel']", test_phone)
            page.click("button[type='submit']")

            print("   -> Đợi kết quả tìm kiếm...")
            page.wait_for_selector(f"text={student_name}", timeout=10000)
            print("   ✅ Tra cứu SĐT thành công!")

            print("\n🎉 KIỂM THỬ E2E HOÀN TẤT THÀNH CÔNG! HỆ THỐNG HOẠT ĐỘNG HOÀN HẢO!")

        except Exception as e:
            print(f"\n❌ LỖI KIỂM THỬ: {e}")
            page.screenshot(path="error_screenshot.png")
            with open("dom.html", "w", encoding="utf-8") as f:
                f.write(page.content())
            print(f"Đã lưu ảnh chụp màn hình lỗi tại error_screenshot.png và HTML tại dom.html")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    run_test()
