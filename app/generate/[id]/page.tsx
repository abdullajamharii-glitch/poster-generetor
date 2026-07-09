"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { templateStore } from "@/lib/storage";
import { PosterTemplate } from "@/lib/types";

const GeneratorShell = dynamic(() => import("@/components/generate/GeneratorShell"), {
  ssr: false,
});

export default function GeneratePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [template, setTemplate] = useState<PosterTemplate | null | undefined>(undefined);

  useEffect(() => {
    setTemplate(templateStore.get(params.id) ?? null);
  }, [params.id]);

  if (template === undefined) return null;
  if (template === null) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 text-sm text-gray-500">
        Template not found.
        <button
          className="text-brand-600 underline"
          onClick={() => router.push("/dashboard")}
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return <GeneratorShell template={template} />;
}
