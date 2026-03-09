import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "German Vocab Tester",
  description: "Test your German vocabulary knowledge",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <a href="/" className="text-xl font-bold">
              German Vocab Tester
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
