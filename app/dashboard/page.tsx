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

  const refresh = () => {
    setTemplates(templateStore.all());
    setPosters(posterStore.all());
    setAssets(assetStore.all());
  };

  useEffect(() => {
    refresh();
  }, []);

  const createTemplate = () => router.push("/editor/new");

  const duplicateTemplate = (t: PosterTemplate) => {
    const clone: PosterTemplate = {
      ...t,
      id: nanoid(10),
      name: `${t.name} (copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    templateStore.save(clone);
    refresh();
  };

  const deleteTemplate = (id: string) => {
    templateStore.remove(id);
    refresh();
  };

  const uploadAsset = async (file: File) => {
    const src = await fileToDataUrl(file);
    assetStore.save({ id: nanoid(10), name: file.name, category: "other", src, createdAt: Date.now() });
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
        <Button size="sm" onClick={createTemplate}>
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
                    <Button size="sm" onClick={createTemplate}>
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
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {assets.map((a) => (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="aspect-square bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.src} alt={a.name} className="w-full h-full object-cover" />
                    </div>
                    <button
                      className="w-full text-[11px] text-red-400 py-1.5 hover:bg-red-50"
                      onClick={() => {
                        assetStore.remove(a.id);
                        refresh();
                      }}
                    >
                      Remove
                    </button>
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
