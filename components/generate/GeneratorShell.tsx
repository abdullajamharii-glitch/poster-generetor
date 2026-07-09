"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, ImagePlus, CheckCircle2, Sparkles, Settings2, ArrowLeftRight, Check, X } from "lucide-react";
import { PosterTemplate, applyPlaceholders, extractPlaceholders, TextElementData } from "@/lib/types";
import { posterStore, fileToDataUrl } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import PreviewStage from "@/components/editor/PreviewStage";
import { exportStageAsImage, exportStageAsPDF, getStageDataUrl } from "@/lib/export";
import { parseCsv } from "@/lib/csv";
import { nanoid } from "nanoid";

function humanize(key: string): string {
  return key
    .replace(/([a-z])(\d+)$/, "$1 $2") // price1 -> price 1
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function GeneratorShell({ template }: { template: PosterTemplate }) {
  const { textKeys, imageKeys } = useMemo(() => extractPlaceholders(template), [template]);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    textKeys.forEach((k) => (init[k] = ""));
    return init;
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Compute live updated template for Preview
  const previewTemplate = useMemo(
    () => applyPlaceholders(template, values),
    [template, values]
  );

  const containerWidth = 440;
  const zoom = containerWidth / template.width;

  // Find the selected element in the template (to show specific edit panel)
  const selectedEl = useMemo(() => {
    if (!selectedId) return null;
    return template.elements.find((e) => e.id === selectedId) || null;
  }, [selectedId, template.elements]);

  // Find the placeholder key for the selected element
  const selectedKey = useMemo(() => {
    if (!selectedEl) return null;
    return selectedEl.type === "image" ? selectedEl.placeholderKey : selectedEl.name;
  }, [selectedEl]);

  const setText = (key: string, v: string) => setValues((s) => ({ ...s, [key]: v }));

  const handleImageFile = async (key: string, file: File) => {
    const dataUrl = await fileToDataUrl(file);
    setValues((s) => ({ ...s, [key]: dataUrl }));
  };

  const waitFrames = (n: number) =>
    new Promise<void>((resolve) => {
      let count = 0;
      const step = () => {
        count++;
        if (count >= n) resolve();
        else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });

  const saveCurrentAsGenerated = () => {
    const dataUrl = getStageDataUrl(template.width, template.height, 2);
    if (!dataUrl) return;
    posterStore.save({
      id: nanoid(10),
      templateId: template.id,
      templateName: template.name,
      values,
      dataUrl,
      createdAt: Date.now(),
    });
  };

  const handleExport = async (format: "png" | "jpg" | "pdf", quality: 1 | 2 | 4) => {
    setBusy("export");
    setDownloaded(null);
    await waitFrames(3);
    if (format === "pdf") {
      await exportStageAsPDF(template.width, template.height, template.name, quality);
    } else {
      await exportStageAsImage(template.width, template.height, template.name, format, quality);
    }
    saveCurrentAsGenerated();
    setDownloaded(format.toUpperCase());
    setTimeout(() => setDownloaded(null), 2500);
    setBusy(null);
  };

  const handleBulkCsv = async (file: File) => {
    const text = await file.text();
    const { rows } = parseCsv(text);
    if (!rows.length) return;
    setBusy("bulk");

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowValues: Record<string, string> = {};
      [...textKeys, ...imageKeys].forEach((k) => { rowValues[k] = row[k] ?? ""; });
      setValues(rowValues);
      await waitFrames(2);
      await new Promise((r) => setTimeout(r, 500));
      const dataUrl = getStageDataUrl(template.width, template.height, 2);
      if (dataUrl) {
        const base64 = dataUrl.split(",")[1];
        zip.file(`${template.name.replace(/\s+/g, "_")}_${i + 1}.png`, base64, { base64: true });
        posterStore.save({
          id: nanoid(10),
          templateId: template.id,
          templateName: template.name,
          values: rowValues,
          dataUrl,
          createdAt: Date.now(),
        });
      }
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, "_")}_bulk.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setBusy(null);
  };

  const hasFields = textKeys.length > 0 || imageKeys.length > 0;

  // Helper to map template elements to their placeholder keys
  const templateElementsMap = useMemo(() => {
    const map: Record<string, string> = {};
    template.elements.forEach((el) => {
      const key = el.type === "image" ? el.placeholderKey : el.name;
      if (key) {
        map[key] = el.id;
      }
    });
    return map;
  }, [template.elements]);

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      {/* ── Top bar ── */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-5 gap-3 sticky top-0 z-20 shadow-sm">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={14} /> Dashboard
          </Button>
        </Link>
        <div className="w-px h-6 bg-gray-200" />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-gray-900 truncate">Update Poster: {template.name}</h1>
          {template.category && (
            <p className="text-[11px] text-gray-400">{template.category}</p>
          )}
        </div>

        {/* Admin edit shortcut */}
        <Link href={`/editor/${template.id}`}>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-brand-600">
            <Settings2 size={14} /> Edit Template
          </Button>
        </Link>

        {/* Download buttons */}
        <div className="flex items-center gap-1.5">
          {downloaded && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium animate-in fade-in">
              <CheckCircle2 size={13} /> Saved!
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={busy === "export"}
            onClick={() => handleExport("png", 1)}
          >
            <Download size={13} /> PNG
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy === "export"}
            onClick={() => handleExport("jpg", 1)}
          >
            <Download size={13} /> JPG
          </Button>
          <Button
            size="sm"
            disabled={busy === "export"}
            onClick={() => handleExport("pdf", 2)}
          >
            <Download size={13} /> {busy === "export" ? "Saving…" : "PDF"}
          </Button>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-7 p-6">

        {/* ── Left: Form panel ── */}
        <div className="w-full md:w-80 shrink-0 space-y-4">

          {/* If a field is active, show the minimal Canva-style Edit view */}
          {selectedEl && selectedKey ? (
            <div className="bg-white rounded-2xl border border-brand-200 shadow-md overflow-hidden animate-in slide-in-from-left duration-250">
              <div className="px-4 py-3 border-b border-brand-100 bg-brand-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">Active Field</p>
                  <h3 className="text-sm font-bold text-gray-800">{humanize(selectedKey)}</h3>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="h-7 w-7 rounded-full bg-white hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm"
                  title="Close focused view"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {selectedEl.type === "text" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Current Value</label>
                      <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-mono break-all mt-1 min-h-[40px]">
                        {values[selectedKey] || <span className="italic text-gray-300">Empty</span>}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Edit Text</label>
                      <textarea
                        autoFocus
                        className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all resize-none min-h-[80px]"
                        value={values[selectedKey] || ""}
                        onChange={(e) => setText(selectedKey, e.target.value)}
                        placeholder={`Enter new ${humanize(selectedKey)}…`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Current Image</label>
                      <div className="flex justify-center border border-gray-200 p-2 rounded-xl bg-gray-50/50 mt-1">
                        {values[selectedKey] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={values[selectedKey]}
                            alt={selectedKey}
                            className="h-28 object-contain rounded-lg shadow-sm"
                          />
                        ) : (
                          <div className="h-28 w-28 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 italic text-xs">
                            No replacement
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm cursor-pointer shadow-sm transition-all text-center">
                        <ImagePlus size={16} />
                        Replace Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImageFile(selectedKey, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {values[selectedKey] && (
                        <Button
                          variant="outline"
                          onClick={() => setText(selectedKey, "")}
                          className="text-red-500 border-red-200 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => setSelectedId(null)}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            /* Default State: full fields list */
            <>
              {/* No placeholders notice */}
              {!hasFields && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
                  <Sparkles className="mx-auto mb-2 text-amber-400" size={24} />
                  <p className="text-sm font-semibold text-amber-700">No mapped regions yet</p>
                  <p className="text-xs text-amber-500 mt-1 leading-relaxed">
                    Open the Template Editor, enable <strong>Map Regions</strong> mode, and draw boxes over each area of the poster you want clients to replace.
                  </p>
                  <Link href={`/editor/${template.id}?mapping=true`} className="mt-3 inline-block">
                    <Button size="sm">Open Template Editor</Button>
                  </Link>
                </div>
              )}

              {/* Text fields list */}
              {textKeys.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Text Fields</p>
                    <p className="text-[10px] text-gray-400">Click field to edit</p>
                  </div>
                  <div className="p-3 space-y-2">
                    {textKeys.map((k) => (
                      <div
                        key={k}
                        onClick={() => setSelectedId(templateElementsMap[k])}
                        className="p-2.5 rounded-xl border border-gray-100 hover:border-brand-300 hover:bg-brand-50/10 cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-600">{humanize(k)}</span>
                          <span className="text-[9px] font-bold text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded-full uppercase">Text</span>
                        </div>
                        <p className="text-xs text-gray-700 truncate font-mono">
                          {values[k] ? values[k] : <span className="italic text-gray-300">Click to fill value...</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image fields list */}
              {imageKeys.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Images & Logos</p>
                    <p className="text-[10px] text-gray-400">Click region to replace</p>
                  </div>
                  <div className="p-3 space-y-2">
                    {imageKeys.map((k) => (
                      <div
                        key={k}
                        onClick={() => setSelectedId(templateElementsMap[k])}
                        className="p-2.5 rounded-xl border border-gray-100 hover:border-brand-300 hover:bg-brand-50/10 cursor-pointer transition-all flex items-center gap-3"
                      >
                        {values[k] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={values[k]}
                            alt={k}
                            className="h-10 w-10 object-cover rounded-lg border border-gray-200 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                            <ImagePlus size={16} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-gray-600 truncate">{humanize(k)}</span>
                            <span className="text-[9px] font-bold text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded-full uppercase shrink-0">Image</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                            {values[k] ? "Custom Image Uploaded" : "Replace Image..."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bulk Generation & CSV Options */}
              {hasFields && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Bulk Generator</p>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      Bulk generate from a CSV file (headers = variable names).
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-gray-600"
                      disabled={busy === "bulk"}
                      onClick={() => csvInputRef.current?.click()}
                    >
                      {busy === "bulk" ? "Generating…" : "Upload CSV → Download ZIP"}
                    </Button>
                    <input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleBulkCsv(f);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right: Live preview ── */}
        <div className="flex-1 flex flex-col gap-3 sticky top-20 self-start">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Preview</p>
            <p className="text-[11px] text-gray-400">Hover & click regions to edit</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-center">
            <PreviewStage
              template={previewTemplate}
              zoom={zoom}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={setSelectedId}
              onHover={setHoveredId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
