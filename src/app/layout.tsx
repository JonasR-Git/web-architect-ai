import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RuntimeModeBanner } from "@/modules/core/components/runtime-mode-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Web Architect AI | Website migration workbench",
  description: "Explore a website, review its migration blueprint and shape page specifications and design drafts in a local AI-assisted workbench.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RuntimeModeBanner />
        {children}
      </body>
    </html>
  );
}
