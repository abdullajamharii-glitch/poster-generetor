"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileSpreadsheet, ImagePlus } from "lucide-react";
import { PosterTemplate, applyPlaceholders, extractPlaceholders } from "@/lib/types";
import { posterStore, fileToDataUrl } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import PreviewStage from "@/components/editor/PreviewStage";
import { exportStageAsImage, exportStageAsPDF, getStageDataUrl } from "@/lib/export";
import { parseCsv } from "@/lib/csv";
import { nanoid } from "nanoid";

export default function GeneratorShell({ template }: { template: PosterTemplate }) {
  const { textKeys, imageKeys } = useMemo(() => extractPlaceholders(template), [template]);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    textKeys.forEach((k) => (init[k] = ""));
    return init;
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [bulkPreviewCount, setBulkPreviewCount] = useState<number | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const previewTemplate = useMemo(() => applyPlaceholders(template, values), [template, values]);

  const containerWidth = 480;
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
    if (format === "pdf") {
      await exportStageAsPDF(template.width, template.height, template.name, quality);
    } else {
      await exportStageAsImage(template.width, template.height, template.name, format, quality);
    }
    saveCurrentAsGenerated();
    setBusy(null);
  };

  const handleBulkCsv = async (file: File) => {
    const text = await file.text();
    const { rows } = parseCsv(text);
    if (!rows.length) return;
    setBusy("bulk");
    setBulkPreviewCount(rows.length);
    const savedValues = values;

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowValues: Record<string, string> = {};
      [...textKeys, ...imageKeys].forEach((k) => {
        rowValues[k] = row[k] ?? "";
      });
      setValues(rowValues);
      // give React + Konva + image loading time to settle before capture
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

    setValues(savedValues);
    setBulkPreviewCount(null);
    setBusy(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={14} /> Dashboard
          </Button>
        </Link>
        <h1 className="text-sm font-semibold">Generate: {template.name}</h1>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5 h-fit">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Fill in poster details</h2>
            <p className="text-xs text-gray-400">
              These map to the {"{{placeholders}}"} defined in the template's text and image
              elements.
            </p>
          </div>

          {textKeys.length === 0 && imageKeys.length === 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              This template has no {"{{placeholders}}"} yet. Add some in the editor (e.g.{" "}
              {"{{route}}"}, {"{{price1}}"}) to make it reusable.
            </p>
          )}

          <div className="space-y-3">
            {textKeys.map((k) => (
              <div key={k} className="space-y-1">
                <label className="text-xs font-medium text-gray-500 capitalize">
                  {k.replace(/_/g, " ")}
                </label>
                <input
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-brand-400 outline-none"
                  value={values[k] || ""}
                  onChange={(e) => setText(k, e.target.value)}
                  placeholder={`Enter ${k.replace(/_/g, " ")}`}
                />
              </div>
            ))}
            {imageKeys.map((k) => (
              <div key={k} className="space-y-1">
                <label className="text-xs font-medium text-gray-500 capitalize">
                  {k.replace(/_/g, " ")}
                </label>
                <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-brand-300 cursor-pointer">
                  <ImagePlus size={14} />
                  {values[k] ? "Image selected — click to change" : "Upload image"}
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

          <div className="pt-4 border-t border-gray-100 space-y-2">
            <h3 className="text-xs font-semibold text-gray-600">Export this poster</h3>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => handleExport("png", 1)}>
                <Download size={14} /> PNG
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport("jpg", 1)}>
                <Download size={14} /> JPG
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport("png", 2)}>
                <Download size={14} /> HD (2x)
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport("png", 4)}>
                <Download size={14} /> 4K
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport("pdf", 2)}>
                <Download size={14} /> PDF
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-2">
            <h3 className="text-xs font-semibold text-gray-600">Bulk generate from CSV</h3>
            <p className="text-[11px] text-gray-400">
              CSV headers should match placeholder names (
              {[...textKeys, ...imageKeys].slice(0, 4).map((k) => `{{${k}}}`).join(", ")}
              {textKeys.length + imageKeys.length > 4 ? ", ..." : ""}). For image placeholders, use
              a public image URL in the cell.
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={busy === "bulk"}
              onClick={() => csvInputRef.current?.click()}
            >
              <FileSpreadsheet size={14} />
              {busy === "bulk"
                ? `Generating ${bulkPreviewCount ?? ""}...`
                : "Upload CSV & generate ZIP"}
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

        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-gray-400 self-start">Live preview</p>
          <PreviewStage template={previewTemplate} zoom={zoom} />
        </div>
      </div>
    </div>
  );
}
