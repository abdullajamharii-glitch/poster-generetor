"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const EditorShell = dynamic(() => import("@/components/editor/EditorShell"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center text-gray-400 text-sm">
      Loading editor…
    </div>
  ),
});

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  return <EditorShell templateId={params.id} />;
}
