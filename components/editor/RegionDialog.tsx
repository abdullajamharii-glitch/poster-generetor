"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CoverConfig } from "@/lib/types";

const TEXT_PRESETS = [
  { label: "Company Name", variable: "company_name", fontSize: 28, fontWeight: "bold" as const, fill: "#ffffff" },
  { label: "Airline", variable: "airline", fontSize: 24, fontWeight: "bold" as const, fill: "#ffffff" },
  { label: "Route", variable: "route", fontSize: 32, fontWeight: "bold" as const, fill: "#ffffff" },
  { label: "Date 1", variable: "date1", fontSize: 22, fontWeight: "normal" as const, fill: "#ffffff" },
  { label: "Date 2", variable: "date2", fontSize: 22, fontWeight: "normal" as const, fill: "#ffffff" },
  { label: "Price 1", variable: "price1", fontSize: 30, fontWeight: "bold" as const, fill: "#ffffff" },
  { label: "Price 2", variable: "price2", fontSize: 24, fontWeight: "bold" as const, fill: "#ffffff" },
  { label: "Phone", variable: "contact", fontSize: 20, fontWeight: "normal" as const, fill: "#ffffff" },
  { label: "Website", variable: "website", fontSize: 18, fontWeight: "normal" as const, fill: "#ffffff" },
  { label: "Social", variable: "social", fontSize: 18, fontWeight: "normal" as const, fill: "#ffffff" },
  { label: "Custom Text", variable: "", fontSize: 24, fontWeight: "normal" as const, fill: "#ffffff" },
];

const IMAGE_PRESETS = [
  { label: "Company Logo", variable: "company_logo" },
  { label: "Airline Logo", variable: "airline_logo" },
  { label: "Flight Image", variable: "flight_image" },
  { label: "Destination Image", variable: "destination_image" },
  { label: "Background Image", variable: "background_image" },
  { label: "Custom Image", variable: "" },
];

export interface RegionConfig {
  type: "text" | "image";
  variable: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold" | "600" | "500";
  fontStyle?: "normal" | "italic";
  fill?: string;
  align?: "left" | "center" | "right";
  fontFamily?: string;
  coverConfig?: CoverConfig;
  fit?: "cover" | "contain" | "fill";
}

interface Props {
  rect: { x: number; y: number; width: number; height: number };
  bgColor: string;
  onConfirm: (cfg: RegionConfig) => void;
  onCancel: () => void;
}

const DEFAULT_COVER: CoverConfig = {
  enabled: false,
  color: "#ffffff",
  opacity: 1,
  blur: 0,
  padding: 4,
  radius: 0,
};

export default function RegionDialog({ rect, bgColor, onConfirm, onCancel }: Props) {
  const [type, setType] = useState<"text" | "image">("text");
  const [textPresetIdx, setTextPresetIdx] = useState(0);
  const [imagePresetIdx, setImagePresetIdx] = useState(0);
  const [customVariable, setCustomVariable] = useState("");
  const [fill, setFill] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(24);
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("normal");
  const [align, setAlign] = useState<"left" | "center" | "right">("left");
  const [fit, setFit] = useState<"cover" | "contain" | "fill">("contain");
  const [cover, setCover] = useState<CoverConfig>({ ...DEFAULT_COVER, color: bgColor });

  const presets = type === "text" ? TEXT_PRESETS : IMAGE_PRESETS;
  const selectedIdx = type === "text" ? textPresetIdx : imagePresetIdx;

  const handleTypeChange = (t: "text" | "image") => {
    setType(t);
  };

  const handlePresetSelect = (idx: number) => {
    if (type === "text") {
      setTextPresetIdx(idx);
      const p = TEXT_PRESETS[idx];
      setFill(p.fill);
      setFontSize(p.fontSize);
      setFontWeight(p.fontWeight === "bold" ? "bold" : "normal");
      if (p.variable) setCustomVariable("");
    } else {
      setImagePresetIdx(idx);
      if (IMAGE_PRESETS[idx].variable) setCustomVariable("");
    }
  };

  const currentPreset = presets[selectedIdx];
  const isCustom = !currentPreset?.variable;

  const getVariable = () => {
    if (!isCustom) return currentPreset.variable;
    return customVariable.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  };

  const handleConfirm = () => {
    const variable = getVariable();
    if (!variable) return;

    if (type === "text") {
      onConfirm({
        type: "text",
        variable,
        fontSize,
        fontWeight,
        fontStyle: "normal",
        fill,
        align,
        fontFamily: "Inter, sans-serif",
        coverConfig: cover,
      });
    } else {
      onConfirm({
        type: "image",
        variable,
        fit,
      });
    }
  };

  const inputCls = "w-full text-sm px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-400 outline-none bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-brand-50 to-white">
          <h2 className="text-base font-bold text-gray-900">Configure Mapped Region</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {Math.round(rect.width)} × {Math.round(rect.height)} px &nbsp;·&nbsp;
            at ({Math.round(rect.x)}, {Math.round(rect.y)})
          </p>
        </div>

        <div className="p-5 space-y-4 max-h-[76vh] overflow-y-auto">
          {/* Type toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            {(["text", "image"] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  type === t
                    ? "bg-white text-brand-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "text" ? "📝  Text Placeholder" : "🖼️  Image Placeholder"}
              </button>
            ))}
          </div>

          {/* Preset chips */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Quick Presets
            </p>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetSelect(idx)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                    selectedIdx === idx
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-600"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Variable preview / custom input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              Variable Name
            </label>
            {isCustom ? (
              <input
                className={inputCls}
                placeholder="e.g. company_name"
                value={customVariable}
                onChange={(e) => setCustomVariable(e.target.value)}
              />
            ) : (
              <div className="px-3 py-2.5 rounded-xl bg-brand-50 border border-brand-200 font-mono text-sm text-brand-700">
                {`{{${currentPreset.variable}}}`}
              </div>
            )}
          </div>

          {/* ── TEXT OPTIONS ── */}
          {type === "text" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-400">Font Size</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-400">Text Color</label>
                  <input
                    type="color"
                    className="w-full h-9 rounded-xl border border-gray-200 cursor-pointer"
                    value={fill}
                    onChange={(e) => setFill(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-400">Weight</label>
                  <select
                    className={inputCls}
                    value={fontWeight}
                    onChange={(e) => setFontWeight(e.target.value as any)}
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-400">Alignment</label>
                  <select
                    className={inputCls}
                    value={align}
                    onChange={(e) => setAlign(e.target.value as any)}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>

              {/* Cover config */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={cover.enabled}
                    onChange={(e) => setCover((c) => ({ ...c, enabled: e.target.checked }))}
                    className="w-4 h-4 rounded accent-brand-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Cover original text</p>
                    <p className="text-[11px] text-gray-400">
                      Renders a colored rectangle to hide baked-in poster text underneath
                    </p>
                  </div>
                </label>

                {cover.enabled && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-400">Cover Color</label>
                        <input
                          type="color"
                          className="w-full h-8 rounded-lg border border-gray-200 cursor-pointer"
                          value={cover.color}
                          onChange={(e) => setCover((c) => ({ ...c, color: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-400">Opacity (0–1)</label>
                        <input
                          type="number" step={0.05} min={0} max={1}
                          className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-200 outline-none"
                          value={cover.opacity}
                          onChange={(e) => setCover((c) => ({ ...c, opacity: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-400">Padding (px)</label>
                        <input
                          type="number"
                          className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-200 outline-none"
                          value={cover.padding}
                          onChange={(e) => setCover((c) => ({ ...c, padding: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-400">Corner Radius</label>
                        <input
                          type="number"
                          className="w-full text-sm px-2 py-1.5 rounded-lg border border-gray-200 outline-none"
                          value={cover.radius}
                          onChange={(e) => setCover((c) => ({ ...c, radius: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── IMAGE OPTIONS ── */}
          {type === "image" && (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                Fit Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["contain", "cover", "fill"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFit(f)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      fit === f
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-600"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400">
                {fit === "contain"
                  ? "Image fits inside the region — letterboxed if needed."
                  : fit === "cover"
                  ? "Image fills the entire region — cropped to fit."
                  : "Image is stretched to exactly fill the region."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-gray-100 bg-gray-50/50">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={isCustom && !customVariable.trim()}
            onClick={handleConfirm}
          >
            Add Region
          </Button>
        </div>
      </div>
    </div>
  );
}
