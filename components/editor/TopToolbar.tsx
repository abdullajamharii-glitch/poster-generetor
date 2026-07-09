"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Undo2,
  Redo2,
  Save,
  Download,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  Sparkles,
  Crosshair,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { IconButton, Button } from "@/components/ui/Button";
import { exportStageAsImage, exportStageAsPDF } from "@/lib/export";

export default function TopToolbar() {
  const {
    template,
    setName,
    save,
    dirty,
    zoom,
    setZoom,
    undo,
    redo,
    historyIndex,
    history,
    mappingMode,
    setMappingMode,
  } = useEditorStore();
  const [exportOpen, setExportOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const doSave = () => {
    save();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };

  const handleExport = async (format: "png" | "jpg" | "pdf", quality: 1 | 2 | 4) => {
    if (format === "pdf") {
      await exportStageAsPDF(template.width, template.height, template.name, quality);
    } else {
      await exportStageAsImage(template.width, template.height, template.name, format, quality);
    }
    setExportOpen(false);
  };

  return (
    <div className="h-14 shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-3 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Link href="/dashboard">
          <IconButton title="Back to dashboard">
            <ArrowLeft size={17} />
          </IconButton>
        </Link>
        <input
          value={template.name}
          onChange={(e) => setName(e.target.value)}
          className="text-sm font-semibold bg-transparent outline-none border border-transparent hover:border-gray-200 focus:border-brand-300 rounded-md px-2 py-1 min-w-[140px] max-w-[260px]"
        />
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full ${
            dirty
              ? "bg-amber-50 text-amber-600"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <IconButton onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)">
          <Undo2 size={16} />
        </IconButton>
        <IconButton
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={16} />
        </IconButton>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <IconButton onClick={() => setZoom(zoom - 0.1)} title="Zoom out">
          <ZoomOut size={16} />
        </IconButton>
        <span className="text-xs w-11 text-center text-gray-500">
          {Math.round(zoom * 100)}%
        </span>
        <IconButton onClick={() => setZoom(zoom + 0.1)} title="Zoom in">
          <ZoomIn size={16} />
        </IconButton>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <button
          onClick={() => setMappingMode(!mappingMode)}
          title="Toggle Mapping Mode — draw regions to define placeholders"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            mappingMode
              ? "bg-brand-500 text-white border-brand-500 shadow-sm"
              : "bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-600"
          }`}
        >
          <Crosshair size={14} />
          {mappingMode ? "Exit Mapping" : "Map Regions"}
        </button>
      </div>

      <div className="flex items-center gap-2 relative">
        <Link href={`/generate/${template.id}`}>
          <Button variant="outline" size="sm">
            <Sparkles size={14} /> Generate Poster
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={doSave}>
          <Save size={14} /> {savedFlash ? "Saved!" : "Save"}
        </Button>
        <div>
          <Button size="sm" onClick={() => setExportOpen((v) => !v)}>
            <Download size={14} /> Export
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg w-56 p-2 z-50">
              <p className="text-[11px] text-gray-400 px-2 pt-1 pb-1.5 uppercase tracking-wide">
                Image
              </p>
              {[
                { label: "PNG · Standard", format: "png" as const, q: 1 as const },
                { label: "JPG · Standard", format: "jpg" as const, q: 1 as const },
                { label: "PNG · HD (2x)", format: "png" as const, q: 2 as const },
                { label: "PNG · 4K (4x)", format: "png" as const, q: 4 as const },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleExport(opt.format, opt.q)}
                  className="w-full text-left text-sm px-2 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  {opt.label}
                </button>
              ))}
              <p className="text-[11px] text-gray-400 px-2 pt-2 pb-1.5 uppercase tracking-wide border-t border-gray-100 mt-1">
                Document
              </p>
              <button
                onClick={() => handleExport("pdf", 2)}
                className="w-full text-left text-sm px-2 py-1.5 rounded-lg hover:bg-gray-50"
              >
                PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
