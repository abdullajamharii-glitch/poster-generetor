"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  LayoutGrid,
  FolderOpen,
  Images,
  Settings as SettingsIcon,
  Trash2,
  Pencil,
  Sparkles,
  Copy,
  Plane,
  LayoutTemplate,
} from "lucide-react";
import clsx from "clsx";
import { templateStore, posterStore, assetStore, fileToDataUrl, AssetItem } from "@/lib/storage";
import { PosterTemplate, GeneratedPoster } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { nanoid } from "nanoid";

type Tab = "templates" | "assets" | "generated" | "settings";

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("templates");
  const [templates, setTemplates] = useState<PosterTemplate[]>([]);
  const [posters, setPosters] = useState<GeneratedPoster[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const router = useRouter();

  // New Template Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("Flight");
  const [newTemplateFile, setNewTemplateFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const refresh = () => {
    setTemplates(templateStore.all());
    setPosters(posterStore.all());
    setAssets(assetStore.all());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!validTypes.includes(f.type)) {
        showToast("Invalid file type. Please upload PNG, JPG, JPEG, or WEBP.", "error");
        return;
      }

      setNewTemplateFile(f);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(f);
    }
  };

  const createTemplateFromAsset = (asset: AssetItem) => {
    const now = Date.now();
    const newTpl: PosterTemplate = {
      id: nanoid(10),
      name: asset.name.replace(/\.[^.]+$/, "") || "New Template",
      category: "Custom",
      width: 1080,
      height: 1528,
      background: asset.src,
      backgroundColor: "#ffffff",
      elements: [],
      createdAt: now,
      updatedAt: now,
    };
    templateStore.save(newTpl);
    showToast("Template created from asset!", "success");
    router.push(`/editor/${newTpl.id}`);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      showToast("Template name is required.", "error");
      return;
    }

    setCreating(true);

    try {
      const now = Date.now();
      let width = 1080;
      let height = 1350; // default for blank canvas (1080x1350 px)
      let background: string | null = null;

      if (newTemplateFile && imagePreview) {
        background = imagePreview;
        // Load image to get actual dimensions
        const img = new Image();
        img.src = imagePreview;
        await new Promise((resolve) => {
          img.onload = () => {
            width = img.naturalWidth || 1080;
            height = img.naturalHeight || 1528;
            resolve(null);
          };
          img.onerror = () => {
            resolve(null);
          };
        });
      }

      const newTpl: PosterTemplate = {
        id: nanoid(10),
        name: newTemplateName.trim(),
        category: newTemplateCategory,
        width,
        height,
        background,
        backgroundColor: "#ffffff",
        elements: [],
        createdAt: now,
        updatedAt: now,
      };

      templateStore.save(newTpl);
      
      showToast("Template created successfully!", "success");

      // Reset state and close modal
      setNewTemplateName("");
      setNewTemplateCategory("Flight");
      setNewTemplateFile(null);
      setImagePreview(null);
      setIsModalOpen(false);

      // Simulate a small delay for premium UX upload animation
      await new Promise((resolve) => setTimeout(resolve, 800));

      router.push(`/editor/${newTpl.id}`);
    } catch (err) {
      console.error("Failed to create template:", err);
      showToast("Failed to create template. Please try again.", "error");
    } finally {
      setCreating(false);
    }
  };

  const duplicateTemplate = (t: PosterTemplate) => {
    const clone: PosterTemplate = {
      ...t,
      id: nanoid(10),
      name: `${t.name} (copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    templateStore.save(clone);
    showToast("Template duplicated!", "success");
    refresh();
  };

  const deleteTemplate = (id: string) => {
    templateStore.remove(id);
    showToast("Template deleted", "success");
    refresh();
  };

  const uploadAsset = async (file: File) => {
    const src = await fileToDataUrl(file);
    assetStore.save({ id: nanoid(10), name: file.name, category: "other", src, createdAt: Date.now() });
    showToast("Asset uploaded successfully!", "success");
    refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <div className="h-8 w-8 rounded-lg bg-brand-500 text-white flex items-center justify-center">
            <Plane size={16} />
          </div>
          Travel Poster Generator
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={14} /> New Template
        </Button>
      </header>

      <div className="max-w-6xl mx-auto flex gap-6 p-6">
        <nav className="w-52 shrink-0 space-y-1">
          {[
            { id: "templates" as Tab, label: "My Templates", icon: LayoutGrid },
            { id: "assets" as Tab, label: "Assets", icon: FolderOpen },
            { id: "generated" as Tab, label: "Generated Posters", icon: Images },
            { id: "settings" as Tab, label: "Settings", icon: SettingsIcon },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                tab === t.id ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </nav>

        <main className="flex-1 min-w-0">
          {tab === "templates" && (
            <div>
              <h1 className="text-lg font-semibold mb-4">My Templates</h1>
              {templates.length === 0 && (
                <EmptyState
                  title="No templates yet"
                  description="Upload a poster design (like a flight-deal flyer) and turn it into a reusable template with editable text and images."
                  action={
                    <Button size="sm" onClick={() => setIsModalOpen(true)}>
                      <Plus size={14} /> Create your first template
                    </Button>
                  }
                />
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden group"
                  >
                    <Link href={`/editor/${t.id}`}>
                      <div className="aspect-[3/4] bg-gray-50 checker-bg flex items-center justify-center">
                        {t.background ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.background} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-gray-300">No background</span>
                        )}
                      </div>
                    </Link>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-700 truncate">{t.name}</p>
                      <p className="text-[11px] text-gray-400">
                        Updated {new Date(t.updatedAt).toLocaleDateString()}
                      </p>
                      <div className="flex gap-1 mt-2">
                        <Link href={`/editor/${t.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Pencil size={13} /> Edit
                          </Button>
                        </Link>
                        <Link href={`/generate/${t.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Sparkles size={13} /> Generate
                          </Button>
                        </Link>
                      </div>
                      <div className="flex gap-1 mt-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => duplicateTemplate(t)}
                        >
                          <Copy size={13} /> Duplicate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-red-500"
                          onClick={() => deleteTemplate(t.id)}
                        >
                          <Trash2 size={13} /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "assets" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold">Assets</h1>
                <label className="text-sm px-3 py-2 rounded-lg bg-brand-500 text-white cursor-pointer hover:bg-brand-600">
                  Upload asset
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadAsset(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {assets.length === 0 && (
                <EmptyState
                  title="No assets yet"
                  description="Store reusable logos, flight images, icons and backgrounds here so you can drop them into any template."
                />
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {assets.map((a) => (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden group">
                    <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.src} alt={a.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <button
                          onClick={() => createTemplateFromAsset(a)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-800 rounded-lg text-xs font-semibold hover:bg-brand-50 hover:text-brand-700 transition-colors"
                        >
                          <LayoutTemplate size={13} /> Use as Template
                        </button>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-gray-600 truncate font-medium">{a.name}</p>
                      <button
                        className="w-full text-[11px] text-red-400 py-1 mt-1 hover:bg-red-50 rounded"
                        onClick={() => {
                          assetStore.remove(a.id);
                          refresh();
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "generated" && (
            <div>
              <h1 className="text-lg font-semibold mb-4">Generated Posters</h1>
              {posters.length === 0 && (
                <EmptyState
                  title="Nothing generated yet"
                  description="Posters you export from a template will show up here for quick re-download."
                />
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {posters.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="aspect-[3/4] checker-bg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.dataUrl} alt={p.templateName} className="w-full h-full object-contain" />
                    </div>
                    <div className="p-2 space-y-1">
                      <p className="text-xs font-medium truncate">{p.templateName}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(p.createdAt).toLocaleString()}
                      </p>
                      <a href={p.dataUrl} download={`${p.templateName}.png`}>
                        <Button size="sm" variant="outline" className="w-full">
                          Download
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="max-w-md space-y-4">
              <h1 className="text-lg font-semibold">Settings</h1>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <p className="text-sm text-gray-600">
                  This preview build stores templates, assets and generated posters locally in
                  your browser (no account needed yet).
                </p>
                <p className="text-sm text-gray-600">
                  The production version connects this same UI to Supabase for authentication,
                  a Postgres database, and Storage buckets for uploaded images — so templates sync
                  across devices and can be shared with a team.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm("Clear all local templates, assets and generated posters?")) {
                      localStorage.clear();
                      refresh();
                    }
                  }}
                >
                  Clear local data
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={clsx(
          "fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0",
          toast.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"
        )}>
          <div className={clsx(
            "h-2 w-2 rounded-full",
            toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
          )} />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* New Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-md shadow-2xl overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Create New Template</h2>
              <p className="text-xs text-gray-400 mt-1">Design a reusable layout for flight, hotel, or custom promos.</p>
            </div>
            
            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Template Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flight Deals Deal-of-the-Week"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Category</label>
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 outline-none bg-white transition-colors cursor-pointer"
                >
                  <option value="Flight">Flight</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Visa">Visa</option>
                  <option value="Tour Package">Tour Package</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Upload Background Poster (Optional)</label>
                <p className="text-[11px] text-gray-400 mb-2">Leave blank to start with a standard 1080 x 1350 px canvas.</p>
                
                <label className="group relative flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50/20 cursor-pointer transition-all">
                  {imagePreview ? (
                    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs text-white font-medium bg-black/60 px-3 py-1.5 rounded-lg">Change Image</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                        <Plus size={20} />
                      </div>
                      <span className="text-xs font-semibold text-gray-600">Select poster file</span>
                      <span className="text-[10px] text-gray-400">PNG, JPG, JPEG, or WEBP</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={creating}
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewTemplateName("");
                    setNewTemplateCategory("Flight");
                    setNewTemplateFile(null);
                    setImagePreview(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center mb-6">
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
