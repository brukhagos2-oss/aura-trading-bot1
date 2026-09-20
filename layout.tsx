import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AURA | Web-Based Multi-Market Automated Trading Bot",
  description:
    "No Indicators, Pure Price Action & 10-Year Historical Data Driven Automated Trading Bot with Strict Anti-Overlap State Management",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#060911] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
