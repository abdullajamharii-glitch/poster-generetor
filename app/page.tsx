import Link from "next/link";
import { Plane, LayoutTemplate, Sparkles, FileSpreadsheet } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <div className="h-8 w-8 rounded-lg bg-brand-500 text-white flex items-center justify-center">
            <Plane size={16} />
          </div>
          Travel Poster Generator
        </div>
        <Link
          href="/dashboard"
          className="text-sm px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600"
        >
          Open Dashboard
        </Link>
      </header>

      <section className="max-w-4xl mx-auto text-center px-6 pt-16 pb-20">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
          Turn one poster design into
          <br /> unlimited on-brand flyers.
        </h1>
        <p className="mt-5 text-gray-500 max-w-xl mx-auto">
          Upload a travel poster template once, mark the parts that change — routes, dates,
          prices, logos — and generate perfectly formatted posters in seconds. Built for
          travel agencies, hotels and resorts running weekly offer campaigns.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-8 px-6 py-3 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 shadow-sm"
        >
          Start building — it's free
        </Link>
      </section>

      <section className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 px-6 pb-24">
        <FeatureCard
          icon={<LayoutTemplate size={20} />}
          title="Canva-style template builder"
          description="Drag, resize, rotate and layer editable text & image regions right on top of your uploaded poster."
        />
        <FeatureCard
          icon={<Sparkles size={20} />}
          title="Fill-in-the-blanks generation"
          description="Define {{route}}, {{price1}}, {{company_logo}} placeholders once, then fill a simple form to produce a new poster."
        />
        <FeatureCard
          icon={<FileSpreadsheet size={20} />}
          title="Bulk CSV generation"
          description="Upload a spreadsheet of routes, dates and prices to generate a whole campaign of posters in one click."
        />
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-panel">
      <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
