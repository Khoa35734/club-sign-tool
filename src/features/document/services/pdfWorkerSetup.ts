/**
 * PDF.js Global Worker Configuration
 * Ensures PDF.js resolves local worker bundle safely in browser/WebView2 environments.
 * Reference: docs/SRS.md FR-PDF-001 & .agents/rules/security-privacy.md Section 1
 */

import * as pdfjsLib from 'pdfjs-dist';

let workerConfigured = false;

export function ensurePdfWorkerConfigured(): void {
  if (workerConfigured) {
    return;
  }

  if (typeof window !== 'undefined' && 'Worker' in window) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      workerConfigured = true;
    } catch {
      // Graceful fallback: PDF.js will run in fake worker mode in the main thread
    }
  }
}

// Auto-run on module evaluation
ensurePdfWorkerConfigured();
