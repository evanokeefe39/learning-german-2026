import type { Metadata, Viewport } from "next";
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
        <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-2xl px-4 py-3 sm:py-4">
            <a href="/" className="text-lg font-bold sm:text-xl">
              German Vocab Tester
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-6 pb-24 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
