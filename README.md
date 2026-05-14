# EduForum - Diễn đàn học thuật

Dự án EduForum được xây dựng với Backend Django REST Framework và Frontend React (UmiJS).

## 🚀 Hướng dẫn cài đặt sau khi Pull code

### 1. Yêu cầu hệ thống
- Python 3.10+
- Node.js 16+
- Docker & Docker Compose

---

### 2. Thiết lập Backend (Django)

1. **Di chuyển vào thư mục backend:**
   ```bash
   cd backend
   ```

2. **Tạo môi trường ảo và cài đặt thư viện:**
   ```bash
   python -m venv venv
   # Kích hoạt venv (Windows)
   .\venv\Scripts\activate
   # Kích hoạt venv (Mac/Linux)
   source venv/bin/activate

   pip install -r requirements.txt
   ```

3. **Cấu hình môi trường:**
   - Copy file `.env.example` thành `.env`:
     ```bash
     cp .env.example .env
     ```
   - Mở file `.env` và điền các thông tin cần thiết (đặc biệt là `EMAIL_HOST_PASSWORD` nếu muốn gửi mail thật).

4. **Khởi chạy Database (Docker):**
   - Quay lại thư mục gốc dự án (nơi có file `docker-compose.yml`):
     ```bash
     docker-compose up -d
     ```

5. **Chạy Migration và Server:**
   ```bash
   cd backend
   python manage.py migrate
   python manage.py runserver
   ```

---

### 3. Thiết lập Frontend (React/UmiJS)

1. **Di chuyển vào thư mục frontend:**
   ```bash
   cd frontend
   ```

2. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

3. **Khởi chạy môi trường phát triển:**
   ```bash
   npm run dev
   ```
   - Truy cập: `http://localhost:8000`

---

## 🛠 Lưu ý quan trọng
- **Email**: Nếu bạn dùng Gmail để gửi mail khôi phục mật khẩu, hãy nhớ tạo **Mật khẩu ứng dụng (App Password)** và điền vào `.env`.
- **Database**: Port mặc định của DB trong dự án này được cấu hình là `5435` (tránh trùng với port `5432` mặc định nếu máy đã cài Postgres).

Chúc các bạn phát triển dự án vui vẻ!
