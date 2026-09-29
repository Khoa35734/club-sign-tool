# CLUB SIGN TOOL

> **Công cụ Ký & Đóng dấu Kế hoạch CLB — Desktop Local/Offline Utility**

---

## 📌 Giới thiệu

**Club Sign Tool** là một công cụ desktop gọn nhẹ, hoạt động hoàn toàn cục bộ/ngoại tuyến (100% Local Offline) phục vụ nhu cầu nội bộ của các câu lạc bộ, đội, nhóm sinh viên:

- 📄 Mở tài liệu kế hoạch định dạng **PDF** hoặc **Word (`.doc`, `.docx`)**.
- 🔄 Tự động chuyển đổi file Word sang PDF giữ nguyên định dạng qua **LibreOffice Headless**.
- ✍️ Kéo - thả chữ ký và con dấu vào đúng vị trí cần ký duyệt.
- 🎨 Chỉnh sửa ảnh: Cắt (Crop), Xoay, Tinh chỉnh độ trong suốt (Opacity), và **Tách nền trắng (Remove White Background)** thành PNG trong suốt.
- 🖋️ Chèn chức danh, họ tên và ngày tháng văn bản chuẩn quy thức hành chính.
- 📑 Xuất file PDF ký duyệt hoàn chỉnh chất lượng in ấn cao để nộp cấp trên.

---

## 🛡️ Tôn chỉ Kỹ thuật & Phạm vi

- **Hoàn toàn Local/Offline:** Không máy chủ backend, không cơ sở dữ liệu SQL/NoSQL, không cloud storage, không telemetry.
- **Bảo toàn dữ liệu gốc:** Không can thiệp, không ghi đè lên file Word/PDF gốc của người dùng.
- **Gọn nhẹ & Tốc độ:** Xây dựng trên nền tảng **Tauri (Rust + WebView2) + React 19 + TypeScript**.

---

## 📚 Tài liệu Đặc tả Yêu cầu Phần mềm (SRS)

Toàn bộ đặc tả chi tiết về chức năng, ca sử dụng (Use Cases), quy tắc nghiệp vụ (Business Rules), kiến trúc hệ thống và ma trận kiểm thử được lưu trữ tại:

👉 [**SRS.md**](./SRS.md)

---

## 🗂️ Cấu trúc Thư mục Dự kiến

```text
club-sign-tool/
├── SRS.md                    # Tài liệu Software Requirements Specification
├── README.md                 # Giới thiệu dự án
├── src-tauri/                # Nhân xử lý Native (Rust Core)
│   ├── src/
│   │   ├── commands/         # File I/O, Word Conversion, PDF Engine, Image Processing
│   │   └── main.rs
│   └── Cargo.toml
├── src/                      # Giao diện người dùng (React + TypeScript)
│   ├── components/           # Canvas Editor, Thumbnails, Asset Manager, Image Editor
│   ├── stores/               # Quản lý state (Zustand)
│   └── styles/
└── package.json
```
