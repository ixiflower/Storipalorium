import type { Metadata } from "next";
import { Reddit_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/toaster";

const redditMono = Reddit_Mono({
  variable: "--font-reddit-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Storipalorium",
  description: "A contemplative, minimal homepage — somewhere to keep something for someday.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${redditMono.variable} dark`}>
      <body className="font-mono">
        <Navbar />
        <Suspense fallback={null}><Toaster /></Suspense>
        <main className="">{children}</main>
      </body>
    </html>
  );
}
