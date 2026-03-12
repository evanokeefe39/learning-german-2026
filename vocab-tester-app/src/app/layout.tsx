import type { Metadata, Viewport } from "next";
import Navbar from "@/components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "German Vocab Tester",
  description: "Test your German vocabulary knowledge",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-6 pb-24 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
