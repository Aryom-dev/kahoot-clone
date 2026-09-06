import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

import InteractiveBackground from "@/components/InteractiveBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monolith — Juegos interactivos en tiempo real",
  description:
    "Crea juegos interactivos al instante o únete con un PIN. Monolith es la plataforma minimalista para quizzes en vivo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-screen font-sans selection:bg-purple-500/30">
        <InteractiveBackground>
          <Navbar />
          <div className="flex flex-1 flex-col">{children}</div>
        </InteractiveBackground>
      </body>
    </html>
  );
}
