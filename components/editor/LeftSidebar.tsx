"use client";

import React, { useRef, useState } from "react";
import clsx from "clsx";
import {
  Type,
  ImageIcon,
  Layers as LayersIcon,
  FolderOpen,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Upload,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { assetStore, fileToDataUrl, AssetItem } from "@/lib/storage";
import { IconButton, Button } from "@/components/ui/Button";

type Tab = "text" | "images" | "layers" | "assets";

const TEXT_PRESETS: { label: string; text: string; fontSize: number; fontWeight: "bold" | "normal" }[] = [
  { label: "Company Name", text: "{{company_name}}", fontSize: 30, fontWeight: "bold" },
  { label: "Airline Name", text: "{{airline_name}}", fontSize: 26, fontWeight: "bold" },
  { label: "Route", text: "{{route}}", fontSize: 34, fontWeight: "bold" },
  { label: "Travel Dates", text: "{{date1}}", fontSize: 24, fontWeight: "normal" },
  { label: "Price", text: "₹{{price1}}", fontSize: 28, fontWeight: "bold" },
  { label: "Baggage Info", text: "{{baggage}}", fontSize: 22, fontWeight: "normal" },
  { label: "Contact Number", text: "{{contact}}", fontSize: 22, fontWeight: "bold" },
  { label: "Website", text: "{{website}}", fontSize: 18, fontWeight: "normal" },
  { label: "Social Handle", text: "{{social}}", fontSize: 18, fontWeight: "normal" },
  { label: "Custom text", text: "Edit this text", fontSize: 24, fontWeight: "normal" },
];

const IMAGE_PRESETS: { label: string; key: string }[] = [
  { label: "Company Logo", key: "company_logo" },
  { label: "Airline Logo", key: "airline_logo" },
  { label: "Flight Image", key: "flight_image" },
  { label: "Destination Image", key: "destination_image" },
];

export default function LeftSidebar() {
  const [tab, setTab] = useState<Tab>("text");
  const {
    template,
    selectedIds,
    select,
    addText,
    addImage,
    updateElement,
    toggleLock,
    toggleVisible,
    deleteSelected,
    reorder,
    setBackground,
    commit,
  } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const pendingPlaceholder = useRef<string | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>(
    typeof window !== "undefined" ? assetStore.all() : []
  );

  const handleImageFile = async (file: File, placeholderKey?: string) => {
    const dataUrl = await fileToDataUrl(file);
    addImage(dataUrl, placeholderKey ? { name: placeholderKey, placeholderKey } : undefined);
  };

  const handleAssetUpload = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    const asset: AssetItem = {
      id: crypto.randomUUID(),
      name: file.name,
      category: "other",
      src: dataUrl,
      createdAt: Date.now(),
    };
    assetStore.save(asset);
    setAssets(assetStore.all());
  };

  const sortedForLayers = [...template.elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="w-72 shrink-0 border-r border-gray-200 bg-white flex flex-col h-full">
      <div className="grid grid-cols-4 gap-1 p-2 border-b border-gray-100">
        {[
          { id: "text" as Tab, icon: Type, label: "Text" },
          { id: "images" as Tab, icon: ImageIcon, label: "Images" },
          { id: "assets" as Tab, icon: FolderOpen, label: "Assets" },
          { id: "layers" as Tab, icon: LayersIcon, label: "Layers" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              "flex flex-col items-center gap-1 py-2 rounded-lg text-[11px] font-medium transition-colors",
              tab === t.id ? "bg-brand-50 text-brand-600" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === "text" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium px-1">Click to add to canvas</p>
            {TEXT_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() =>
                  addText({
                    name: p.label,
                    text: p.text,
                    fontSize: p.fontSize,
                    fontWeight: p.fontWeight,
                  })
                }
                className="w-full text-left px-3 py-2.5 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/40 transition-colors group"
              >
                <span className="text-sm text-gray-700 group-hover:text-brand-700 font-medium">
                  {p.label}
                </span>
                <div className="text-[11px] text-gray-400 truncate">{p.text}</div>
              </button>
            ))}
          </div>
        )}

        {tab === "images" && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 font-medium px-1 mb-2">Placeholder image slots</p>
              <div className="space-y-2">
                {IMAGE_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => {
                      pendingPlaceholder.current = p.key;
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/40 transition-colors"
                  >
                    <span className="text-sm text-gray-700">{p.label}</span>
                    <Upload size={14} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium px-1 mb-2">Background</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => bgInputRef.current?.click()}
              >
                <Upload size={14} /> Upload background poster
              </Button>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium px-1 mb-2">Or add a free image</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  pendingPlaceholder.current = null;
                  fileInputRef.current?.click();
                }}
              >
                <Plus size={14} /> Upload image
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageFile(f, pendingPlaceholder.current || undefined);
                e.target.value = "";
              }}
            />
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setBackground(await fileToDataUrl(f));
                e.target.value = "";
              }}
            />
          </div>
        )}

        {tab === "assets" && (
          <div className="space-y-3">
            <label className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-brand-300 cursor-pointer">
              <Upload size={14} /> Upload to asset library
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAssetUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              {assets.map((a) => (
                <button
                  key={a.id}
                  onClick={() => addImage(a.src, { name: a.name })}
                  className="rounded-lg overflow-hidden border border-gray-100 hover:border-brand-300 aspect-square bg-gray-50"
                  title={a.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.src} alt={a.name} className="w-full h-full object-cover" />
                </button>
              ))}
              {assets.length === 0 && (
                <p className="col-span-2 text-xs text-gray-400 text-center py-6">
                  No assets yet. Upload logos, icons or backgrounds you reuse often.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === "layers" && (
          <div className="space-y-1.5">
            {sortedForLayers.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">
                No elements yet — add text or images to get started.
              </p>
            )}
            {sortedForLayers.map((el) => (
              <div
                key={el.id}
                onClick={() => select(el.id)}
                className={clsx(
                  "flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer border",
                  selectedIds.includes(el.id)
                    ? "border-brand-300 bg-brand-50/60"
                    : "border-transparent hover:bg-gray-50"
                )}
              >
                <span className="text-[10px] uppercase font-semibold text-gray-400 w-9 shrink-0">
                  {el.type}
                </span>
                <span className="text-sm text-gray-700 truncate flex-1">
                  {el.type === "text" ? (el as any).text : el.name}
                </span>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    reorder(el.id, "forward");
                  }}
                  title="Bring forward"
                >
                  <ChevronUp size={14} />
                </IconButton>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    reorder(el.id, "backward");
                  }}
                  title="Send backward"
                >
                  <ChevronDown size={14} />
                </IconButton>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisible(el.id);
                  }}
                  title="Toggle visibility"
                >
                  {el.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </IconButton>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock(el.id);
                  }}
                  title="Toggle lock"
                >
                  {el.locked ? <Lock size={14} /> : <Unlock size={14} />}
                </IconButton>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    select(el.id);
                    deleteSelected();
                  }}
                  title="Delete"
                >
                  <Trash2 size={14} className="text-red-400" />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
