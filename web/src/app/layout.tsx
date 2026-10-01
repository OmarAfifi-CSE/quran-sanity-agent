import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Quran Sanity Agent — Understanding, with evidence",
  description:
    "Explore Quran verses and chapter facts in Arabic or English. Inspect the source records and see where commentary still needs review.",
  icons: { icon: "/icon.svg" },
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
