"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, ImagePlus, CheckCircle2, Sparkles, Settings2 } from "lucide-react";
import { PosterTemplate, applyPlaceholders, extractPlaceholders } from "@/lib/types";
import { posterStore, fileToDataUrl } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import PreviewStage from "@/components/editor/PreviewStage";
import { exportStageAsImage, exportStageAsPDF, getStageDataUrl } from "@/lib/export";
import { parseCsv } from "@/lib/csv";
import { nanoid } from "nanoid";

/**
 * Convert variable_name → human-readable label
 * e.g. "company_name" → "Company Name"
 *      "date1" → "Date 1"
 *      "price2" → "Price 2"
 */
function humanize(key: string): string {
  return key
    .replace(/([a-z])(\d+)$/, "$1 $2") // price1 → price 1
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * CLIENT MODE – simple form to fill placeholder values.
 * No design tools. Only text fields and image replace buttons.
 * Live preview updates as the user types.
 */
export default function GeneratorShell({ template }: { template: PosterTemplate }) {
  const { textKeys, imageKeys } = useMemo(() => extractPlaceholders(template), [template]);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    textKeys.forEach((k) => (init[k] = ""));
    return init;
  });

  const [busy, setBusy] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const previewTemplate = useMemo(
    () => applyPlaceholders(template, values),
    [template, values]
  );

  const containerWidth = 440;
  const zoom = containerWidth / template.width;

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
          <h1 className="text-sm font-bold text-gray-900 truncate">{template.name}</h1>
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
      <div className="max-w-6xl mx-auto flex gap-7 p-6">

        {/* ── Left: Form panel ── */}
        <div className="w-80 shrink-0 space-y-4">

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

          {/* Text fields */}
          {textKeys.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Text Fields</p>
              </div>
              <div className="p-4 space-y-3">
                {textKeys.map((k) => (
                  <div key={k} className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">{humanize(k)}</label>
                    <input
                      className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all placeholder-gray-300"
                      value={values[k] || ""}
                      onChange={(e) => setText(k, e.target.value)}
                      placeholder={`Enter ${humanize(k)}…`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image fields */}
          {imageKeys.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Images & Logos</p>
              </div>
              <div className="p-4 space-y-3">
                {imageKeys.map((k) => (
                  <div key={k} className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">{humanize(k)}</label>
                    <label className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-gray-200 hover:border-brand-400 hover:bg-brand-50/30 cursor-pointer transition-all">
                      {values[k] ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={values[k]}
                            alt={k}
                            className="h-9 w-9 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700">Image selected ✓</p>
                            <p className="text-[10px] text-brand-500 group-hover:underline">Click to replace</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 group-hover:bg-brand-100 group-hover:text-brand-500 transition-colors">
                            <ImagePlus size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700">Replace {humanize(k)}</p>
                            <p className="text-[10px] text-gray-400">PNG, JPG, WEBP</p>
                          </div>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageFile(k, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export options (bottom of form) */}
          {hasFields && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Export Poster</p>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={busy === "export"}
                    onClick={() => handleExport("png", 1)}
                  >
                    <Download size={13} /> PNG
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={busy === "export"}
                    onClick={() => handleExport("jpg", 1)}
                  >
                    <Download size={13} /> JPG
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={busy === "export"}
                    onClick={() => handleExport("png", 2)}
                  >
                    <Download size={13} /> HD PNG
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={busy === "export"}
                    onClick={() => handleExport("pdf", 2)}
                  >
                    <Download size={13} /> {busy === "export" ? "Saving…" : "PDF"}
                  </Button>
                </div>

                {/* Bulk CSV */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 mb-2">
                    Bulk generate from a CSV file (headers = variable names).
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-gray-500"
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
            </div>
          )}
        </div>

        {/* ── Right: Live preview ── */}
        <div className="flex-1 flex flex-col gap-3 sticky top-20 self-start">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Preview</p>
            <p className="text-[11px] text-gray-400">Updates as you type</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-center">
            <PreviewStage template={previewTemplate} zoom={zoom} />
          </div>
        </div>
      </div>
    </div>
  );
}
