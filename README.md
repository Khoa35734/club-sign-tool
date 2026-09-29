# CLUB SIGN TOOL

> **Công cụ Ký & Đóng dấu Kế hoạch CLB — Desktop Local/Offline Utility**

---

## 📌 Giới thiệu

**Club Sign Tool** là ứng dụng máy tính gọn nhẹ, hoạt động **100% cục bộ và ngoại tuyến (Local / Offline-First)**, được thiết kế chuyên biệt cho Ban Chủ nhiệm và cán bộ các Câu lạc bộ, Đội, Nhóm sinh viên tại các trường đại học để chuẩn bị hồ sơ, kế hoạch tổ chức sự kiện, tờ trình trước khi nộp lên Đoàn trường, Hội Sinh viên hoặc cấp quản lý.

### Quy trình nghiệp vụ chính:
```text
Mở tài liệu (PDF / DOC / DOCX)
        ↓
Tự động chuyển đổi Word → PDF (LibreOffice Headless cục bộ)
        ↓
Chèn Chữ ký & Con dấu trực quan (Kéo - Thả, Căn dóng, Z-Index)
        ↓
Chèn Chức danh, Họ tên & Ngày tháng văn bản chuẩn quy thức
        ↓
Xem trước & Xác thực
        ↓
Xuất file PDF đã ký an toàn (original_SIGNED.pdf)
```

---

## 🛡️ Tôn chỉ Kỹ thuật & Phạm vi

- **100% Ngoại tuyến (Air-Gapped Ready):** Không cần kết nối Internet; tuyệt đối không mở cổng mạng, không có máy chủ backend, không lưu trữ đám mây, không gửi dữ liệu ra bên ngoài.
- **Bảo toàn Tài liệu Gốc (Immutability):** Không bao giờ can thiệp, sửa đổi hay ghi đè lên file Word/PDF gốc của người dùng. Quá trình xuất sử dụng cơ chế ghi an toàn nguyên tử (**Atomic File Output**: `.tmp` $\rightarrow$ verify $\rightarrow$ rename).
- **Bảo mật Tài sản Danh tính:** Hình ảnh chữ ký và con dấu là dữ liệu nhạy cảm, được lưu trữ hoàn toàn cục bộ trên máy tính người dùng tại `%APPDATA%/ClubSignTool/`.
- **Bảo toàn Vector (`BR-009`):** Giữ nguyên vẹn các lớp văn bản dạng vector có thể tìm kiếm/bôi đen (`searchable text`) của tài liệu PDF gốc, không biến toàn bộ trang thành ảnh bitmap mờ.

---

## 💻 Yêu cầu Hệ thống

| Thành phần | Yêu cầu tối thiểu | Khuyến nghị |
|---|---|---|
| **Hệ điều hành** | Windows 10 (bản 1809 trở lên, 64-bit) | Windows 11 (64-bit) |
| **WebView Runtime** | Microsoft Edge WebView2 (đã tích hợp sẵn trên Windows 10/11) | Phiên bản Evergreen mới nhất |
| **Node.js** | v18.0.0 trở lên | v20.x hoặc v22.x LTS (kèm `npm`) |
| **Rust & Cargo** | Rust 1.80.0 trở lên | Toolchain `msvc` hoặc `gnu` |
| **Bộ chuyển đổi Word** | LibreOffice 7.x trở lên | LibreOffice 24.x (để tự động convert `.docx`/`.doc` sang PDF) |

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Tải mã nguồn về máy
```bash
git clone https://github.com/dutesports/club-sign-tool.git
cd club-sign-tool
```

### 2. Cài đặt các gói phụ thuộc Frontend
```bash
npm install
```

### 3. Khởi chạy Ứng dụng ở Chế độ Phát triển (Dev Mode)

#### 👉 Chạy toàn diện Ứng dụng Desktop Tauri (Khuyên dùng):
Lệnh này sẽ khởi chạy đồng thời WebView2 và nhân Rust Native:
```bash
npm run tauri dev
```

#### 🌐 Hoặc chạy riêng giao diện Web Frontend:
Nếu bạn chỉ muốn thử nghiệm và tinh chỉnh nhanh giao diện trên trình duyệt web:
```bash
npm run dev
```
Ứng dụng web sẽ mở tại địa chỉ: `http://localhost:1420` (hoặc cổng hiển thị trên terminal).

---

## 🧪 Kiểm tra Chất lượng & Kiểm thử (Testing)

Dự án tuân thủ nghiêm ngặt quy chuẩn kiểm thử và type-safe trước mỗi lần bàn giao:

### 1. Kiểm tra Kiểu dữ liệu TypeScript
```bash
npx tsc --noEmit
```

### 2. Kiểm tra Quy chuẩn Mã nguồn (Linter)
```bash
# Kiểm tra linter Frontend (ESLint)
npm run lint

# Kiểm tra linter Rust Native (Clippy)
cargo clippy --manifest-path src-tauri/Cargo.toml
```

### 3. Chạy Toàn bộ Bộ Kiểm thử Tự động (Unit & Integration Tests)
```bash
# Chạy toàn bộ test suites Frontend & Quy chuẩn SRS
npm test

# Chạy test suites tầng Rust Native
cargo test --manifest-path src-tauri/Cargo.toml
```

---

## 📦 Đóng gói Ứng dụng Xuất bản (Production Build)

Để đóng gói thành bộ cài đặt hoàn chỉnh (`.exe` hoặc `.msi`) phân phối cho các thành viên CLB sử dụng mà không cần cài môi trường lập trình:

### 1. Biên dịch Frontend:
```bash
npm run build
```

### 2. Đóng gói Ứng dụng Desktop bằng Tauri:
```bash
npm run tauri build
```
Bộ cài đặt sau khi hoàn tất sẽ nằm tại thư mục:
`src-tauri/target/release/bundle/msi/` hoặc `src-tauri/target/release/bundle/nsis/`

---

## 🗂️ Cấu trúc Thư mục Dự án

```text
club-sign-tool/
├── docs/                                 # Tài liệu kiến trúc và đặc tả chuẩn
│   ├── SRS.md                            # Software Requirements Specification (Tài liệu gốc)
│   ├── ARCHITECTURE.md                   # Kiến trúc hệ thống chi tiết
│   ├── DECISIONS.md                      # Architecture Decision Records (ADRs)
│   └── ROADMAP.md                        # Tiến độ phát triển từng tính năng
├── src/                                  # Tầng Presentation & Frontend (React 19 + TypeScript)
│   ├── app/                              # Layout Shell, Providers, Header/Footer
│   ├── components/                       # Shared UI components (Button, Modal, Toast)
│   ├── features/                         # Feature-sliced modules
│   │   ├── document/                     # Quản lý file, native file dialog, thumbnails
│   │   ├── editor/                       # Canvas overlay, tương tác kéo thả, zoom/pan
│   │   ├── signature/                    # Quản lý & chèn chữ ký
│   │   ├── stamp/                        # Quản lý & chèn con dấu (độ mờ 85%, Z-index)
│   │   ├── image-editor/                 # Tách nền trắng ảnh, cắt (crop), xoay
│   │   ├── word-conversion/              # Tiến trình gọi LibreOffice Headless
│   │   ├── export/                       # Xem trước bản xuất và ghi file PDF an toàn
│   │   └── settings/                     # Tùy biến cấu hình cục bộ
│   ├── hooks/                            # Custom hooks dùng chung (phím tắt, resize)
│   ├── services/                         # Tauri IPC client bridge wrappers
│   ├── stores/                           # Global state stores (useDocumentStore, useEditorStore)
│   ├── types/                            # TypeScript interfaces và domain models
│   └── utils/                            # Các hàm toán học, tọa độ chuẩn hóa, xử lý file
├── src-tauri/                            # Tầng Nhân hệ thống Native (Rust Core)
│   ├── src/
│   │   ├── commands/                     # Tauri command controllers (thin boundary)
│   │   ├── conversion/                   # LibreOffice subprocess manager & timeout
│   │   ├── document/                     # Native file dialog, đọc metadata PDF
│   │   ├── errors/                       # Enum AppError định kiểu lỗi tập trung
│   │   ├── filesystem/                   # Atomic file writer, quản lý %APPDATA%
│   │   ├── image/                        # Thuật toán tách nền trắng và xử lý pixel
│   │   ├── pdf/                          # Vector PDF manipulations
│   │   ├── lib.rs                        # Khởi tạo Tauri context và đăng ký commands
│   │   └── main.rs                       # Entrypoint khởi động ứng dụng
│   ├── Cargo.toml                        # Cấu hình phụ thuộc Rust
│   └── tauri.conf.json                   # Cấu hình cửa sổ, bảo mật và đóng gói Tauri
├── tests/                                # Test suites tự động kiểm tra nghiệp vụ và SRS
├── package.json                          # Cấu hình npm và scripts
└── tsconfig.json                         # Cấu hình TypeScript Strict Mode
```

---

## 📖 Tài liệu Tham khảo

- [Software Requirements Specification (SRS)](./docs/SRS.md)
- [System Architecture Document](./docs/ARCHITECTURE.md)
- [Architecture Decision Records (DECISIONS.md)](./docs/DECISIONS.md)
- [Development Roadmap & Checklists](./docs/ROADMAP.md)

---

## 📄 Bản quyền & Bảo mật

Phần mềm nội bộ dành cho các Câu lạc bộ sinh viên. Nghiêm cấm phân phối thương mại hoặc sửa đổi bản quyền mà không có sự cho phép.
