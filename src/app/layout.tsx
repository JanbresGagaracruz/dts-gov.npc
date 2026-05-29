import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

import { DM_Sans, Syne } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  title: "Document Tracking System",
  description: "Manage document tracking and workflow efficiently.",
  icons: { icon: "/npc.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${syne.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
