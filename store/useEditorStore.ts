import { create } from "zustand";
import { nanoid } from "nanoid";
import {
  EditorElement,
  PosterTemplate,
  TextElementData,
  ImageElementData,
} from "@/lib/types";
import { templateStore } from "@/lib/storage";

const CANVAS_W = 1080;
const CANVAS_H = 1528; // ~ A4-ish poster ratio matching the reference image

function blankTemplate(name = "Untitled Template"): PosterTemplate {
  const now = Date.now();
  return {
    id: nanoid(10),
    name,
    width: CANVAS_W,
    height: CANVAS_H,
    background: null,
    backgroundColor: "#ffffff",
    elements: [],
    createdAt: now,
    updatedAt: now,
  };
}

interface HistoryEntry {
  elements: EditorElement[];
  background: string | null;
  backgroundColor: string;
}

interface EditorState {
  template: PosterTemplate;
  selectedIds: string[];
  zoom: number;
  history: HistoryEntry[];
  historyIndex: number;
  dirty: boolean;

  // lifecycle
  loadTemplate: (t: PosterTemplate) => void;
  newTemplate: (name?: string) => void;
  setName: (name: string) => void;
  setBackground: (src: string | null) => void;
  setBackgroundColor: (color: string) => void;
  save: () => void;

  // selection
  select: (id: string | null, additive?: boolean) => void;
  clearSelection: () => void;

  // elements
  addText: (partial?: Partial<TextElementData>) => string;
  addImage: (src: string, partial?: Partial<ImageElementData>) => string;
  updateElement: (id: string, patch: Partial<EditorElement>) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  toggleLock: (id: string) => void;
  toggleVisible: (id: string) => void;
  reorder: (id: string, direction: "front" | "back" | "forward" | "backward") => void;
  align: (mode: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;

  // zoom
  setZoom: (z: number) => void;

  // history
  commit: () => void;
  undo: () => void;
  redo: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  template: blankTemplate(),
  selectedIds: [],
  zoom: 0.5,
  history: [],
  historyIndex: -1,
  dirty: false,

  loadTemplate: (t) =>
    set({
      template: t,
      selectedIds: [],
      history: [{ elements: t.elements, background: t.background, backgroundColor: t.backgroundColor }],
      historyIndex: 0,
      dirty: false,
    }),

  newTemplate: (name) => {
    const t = blankTemplate(name);
    set({
      template: t,
      selectedIds: [],
      history: [{ elements: [], background: null, backgroundColor: "#ffffff" }],
      historyIndex: 0,
      dirty: false,
    });
  },

  setName: (name) =>
    set((s) => ({ template: { ...s.template, name }, dirty: true })),

  setBackground: (src) => {
    set((s) => ({ template: { ...s.template, background: src }, dirty: true }));
    get().commit();
  },

  setBackgroundColor: (color) => {
    set((s) => ({ template: { ...s.template, backgroundColor: color }, dirty: true }));
    get().commit();
  },

  save: () => {
    const t = { ...get().template, updatedAt: Date.now() };
    templateStore.save(t);
    set({ template: t, dirty: false });
  },

  select: (id, additive) =>
    set((s) => {
      if (!id) return { selectedIds: [] };
      if (additive) {
        return s.selectedIds.includes(id)
          ? { selectedIds: s.selectedIds.filter((x) => x !== id) }
          : { selectedIds: [...s.selectedIds, id] };
      }
      return { selectedIds: [id] };
    }),

  clearSelection: () => set({ selectedIds: [] }),

  addText: (partial) => {
    const id = nanoid(8);
    const base: TextElementData = {
      id,
      type: "text",
      name: partial?.name || "Text",
      x: 100,
      y: 100,
      width: 400,
      height: 60,
      rotation: 0,
      zIndex: get().template.elements.length,
      locked: false,
      visible: true,
      opacity: 1,
      text: "Edit this text",
      fontFamily: "Inter, sans-serif",
      fontSize: 32,
      fontWeight: "bold",
      fontStyle: "normal",
      fill: "#111111",
      align: "left",
      letterSpacing: 0,
      lineHeight: 1.2,
      shadow: { enabled: false, color: "#000000", blur: 4, offsetX: 0, offsetY: 2, opacity: 0.4 },
      ...partial,
    };
    set((s) => ({
      template: { ...s.template, elements: [...s.template.elements, base] },
      selectedIds: [id],
      dirty: true,
    }));
    get().commit();
    return id;
  },

  addImage: (src, partial) => {
    const id = nanoid(8);
    const base: ImageElementData = {
      id,
      type: "image",
      name: partial?.name || "Image",
      x: 100,
      y: 100,
      width: 240,
      height: 240,
      rotation: 0,
      zIndex: get().template.elements.length,
      locked: false,
      visible: true,
      opacity: 1,
      src,
      fit: "cover",
      cornerRadius: 0,
      ...partial,
    };
    set((s) => ({
      template: { ...s.template, elements: [...s.template.elements, base] },
      selectedIds: [id],
      dirty: true,
    }));
    get().commit();
    return id;
  },

  updateElement: (id, patch) =>
    set((s) => ({
      template: {
        ...s.template,
        elements: s.template.elements.map((el) =>
          el.id === id ? ({ ...el, ...patch } as EditorElement) : el
        ),
      },
      dirty: true,
    })),

  deleteSelected: () => {
    const { selectedIds } = get();
    if (!selectedIds.length) return;
    set((s) => ({
      template: {
        ...s.template,
        elements: s.template.elements.filter((el) => !selectedIds.includes(el.id)),
      },
      selectedIds: [],
      dirty: true,
    }));
    get().commit();
  },

  duplicateSelected: () => {
    const { selectedIds, template } = get();
    if (!selectedIds.length) return;
    const newIds: string[] = [];
    const clones = template.elements
      .filter((el) => selectedIds.includes(el.id))
      .map((el) => {
        const id = nanoid(8);
        newIds.push(id);
        return { ...el, id, x: el.x + 24, y: el.y + 24, zIndex: template.elements.length };
      });
    set((s) => ({
      template: { ...s.template, elements: [...s.template.elements, ...clones] },
      selectedIds: newIds,
      dirty: true,
    }));
    get().commit();
  },

  toggleLock: (id) =>
    set((s) => ({
      template: {
        ...s.template,
        elements: s.template.elements.map((el) =>
          el.id === id ? { ...el, locked: !el.locked } : el
        ),
      },
    })),

  toggleVisible: (id) =>
    set((s) => ({
      template: {
        ...s.template,
        elements: s.template.elements.map((el) =>
          el.id === id ? { ...el, visible: !el.visible } : el
        ),
      },
    })),

  reorder: (id, direction) => {
    set((s) => {
      const elements = [...s.template.elements].sort((a, b) => a.zIndex - b.zIndex);
      const idx = elements.findIndex((e) => e.id === id);
      if (idx < 0) return {};
      const [el] = elements.splice(idx, 1);
      if (direction === "front") elements.push(el);
      else if (direction === "back") elements.unshift(el);
      else if (direction === "forward")
        elements.splice(Math.min(idx + 1, elements.length), 0, el);
      else if (direction === "backward")
        elements.splice(Math.max(idx - 1, 0), 0, el);
      const reindexed = elements.map((e, i) => ({ ...e, zIndex: i }));
      return { template: { ...s.template, elements: reindexed }, dirty: true };
    });
    get().commit();
  },

  align: (mode) => {
    const { selectedIds, template } = get();
    if (!selectedIds.length) return;
    set((s) => ({
      template: {
        ...s.template,
        elements: s.template.elements.map((el) => {
          if (!selectedIds.includes(el.id)) return el;
          switch (mode) {
            case "left":
              return { ...el, x: 0 };
            case "right":
              return { ...el, x: template.width - el.width };
            case "center":
              return { ...el, x: (template.width - el.width) / 2 };
            case "top":
              return { ...el, y: 0 };
            case "bottom":
              return { ...el, y: template.height - el.height };
            case "middle":
              return { ...el, y: (template.height - el.height) / 2 };
            default:
              return el;
          }
        }),
      },
      dirty: true,
    }));
    get().commit();
  },

  setZoom: (z) => set({ zoom: Math.min(2, Math.max(0.1, z)) }),

  commit: () => {
    const { template, history, historyIndex } = get();
    const entry: HistoryEntry = {
      elements: template.elements,
      background: template.background,
      backgroundColor: template.backgroundColor,
    };
    const trimmed = history.slice(0, historyIndex + 1);
    trimmed.push(entry);
    set({ history: trimmed.slice(-60), historyIndex: Math.min(trimmed.length - 1, 59) });
  },

  undo: () => {
    const { history, historyIndex, template } = get();
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    set({
      template: { ...template, ...prev },
      historyIndex: historyIndex - 1,
      selectedIds: [],
    });
  },

  redo: () => {
    const { history, historyIndex, template } = get();
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    set({
      template: { ...template, ...next },
      historyIndex: historyIndex + 1,
      selectedIds: [],
    });
  },
}));
