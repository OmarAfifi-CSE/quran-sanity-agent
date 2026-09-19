import type { Metadata } from "next";
import { Inter, Amiri } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

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
    <html
      lang="en"
      className={`${inter.variable} ${amiri.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-[#090a0f] text-[#ededed] font-sans selection:bg-[#d4af37]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
