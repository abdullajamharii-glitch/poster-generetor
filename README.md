# Travel Poster Generator (Phase 1)

A Canva-style editor for building reusable travel poster templates and generating
on-brand posters from `{{placeholders}}` — built with Next.js 15, React 19,
TypeScript, Tailwind, Konva.js and Zustand.

This is the **Phase 1** build: the template editor, the poster generation form
(with CSV bulk export), and export to PNG/JPG/PDF/HD/4K. Data is currently stored
in the browser's `localStorage` (templates, assets, generated posters) so you can
try the whole workflow with zero setup. Supabase (auth + Postgres + Storage) is the
natural next step — see "Phase 2" below.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 → **Open Dashboard** → **New Template**.

## Deploy

This is a standard Next.js 15 app — deploy it to Vercel:

```bash
npm i -g vercel
vercel
```

or connect the folder as a Git repo and import it at vercel.com/new. No environment
variables are required for Phase 1.

## How it works

1. **Dashboard** (`/dashboard`) — My Templates, Assets, Generated Posters, Settings.
2. **Template Builder** (`/editor/[id]`) — upload a poster as the background, then
   add editable **Text** and **Image** elements from the left sidebar. Use
   `{{route}}`, `{{date1}}`, `{{price1}}`, `{{company_logo}}` etc. as placeholder
   tokens inside text content or as an image's placeholder key. Drag, resize
   (corner handles), rotate, duplicate (Ctrl/Cmd+D), delete (Backspace), lock,
   hide and reorder layers from the **Layers** tab. Undo/redo with Ctrl/Cmd+Z / Y.
3. **Poster Generator** (`/generate/[id]`) — auto-detects every placeholder used in
   the template and renders a form. Fill it in, watch the live preview update, then
   export PNG / JPG / PDF / HD (2x) / 4K (4x). Or upload a CSV (headers matching
   placeholder names; image cells hold public image URLs) to bulk-generate a ZIP
   of posters in one click.

## Project structure

```
app/                     Routes (dashboard, editor, generate, landing)
components/editor/       Canvas (Konva), toolbar, sidebars, properties panel
components/generate/     Poster generation form + live preview
components/ui/           Small shared UI primitives
lib/types.ts             Template/element types + placeholder engine
lib/storage.ts           localStorage persistence (swap for Supabase in Phase 2)
lib/export.ts            PNG/JPG/PDF export via Konva + jsPDF
lib/csv.ts               Minimal CSV parser for bulk generation
store/useEditorStore.ts  Zustand store: elements, selection, history (undo/redo)
```

## Phase 2 roadmap (not yet implemented)

- **Supabase Auth** — replace the local-only dashboard with real sign-in/sign-up
  and per-user template ownership (RLS policies keyed on `auth.uid()`).
- **Supabase Postgres** — move `templates`, `assets`, and `generated_posters` out
  of `localStorage` into tables, with a `template_versions` table for versioning.
- **Supabase Storage** — store uploaded backgrounds/logos/photos as Storage
  objects instead of base64 data URLs (which bloat localStorage and page weight).
- **Bulk generation upgrade** — direct per-row image uploads (not just URLs),
  progress UI, and background job processing for large CSVs.
- **AI-assisted features** — auto-suggest placeholder regions from an uploaded
  poster (OCR + layout detection), AI copywriting for taglines, and
  background/logo generation (this could plug into the Bloom MCP connector).
- **Real-time collaboration** and **template sharing/marketplace**.

## Notes on the tech choices

- **Konva.js / react-konva** for the canvas (transform handles, cropping, text
  layout) rather than Fabric.js — slightly better React bindings and TypeScript
  support in 2026, easy drop-in swap if you prefer Fabric.
- **Zustand** holds the live editor state plus a simple snapshot-based undo/redo
  history (last 60 steps).
- Export always re-renders the Konva stage at the template's true resolution
  (ignoring the current on-screen zoom) before rasterizing, so HD/4K exports are
  always crisp.
