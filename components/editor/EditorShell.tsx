"use client";

import React, { useEffect, useState } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { templateStore } from "@/lib/storage";
import TopToolbar from "./TopToolbar";
import LeftSidebar from "./LeftSidebar";
import PropertiesPanel from "./PropertiesPanel";
import CanvasStage from "./CanvasStage";

export default function EditorShell({ templateId }: { templateId: string }) {
  const { loadTemplate, newTemplate } = useEditorStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (templateId === "new") {
      newTemplate("Untitled Travel Poster");
    } else {
      const existing = templateStore.get(templateId);
      if (existing) {
        loadTemplate(existing);
      } else {
        newTemplate("Untitled Travel Poster");
      }
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  if (!ready) return null;

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
      <TopToolbar />
      <div className="flex flex-1 min-h-0">
        <LeftSidebar />
        <div className="flex-1 overflow-auto flex items-center justify-center p-10">
          <CanvasStage />
        </div>
        <PropertiesPanel />
      </div>
    </div>
  );
}
