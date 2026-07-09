import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travel Poster Generator",
  description: "Build reusable travel poster templates and generate posters in bulk.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
