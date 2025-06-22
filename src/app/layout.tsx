import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF Form Filler",
  description: "Fill PDF forms with live preview",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-gray-800 text-white p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">PDF Form Filler</h1>
            <div className="flex space-x-4">
              <a href="/" className="hover:text-blue-300 transition-colors">Main Form</a>
              <a href="/test" className="hover:text-blue-300 transition-colors">Test PDF</a>
              <a href="/test-pdf" className="hover:text-blue-300 transition-colors">PDF Viewer</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
