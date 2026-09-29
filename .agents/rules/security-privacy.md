---
trigger: always_on
description: "Strict privacy and security invariants: zero telemetry, air-gapped asset protection, input sanitization, safe Word conversion, and proprietary IP protection."
---

# Security, Privacy & Asset Protection

## 1. Local Asset Confidentiality (Signatures & Stamps)
- **Sensitive Credentials:** Handwritten signatures and club seals represent legal identity and administrative authority. Treat them as sensitive personal credentials.
- **Air-Gapped Local Storage:** All user assets (signature PNGs, stamp PNGs, recent file manifests) must reside strictly on the local machine in `%APPDATA%/ClubSignTool/`.
- **Zero Network Transmission:** Never transmit, upload, or sync signature images, document previews, or file contents over HTTP, HTTPS, WebSockets, or cloud endpoints. The app must function entirely offline.
- **No Sensitive Logging:** Never log raw image byte buffers, base64 strings, file paths containing sensitive identifiers, or document text content to terminal output or log files.
- **No Real Assets in VCS:** Strictly forbid committing real signatures or official institution seals to Git. Test fixtures must use synthetic vector shapes with watermark text (e.g., "MOCK SIGNATURE", "SAMPLE STAMP").

---

## 2. Image & SVG Input Sanitization
- **SVG Attack Vectors:** SVG files can carry malicious scripts (`<script>`), event handlers (`onload`, `onerror`), and external entity injections (`xlink:href="http://..."`).
- **Sanitization Policy:** When accepting SVG signatures or vector stamps:
  - Sanitize the SVG content using a strict whitelist policy that strips all script elements, event attributes, and external network links.
  - Alternatively, rasterize SVGs locally to transparent PNG bitmaps before rendering on the Konva canvas or embedding in the PDF.
- **Image Bomb & Format Verification:** Validate image headers (PNG, JPEG, WebP) and verify image dimensions before decoding to avoid memory exhaustion attacks ("decompression bombs").

---

## 3. Safe Word Conversion via LibreOffice Headless
- **Process Isolation:** Invoke `soffice.exe` using native process spawning with arguments:
  ```text
  soffice.exe --headless --norestore --writer --convert-to pdf --outdir [temp_dir] [input_file]
  ```
- **Macro Execution Prevention:** Macros must never be executed during conversion. Reject macro-enabled Word documents (`.docm`) by default.
- **Execution Timeout:** Enforce a hard process timeout of 30 seconds. If the conversion process does not terminate within the window, immediately terminate the child process to prevent hanging.
- **Temporary Output Directory:** Always execute conversions within a dedicated, isolated temporary subfolder (`%TEMP%/ClubSignTool_Conversion_[UUID]/`) and purge the folder immediately after the generated PDF is verified.

---

## 4. Proprietary IP & Licensing Compliance
- **Proprietary Source Code:** This repository is private, proprietary intellectual property.
- **No Unauthorized Re-licensing:** Never change license headers, delete copyright notices, or alter `LICENSE` to permissive or copyleft open-source licenses (MIT, Apache, BSD, GPL).
- **Prohibition of Copyleft Dependencies:** Strictly forbid adding dependencies with copyleft licenses (GPL v2/v3, AGPL, LGPL static link) that could force the disclosure of proprietary source code. Always verify that third-party crates and npm packages use permissive licenses (MIT, Apache-2.0, ISC, BSD-3-Clause).
- **No Public Registry Publishing:** Never execute `npm publish`, `cargo publish`, or push artifacts to public cloud registries.
