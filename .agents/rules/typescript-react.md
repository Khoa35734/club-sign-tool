---
trigger: glob
globs: "*.ts, *.tsx, src/**/*.ts, src/**/*.tsx"
description: "Strict TypeScript and React 19 standards, state management, hook patterns, and component sizing."
---

# TypeScript & React Standards

## 1. Strict TypeScript Discipline
- **Zero `any` Policy:** Do not use `any`. Use `unknown` with custom type guards, type predicates (`is CustomType`), or explicit TypeScript generics.
- **Discriminated Unions:** Model polymorphic data (such as canvas objects, file states, and dialogs) with discriminated unions and a constant `type` or `kind` field.
- **Explicit Boundary Types:** All exported functions, custom hooks, and service methods must have explicit return types.
- **No Compiler Suppression:** Strictly forbid `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck` unless interfacing with an untyped third-party legacy script where no typedefs exist (must be documented with an explanatory comment).
- **Domain Modeling:** Keep domain models in `src/types/`. Do not define ad-hoc interfaces inside components if they are shared across features.

---

## 2. Functional React Components & Component Sizing
- **Pure Functional Components:** Use functional components with typed props interfaces (`interface ComponentProps { ... }`).
- **Component Size Limit:** Keep components focused and readable. If a component exceeds **150–200 lines**, break it down:
  - Extract sub-views into dedicated child components in a `components/` subfolder.
  - Extract complex event handlers and state calculations into custom hooks (`use*.ts`).
- **No Inline Business Logic:** Keep mathematical calculations (e.g., coordinate conversions, DPI adjustments) in pure utility functions under `src/utils/` and test them with unit tests.

---

## 3. React Hooks Discipline
- **Rules of Hooks:** Never call hooks conditionally or inside loops.
- **Avoid Unnecessary `useEffect`:**
  - **Derived State:** Never synchronize state using `useEffect` (e.g., `useEffect(() => setFiltered(list.filter(...)), [list])`). Calculate derived state directly in the render function or memoize with `useMemo`.
  - **User Events:** Never trigger state transitions inside `useEffect` in response to user actions; execute logic directly inside event handlers (`onClick`, `onDrop`, `onKeyDown`).
  - **Proper Use:** Reserve `useEffect` strictly for synchronization with external imperative APIs (PDF.js render pipeline, Konva stage resize listeners, window keyboard shortcuts). Always provide clean-up functions to prevent memory leaks.
- **Custom Hooks:** Encapsulate reusable logic (e.g., `usePdfRenderer`, `useCanvasTransform`, `useKeyboardShortcuts`) into standalone, testable hooks.

---

## 4. State Architecture & Immutability
- **Zustand for Global Domain State:**
  - `useDocumentStore`: Open file path, document type, total pages, page dimensions, loading state.
  - `useEditorStore`: Active page index, placed objects array, selected object ID, zoom level, history (undo/redo stacks).
  - `useSettingsStore`: LibreOffice binary path, default stamp opacity, recent export directory.
- **Local State for Ephemeral UI:** Use `useState` or `useReducer` for modal dialog visibility, popover toggles, and transient drag coordinates.
- **Strict Immutability:** Never mutate Zustand store state or React state objects directly:
  ```ts
  // FORBIDDEN:
  state.objects[index].x = newX;

  // REQUIRED:
  set((state) => ({
    objects: state.objects.map((obj) => (obj.id === id ? { ...obj, x: newX } : obj)),
  }));
  ```
- **Derived State Normalization:** Do not store redundant data in stores. Store `selectedId: string | null`, and derive `selectedObject = objects.find(o => o.id === selectedId)`.

---

## 5. Error Handling & User Feedback
- **No Empty Catch Blocks:** Never write `try { ... } catch {}`. At minimum, log meaningful context via internal logging service and present a friendly notification.
- **User-Facing Errors:** UI notifications must be concise, helpful, and free of technical stack traces (e.g., "Cannot convert Word document. Please ensure LibreOffice is installed" instead of "Process terminated with exit code 0xC0000005 at 0x7FFF...").
- **Error Boundaries:** Wrap top-level feature panels (PDF Canvas, Asset Manager, Word Converter) in React Error Boundaries to prevent single-component failures from crashing the entire app.
