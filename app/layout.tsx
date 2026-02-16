import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { SyncStatus } from "@/components/SyncStatus";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Time Tracker - Track Your Time Efficiently",
  description: "A modern time tracking application with offline support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen bg-background">
          {children}
        </main>
        <SyncStatus />
      </body>
    </html>
  );
}
