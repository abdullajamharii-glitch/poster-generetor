import { PosterTemplate, GeneratedPoster } from "./types";

const TEMPLATES_KEY = "tpg_templates_v1";
const POSTERS_KEY = "tpg_generated_posters_v1";
const ASSETS_KEY = "tpg_assets_v1";

export interface AssetItem {
  id: string;
  name: string;
  category: "logo" | "flight" | "icon" | "background" | "other";
  src: string;
  createdAt: number;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const templateStore = {
  all(): PosterTemplate[] {
    return read<PosterTemplate[]>(TEMPLATES_KEY, []).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
  },
  get(id: string): PosterTemplate | undefined {
    return this.all().find((t) => t.id === id);
  },
  save(template: PosterTemplate) {
    const list = this.all();
    const idx = list.findIndex((t) => t.id === template.id);
    if (idx >= 0) list[idx] = template;
    else list.push(template);
    write(TEMPLATES_KEY, list);
  },
  remove(id: string) {
    write(
      TEMPLATES_KEY,
      this.all().filter((t) => t.id !== id)
    );
  },
};

export const posterStore = {
  all(): GeneratedPoster[] {
    return read<GeneratedPoster[]>(POSTERS_KEY, []).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  },
  save(poster: GeneratedPoster) {
    const list = this.all();
    list.unshift(poster);
    write(POSTERS_KEY, list.slice(0, 200));
  },
  remove(id: string) {
    write(
      POSTERS_KEY,
      this.all().filter((p) => p.id !== id)
    );
  },
};

export const assetStore = {
  all(): AssetItem[] {
    return read<AssetItem[]>(ASSETS_KEY, []).sort((a, b) => b.createdAt - a.createdAt);
  },
  save(asset: AssetItem) {
    const list = this.all();
    list.unshift(asset);
    write(ASSETS_KEY, list);
  },
  remove(id: string) {
    write(
      ASSETS_KEY,
      this.all().filter((a) => a.id !== id)
    );
  },
};

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
