---
trigger: model_decision
description: "Rules for PDF viewing, interactive canvas (Konva/PDF.js), signature/stamp placement, normalized coordinates, zoom/DPI invariance, undo/redo history, and atomic PDF export."
---

# PDF Viewer & Canvas Editor Engineering

## 1. Normalized Coordinate System (Non-Negotiable)
- **Zero Raw Pixel Storage:** Never persist canvas object positions (`x`, `y`, `width`, `height`) as screen, client, or viewport pixels.
- **Normalized Space (`0.0` to `1.0`):** Coordinates must always be stored relative to the unscaled, canonical dimensions of the specific PDF page:
  ```ts
  normalizedX = screenX / renderedPageWidth;
  normalizedY = screenY / renderedPageHeight;
  normalizedWidth = screenWidth / renderedPageWidth;
  normalizedHeight = screenHeight / renderedPageHeight;
  ```
- **Rendering to Screen:**
  ```ts
  screenX = normalizedX * currentViewportWidth;
  screenY = normalizedY * currentViewportHeight;
  screenWidth = normalizedWidth * currentViewportWidth;
  screenHeight = normalizedHeight * currentViewportHeight;
  ```
- **Invariance Guarantee:** Placed signatures, stamps, and text boxes must remain locked to the exact physical point on the document across:
  - Arbitrary zoom factors (e.g., 25%, 75%, 100%, 150%, 300%).
  - Window resizing and sidebar collapsing.
  - Variable display scaling (Windows High-DPI 125%, 150%, 200%).
  - Multi-monitor setups with different resolutions.

---

## 2. Placed Object Data Model
All canvas elements must adhere to a typed interface in `src/types/editor.ts`:
```ts
export type EditorObjectType = "signature" | "stamp" | "text" | "date";

export interface EditorObject {
  id: string;
  type: EditorObjectType;
  pageIndex: number; // 0-based index

  // Normalized bounding box [0.0 - 1.0]
  x: number;
  y: number;
  width: number;
  height: number;

  rotation: number; // Degrees [0, 360)
  opacity: number;  // [0.0 - 1.0], default 1.0 for signature, 0.85-0.90 for stamps
  zIndex: number;

  // Type-specific payloads
  assetId?: string;         // Referenced image asset in local library
  textPayload?: string;     // Text content for text/date types
  fontFamily?: string;      // Standard font (e.g., "Times New Roman", "Arial")
  fontSizeNormalized?: number; // Font size normalized to page height
  color?: string;           // Hex color (e.g., "#000000", "#d32f2f")
}
```

---

## 3. Administrative Stamping Conventions
- **Stamp Over Signature Rule:** In Vietnamese administrative formatting (Nghị định 30/2020/NĐ-CP), an official seal/stamp is placed overlapping approximately **1/3 of the signature on the left-hand side**.
- **Transparency & Blending:** Stamps must support an opacity slider (default range: `0.85`–`0.90`) and proper layer blending so that signature strokes beneath the stamp remain clearly legible in both screen preview and exported PDF.

---

## 4. Canvas & Rendering Performance
- **Layer Separation:**
  1. *Underlying Layer:* HTML5 Canvas rendered by PDF.js with text rendering disabled if not in text-selection mode.
  2. *Overlay Layer:* Konva.js Stage containing shapes, transformer anchors, and drag handles.
- **Lazy Page Rendering:**
  - Never render all pages at once for large documents (e.g., 50–200 pages).
  - Use an intersection observer / virtualized list to render only pages currently visible in the viewport plus a 1-page prefetch margin.
  - Evict off-screen page canvas raster data from memory to maintain low RAM consumption.
- **Dedicated Thumbnail Pipeline:** Render thumbnail sidebar previews at a fixed low resolution (`scale: 0.25`) and cache them.

---

## 5. Atomic PDF Export Pipeline
The original file is sacred and must remain 100% untouched. Exporting follows an atomic sequence:

```text
1. Original PDF (read-only)
         ↓
2. Calculate Native PDF Points:
   pdfX = normalizedX * pdfPageWidth
   pdfY = (1.0 - normalizedY - normalizedHeight) * pdfPageHeight  (Bottom-Left Origin)
         ↓
3. Write to temporary file: [temp_dir]/.clbsign_tmp_[uuid].pdf
         ↓
4. Burn signatures/stamps via PDF engine (pdf-lib / Rust native)
         ↓
5. Verify integrity of temp output (file size > 0, valid PDF header/trailer)
         ↓
6. Atomically move/rename to target path (e.g. document_SIGNED.pdf)
         ↓
7. If any step fails: purge temp file immediately, leaving original file intact
```

---

## 6. Undo / Redo Command History
- **Command Coverage:** Every user action that alters the document state must be registered in the undo stack:
  - Add object
  - Delete object
  - Move / Drag
  - Resize / Transform
  - Rotate
  - Change opacity
  - Edit text / date
  - Change z-index (bring forward / send backward)
  - Duplicate across pages
- **State Integrity:** Executing a new user action must immediately truncate the redo stack. Keep the history stack bounded (e.g., max 50 actions) to prevent memory ballooning.
