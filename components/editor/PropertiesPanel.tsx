"use client";

import React, { useRef } from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Copy,
  Trash2,
  Upload,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { IconButton, Button } from "@/components/ui/Button";
import { fileToDataUrl } from "@/lib/storage";
import { TextElementData, ImageElementData } from "@/lib/types";

const FONT_OPTIONS = [
  "Inter, sans-serif",
  "Arial, sans-serif",
  "Georgia, serif",
  "'Times New Roman', serif",
  "'Courier New', monospace",
  "Verdana, sans-serif",
  "'Trebuchet MS', sans-serif",
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-gray-400">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 focus:border-brand-400 outline-none bg-white";

export default function PropertiesPanel() {
  const { template, selectedIds, updateElement, commit, duplicateSelected, deleteSelected, align } =
    useEditorStore();
  const replaceRef = useRef<HTMLInputElement>(null);

  const selected = template.elements.filter((e) => selectedIds.includes(e.id));
  const el = selected.length === 1 ? selected[0] : undefined;

  const patch = (p: any) => el && updateElement(el.id, p);

  if (!el) {
    return (
      <div className="w-72 shrink-0 border-l border-gray-200 bg-white p-4 h-full">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Properties</h3>
        <p className="text-xs text-gray-400">
          Select an element on the canvas to edit its properties, or select multiple to align them.
        </p>
        {selectedIds.length > 1 && (
          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-medium text-gray-400">Align selection</p>
            <div className="flex gap-1">
              <IconButton onClick={() => align("left")}>
                <AlignLeft size={14} />
              </IconButton>
              <IconButton onClick={() => align("center")}>
                <AlignCenter size={14} />
              </IconButton>
              <IconButton onClick={() => align("right")}>
                <AlignRight size={14} />
              </IconButton>
              <IconButton onClick={() => align("top")}>
                <AlignStartVertical size={14} />
              </IconButton>
              <IconButton onClick={() => align("middle")}>
                <AlignCenterVertical size={14} />
              </IconButton>
              <IconButton onClick={() => align("bottom")}>
                <AlignEndVertical size={14} />
              </IconButton>
            </div>
            <Button variant="danger" size="sm" className="w-full" onClick={deleteSelected}>
              <Trash2 size={14} /> Delete selection
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-72 shrink-0 border-l border-gray-200 bg-white p-4 h-full overflow-y-auto space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          {el.type === "text" ? "Text properties" : "Image properties"}
        </h3>
        <div className="flex gap-1">
          <IconButton title="Duplicate (Ctrl+D)" onClick={duplicateSelected}>
            <Copy size={14} />
          </IconButton>
          <IconButton title="Delete" onClick={deleteSelected}>
            <Trash2 size={14} className="text-red-400" />
          </IconButton>
        </div>
      </div>

      {el.type === "text" && <TextProps el={el as TextElementData} patch={patch} commit={commit} />}
      {el.type === "image" && (
        <ImageProps
          el={el as ImageElementData}
          patch={patch}
          commit={commit}
          replaceRef={replaceRef}
        />
      )}

      <div className="pt-3 border-t border-gray-100 space-y-3">
        <p className="text-[11px] font-medium text-gray-400">Transform</p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="X">
            <input
              type="number"
              className={inputCls}
              value={Math.round(el.x)}
              onChange={(e) => patch({ x: Number(e.target.value) })}
              onBlur={commit}
            />
          </Field>
          <Field label="Y">
            <input
              type="number"
              className={inputCls}
              value={Math.round(el.y)}
              onChange={(e) => patch({ y: Number(e.target.value) })}
              onBlur={commit}
            />
          </Field>
          <Field label="Width">
            <input
              type="number"
              className={inputCls}
              value={Math.round(el.width)}
              onChange={(e) => patch({ width: Number(e.target.value) })}
              onBlur={commit}
            />
          </Field>
          <Field label="Height">
            <input
              type="number"
              className={inputCls}
              value={Math.round(el.height)}
              onChange={(e) => patch({ height: Number(e.target.value) })}
              onBlur={commit}
            />
          </Field>
          <Field label="Rotation">
            <input
              type="number"
              className={inputCls}
              value={Math.round(el.rotation)}
              onChange={(e) => patch({ rotation: Number(e.target.value) })}
              onBlur={commit}
            />
          </Field>
          <Field label="Opacity %">
            <input
              type="number"
              min={0}
              max={100}
              className={inputCls}
              value={Math.round(el.opacity * 100)}
              onChange={(e) => patch({ opacity: Number(e.target.value) / 100 })}
              onBlur={commit}
            />
          </Field>
        </div>
        <div className="flex gap-1">
          <IconButton title="Align left" onClick={() => align("left")}>
            <AlignLeft size={14} />
          </IconButton>
          <IconButton title="Align center" onClick={() => align("center")}>
            <AlignCenter size={14} />
          </IconButton>
          <IconButton title="Align right" onClick={() => align("right")}>
            <AlignRight size={14} />
          </IconButton>
          <IconButton title="Align top" onClick={() => align("top")}>
            <AlignStartVertical size={14} />
          </IconButton>
          <IconButton title="Align middle" onClick={() => align("middle")}>
            <AlignCenterVertical size={14} />
          </IconButton>
          <IconButton title="Align bottom" onClick={() => align("bottom")}>
            <AlignEndVertical size={14} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function TextProps({
  el,
  patch,
  commit,
}: {
  el: TextElementData;
  patch: (p: Partial<TextElementData>) => void;
  commit: () => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Content (use {{placeholders}})">
        <textarea
          className={inputCls + " min-h-[64px] resize-none"}
          value={el.text}
          onChange={(e) => patch({ text: e.target.value })}
          onBlur={commit}
        />
      </Field>
      <Field label="Font family">
        <select
          className={inputCls}
          value={el.fontFamily}
          onChange={(e) => {
            patch({ fontFamily: e.target.value });
            commit();
          }}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f.split(",")[0].replace(/'/g, "")}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Size">
          <input
            type="number"
            className={inputCls}
            value={el.fontSize}
            onChange={(e) => patch({ fontSize: Number(e.target.value) })}
            onBlur={commit}
          />
        </Field>
        <Field label="Letter spacing">
          <input
            type="number"
            className={inputCls}
            value={el.letterSpacing}
            onChange={(e) => patch({ letterSpacing: Number(e.target.value) })}
            onBlur={commit}
          />
        </Field>
        <Field label="Weight">
          <select
            className={inputCls}
            value={el.fontWeight}
            onChange={(e) => {
              patch({ fontWeight: e.target.value as any });
              commit();
            }}
          >
            <option value="normal">Normal</option>
            <option value="500">Medium</option>
            <option value="600">Semibold</option>
            <option value="bold">Bold</option>
          </select>
        </Field>
        <Field label="Style">
          <select
            className={inputCls}
            value={el.fontStyle}
            onChange={(e) => {
              patch({ fontStyle: e.target.value as any });
              commit();
            }}
          >
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
          </select>
        </Field>
        <Field label="Line height">
          <input
            type="number"
            step={0.1}
            className={inputCls}
            value={el.lineHeight}
            onChange={(e) => patch({ lineHeight: Number(e.target.value) })}
            onBlur={commit}
          />
        </Field>
        <Field label="Color">
          <input
            type="color"
            className="w-full h-9 rounded-lg border border-gray-200"
            value={el.fill}
            onChange={(e) => patch({ fill: e.target.value })}
            onBlur={commit}
          />
        </Field>
      </div>
      <Field label="Alignment">
        <div className="flex gap-1">
          <IconButton
            active={el.align === "left"}
            onClick={() => {
              patch({ align: "left" });
              commit();
            }}
          >
            <AlignLeft size={14} />
          </IconButton>
          <IconButton
            active={el.align === "center"}
            onClick={() => {
              patch({ align: "center" });
              commit();
            }}
          >
            <AlignCenter size={14} />
          </IconButton>
          <IconButton
            active={el.align === "right"}
            onClick={() => {
              patch({ align: "right" });
              commit();
            }}
          >
            <AlignRight size={14} />
          </IconButton>
        </div>
      </Field>
      <Field label="Text shadow">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={el.shadow.enabled}
            onChange={(e) => {
              patch({ shadow: { ...el.shadow, enabled: e.target.checked } });
              commit();
            }}
          />
          Enable shadow
        </label>
        {el.shadow.enabled && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Field label="Blur">
              <input
                type="number"
                className={inputCls}
                value={el.shadow.blur}
                onChange={(e) => patch({ shadow: { ...el.shadow, blur: Number(e.target.value) } })}
                onBlur={commit}
              />
            </Field>
            <Field label="Color">
              <input
                type="color"
                className="w-full h-9 rounded-lg border border-gray-200"
                value={el.shadow.color}
                onChange={(e) => patch({ shadow: { ...el.shadow, color: e.target.value } })}
                onBlur={commit}
              />
            </Field>
          </div>
        )}
      </Field>
    </div>
  );
}

function ImageProps({
  el,
  patch,
  commit,
  replaceRef,
}: {
  el: ImageElementData;
  patch: (p: Partial<ImageElementData>) => void;
  commit: () => void;
  replaceRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-3">
      {el.placeholderKey && (
        <div className="text-[11px] px-2 py-1.5 rounded-lg bg-brand-50 text-brand-700 font-mono">
          {"{{"}
          {el.placeholderKey}
          {"}}"}
        </div>
      )}
      <Button variant="outline" size="sm" className="w-full" onClick={() => replaceRef.current?.click()}>
        <Upload size={14} /> Replace image
      </Button>
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            const src = await fileToDataUrl(f);
            patch({ src });
            commit();
          }
          e.target.value = "";
        }}
      />
      <Field label="Fit mode">
        <select
          className={inputCls}
          value={el.fit}
          onChange={(e) => {
            patch({ fit: e.target.value as any });
            commit();
          }}
        >
          <option value="cover">Cover (crop to fill)</option>
          <option value="contain">Contain (fit inside)</option>
          <option value="fill">Fill (stretch)</option>
        </select>
      </Field>
      <Field label="Corner radius">
        <input
          type="number"
          className={inputCls}
          value={el.cornerRadius}
          onChange={(e) => patch({ cornerRadius: Number(e.target.value) })}
          onBlur={commit}
        />
      </Field>
    </div>
  );
}
