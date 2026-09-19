import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quran Sanity Agent | Zero-Hallucination Exegesis Intelligence",
  description:
    "A research-grade exegesis intelligence querying structured classical Quranic knowledge via Sanity Context and Model Context Protocol (MCP).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark antialiased">
      <body className="min-h-screen bg-[#090a0f] text-[#ededed] font-sans selection:bg-[#d4af37]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
